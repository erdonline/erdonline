/**
 * 浏览器导航用 API 绝对路径（与 request.js 的 BASE_URL 同源）。
 * XHR 走 umi-request prefix；`<a href>` / `location.assign` 须显式拼后端基址，
 * 否则静态托管（CF Pages）会把 `/auth/...` 当 SPA 路由。
 */

function readApiBase(): string {
  const fromRuntime =
    typeof window !== 'undefined' ? window._env_?.API_URL : undefined;
  const fromBuild = typeof API_URL !== 'undefined' ? API_URL : '';
  const raw = fromRuntime || fromBuild || '';
  return raw.replace(/\/+$/, '');
}

export function buildApiHrefWithBase(path: string, apiBase: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with /: ${path}`);
  }
  const base = (apiBase || '').replace(/\/+$/, '');
  return base ? `${base}${path}` : path;
}

/**
 * @param path 必须以 `/` 开头的 API 路径（可含 query）
 * @returns 本地 dev（空 API_URL）→ 相对路径；prod → `https://api…/path`
 */
export function buildApiHref(path: string): string {
  return buildApiHrefWithBase(path, readApiBase());
}
