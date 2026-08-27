/** Cursor / Claude Desktop mcp.json fragment after PAT mint (growth slice 4). */

export const MCP_DIST_PATH_PLACEHOLDER =
  '/ABS/PATH/to/erdonline/mcp/dist/index.js';

/** MCP is a Node process; empty SPA API_URL cannot be same-origin. */
export const LOCAL_MCP_API_URL = 'http://127.0.0.1:9502';

export function resolveMcpApiUrl(apiUrl?: string | null): string {
  const raw = (apiUrl ?? '').trim().replace(/\/+$/, '');
  if (!raw || raw.startsWith('/')) {
    return LOCAL_MCP_API_URL;
  }
  return raw;
}

export function buildCursorMcpJson(
  pat: string,
  apiUrl?: string | null,
): string {
  return `${JSON.stringify(
    {
      mcpServers: {
        erdonline: {
          command: 'node',
          args: [MCP_DIST_PATH_PLACEHOLDER],
          env: {
            ERD_API_URL: resolveMcpApiUrl(apiUrl),
            ERD_PAT: pat,
          },
        },
      },
    },
    null,
    2,
  )}\n`;
}
