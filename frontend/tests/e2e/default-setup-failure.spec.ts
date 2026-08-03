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
 * 默认项设置失败：禁止本地改完即 toast/关窗伪装成功；业务码 toast 后窗仍开，可重试
 */

const MOCK_SQL_SEP = '/*SQL@E2E-DEF-FAIL*/';

test.describe('默认项设置失败不关窗', () => {
  test('业务码失败：可读 toast + 窗仍开 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('defclass-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'deffail', 'default setup fail');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '设置' })
        .click();
      await page.getByRole('menuitem', { name: '默认项设置' }).click();

      const dialog = page.getByRole('dialog', { name: '默认项设置' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByRole('tab', { name: '默认配置' }).click();
      await dialog.getByLabel('SQL分隔符').fill(MOCK_SQL_SEP);

      let profileSaveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let sqlConfig: string | undefined;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          sqlConfig =
            body?.projectJSON?.profile?.sqlConfig ??
            body?.data?.projectJSON?.profile?.sqlConfig;
        } catch {
          sqlConfig = undefined;
        }
        // 仅拦截本次「默认配置」落库（勿误伤无关 autosave）
        if (sqlConfig !== MOCK_SQL_SEP) {
          await route.continue();
          return;
        }
        profileSaveHits += 1;
        if (profileSaveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟默认项设置拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await dialog.getByRole('button', { name: /确\s*定/ }).click();
        await expectToast(page, '模拟默认项设置拒绝');
        await expect(dialog).toBeVisible();
        await expect(page.getByText('设置成功')).toHaveCount(0);

        await dialog.getByRole('button', { name: /确\s*定/ }).click();
        await expectToast(page, '设置成功');
        await expect(dialog).toHaveCount(0);
        expect(profileSaveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
