import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * EntityModal 新增模型：禁止本地 mutate 即 toast/关窗；仅 project/save code===200 成功
 */

const MOCK_MODULE = 'E2E_MOD_FAIL';

test.describe('EntityModal 落盘失败不关窗', () => {
  test('业务码失败：可读 toast + 窗仍开 → 重试成功关窗', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('entity-modal-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'entfail', 'entity modal fail');

      const trigger = page.getByRole('button', { name: '新增模型' });
      await expect(trigger).toBeVisible({ timeout: 15_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: '新增模型' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      await dialog.getByRole('textbox', { name: '名称' }).fill(MOCK_MODULE);
      await dialog.getByRole('textbox', { name: '中文名' }).fill('失败重试模型');

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let hasModule = false;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          const modules =
            body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
          hasModule = Array.isArray(modules)
            && modules.some((m: { name?: string }) => m?.name === MOCK_MODULE);
        } catch {
          hasModule = false;
        }
        // 仅拦截含本次新模型名的落盘（勿误伤无关 autosave）
        if (!hasModule) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟模型保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await dialog.getByRole('button', { name: /确\s*定/ }).click();
        await expectToast(page, '模拟模型保存拒绝');
        await expect(dialog).toBeVisible();
        await expect(page.getByText('模型添加成功')).toHaveCount(0);

        await dialog.getByRole('button', { name: /确\s*定/ }).click();
        await expectToast(page, '模型添加成功');
        await expect(dialog).toHaveCount(0);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
