#!/usr/bin/env node
/**
 * ADR-0033：locale 键对齐 / 重复 / 占位符一致性门禁。
 *
 * 用法：node scripts/check-locale-keys.mjs
 * 退出码：0 通过；1 失败。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src');

const LOCALE_FILE_RE = /^(zh-CN|en-US)\.(ts|js)$/;
const LOCALE_SUBDIR_RE = /^(zh-CN|en-US)$/;

/** @param {string} dir */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.umi') continue;
      walk(full, out);
    } else if (/\.(ts|js)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/** @param {string} filePath @returns {'zh-CN' | 'en-US' | null} */
function localeTagFromPath(filePath) {
  const base = path.basename(filePath);
  const m = base.match(LOCALE_FILE_RE);
  if (m) return /** @type {'zh-CN' | 'en-US'} */ (m[1]);
  const parent = path.basename(path.dirname(filePath));
  if (LOCALE_SUBDIR_RE.test(parent)) return /** @type {'zh-CN' | 'en-US'} */ (parent);
  return null;
}

/** @param {string} source */
function stripComments(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    if (source[i] === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (source[i] === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    out += source[i];
    i++;
  }
  return out;
}

/** @param {string} value */
function placeholdersIn(value) {
  const set = new Set();
  // Simple: {name}; ICU: {count, plural, one {...} other {...}}
  for (const m of value.matchAll(/\{(\w+)(?:\}|,)/g)) set.add(m[1]);
  return [...set].sort();
}

/**
 * 解析 umi locale 文件的 flat key → value（仅字符串值）。
 * @param {string} content
 * @returns {Map<string, string>}
 */
function parseLocaleEntries(content) {
  const body = stripComments(content);
  const normalized = body.replace(/\r\n/g, '\n');
  const entries = new Map();

  const re =
    /['"]([\w.-]+)['"]\s*:\s*(?:\n\s*)?(['"`])((?:\\.|(?!\2)[\s\S])*?)\2/g;
  for (const m of normalized.matchAll(re)) {
    const key = m[1];
    const raw = m[3]
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n');
    if (!entries.has(key)) entries.set(key, raw);
  }
  return entries;
}

/** @param {string} filePath */
function isLocaleFilePath(filePath) {
  const rel = path.relative(FRONTEND_SRC, filePath).replace(/\\/g, '/');
  if (rel.startsWith('locales/')) return localeTagFromPath(filePath) !== null;
  if (rel.includes('/locales/')) return localeTagFromPath(filePath) !== null;
  return false;
}

/** @returns {Array<{ locale: 'zh-CN' | 'en-US', rel: string, entries: Map<string, string> }>} */
function collectLocaleFiles() {
  /** @type {Array<{ locale: 'zh-CN' | 'en-US', rel: string, entries: Map<string, string> }>} */
  const files = [];

  for (const fp of walk(FRONTEND_SRC)) {
    if (!isLocaleFilePath(fp)) continue;
    const tag = localeTagFromPath(fp);
    if (!tag) continue;
    const rel = path.relative(ROOT, fp);
    files.push({
      locale: tag,
      rel,
      entries: parseLocaleEntries(readFileSync(fp, 'utf8')),
    });
  }

  return files;
}

/** @param {typeof files} files */
function mergeByLocale(files, locale) {
  /** @type {Map<string, { value: string, rel: string }>} */
  const merged = new Map();
  /** @type {Map<string, string[]>} */
  const dupes = new Map();

  for (const file of files.filter((f) => f.locale === locale)) {
    for (const [key, value] of file.entries) {
      if (merged.has(key)) {
        const list = dupes.get(key) ?? [merged.get(key).rel];
        list.push(file.rel);
        dupes.set(key, list);
      } else {
        merged.set(key, { value, rel: file.rel });
      }
    }
  }
  return { merged, dupes };
}

function main() {
  const files = collectLocaleFiles();
  if (files.length === 0) {
    console.error('[check-locale-keys] no locale files found');
    process.exit(1);
  }

  let failed = false;
  const zh = mergeByLocale(files, 'zh-CN');
  const en = mergeByLocale(files, 'en-US');

  console.log(
    `[check-locale-keys] scanned ${files.length} file(s): zh-CN ${zh.merged.size} keys, en-US ${en.merged.size} keys`,
  );

  for (const [locale, { dupes }] of [
    ['zh-CN', zh],
    ['en-US', en],
  ]) {
    if (dupes.size === 0) continue;
    failed = true;
    console.error(`\n[check-locale-keys] duplicate keys in ${locale}:`);
    for (const [key, locs] of [...dupes.entries()].sort()) {
      console.error(`  ${key}: ${[...new Set(locs)].join(', ')}`);
    }
  }

  const zhKeys = new Set(zh.merged.keys());
  const enKeys = new Set(en.merged.keys());
  const missingInEn = [...zhKeys].filter((k) => !enKeys.has(k)).sort();
  const missingInZh = [...enKeys].filter((k) => !zhKeys.has(k)).sort();

  if (missingInEn.length || missingInZh.length) {
    failed = true;
    console.error('\n[check-locale-keys] zh-CN ↔ en-US key mismatch:');
    if (missingInEn.length) {
      console.error(`  missing in en-US (${missingInEn.length}):`);
      for (const k of missingInEn.slice(0, 30)) console.error(`    - ${k}`);
      if (missingInEn.length > 30) console.error(`    … and ${missingInEn.length - 30} more`);
    }
    if (missingInZh.length) {
      console.error(`  missing in zh-CN (${missingInZh.length}):`);
      for (const k of missingInZh.slice(0, 30)) console.error(`    - ${k}`);
      if (missingInZh.length > 30) console.error(`    … and ${missingInZh.length - 30} more`);
    }
  }

  const placeholderMismatches = [];
  for (const key of zhKeys) {
    if (!enKeys.has(key)) continue;
    const zhPh = placeholdersIn(zh.merged.get(key).value);
    const enPh = placeholdersIn(en.merged.get(key).value);
    const zhSet = new Set(zhPh);
    const enSet = new Set(enPh);
    const diffZh = zhPh.filter((p) => !enSet.has(p));
    const diffEn = enPh.filter((p) => !zhSet.has(p));
    if (diffZh.length || diffEn.length) {
      placeholderMismatches.push({ key, zhPh, enPh });
    }
  }

  if (placeholderMismatches.length) {
    failed = true;
    console.error('\n[check-locale-keys] placeholder mismatch:');
    for (const { key, zhPh, enPh } of placeholderMismatches.slice(0, 20)) {
      console.error(`  ${key}: zh=[${zhPh.join(', ')}] en=[${enPh.join(', ')}]`);
    }
    if (placeholderMismatches.length > 20) {
      console.error(`  … and ${placeholderMismatches.length - 20} more`);
    }
  }

  if (failed) {
    console.error('\n[check-locale-keys] FAIL');
    process.exit(1);
  }

  console.log('[check-locale-keys] PASS — keys aligned, no duplicates, placeholders match');
  process.exit(0);
}

main();
