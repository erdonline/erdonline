/** Remote Streamable HTTP endpoint shared by supported MCP clients. */
export const PRODUCTION_MCP_URL = 'https://api.erdonline.com/mcp';

export const LOCAL_MCP_URL = 'http://127.0.0.1:9502/mcp';

export function resolveMcpUrl(apiUrl?: string | null): string {
  const raw = (apiUrl ?? '').trim().replace(/\/+$/, '');
  if (!raw || raw.startsWith('/')) {
    return LOCAL_MCP_URL;
  }
  if (raw === 'https://api.erdonline.com') {
    return PRODUCTION_MCP_URL;
  }
  return raw.endsWith('/mcp') ? raw : `${raw}/mcp`;
}

export function buildCursorMcpJson(
  pat: string,
  apiUrl?: string | null,
): string {
  return `${JSON.stringify(
    {
      mcpServers: {
        erdonline: {
          url: resolveMcpUrl(apiUrl),
          headers: {
            Authorization: `Bearer ${pat}`,
          },
        },
      },
    },
    null,
    2,
  )}\n`;
}

export function buildClineMcpJson(
  pat: string,
  apiUrl?: string | null,
): string {
  return `${JSON.stringify(
    {
      mcpServers: {
        erdonline: {
          type: 'streamableHttp',
          url: resolveMcpUrl(apiUrl),
          headers: {
            Authorization: `Bearer ${pat}`,
          },
        },
      },
    },
    null,
    2,
  )}\n`;
}

export function buildDevinMcpJson(
  pat: string,
  apiUrl?: string | null,
): string {
  return `${JSON.stringify(
    {
      mcpServers: {
        erdonline: {
          serverUrl: resolveMcpUrl(apiUrl),
          headers: {
            Authorization: `Bearer ${pat}`,
          },
        },
      },
    },
    null,
    2,
  )}\n`;
}

export function buildVsCodeMcpJson(
  pat: string,
  apiUrl?: string | null,
): string {
  return `${JSON.stringify(
    {
      servers: {
        erdonline: {
          type: 'http',
          url: resolveMcpUrl(apiUrl),
          headers: {
            Authorization: `Bearer ${pat}`,
          },
        },
      },
    },
    null,
    2,
  )}\n`;
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildClaudeCodeCommand(
  pat: string,
  apiUrl?: string | null,
): string {
  return `claude mcp add --transport http --scope user erdonline ${resolveMcpUrl(
    apiUrl,
  )} -H ${shellSingleQuote(`Authorization: Bearer ${pat}`)}`;
}

export type CursorMcpInstallOpts = {
  mcpUrl?: string | null;
};

/**
 * Inner server object Cursor encodes in install-link `config`.
 * Never add authorization headers here: deeplink URLs leak into history/logs.
 */
export function cursorMcpInstallConfig(
  opts?: CursorMcpInstallOpts,
): {
  url: string;
} {
  return {
    url:
      opts?.mcpUrl === undefined
        ? PRODUCTION_MCP_URL
        : resolveMcpUrl(opts.mcpUrl),
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

function cursorInstallQuery(opts?: CursorMcpInstallOpts): string {
  const b64 = utf8ToBase64(JSON.stringify(cursorMcpInstallConfig(opts)));
  return `name=erdonline&config=${encodeURIComponent(b64)}`;
}

/** https://cursor.com/docs/mcp/install-links — opens the Cursor app. */
export function cursorMcpInstallDeeplink(opts?: CursorMcpInstallOpts): string {
  return `cursor://anysphere.cursor-deeplink/mcp/install?${cursorInstallQuery(opts)}`;
}

/** VS Code install URI contains only the public endpoint, never a PAT. */
export function vsCodeMcpInstallDeeplink(opts?: CursorMcpInstallOpts): string {
  const url =
    opts?.mcpUrl === undefined
      ? PRODUCTION_MCP_URL
      : resolveMcpUrl(opts.mcpUrl);
  const config = {
    name: 'erdonline',
    type: 'http',
    url,
  };
  return `vscode:mcp/install?${encodeURIComponent(JSON.stringify(config))}`;
}
