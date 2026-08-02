import { expect, test } from '@playwright/test';
import {
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  openUserMenu,
} from './helpers';

/**
 * 下一季 bet①：落地 → demo → 登录 → 示例就绪 → 保存首版本（墙钟计时）
 *
 * 产品目标「30s 惊艳」面向真人冷启动；本用例量 E2E 自动化墙钟（含导航/等待），
 * 预算见 docs/performance-budget.md「激活旅程」，禁止臆造不可达的 30s 断言。
 */

type Segment = { name: string; ms: number };

/** E2E 墙钟预算：与产品「30s」对齐；本机基线 ~3.5s，见 performance-budget */
const ACTIVATION_E2E_BUDGET_MS = 30_000;

function mark(segments: Segment[], name: string, started: number) {
  segments.push({ name, ms: Date.now() - started });
}

async function logoutIfNeeded(page: import('@playwright/test').Page) {
  const trigger = page.getByTestId('user-menu-trigger');
  if ((await trigger.count()) === 0 || !(await trigger.isVisible().catch(() => false))) {
    return;
  }
  await openUserMenu(page);
  await page.getByRole('menuitem', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
}

test.describe('激活计时：30 秒进版本保存', () => {
  test('落地 → demo → 登录 → 示例就绪 → 保存首版本', async ({ page }) => {
    test.setTimeout(180_000);
    const account = e2eAccount();
    const segments: Segment[] = [];

    // 预热不计时：清会话，避免已登录短路落地页 CTA
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await login(page, account);
    await deleteOwnPersonProjects(page).catch(() => {});
    await logoutIfNeeded(page);
    await page.evaluate(() => localStorage.clear());

    const t0 = Date.now();
    try {
      let t = Date.now();
      await page.goto('/');
      await expect(page.getByTestId('landing-page')).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole('heading', { name: /数据库设计的 Git \+ Figma/ }),
      ).toBeVisible();
      mark(segments, 'landing', t);

      t = Date.now();
      await page.getByRole('link', { name: '在线试用 demo' }).click();
      await expect(page).toHaveURL(/\/(demo|s\/public-demo)/, { timeout: 15_000 });
      await expect(page.getByTestId('share-relation-canvas')).toBeVisible({
        timeout: 15_000,
      });
      mark(segments, 'demo', t);

      t = Date.now();
      // 漏斗：demo 后注册/登录；种子账号计墙钟（真人填表另计）
      await page.goto('/login');
      await page.getByRole('textbox', { name: '用户名' }).fill(account.name);
      await page.getByRole('textbox', { name: '密码' }).fill(account.pass);
      await page.getByRole('button', { name: /登\s*录/ }).click();
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
      mark(segments, 'login', t);

      t = Date.now();
      await page.goto('/home');
      await expect(page.getByTestId('home-link-example')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('home-link-example').click();
      await expect(page).toHaveURL(/\/design\/table/, { timeout: 20_000 });
      await expectToast(page, /示例项目已就绪/);
      mark(segments, 'example_ready', t);

      t = Date.now();
      await page.getByTestId('example-save-version-cta').click();
      await expect(page).toHaveURL(/\/design\/table\/version\/all/, { timeout: 15_000 });
      await expect(page.getByText('Loading...')).toHaveCount(0);
      await page.getByTestId('add-version-btn').click({ timeout: 15_000 });
      const dialog = page.getByRole('dialog').filter({ hasText: '新增版本' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: /确\s*定/ }).click();
      await expectToast(page, /保存成功/);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      mark(segments, 'save_version', t);

      const totalMs = Date.now() - t0;
      // 证据输出（list reporter 可见）
      // eslint-disable-next-line no-console
      console.log(
        `[activation-30s] totalMs=${totalMs} budgetMs=${ACTIVATION_E2E_BUDGET_MS} segments=${JSON.stringify(segments)}`,
      );
      expect(
        totalMs,
        `激活墙钟 ${totalMs}ms 超预算 ${ACTIVATION_E2E_BUDGET_MS}ms；分段=${JSON.stringify(segments)}`,
      ).toBeLessThanOrEqual(ACTIVATION_E2E_BUDGET_MS);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
