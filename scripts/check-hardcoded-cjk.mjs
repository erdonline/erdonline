#!/usr/bin/env node
/**
 * ADR-0033：用户可见硬编码中文「只减不增」门禁。
 *
 * 用法：
 *   node scripts/check-hardcoded-cjk.mjs
 *   node scripts/check-hardcoded-cjk.mjs --write-baseline scripts/cjk-baseline.json
 *   node scripts/check-hardcoded-cjk.mjs --baseline scripts/cjk-baseline.json
 *
 * 退出码：0 通过；1 失败。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src');
const DEFAULT_BASELINE = path.join(ROOT, 'scripts', 'cjk-baseline.json');
const DEFAULT_ALLOWLIST = path.join(ROOT, 'scripts', 'cjk-allowlist.json');

const CJK_RE = /[\u3400-\u9fff\u{f900}-\u{faff}]/u;
const COMPARE_CTX_RE =
  /(?:===|!==|==|!=|\?\?|\|\||&&|\.includes\s*\(|\.startsWith\s*\(|\.endsWith\s*\(|\.indexOf\s*\(|\.filter\s*\(|tag\s*===)\s*$/;

/** @param {string} dir */
function walkSourceFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'locales' || name === '.umi' || name === 'node_modules') continue;
      walkSourceFiles(full, out);
    } else if (/\.(ts|tsx|js|jsx)$/.test(name)) {
      if (/\.test\.(ts|tsx|js|jsx)$/.test(name)) continue;
      if (full.includes(`${path.sep}locales${path.sep}`)) continue;
      out.push(full);
    }
  }
  return out;
}

/** @param {string} source */
function stripComments(source) {
  let out = '';
  let i = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inStr = null;
  let escape = false;

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        out += ch;
      }
      i++;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (inStr) {
      out += ch;
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === inStr) {
        inStr = null;
      }
      i++;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = ch;
      out += ch;
      i++;
      continue;
    }

    out += ch;
    i++;
  }
  return out;
}

/**
 * @param {string} line
 * @param {string} rel
 * @returns {number}
 */
function countCjkOnLine(line, rel) {
  if (/^\s*\/\//.test(line)) return 0;

  // 纯数据比较字面量：tag === '官方'
  const comparePatterns = [
    /(?:===|!==|==|!=)\s*['"]([^'"]*)['"]/g,
    /\.(?:includes|startsWith|endsWith|indexOf)\s*\(\s*['"]([^'"]*)['"]/g,
    /\?\?\s*['"]([^'"]*)['"]/g,
  ];
  let working = line;
  for (const re of comparePatterns) {
    working = working.replace(re, (full, inner) => {
      if (CJK_RE.test(inner)) return ' '.repeat(full.length);
      return full;
    });
  }

  // JSX 文本：<span>中文</span> 或 >中文<
  let count = 0;
  const jsxTextRe = />([^<{][^<]*?)</g;
  for (const m of working.matchAll(jsxTextRe)) {
    const text = m[1].trim();
    if (text && CJK_RE.test(text)) count += (text.match(CJK_RE) || []).length;
  }

  // 字符串字面量
  const strRe = /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g;
  for (const m of working.matchAll(strRe)) {
    const inner = m[2];
    if (!CJK_RE.test(inner)) continue;
    // 模板字符串中的 ${} 表达式跳过（已在 strip 后仍可能有 CJK 在静态段）
    if (m[1] === '`' && inner.includes('${')) {
      const staticParts = inner.split(/\$\{[^}]*\}/);
      for (const part of staticParts) {
        if (CJK_RE.test(part)) count += (part.match(CJK_RE) || []).length;
      }
    } else {
      count += (inner.match(CJK_RE) || []).length;
    }
  }

  return count;
}

/** @param {string} filePath @param {Set<string>} allowFiles */
function countFileCjk(filePath, allowFiles) {
  const rel = path.relative(ROOT, filePath);
  if (allowFiles.has(rel.replace(/\\/g, '/'))) return 0;

  const content = readFileSync(filePath, 'utf8');
  const stripped = stripComments(content);
  const lines = stripped.split('\n');
  let total = 0;
  for (const line of lines) {
    total += countCjkOnLine(line, rel);
  }
  return total;
}

function loadAllowlist() {
  /** @type {Set<string>} */
  const files = new Set();
  if (!existsSync(DEFAULT_ALLOWLIST)) return files;
  const data = JSON.parse(readFileSync(DEFAULT_ALLOWLIST, 'utf8'));
  for (const f of data.files ?? []) {
    files.add(f.replace(/\\/g, '/'));
  }
  return files;
}

function parseArgs(argv) {
  let baselinePath = DEFAULT_BASELINE;
  let writeBaseline = false;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--write-baseline') {
      writeBaseline = true;
      if (argv[i + 1] && !argv[i + 1].startsWith('-')) {
        baselinePath = path.resolve(ROOT, argv[++i]);
      }
    } else if (argv[i] === '--baseline') {
      baselinePath = path.resolve(ROOT, argv[++i]);
    }
  }
  return { baselinePath, writeBaseline };
}

