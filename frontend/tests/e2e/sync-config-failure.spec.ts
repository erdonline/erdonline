import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  openVersionPage,
  uniqueProjectName,
} from './helpers';

/**
 * 同步配置失败：禁止本地改完即 toast/关窗伪装成功；业务码 toast 后窗仍开，可重试
 */

test.describe('同步配置失败不关窗', () => {
  test('业务码失败：可读 toast + 窗仍开 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('syncfg-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'scfail', 'sync config fail');
      await openVersionPage(page);

      await page.getByRole('button', { name: '同步配置' }).click();
      const dialog = page.getByRole('dialog', { name: /同步配置/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByRole('radio', { name: '重建数据表' }).check();

      let syncSaveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let upgradeType: string | undefined;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          upgradeType =
            body?.configJSON?.synchronous?.upgradeType ??
            body?.data?.configJSON?.synchronous?.upgradeType;
        } catch {
          upgradeType = undefined;
        }
        // 仅拦截本次「重建数据表」落库（勿误伤无关 autosave）
        if (upgradeType !== 'rebuild') {
          await route.continue();
          return;
        }
        syncSaveHits += 1;
        if (syncSaveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟同步配置拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await dialog.getByRole('button', { name: /确\s*定/ }).click();
        await expectToast(page, '模拟同步配置拒绝');
        await expect(dialog).toBeVisible();
        await expect(page.getByText('设置成功')).toHaveCount(0);

        await dialog.getByRole('button', { name: /确\s*定/ }).click();
        await expectToast(page, '设置成功');
        await expect(dialog).toHaveCount(0);
        expect(syncSaveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
