import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * W2：`/design/dataDomain` 实验空壳下线路由 → 404；项目菜单无「数据域」
 */
test.describe('数据域导航裁剪', () => {
  test.describe.configure({ retries: 1 });

  test('项目菜单无「数据域」；深链 404', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('datadomain');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await page.getByRole('button', { name: '项目菜单' }).click();
      const projectMenu = page.getByTestId('project-menu-panel');
      await expect(projectMenu.getByRole('menuitem', { name: '全部项目' })).toBeVisible({
        timeout: 5_000,
      });
      await expect(projectMenu.getByRole('menuitem', { name: '数据域' })).toHaveCount(0);
      await page.keyboard.press('Escape');

      await page.goto(`/design/dataDomain?projectId=${projectId}`);
      await expect(page.getByText('404', { exact: true })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('抱歉，你访问的页面不存在')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