function main() {
  const { baselinePath, writeBaseline } = parseArgs(process.argv);
  const allowFiles = loadAllowlist();
  const sourceFiles = walkSourceFiles(FRONTEND_SRC);

  /** @type {Record<string, number>} */
  const byFile = {};
  let total = 0;
  for (const fp of sourceFiles) {
    const n = countFileCjk(fp, allowFiles);
    if (n > 0) {
      const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
      byFile[rel] = n;
      total += n;
    }
  }

  const snapshot = {
    generatedAt: new Date().toISOString().slice(0, 10),
    total,
    byFile,
    note: 'ADR-0033 ratchet baseline — CJK char count in user-visible strings (excludes locales/, tests, allowlist)',
  };

  console.log(
    `[check-hardcoded-cjk] scanned ${sourceFiles.length} file(s), ${Object.keys(byFile).length} with CJK, total ${total} CJK char(s)`,
  );

  if (writeBaseline) {
    writeFileSync(baselinePath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    console.log(`[check-hardcoded-cjk] baseline written → ${path.relative(ROOT, baselinePath)}`);
    process.exit(0);
  }

  if (!existsSync(baselinePath)) {
    console.error(
      `[check-hardcoded-cjk] baseline missing: ${path.relative(ROOT, baselinePath)} — run with --write-baseline first`,
    );
    process.exit(1);
  }

  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  let failed = false;

  if (total > baseline.total) {
    failed = true;
    console.error(
      `\n[check-hardcoded-cjk] total increased: ${baseline.total} → ${total} (+${total - baseline.total})`,
    );
  }

  const regressions = [];
  for (const [file, count] of Object.entries(byFile)) {
    const prev = baseline.byFile?.[file] ?? 0;
    if (count > prev) regressions.push({ file, prev, count, delta: count - prev });
  }

  if (regressions.length) {
    failed = true;
    console.error('\n[check-hardcoded-cjk] per-file regressions:');
    for (const r of regressions.sort((a, b) => b.delta - a.delta).slice(0, 20)) {
      console.error(`  ${r.file}: ${r.prev} → ${r.count} (+${r.delta})`);
    }
    if (regressions.length > 20) {
      console.error(`  … and ${regressions.length - 20} more`);
    }
  }

  const removed = baseline.total - total;
  if (!failed) {
    const msg =
      removed > 0
        ? `[check-hardcoded-cjk] PASS — total ${total} (baseline ${baseline.total}, −${removed})`
        : `[check-hardcoded-cjk] PASS — total ${total} (baseline ${baseline.total})`;
    console.log(msg);
    process.exit(0);
  }

  console.error('\n[check-hardcoded-cjk] FAIL — hardcoded CJK must not increase (ADR-0033 ratchet)');
  process.exit(1);
}

main();
