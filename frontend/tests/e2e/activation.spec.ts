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

        await expect(page.getByText('功能鉴权', { exact: true })).toBeVisible({ timeout: 15_000 });
        await expandTreeTitle(page, '功能鉴权');
        await expandTreeTitle(page, '关系');
        await page.getByTestId('tree-open-relation').click();
        await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
        // hasText 'sys_user' 会误匹配 sys_user_role；用 RF data-testid
        await expect(page.getByTestId('rf__node-sys_user')).toBeVisible();
        await expect(page.getByTestId('rf__node-sys_role')).toBeVisible();
        // 双图切换器 + 主图 Frame（ADR-0017）
        await expect(page.getByTestId('diagram-switcher')).toBeVisible();
        await expect(page.getByTestId('diagram-switcher')).toContainText('鉴权核心');
        await expect(page.locator('.react-flow__node-table')).toHaveCount(8);
        await expect(page.getByTestId('diagram-frame')).toHaveCount(4);
        await expect(page.getByTestId('diagram-frame').filter({ hasText: 'RBAC' })).toBeVisible();
        await expect(page.locator('.react-flow__edge')).toHaveCount(7);
        // 切到「会话与审计」仍见 Frame
        await page.getByTestId('diagram-switcher').locator('.ant-select-selector').click();
        await page.getByRole('option', { name: '会话与审计' }).click();
        await expect(page.getByTestId('diagram-switcher')).toContainText('会话与审计');
        await expect(page.getByTestId('diagram-frame').filter({ hasText: '会话审计' })).toBeVisible();
      } finally {
        await deleteAllPersonProjects(page).catch(() => {});
      }
    });
  });

  test('示例项目一键直达保存第一个版本（30s 激活闭环）', async ({ page }) => {
    test.setTimeout(120_000);
    await withExclusiveAccount(async () => {
      try {
        await login(page, E2E_SERIAL);
        await deleteAllPersonProjects(page);

        await page.goto('/home');
        await page.getByTestId('home-link-example').click();
        await expect(page).toHaveURL(/\/design\/table/, { timeout: 20_000 });
        await expectToast(page, /示例项目已就绪/);

        await page.getByTestId('example-save-version-cta').click();
        await expect(page).toHaveURL(/\/design\/table\/version\/all/, { timeout: 15_000 });
        await expect(page.getByText('Loading...')).toHaveCount(0);

        await page.getByTestId('add-version-btn').click({ timeout: 15_000 });
        const dialog = page.getByRole('dialog').filter({ hasText: '新增版本' });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: /确\s*定/ }).click();
        await expectToast(page, /保存成功/);
        await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      } finally {
        await deleteAllPersonProjects(page).catch(() => {});
      }
    });
  });

  test('关闭示例就绪通知后仍可经顶栏保存版本', async ({ page }) => {
    test.setTimeout(120_000);
    await withExclusiveAccount(async () => {
      try {
        await login(page, E2E_SERIAL);
        await deleteAllPersonProjects(page);

        await page.goto('/home');
        await page.getByTestId('home-link-example').click();
        await expect(page).toHaveURL(/\/design\/table/, { timeout: 20_000 });
        await expectToast(page, /示例项目已就绪/);
        await expect(page.getByTestId('design-header-save-version')).toBeVisible();

        await page.getByTestId('example-ready-dismiss').click();
        await expect(page.getByTestId('example-save-version-cta')).toHaveCount(0);

        await page.getByTestId('design-header-save-version').click();
        await expect(page).toHaveURL(/\/design\/table\/version\/all/, { timeout: 15_000 });
        await expect(page.getByText('Loading...')).toHaveCount(0);

        await page.getByTestId('add-version-btn').click({ timeout: 15_000 });
        const dialog = page.getByRole('dialog').filter({ hasText: '新增版本' });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: /确\s*定/ }).click();
        await expectToast(page, /保存成功/);
        await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
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
