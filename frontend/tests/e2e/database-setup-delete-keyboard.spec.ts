import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 设计器「数据源设置」删确认 Modal 键盘闭环
 * — 新增后点删 → 首焦「删除」；Esc 关确认且不删、归还删钮；Tab trap；外层配置窗仍开
 */

async function assertFocusInside(dialog: Locator) {
  expect(
    await dialog.evaluate((dlg) => dlg.contains(document.activeElement)),
  ).toBe(true);
}

async function assertTabTrap(dialog: Locator, page: Page, presses = 8) {
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await assertFocusInside(dialog);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Shift+Tab');
    await assertFocusInside(dialog);
  }
}

test.describe('数据源设置删确认键盘', () => {
  test('删数据源：首焦删除；Esc 归还；Tab trap；不删', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('ds-del-kb');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dsdel', 'ds delete keyboard');

      const menuTrigger = page.getByRole('button', { name: '项目菜单' });
      await menuTrigger.click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '设置' })
        .click();
      await page.getByRole('menuitem', { name: '数据源设置' }).click();

      const setup = page.getByRole('dialog', { name: '数据源连接配置' });
      await expect(setup).toBeVisible({ timeout: 10_000 });

      const postWait = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/dataSources') &&
          r.request().method() === 'POST' &&
          !r.url().includes('ping'),
        { timeout: 20_000 },
      );
      await setup.getByRole('button', { name: '新增数据源' }).click();
      const postRes = await postWait;
      expect(postRes.status()).toBe(200);
      const dsName = postRes.request().postDataJSON()?.name as string;
      expect(dsName).toBeTruthy();
      const nameInput = setup.locator(`input[value="${dsName}"]`);
      await expect(nameInput).toBeVisible({ timeout: 10_000 });

      const delBtn = setup.getByRole('button', { name: `删除数据源 ${dsName}` });
      await expect(delBtn).toBeVisible();
      await delBtn.click();

      const confirm = page.getByRole('dialog').filter({ hasText: /默认数据源|是否删除该数据源/ });
      await expect(confirm).toBeVisible({ timeout: 10_000 });
      await expect(confirm.getByRole('button', { name: /删\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(confirm, page);

      await page.keyboard.press('Escape');
      await expect(confirm).toHaveCount(0);
      await expect(setup).toBeVisible();
      await expect(delBtn).toBeFocused({ timeout: 5_000 });
      await expect(nameInput).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
