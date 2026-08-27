/** Cursor / Claude Desktop mcp.json fragment after PAT mint. */

/** GitHub Release tarball of in-repo `@erdonline/mcp` (no clone + yarn build). */
export const MCP_NPX_PACKAGE =
  'https://github.com/erdonline/erdonline/releases/download/mcp-v0.1.0/erdonline-mcp-0.1.0.tgz';

export const MCP_NPX_ARGS = ['-y', '--package', MCP_NPX_PACKAGE, 'erd-mcp'];

export const PRODUCTION_MCP_API_URL =
  'https://erdonline-production.up.railway.app';

export const MCP_PAT_PLACEHOLDER = 'erd_pat_…';

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

/** Inner server object Cursor encodes in install-link `config` (official docs). */
export function cursorMcpInstallConfig(): {
  command: 'npx';
  args: string[];
  env: {ERD_API_URL: string; ERD_PAT: string};
} {
  return {
    command: 'npx',
    args: [...MCP_NPX_ARGS],
    env: {
      ERD_API_URL: PRODUCTION_MCP_API_URL,
      ERD_PAT: MCP_PAT_PLACEHOLDER,
    },
  };
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin);
}

function cursorInstallQuery(): string {
  const b64 = utf8ToBase64(JSON.stringify(cursorMcpInstallConfig()));
  return `name=erdonline&config=${encodeURIComponent(b64)}`;
}

/** https://cursor.com/docs/mcp/install-links — web stand-in for cursor:// */
export function cursorMcpInstallWebHref(): string {
  return `https://cursor.com/link/mcp/install?${cursorInstallQuery()}`;
}

export function cursorMcpInstallDeeplink(): string {
  return `cursor://anysphere.cursor-deeplink/mcp/install?${cursorInstallQuery()}`;
}
