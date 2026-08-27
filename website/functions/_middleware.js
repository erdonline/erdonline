/**
 * Cloudflare Pages Function: send the default pages.dev hostname to the sole public docs host.
 * Preview URLs (`*.erdonline-docs.pages.dev`) are left alone.
 * Extensionless paths get a trailing slash so the 301 lands on the canonical URL
 * (avoids 301 host hop + 308 slash hop).
 */
export function canonicalizeDocsPathname(pathname) {
  if (!pathname || pathname === '/') return '/';
  if (pathname.endsWith('/')) return pathname;
  const last = pathname.split('/').pop() || '';
  if (last.includes('.')) return pathname;
  return `${pathname}/`;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'erdonline-docs.pages.dev') {
    url.hostname = 'doc.erdonline.com';
    url.protocol = 'https:';
    url.port = '';
    url.pathname = canonicalizeDocsPathname(url.pathname);
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
