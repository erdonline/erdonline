import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 加载态：慢网下项目列表 / 进设计器须见骨架或 list loading。
 */
test.describe('加载态骨架', () => {
  test('个人项目列表请求中有 loading，完成后可交互', async ({ page }) => {
    await login(page);
    await page.route('**/ncnb/project/page**', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await page.goto('/project/person');
    await expect(
      page.getByTestId('page-skeleton').or(page.locator('[aria-busy="true"]')).first(),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /新\s*建/ })).toBeVisible({ timeout: 15_000 });
  });

  test('进入设计器拉取项目时见骨架，随后进入画布区', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('skel');
    await login(page);
    await deleteOwnPersonProjects(page);
    await createAndOpenPersonProject(page, projectName, 'skel', 'skeleton load');
    // 上面已进设计器；再测慢网拉项目：回列表后重开
    await page.goto('/project/person');
    await expect(page.getByText(projectName).first()).toBeVisible();

    await page.route('**/ncnb/project/info/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.continue();
    });

    await page.getByTestId('open-project').first().click();
    await expect(page.getByTestId('page-skeleton')).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/design\/table/, { timeout: 20_000 });
    await expect(page.getByTestId('page-skeleton')).toHaveCount(0, { timeout: 15_000 });

    await deleteOwnPersonProjects(page);
  });
});
