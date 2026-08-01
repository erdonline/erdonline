import { expect, test } from '@playwright/test';
import { deleteOwnPersonProjects, login, uniqueProjectName } from './helpers';

/**
 * 加载态：慢网下项目列表 / 进设计器须见骨架或 list loading，禁止空闪。
 */
test.describe('加载态骨架', () => {
  test('个人项目列表请求中有 loading，完成后可交互', async ({ page }) => {
    await login(page);
    await page.route('**/ncnb/project/page**', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await page.goto('/project/person');
    await expect(page.locator('.ant-spin-spinning, [data-testid=page-skeleton]').first()).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole('button', { name: /新\s*建/ })).toBeVisible({ timeout: 15_000 });
  });

  test('进入设计器拉取项目时见骨架，随后进入画布区', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('skel');
    await login(page);
    await deleteOwnPersonProjects(page);

    await page.getByRole('button', { name: /新\s*建/ }).click();
    await page.getByPlaceholder('请输入项目名').fill(projectName);
    await page.locator('.ant-modal .ant-select').first().click();
    await page.locator('.ant-select-item-option', { hasText: '个人项目' }).click();
    await page.locator('.ant-modal .ant-select').nth(1).click();
    await page.keyboard.type('skel');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('请输入项目描述').fill('skeleton load');
    await page.locator('.ant-modal').getByRole('button', { name: /确\s*定/ }).click();
    await expect(page.getByText(projectName).first()).toBeVisible();

    await page.route('**/ncnb/project/info/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.continue();
    });

    await page.getByRole('button', { name: '打开模型' }).first().click();
    await expect(page.getByTestId('page-skeleton')).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/design\/table/, { timeout: 20_000 });
    await expect(page.getByTestId('page-skeleton')).toHaveCount(0, { timeout: 15_000 });

    await deleteOwnPersonProjects(page);
  });
});
