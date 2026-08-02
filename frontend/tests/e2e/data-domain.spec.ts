import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * W6 `/design/dataDomain`：低北极星价值 → DesignLayout 路由菜单裁剪；深链保留实验页
 * （DesignLayout 顶栏水平 Menu；以项目菜单 + 深链为准）
 */
test.describe('数据域导航裁剪', () => {
  test.describe.configure({ retries: 1 });

  test('项目菜单无「数据域」；深链见实验提示', async ({ page }) => {
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
      await expect(projectMenu.getByRole('menuitem', { name: '版本' })).toBeVisible({
        timeout: 5_000,
      });
      await expect(projectMenu.getByRole('menuitem', { name: '数据域' })).toHaveCount(0);
      await page.keyboard.press('Escape');

      await page.goto(`/design/dataDomain?projectId=${projectId}`);
      await expect(page).toHaveURL(/\/design\/dataDomain/, { timeout: 15_000 });
      const sheet = page.getByTestId('data-domain-page');
      await expect(sheet).toBeVisible({ timeout: 15_000 });
      await expect(sheet.getByText('实验功能')).toBeVisible();
      // 深链可达，但不挂主菜单入口（无指向本页的导航 link）
      await expect(
        page.getByRole('link', { name: '数据域' }),
      ).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
