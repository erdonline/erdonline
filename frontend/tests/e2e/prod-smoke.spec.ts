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
  { path: '/en/catalog', label: 'en-catalog' },
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

  test('crawler first HTML uses path canonical (not homepage)', async ({ request }) => {
    const home = await (await request.get('/')).text();
    expect(home).toContain('<title>Draw ER Diagram Online — Free Editor | ERD Online</title>');
    expect(home).toMatch(/rel="canonical"[^>]*href="https:\/\/www\.erdonline\.com\/"/);

    const cases: { path: string; title: string; canonical: string }[] = [
      {
        path: '/catalog',
        title: 'ER 图模板 — 免费数据库模型广场 | ERD Online',
        canonical: 'https://www.erdonline.com/catalog',
      },
      {
        path: '/compare',
        title: 'ERD Online vs draw.io — 协作、版本与外键语义',
        canonical: 'https://www.erdonline.com/compare',
      },
      {
        path: '/en',
        title: 'Draw ER Diagram Online — Free Editor | ERD Online',
        canonical: 'https://www.erdonline.com/en',
      },
      {
        path: '/en/catalog',
        title: 'ER diagram templates — free database models | ERD Online',
        canonical: 'https://www.erdonline.com/en/catalog',
      },
      {
        path: '/en/compare',
        title: 'ERD Online vs draw.io — collaboration, versions, and FK semantics',
        canonical: 'https://www.erdonline.com/en/compare',
      },
    ];
    for (const c of cases) {
      const res = await request.get(c.path);
      expect(res.ok(), c.path).toBeTruthy();
      const html = await res.text();
      expect(html, c.path).toContain(`<title>${c.title}</title>`);
      const canon = html.match(/rel="canonical"[^>]*href="([^"]+)"/)?.[1] ?? '';
      expect(canon, c.path).toBe(c.canonical);
      expect(canon, `${c.path} must not canonicalize to homepage`).not.toBe(
        'https://www.erdonline.com/',
      );
    }
  });
});
