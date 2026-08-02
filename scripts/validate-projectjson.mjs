#!/usr/bin/env node
/**
 * 用 JSON Schema (draft 2020-12) 校验 projectJSON。
 *
 * 用法：
 *   node scripts/validate-projectjson.mjs
 *   node scripts/validate-projectjson.mjs path/to/file.json
 *
 * 无参：正例 schema/examples/demo.projectjson.json 必须通过；
 *       负例 schema/examples/invalid.projectjson.json 必须失败。
 * 退出码：0 成功；非 0 失败。
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCHEMA_DIR = path.join(ROOT, 'schema');
const SCHEMA_PATH = path.join(SCHEMA_DIR, 'projectjson.schema.json');
const DEMO_PATH = path.join(SCHEMA_DIR, 'examples', 'demo.projectjson.json');
const INVALID_PATH = path.join(SCHEMA_DIR, 'examples', 'invalid.projectjson.json');
const AJV_PKG = path.join(SCHEMA_DIR, 'node_modules', 'ajv', 'package.json');

function ensureAjv() {
  if (existsSync(AJV_PKG)) return;
  console.error('[validate-projectjson] installing ajv@8 into schema/ …');
  const r = spawnSync(
    'npm',
    ['install', '--no-fund', '--no-audit', '--prefix', SCHEMA_DIR],
    { stdio: 'inherit', cwd: ROOT },
  );
  if (r.status !== 0) {
    console.error('[validate-projectjson] npm install failed; run: npm install --prefix schema');
    process.exit(1);
  }
}

function loadAjv2020() {
  ensureAjv();
  const require = createRequire(path.join(SCHEMA_DIR, 'package.json'));
  const Ajv2020 = require('ajv/dist/2020.js');
  const addFormats = require('ajv-formats');
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function formatErrors(errors) {
  if (!errors?.length) return '(no details)';
  return errors
    .map((e) => `  ${e.instancePath || '/'} ${e.message}${e.params ? ` ${JSON.stringify(e.params)}` : ''}`)
    .join('\n');
}

function validateOne(validate, filePath, expectValid) {
  const data = readJson(filePath);
  const ok = validate(data);
  const label = path.relative(ROOT, filePath);
  if (expectValid) {
    if (!ok) {
      console.error(`FAIL (expected valid): ${label}\n${formatErrors(validate.errors)}`);
      return false;
    }
    console.log(`PASS (valid): ${label}`);
    return true;
  }
  if (ok) {
    console.error(`FAIL (expected invalid): ${label} validated unexpectedly`);
    return false;
  }
  console.log(`PASS (invalid as expected): ${label}`);
  console.log(formatErrors(validate.errors));
  return true;
}

function main() {
  const ajv = loadAjv2020();
  const schema = readJson(SCHEMA_PATH);
  const validate = ajv.compile(schema);
  const args = process.argv.slice(2);

  if (args.length > 0) {
    let allOk = true;
    for (const arg of args) {
      const filePath = path.resolve(arg);
      if (!existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        allOk = false;
        continue;
      }
      if (!validateOne(validate, filePath, true)) allOk = false;
    }
    process.exit(allOk ? 0 : 1);
  }

  const demoOk = validateOne(validate, DEMO_PATH, true);
  const invalidOk = validateOne(validate, INVALID_PATH, false);
  if (!demoOk || !invalidOk) {
    process.exit(1);
  }
  console.log('validate-projectjson: all checks passed');
}

main();
