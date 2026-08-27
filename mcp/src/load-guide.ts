import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MCP_GUIDE_URI =
  'https://doc.erdonline.com/docs/guide/api-and-mcp/';

const FALLBACK = `---
title: 用 MCP 让 Cursor / Claude 读取 ER 图
---

Agents read/write the same versioned projectJSON as the designer. Mint a PAT; never put a live token in a URL.

Canonical: ${MCP_GUIDE_URI}
`;

/**
 * Bundled How-to markdown (copied at build). Offline, PAT-free.
 */
export function loadApiAndMcpMarkdown(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, '..', 'guide', 'api-and-mcp.md'),
    path.join(here, '..', '..', 'docs', 'guide', 'api-and-mcp.md'),
  ];
  for (const p of candidates) {
    try {
      return fs.readFileSync(p, 'utf8');
    } catch {
      /* try next */
    }
  }
  return FALLBACK;
}
