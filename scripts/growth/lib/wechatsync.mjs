/**
 * Wechatsync（文章同步助手）与 growth 流水线平台 ID 映射 + CLI 引导。
 * @see https://github.com/wechatsync/Wechatsync
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const GROWTH_DIR = path.resolve(__dirname, '..');

/** growth frontmatter platform → Wechatsync CLI platform id */
export const WECHATSYNC_PLATFORM_MAP = {
  juejin: 'juejin',
  zhihu: 'zhihu',
  wechat: 'weixin',
  weixin: 'weixin',
  csdn: 'csdn',
  segmentfault: 'segmentfault',
  oschina: 'oschina',
};

/** growth 平台里 Wechatsync 不支持的（仍走人工包） */
export const WECHATSYNC_UNSUPPORTED = ['v2ex'];

export const PLATFORM_ARTIFACT = {
  juejin: 'juejin.md',
  zhihu: 'zhihu.md',
  wechat: 'wechat.md',
  weixin: 'weixin.md',
  csdn: 'csdn.md',
  segmentfault: 'segmentfault.md',
  oschina: 'oschina.md',
};

/**
 * @param {string[]} platforms growth frontmatter platforms
 * @returns {{ sync: string[], skipped: { platform: string, reason: string }[] }}
 */
export function resolveWechatsyncPlatforms(platforms) {
  const sync = [];
  const skipped = [];
  for (const p of platforms) {
    if (WECHATSYNC_UNSUPPORTED.includes(p)) {
      skipped.push({ platform: p, reason: 'Wechatsync 不支持，仍用 content/dist 人工帖' });
    } else if (WECHATSYNC_PLATFORM_MAP[p]) {
      sync.push(p);
    } else {
      skipped.push({ platform: p, reason: '未知平台' });
    }
  }
  return { sync, skipped };
}

export function wechatsyncCliPath() {
  const local = path.join(GROWTH_DIR, 'node_modules', '.bin', 'wechatsync');
  if (existsSync(local)) return local;
  return 'wechatsync';
}

export function ensureWechatsyncCli() {
  const localBin = path.join(GROWTH_DIR, 'node_modules', '.bin', 'wechatsync');
  if (existsSync(localBin)) return localBin;
  console.error(
    '未找到 @wechatsync/cli。请先安装：\n  cd scripts/growth && npm install\n',
  );
  process.exit(1);
}

/**
 * @param {{ dryRun?: boolean, requireToken?: boolean }} [opts]
 */
export function validateWechatsyncEnv(opts = {}) {
  const { dryRun = false, requireToken = true } = opts;
  const token = process.env.WECHATSYNC_TOKEN?.trim();
  if (requireToken && !dryRun && !token) {
    console.error(
      [
        '缺少 WECHATSYNC_TOKEN（Chrome 扩展「MCP 连接」里生成，与扩展端一致）。',
        '复制 .env.example 中 Growth / Wechatsync 段到 .env 后填入。',
        '仅预览可加 --dry-run；检查登录：node scripts/growth/sync-wechatsync.mjs --check-auth',
      ].join('\n'),
    );
    process.exit(1);
  }
  return { token, port: process.env.SYNC_WS_PORT || '9527' };
}

/**
 * @param {string[]} args wechatsync 子命令参数（不含可执行文件路径）
 * @param {{ inherit?: boolean }} [opts]
 */
export function runWechatsync(args, opts = {}) {
  const bin = ensureWechatsyncCli();
  const env = { ...process.env };
  if (!env.WECHATSYNC_TOKEN && env.MCP_TOKEN) {
    env.WECHATSYNC_TOKEN = env.MCP_TOKEN;
  }
  const r = spawnSync(bin, args, {
    stdio: opts.inherit === false ? 'pipe' : 'inherit',
    env,
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    if (r.stderr?.includes('ERR_REQUIRE_ESM')) {
      console.error(
        '\n@wechatsync/cli 依赖解析失败。请用仓库内 pinned 安装：\n  cd scripts/growth && npm install\n',
      );
    }
    process.exit(r.status ?? 1);
  }
  return r;
}
