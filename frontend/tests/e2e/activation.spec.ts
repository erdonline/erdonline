import { expect, test } from '@playwright/test';
import {
  createPersonProject,
  deleteAllPersonProjects,
  E2E_SERIAL,
  expectToast,
  expandTreeTitle,
  login,
  withExclusiveAccount,
} from './helpers';

/**
 * 新手 30s 激活（账号级操作，走 chromium-serial + withExclusiveAccount）
 */
test.describe('新手激活', () => {
  test.describe.configure({ mode: 'serial' });

  test('首页示例项目一键进入设计器可见表与连线', async ({ page }) => {
    test.setTimeout(120_000);
    await withExclusiveAccount(async () => {
      try {
        await login(page, E2E_SERIAL);
        await deleteAllPersonProjects(page);

        await page.goto('/home');
        await expect(page.getByTestId('home-link-example')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByTestId('home-link-new-project')).toHaveAttribute(
          'href',
          /\/project\/person/,
        );

        await page.getByTestId('home-link-example').click();
        await expect(page).toHaveURL(/\/design\/table/, { timeout: 20_000 });
        await expectToast(page, /示例项目已就绪/);

        await expect(page.getByText('示例商城', { exact: true })).toBeVisible({ timeout: 15_000 });
        await expandTreeTitle(page, '示例商城');
        await expandTreeTitle(page, '关系');
        await page.getByTestId('tree-open-relation').click();
        await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('.react-flow__node', { hasText: 'T_USER' })).toBeVisible();
        await expect(page.locator('.react-flow__node', { hasText: 'T_ORDER' })).toBeVisible();
        await expect(page.locator('.react-flow__edge')).toHaveCount(1);
      } finally {
        await deleteAllPersonProjects(page).catch(() => {});
      }
    });
  });

  test('开源版可连续创建多个个人项目', async ({ page }) => {
    test.setTimeout(120_000);
    const a = `multi-a-${Date.now()}`;
    const b = `multi-b-${Date.now()}`;
    await withExclusiveAccount(async () => {
      try {
        await login(page, E2E_SERIAL);
        await deleteAllPersonProjects(page);

        await page.goto('/project/person');
        await createPersonProject(page, a, 'm', 'no quota');
        await createPersonProject(page, b, 'm', 'no quota');
        await expect(page.getByRole('button', { name: /删\s*除/ })).toHaveCount(2, {
          timeout: 10_000,
        });
      } finally {
        await deleteAllPersonProjects(page).catch(() => {});
      }
    });
  });
});
