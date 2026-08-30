#!/usr/bin/env node
/**
 * ERD Online MCP — read-only skeleton (ADR-0013 slice 4).
 *
 * Default: stdio transport (Cursor / Claude Desktop).
 * Optional: Streamable HTTP via `--http` (local dogfood / remote hosts).
 *
 * Env: ERD_API_URL, ERD_PAT
 */
import type { Request, Response } from 'express';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { createErdMcpServer } from './create-server.js';
import { loadConfigFromEnv, patFromAuthorizationHeader } from './erd-api.js';

async function runStdio() {
  const config = loadConfigFromEnv();
  const server = createErdMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  if (!config.pat) {
    console.error(
      `erd-mcp stdio ready → ${config.baseUrl} (no ERD_PAT; tools/list only until you mint a token)`,
    );
  } else {
    console.error(
      `erd-mcp stdio ready → ${config.baseUrl} (PAT hint …${config.pat.slice(-4)})`,
    );
  }
}

async function runHttp() {
  const baseConfig = loadConfigFromEnv();
  const port = Number(process.env.ERD_MCP_PORT ?? 3920);
  const app = createMcpExpressApp();

  app.post('/mcp', async (req: Request, res: Response) => {
    const requestPat = patFromAuthorizationHeader(req.headers.authorization);
    const config = {
      baseUrl: baseConfig.baseUrl,
      pat: requestPat ?? baseConfig.pat,
    };
    const server = createErdMcpServer(config);
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on('close', () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      console.error('MCP HTTP error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  app.get('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed (use POST).' },
      id: null,
    });
  });

  app.listen(port, () => {
    console.error(
      `erd-mcp Streamable HTTP on http://127.0.0.1:${port}/mcp → ${baseConfig.baseUrl}`,
    );
  });
}

const httpMode =
  process.argv.includes('--http') || process.env.ERD_MCP_TRANSPORT === 'http';

if (httpMode) {
  void runHttp().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  void runStdio().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
