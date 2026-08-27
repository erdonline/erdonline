/** Cursor / Claude Desktop mcp.json fragment after PAT mint. */

/** GitHub Release tarball of in-repo `@erdonline/mcp` (no clone + yarn build). */
export const MCP_NPX_PACKAGE =
  'https://github.com/erdonline/erdonline/releases/download/mcp-v0.1.0/erdonline-mcp-0.1.0.tgz';

export const MCP_NPX_ARGS = ['-y', '--package', MCP_NPX_PACKAGE, 'erd-mcp'];

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
          command: 'npx',
          args: [...MCP_NPX_ARGS],
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
