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
 * 数据源设置确定：禁止无条件 toast「保存成功」；PUT 业务码失败后窗仍开，可重试
 */

test.describe('数据源设置失败不关窗', () => {
  test('业务码失败：可读 toast + 窗仍开 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('ds-setup-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dsfail', 'database setup fail');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '设置' })
        .click();
      await page.getByRole('menuitem', { name: '数据源设置' }).click();

      const dialog = page.getByRole('dialog', { name: '数据源连接配置' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      const postWait = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/dataSources') &&
          r.request().method() === 'POST' &&
          !r.url().includes('ping'),
        { timeout: 20_000 },
      );
      await dialog.getByRole('button', { name: '新增数据源' }).click();
      await postWait;
      // 等 Form setFieldsValue（reload 后）落稳，避免 fill 被冲掉
      await expect(dialog.getByLabel('url')).not.toHaveValue('', { timeout: 10_000 });
      await expect(dialog.getByText(/当前使用的数据源为/)).toBeVisible({
        timeout: 10_000,
      });

      const mockUrl = 'jdbc:mysql://e2e-ds-fail.example:3306/erd_mock';

      let putHits = 0;
      await page.route('**/ncnb/dataSources/**', async (route) => {
        if (route.request().method() !== 'PUT') {
          await route.continue();
          return;
        }
        let url: string | undefined;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          url = body?.url;
        } catch {
          url = undefined;
        }
        // 仅拦截本次「确定」刷盘（勿误伤其它 PUT）
        if (url !== mockUrl) {
          await route.continue();
          return;
        }
        putHits += 1;
        if (putHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟数据源保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await dialog.getByLabel('url').fill(mockUrl);
        await dialog.getByLabel('username').fill('e2e_user');
        await dialog.getByLabel('password').fill('e2e_pass');
        await expect(dialog.getByLabel('url')).toHaveValue(mockUrl);
        await expect(dialog.getByLabel('username')).toHaveValue('e2e_user');

        await dialog.getByRole('button', { name: '确定' }).click();
        await expectToast(page, '模拟数据源保存拒绝');
        await expect(dialog).toBeVisible();
        await expect(page.getByText('保存成功！')).toHaveCount(0);

        await dialog.getByRole('button', { name: '确定' }).click();
        await expectToast(page, '保存成功！');
        await expect(dialog).toHaveCount(0);
        expect(putHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/dataSources/**').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
