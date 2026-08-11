import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  uniqueProjectName,
} from './helpers';

async function openProjectMenu(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '项目菜单' }).click();
  return page.getByTestId('project-menu-panel');
}

async function openSetupEntry(
  page: import('@playwright/test').Page,
  testId: string,
) {
  const panel = await openProjectMenu(page);
  const setup = panel.getByRole('menuitem', { name: '设置' });
  await setup.scrollIntoViewIfNeeded();
  await setup.click();
  const entry = page.getByTestId(testId);
  await expect(entry).toBeVisible({ timeout: 10_000 });
  await entry.click();
}

/**
 * 字段库表单化 + 项目菜单露出设置页
 */
test.describe('字段库管理与设置露出', () => {
  test.describe.configure({ retries: 1 });

  test('项目菜单可进类型字典与字段库；表单新建条目', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('flib-ui');
    const entryTitle = `昵称_${Date.now().toString(36)}`;
    const fieldName = `nick_${Date.now().toString(36).slice(-6)}`;

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'flibui', 'field library form e2e');

      await openSetupEntry(page, 'project-menu-datatype-dict');
      await expect(page).toHaveURL(/\/design\/table\/setting\/dataType/);
      await expect(page.getByTestId('datatype-domains-page')).toBeVisible({
        timeout: 15_000,
      });

      // 设置侧栏切字段库（避免二次展开项目菜单 SubMenu 的不稳定）
      await page
        .getByTestId('design-layout-sider-menu')
        .getByRole('link', { name: '字段库' })
        .click();
      await expect(page).toHaveURL(/\/design\/table\/setting\/fieldLibrary/);
      const manager = page.getByTestId('field-library-manager');
      await expect(manager).toBeVisible({ timeout: 15_000 });

      await page.getByTestId('field-library-create').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('field-library-form-title').fill(entryTitle);
      await dialog.getByTestId('field-library-form-field-name').first().fill(fieldName);
      await dialog.getByTestId('field-library-form-field-chnname').first().fill('昵称');
      // 确保类型有值（默认 MiddleString）
      await expect(dialog.getByTestId('field-library-form-field-type').first()).toBeVisible();
      const [createResp] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.request().method() === 'POST' &&
            /\/dataDict\/?$/.test(new URL(r.url()).pathname),
          { timeout: 15_000 },
        ),
        dialog.getByTestId('field-library-form-submit').click(),
      ]);
      expect(createResp.ok()).toBeTruthy();
      await expectToast(page, /已创建/);
      await expect(dialog).toBeHidden({ timeout: 15_000 });

      await page.getByTestId('field-library-refresh').click();
      await expect(manager.getByText(entryTitle)).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('项目菜单直达字段库', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('flib-nav');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await openSetupEntry(page, 'project-menu-field-library');
      await expect(page).toHaveURL(/\/design\/table\/setting\/fieldLibrary/);
      await expect(page.getByTestId('field-library-manager')).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
