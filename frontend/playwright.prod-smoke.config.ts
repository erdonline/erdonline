import { defineConfig, devices } from '@playwright/test';

/**
 * Serves pre-built `dist/` and runs boot-only smoke (no backend required).
 * CI / deploy: set PROD_SMOKE_SKIP_BUILD=1 after yarn build.
 * Serves via scripts/serve-dist-pages.mjs (directory shells before SPA).
 * Do not use `npx serve -s` — it rewrites prerendered /catalog to homepage HTML.
 */
const PORT = Number(process.env.PROD_SMOKE_PORT || 4173);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/prod-smoke.spec.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  fullyParallel: false,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PROD_SMOKE_BASE_URL || `http://127.0.0.1:${PORT}`,
    locale: 'zh-CN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'prod-smoke', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PROD_SMOKE_BASE_URL
    ? undefined
    : {
        command: 'node ./scripts/serve-dist-pages.mjs',
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
