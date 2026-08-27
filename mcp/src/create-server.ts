import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  ErdApiClient,
  ErdApiError,
  attachEmptyProjectsHint,
  type ErdApiConfig,
} from './erd-api.js';
import { loadApiAndMcpMarkdown, MCP_GUIDE_URI } from './load-guide.js';

function textResult(payload: unknown, isError = false) {
  return {
    content: [
      {
        type: 'text' as const,
        text:
          typeof payload === 'string'
            ? payload
            : JSON.stringify(payload, null, 2),
      },
    ],
    isError,
  };
}

function wrapTool(run: () => Promise<unknown>) {
  return async () => {
    try {
      return textResult(await run());
    } catch (e) {
      if (e instanceof ErdApiError) {
        return textResult(
          { error: e.message, status: e.status, body: e.body },
          true,
        );
      }
      return textResult(
        { error: e instanceof Error ? e.message : String(e) },
        true,
      );
    }
  };
}

/** Glama / Cursor TDQS: declare side effects on every tool. */
const readAnno = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;
const writeAnno = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const;
const replaceAnno = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: true,
} as const;

/**
 * MCP tools → Public API REST (read + versions:write + projects:write).
 */
export function createErdMcpServer(config: ErdApiConfig): McpServer {
  const api = new ErdApiClient(config);
  const server = new McpServer({
    name: 'erdonline',
    version: '0.3.0',
  });

  server.registerTool(
    'list_projects',
    {
      description:
        'List projects the PAT user belongs to (GET /api/v1/projects). Requires projects:read. Does not generate diagrams.',
      annotations: readAnno,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe('Page (1-based)'),
        size: z.number().int().min(1).max(100).default(20).describe('Page size'),
      },
    },
    async ({ page, size }) =>
      wrapTool(async () =>
        attachEmptyProjectsHint(await api.listProjects(page ?? 1, size ?? 20)),
      )(),
  );

  server.registerTool(
    'get_project',
    {
      description:
        'Get project detail including sanitized projectJSON (GET /api/v1/projects/{id}). profile.dbs is always empty. Not ChatSQL.',
      annotations: readAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
      },
    },
    async ({ projectId }) => wrapTool(() => api.getProject(projectId))(),
  );

  server.registerTool(
    'get_project_schema',
    {
      description:
        'Agent-oriented schema: returns projectJSON (and id/name) from project detail. Same as get_project but focused payload. Humans still diff versions; do not one-shot generate ERD.',
      annotations: readAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
      },
    },
    async ({ projectId }) =>
      wrapTool(async () => {
        const detail = (await api.getProject(projectId)) as Record<
          string,
          unknown
        >;
        return {
          id: detail?.id,
          name: detail?.name,
          projectJSON: detail?.projectJSON,
        };
      })(),
  );

  server.registerTool(
    'list_versions',
    {
      description:
        'List saved versions for a project (GET /api/v1/projects/{id}/versions). Requires versions:read. No projectJSON in list.',
      annotations: readAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
        page: z.number().int().min(1).default(1).describe('Page (1-based)'),
        size: z.number().int().min(1).max(100).default(20).describe('Page size'),
        dbKey: z
          .string()
          .optional()
          .describe('Optional dbKey filter'),
      },
    },
    async ({ projectId, page, size, dbKey }) =>
      wrapTool(() =>
        api.listVersions(projectId, {
          page: page ?? 1,
          size: size ?? 20,
          dbKey,
        }),
      )(),
  );

  server.registerTool(
    'get_version',
    {
      description:
        'Version detail with sanitized projectJSON snapshot (GET /api/v1/projects/{id}/versions/{versionId}).',
      annotations: readAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
        versionId: z.string().min(1).describe('Version / db_change id'),
      },
    },
    async ({ projectId, versionId }) =>
      wrapTool(() => api.getVersion(projectId, versionId))(),
  );

  server.registerTool(
    'create_version',
    {
      description:
        'Commit a new version snapshot (POST /api/v1/projects/{id}/versions). Requires versions:write + membership. profile.dbs is stripped server-side before persist. A human should still open the version diff.',
      annotations: writeAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
        dbKey: z.string().min(1).describe('Database key (e.g. defaultDB)'),
        version: z.string().min(1).describe('Version label, e.g. 1.0.1'),
        versionDesc: z.string().min(1).describe('Version description'),
        projectJSON: z
          .record(z.string(), z.unknown())
          .describe('Full projectJSON snapshot (secrets stripped server-side)'),
        tag: z.string().optional().describe('Optional comma-separated tags'),
        baseVersion: z
          .boolean()
          .optional()
          .describe('Mark as baseline version'),
        changes: z
          .array(z.unknown())
          .optional()
          .describe('Optional change list'),
      },
    },
    async ({
      projectId,
      dbKey,
      version,
      versionDesc,
      projectJSON,
      tag,
      baseVersion,
      changes,
    }) =>
      wrapTool(() =>
        api.createVersion(projectId, {
          dbKey,
          version,
          versionDesc,
          projectJSON: projectJSON as Record<string, unknown>,
          tag,
          baseVersion,
          changes,
        }),
      )(),
  );

  server.registerTool(
    'update_project',
    {
      description:
        'Partial update project metadata (PATCH /api/v1/projects/{id}). Requires projects:write + membership. At least one of projectName/name, description, tags.',
      annotations: writeAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
        projectName: z
          .string()
          .max(100)
          .optional()
          .describe('Project display name'),
        name: z
          .string()
          .max(100)
          .optional()
          .describe('Alias for projectName'),
        description: z.string().max(500).optional().describe('Description'),
        tags: z.string().max(255).optional().describe('Tags string'),
      },
    },
    async ({ projectId, projectName, name, description, tags }) =>
      wrapTool(() =>
        api.updateProject(projectId, {
          projectName,
          name,
          description,
          tags,
        }),
      )(),
  );

  server.registerTool(
    'put_project_json',
    {
      description:
        'Replace workspace projectJSON (PUT /api/v1/projects/{id}/projectJSON). Requires projects:write + membership. Overwrites the current model; profile.dbs is stripped server-side.',
      annotations: replaceAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
        projectJSON: z
          .record(z.string(), z.unknown())
          .describe('Full projectJSON (secrets stripped server-side)'),
      },
    },
    async ({ projectId, projectJSON }) =>
      wrapTool(() =>
        api.putProjectJson(
          projectId,
          projectJSON as Record<string, unknown>,
        ),
      )(),
  );

  server.registerTool(
    'list_templates',
    {
      description:
        'List official/community templates (GET /api/v1/catalog/templates). Requires projects:read.',
      annotations: readAnno,
      inputSchema: {
        q: z.string().optional().describe('Search keyword'),
        tag: z.string().optional().describe('Tag filter'),
        sort: z
          .enum(['installs', 'rating', 'newest'])
          .optional()
          .describe('Sort order'),
        page: z.number().int().min(1).default(1),
        size: z.number().int().min(1).max(100).default(20),
      },
    },
    async ({ q, tag, sort, page, size }) =>
      wrapTool(() =>
        api.listCatalogTemplates({ q, tag, sort, page: page ?? 1, size: size ?? 20 }),
      )(),
  );

  server.registerTool(
    'get_template',
    {
      description:
        'Template detail with sanitized projectJSON (GET /api/v1/catalog/templates/{id}). Requires projects:read.',
      annotations: readAnno,
      inputSchema: {
        templateId: z.string().min(1).describe('Template id or slug'),
      },
    },
    async ({ templateId }) => wrapTool(() => api.getCatalogTemplate(templateId))(),
  );

  server.registerTool(
    'install_template',
    {
      description:
        'Install template as a new personal project (POST /api/v1/catalog/templates/{id}/install). Requires projects:write. Creates a project; does not overwrite existing ones.',
      annotations: writeAnno,
      inputSchema: {
        templateId: z.string().min(1).describe('Template id or slug'),
      },
    },
    async ({ templateId }) => wrapTool(() => api.installCatalogTemplate(templateId))(),
  );

  server.registerTool(
    'get_creator',
    {
      description:
        'Author page with published templates (GET /api/v1/catalog/creators/{handle}). Requires projects:read.',
      annotations: readAnno,
      inputSchema: {
        handle: z.string().min(1).describe('GitHub handle or erdonline'),
      },
    },
    async ({ handle }) => wrapTool(() => api.getCatalogCreator(handle))(),
  );

  server.registerResource(
    'mcp-guide',
    MCP_GUIDE_URI,
    {
      title: 'ERD Online MCP guide',
      description:
        'How-to markdown: agents read/write the same versioned projectJSON as the designer. Git + Figma for schema; not ChatSQL or one-shot ERD generation.',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [
        {
          uri: String(uri),
          mimeType: 'text/markdown',
          text: loadApiAndMcpMarkdown(),
        },
      ],
    }),
  );

  server.registerPrompt(
    'list-erd-projects',
    {
      title: 'List my ER diagrams',
      description:
        'List ERD Online projects and read projectJSON. Do not generate an ER diagram from natural language.',
    },
    () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'List my ERD Online projects. Use get_project_schema for the same projectJSON the designer uses. Do not generate an ER diagram from a sentence.',
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'suggest-erd-version',
    {
      title: 'Suggest a version (human diffs)',
      description:
        'Read projectJSON, then create_version with a short note. Humans approve in the designer diff. Do not put_project_json. Do not generate an ER diagram.',
    },
    () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              'List my ERD Online projects. If the list is empty, tell me to create a project in the designer (the official Demo is not a PAT). ' +
              'Otherwise get_project_schema, propose a small additive change, and call create_version (not put_project_json). ' +
              'I will open the version diff. Do not generate an ER diagram from a sentence.',
          },
        },
      ],
    }),
  );

  return server;
}
