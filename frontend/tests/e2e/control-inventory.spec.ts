import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { login } from './helpers';

/**
 * 手工控件清单采集（默认 skip，不进 CI）。
 *
 * 用法（需全栈已起）：
 *   cd frontend && PW_CONTROL_INVENTORY=1 npx playwright test \
 *     tests/e2e/control-inventory.spec.ts --project=chromium
 *
 * 产出：test-results/control-inventory.json（button/link/menuitem/testid 列表）
 * 仅采集，不断言业务闭环。
 */
const enabled = process.env.PW_CONTROL_INVENTORY === '1';

test.describe('控件清单采集（手工）', () => {
  test.skip(!enabled, '设 PW_CONTROL_INVENTORY=1 才跑；避免 CI 抖动');

  test('登录后扫描挂载面 clickables', async ({ page }) => {
    await login(page);

    const surfaces = [
      '/home',
      '/project/person',
      '/project/recent',
      '/project/group',
      '/dataModels',
      '/databaseConfig',
      '/account/settings',
    ];

    type Hit = {
      surface: string;
      role: string;
      name: string;
      testId?: string;
      tag: string;
    };
    const hits: Hit[] = [];

    for (const surface of surfaces) {
      await page.goto(surface);
      await page.waitForLoadState('domcontentloaded');
      const batch = await page.evaluate((surf) => {
        const out: Hit[] = [];
        const push = (el: Element, role: string) => {
          const name =
            (el.getAttribute('aria-label') ||
              (el as HTMLElement).innerText ||
              '').trim().slice(0, 120);
          const testId = el.getAttribute('data-testid') || undefined;
          if (!name && !testId) return;
          out.push({
            surface: surf,
            role,
            name: name || '(unnamed)',
            testId,
            tag: el.tagName.toLowerCase(),
          });
        };
        document
          .querySelectorAll('button, a, [role="button"], [role="link"], [role="menuitem"], [data-testid]')
          .forEach((el) => {
            const role =
              el.getAttribute('role') ||
              (el.tagName === 'BUTTON'
                ? 'button'
                : el.tagName === 'A'
                  ? 'link'
                  : 'other');
            push(el, role);
          });
        return out;
      }, surface);
      hits.push(...batch);
    }

    const dest = path.join(
      path.resolve(__dirname, '../../test-results'),
      'control-inventory.json',
    );
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(
      dest,
      JSON.stringify({ generatedAt: new Date().toISOString(), count: hits.length, hits }, null, 2),
    );
  });
});
