import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ErdApiClient, ErdApiError, type ErdApiConfig } from './erd-api.js';

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
        'List projects the PAT user belongs to (GET /api/v1/projects). Requires projects:read.',
      inputSchema: {
        page: z.number().int().min(1).default(1).describe('Page (1-based)'),
        size: z.number().int().min(1).max(100).default(20).describe('Page size'),
      },
    },
    async ({ page, size }) =>
      wrapTool(() => api.listProjects(page ?? 1, size ?? 20))(),
  );

  server.registerTool(
    'get_project',
    {
      description:
        'Get project detail including sanitized projectJSON (GET /api/v1/projects/{id}). profile.dbs is always empty.',
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
        'Agent-oriented schema: returns projectJSON (and id/name) from project detail. Same as get_project but focused payload.',
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
        'Commit a new version snapshot (POST /api/v1/projects/{id}/versions). Requires versions:write + membership. profile.dbs is stripped server-side before persist.',
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
        'Replace workspace projectJSON (PUT /api/v1/projects/{id}/projectJSON). Requires projects:write + membership. profile.dbs is stripped server-side before persist.',
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
        'Install template as a new personal project (POST /api/v1/catalog/templates/{id}/install). Requires projects:write.',
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
      inputSchema: {
        handle: z.string().min(1).describe('GitHub handle or erdonline'),
      },
    },
    async ({ handle }) => wrapTool(() => api.getCatalogCreator(handle))(),
  );

  return server;
}
