import { expect, test } from '@playwright/test';
import {
  createPersonProject,
  deleteAllPersonProjects,
  E2E_SERIAL,
  expandTreeTitle,
  login,
  withExclusiveAccount,
} from './helpers';

/**
 * 项目激活链路（账号级空态，走 chromium-serial + withExclusiveAccount）
 */
test.describe('项目激活', () => {
  test.describe.configure({ mode: 'serial' });

  test('个人项目空态引导新建与一键示例', async ({ page }) => {
    test.setTimeout(120_000);
    await withExclusiveAccount(async () => {
      try {
        await login(page, E2E_SERIAL);
        await deleteAllPersonProjects(page);
        await page.goto('/project/person');
        await expect(page.getByTestId('person-empty-create')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId('person-empty-example')).toBeVisible();

        await page.getByTestId('person-empty-example').click();
        await expect(page).toHaveURL(/\/design\/table\/model\?projectId=/, { timeout: 15_000 });
        await expect(page.getByText('示例商城', { exact: true })).toBeVisible({ timeout: 15_000 });
        await expandTreeTitle(page, '示例商城');
        await expandTreeTitle(page, '表');
        await expect(page.getByText('T_USER', { exact: true })).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('T_ORDER', { exact: true })).toBeVisible();
      } finally {
        await deleteAllPersonProjects(page).catch(() => {});
      }
    });
  });

  test('新建项目表单可创建成功并出现在列表', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = `act-${Date.now()}`;
    await withExclusiveAccount(async () => {
      try {
        await login(page, E2E_SERIAL);
        await deleteAllPersonProjects(page);
        await page.goto('/project/person');
        await expect(page.getByTestId('person-empty-create')).toBeVisible({ timeout: 10_000 });
        // 表单默认已有标签「新建」；勿再输入同名标签（Select tags 会卡住）
        await createPersonProject(page, projectName, 'act', 'activation test');
        await expect(page.getByRole('link', { name: projectName }).first()).toBeVisible({
          timeout: 10_000,
        });
      } finally {
        await deleteAllPersonProjects(page).catch(() => {});
      }
    });
  });
});
