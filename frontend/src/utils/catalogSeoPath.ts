/** Catalog list vs item paths for page SEO (do not treat /catalog/:id as the list). */

const RESERVED_CATALOG_SEGMENTS = new Set(['creator', 'publish', 'review', '_item']);

export function normalizeCatalogPathname(pathname: string): string {
  if (!pathname || pathname === '/') return pathname || '/';
  return pathname.replace(/\/+$/, '') || '/';
}

/** True for `/catalog/:id` (and trailing slash). Not list, creator, publish, review, or _item. */
export function isCatalogDetailPath(pathname: string): boolean {
  const p = normalizeCatalogPathname(pathname);
  const m = /^\/catalog\/([^/]+)$/.exec(p);
  if (!m) return false;
  return !RESERVED_CATALOG_SEGMENTS.has(m[1]);
}
