import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

test.describe('设计器项目菜单', () => {
  test('项目 → 设置 → 数据源设置 可打开', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('menu');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page.getByRole('menuitem', { name: '设置' }).hover();
      await page.getByRole('button', { name: '数据源设置' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText('数据源连接配置')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
