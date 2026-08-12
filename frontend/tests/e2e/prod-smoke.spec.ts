import { expect, test } from '@playwright/test';

/**
 * Production boot smoke — catches SPA init crashes (route flatten, bad imports, etc.)
 * that review/ESLint miss. Runs against `dist/` via playwright.prod-smoke.config.ts.
 *
 * Would have caught ADR-0034 LocaleRoute flattenRoutes crash: every URL threw pageerror
 * and #root stayed empty before any API call.
 */

type PublicCase = {
  path: string;
  label: string;
  /** After navigation, URL must match (redirects). */
  url?: RegExp;
};

const PUBLIC_CASES: PublicCase[] = [
  { path: '/', label: 'landing' },
  { path: '/compare', label: 'compare' },
  { path: '/catalog', label: 'catalog' },
  { path: '/demo', label: 'demo', url: /\/s\/public-demo/ },
  { path: '/en', label: 'en-landing' },
  { path: '/en/compare', label: 'en-compare' },
];

function attachBootListeners(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message || String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      // Ignore benign network errors when no backend is wired (prod smoke is boot-only).
      if (/Failed to load resource|net::ERR_|404 \(Not Found\)/i.test(t)) return;
      if (/Uncaught/i.test(t)) errors.push(t);
    }
  });
  return errors;
}

async function assertRootBoot(page: import('@playwright/test').Page, path: string) {
  const root = page.locator('#root');
  await expect(root, `#root missing on ${path}`).toBeAttached({ timeout: 15_000 });

  await expect
    .poll(
      async () => {
        const m = await root.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
          return {
            childCount: el.childElementCount,
            textLen: text.length,
            height: rect.height,
          };
        });
        return m.childCount > 0 && m.textLen > 10 && m.height > 0;
      },
      { message: `#root never mounted content on ${path}`, timeout: 20_000 },
    )
    .toBe(true);
}

test.describe('prod smoke: built SPA boots on public URLs', () => {
  for (const { path, label, url } of PUBLIC_CASES) {
    test(`${label} ${path}`, async ({ page }) => {
      const errors = attachBootListeners(page);

      await page.goto(path, { waitUntil: 'domcontentloaded' });
      if (url) {
        await expect(page).toHaveURL(url, { timeout: 15_000 });
      }

      // Give umi/React one tick after first paint (init throws sync otherwise).
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);

      expect(errors, `uncaught on ${path}:\n${errors.join('\n')}`).toEqual([]);
      await assertRootBoot(page, path);
    });
  }
});
