import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * W6 `/design/table/query`：exec 忽略所选数据源、打应用库 → 侧栏裁剪；深链保留实验页
 * （与 dataDomain / Chat SQL 同策略；不扩「真·数据源 SELECT」E2E）
 */
test.describe('设计器查询导航裁剪', () => {
  test.describe.configure({ retries: 1 });

  test('项目菜单无「查询」；深链见实验提示', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('designquery');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await page.getByRole('button', { name: '项目菜单' }).click();
      const projectMenu = page.getByTestId('project-menu-panel');
      await expect(projectMenu.getByRole('menuitem', { name: '版本' })).toBeVisible({
        timeout: 5_000,
      });
      await expect(projectMenu.getByRole('menuitem', { name: '查询' })).toHaveCount(0);
      await page.keyboard.press('Escape');

      await page.goto(`/design/table/query?projectId=${projectId}`);
      await expect(page).toHaveURL(/\/design\/table\/query/, { timeout: 15_000 });
      const sheet = page.getByTestId('design-query-page');
      await expect(sheet).toBeVisible({ timeout: 15_000 });
      await expect(sheet.getByText('实验功能')).toBeVisible();
      await expect(page.getByRole('link', { name: '查询' })).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
