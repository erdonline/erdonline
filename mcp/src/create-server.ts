import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  ErdApiClient,
  ErdApiError,
  attachEmptyProjectsHint,
  attachCreateVersionHint,
  type ErdApiConfig,
} from './erd-api.js';
import { loadApiAndMcpMarkdown, MCP_GUIDE_URI } from './load-guide.js';
import {
  describeContractTable,
  extractProjectJson,
  listContractTables,
} from './contract-schema.js';
import {
  diffVersionDetails,
  draftDdlFromVersion,
} from './version-tools.js';

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
    'list_tables',
    {
      description:
        'Progressive disclosure step 1: compact table list (module, title, chnname, field count) from the approved projectJSON contract — NOT a live database, NOT a full schema dump. Reads the saved version snapshot when versionId is given, else the current workspace projectJSON. Follow up with describe_table for the one table you need.',
      annotations: readAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
        versionId: z
          .string()
          .optional()
          .describe('Optional approved version id; defaults to current projectJSON'),
      },
    },
    async ({ projectId, versionId }) =>
      wrapTool(async () => {
        const detail = versionId
          ? await api.getVersion(projectId, versionId)
          : await api.getProject(projectId);
        const projectJSON = extractProjectJson(detail);
        if (!projectJSON) {
          return {
            error: 'No projectJSON in response',
            hint: 'Call list_projects, then get_project_schema to inspect the payload.',
          };
        }
        const tables = listContractTables(projectJSON);
        return {
          source: versionId ? 'version' : 'workspace',
          tableCount: tables.length,
          tables,
          hint: 'Pick ONE table and call describe_table. Do not dump the whole schema into context.',
        };
      })(),
  );

  server.registerTool(
    'describe_table',
    {
      description:
        'Progressive disclosure step 2: fields + FK neighborhood (inbound/outbound associations) for ONE table, from the approved projectJSON contract — never a live database. Unknown table returns found:false with suggestions; use a suggestion instead of inventing columns.',
      annotations: readAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
        table: z.string().min(1).describe('Table title, e.g. sys_user'),
        versionId: z
          .string()
          .optional()
          .describe('Optional approved version id; defaults to current projectJSON'),
      },
    },
    async ({ projectId, table, versionId }) =>
      wrapTool(async () => {
        const detail = versionId
          ? await api.getVersion(projectId, versionId)
          : await api.getProject(projectId);
        const projectJSON = extractProjectJson(detail);
        if (!projectJSON) {
          return {
            error: 'No projectJSON in response',
            hint: 'Call list_projects, then get_project_schema to inspect the payload.',
          };
        }
        const result = describeContractTable(projectJSON, table);
        if (!result.found) {
          return {
            ...result,
            hint: 'Table not in the approved contract. Retry with one of the suggestions; do not invent columns.',
          };
        }
        return result;
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
    'diff_versions',
    {
      description:
        'Review-oriented semantic diff between two named version snapshots. Returns tables and columns added, removed, modified, plus conservative rename candidates — not an ALTER dump. API data is evidence for human review, not approval.',
      annotations: readAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
        fromVersionId: z.string().min(1).describe('Baseline version id'),
        toVersionId: z.string().min(1).describe('Proposed version id'),
      },
    },
    async ({ projectId, fromVersionId, toVersionId }) =>
      wrapTool(async () => {
        const [fromVersion, toVersion] = await Promise.all([
          api.getVersion(projectId, fromVersionId),
          api.getVersion(projectId, toVersionId),
        ]);
        return diffVersionDetails(
          fromVersion,
          toVersion,
          fromVersionId,
          toVersionId,
        );
      })(),
  );

  server.registerTool(
    'preview_ddl',
    {
      description:
        'Generate a conservative CREATE TABLE draft from one named saved version snapshot. Preview only: never connects to a database and never executes SQL. Review dialect details and approval status before use.',
      annotations: readAnno,
      inputSchema: {
        projectId: z.string().min(1).describe('Project id'),
        versionId: z
          .string()
          .min(1)
          .describe('Named saved version id; workspace projectJSON is not accepted'),
        dialect: z
          .enum(['mysql', 'postgresql', 'sqlserver', 'oracle'])
          .describe('Target SQL dialect'),
        table: z
          .string()
          .min(1)
          .optional()
          .describe('Optional exact table name; omit to preview all tables'),
      },
    },
    async ({ projectId, versionId, dialect, table }) =>
      wrapTool(async () =>
        draftDdlFromVersion(
          await api.getVersion(projectId, versionId),
          versionId,
          dialect,
          table,
        ),
      )(),
  );

  server.registerTool(
    'create_version',
    {
      description:
        'Commit a new version snapshot (POST /api/v1/projects/{id}/versions). Requires versions:write + membership. profile.dbs is stripped server-side. After this call you MUST ask the human to open the version diff and confirm or roll back. API 200 is not approval. Do not put_project_json. Do not generate an ER diagram.',
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
      wrapTool(async () =>
        attachCreateVersionHint(
          await api.createVersion(projectId, {
            dbKey,
            version,
            versionDesc,
            projectJSON: projectJSON as Record<string, unknown>,
            tag,
            baseVersion,
            changes,
          }),
        ),
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
              'Then you MUST tell me to open the version diff and confirm or roll back. API success is not my approval. ' +
              'Do not generate an ER diagram from a sentence.',
          },
        },
      ],
    }),
  );

  return server;
}
