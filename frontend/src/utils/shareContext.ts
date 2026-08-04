/**
 * Read-only share viewer routes (ADR-0022 #11): no Layer B / JDBC probe.
 */
export function isShareGuestContext(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return /^\/s\/[^/]+/.test(window.location.pathname);
}
