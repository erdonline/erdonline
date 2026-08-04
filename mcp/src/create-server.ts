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
 * Read-only MCP tools → Public API REST. No write tools.
 */
export function createErdMcpServer(config: ErdApiConfig): McpServer {
  const api = new ErdApiClient(config);
  const server = new McpServer({
    name: 'erdonline',
    version: '0.1.0',
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

  return server;
}
