/**
 * Cloudflare Pages Function: send the default pages.dev hostname to the sole public docs host.
 * Preview URLs (`*.erdonline-docs.pages.dev`) are left alone.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'erdonline-docs.pages.dev') {
    url.hostname = 'doc.erdonline.com';
    url.protocol = 'https:';
    url.port = '';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
