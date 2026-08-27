#!/usr/bin/env node
/**
 * Copy the canonical MCP How-to into the pack so resources/read
 * works after `npx --package <tarball>` (no live docs fetch, no PAT).
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(mcpRoot, '..', 'docs', 'guide', 'api-and-mcp.md');
const destDir = path.join(mcpRoot, 'guide');
const dest = path.join(destDir, 'api-and-mcp.md');
if (!fs.existsSync(src)) {
  console.error(`sync-guide: missing ${src}`);
  process.exit(1);
}
fs.mkdirSync(destDir, {recursive: true});
fs.copyFileSync(src, dest);
