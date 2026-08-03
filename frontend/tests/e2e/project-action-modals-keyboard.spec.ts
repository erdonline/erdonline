import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 项目动作弹窗键盘闭环：新建 / 修改 / 删除确认
 * — 打开首焦字段或确认钮；Esc 关；焦点归还触发器；Tab trap 在 dialog
 */

async function assertFocusInside(dialog: Locator) {
  expect(
    await dialog.evaluate((dlg) => dlg.contains(document.activeElement)),
  ).toBe(true);
}

async function assertTabTrap(dialog: Locator, page: Page, presses = 12) {
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await assertFocusInside(dialog);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Shift+Tab');
    await assertFocusInside(dialog);
  }
}

test.describe('项目动作弹窗键盘', () => {
  test('新建：首焦类型；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(90_000);
    await login(page, e2eAccount());
    await page.goto('/project/person');
    await expect(page.getByTestId('project-person-page')).toBeVisible({
      timeout: 15_000,
    });

    const trigger = page.getByTestId('project-create-trigger');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '新增项目' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('项目类型')).toBeFocused({ timeout: 5_000 });

    await assertTabTrap(dialog, page);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused({ timeout: 5_000 });
  });

  test('修改：首焦项目名；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('pmodal-rename');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await page.goto('/project/person');
      await createPersonProject(page, projectName, 'pm', 'modal keyboard rename');

      const row = page
        .getByTestId('project-person-page')
        .getByTestId('project-list-row')
        .filter({ has: page.getByRole('link', { name: projectName, exact: true }) });
      await expect(row).toBeVisible({ timeout: 15_000 });

      const trigger = row.getByRole('button', { name: '修改项目' });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: '修改项目' });
      await expect(dialog).toBeVisible();
      const nameField = dialog.getByPlaceholder('请输入项目名');
      await expect(nameField).toBeFocused({ timeout: 5_000 });
      await expect(nameField).toHaveValue(projectName);

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('删除确认：首焦确定；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('pmodal-del');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await page.goto('/project/person');
      await createPersonProject(page, projectName, 'pd', 'modal keyboard delete');

      const row = page
        .getByTestId('project-person-page')
        .getByTestId('project-list-row')
        .filter({ has: page.getByRole('link', { name: projectName, exact: true }) });
      await expect(row).toBeVisible({ timeout: 15_000 });

      const trigger = row.getByRole('button', { name: '删除项目' });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: '删除项目' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: '是' })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page, 8);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(
        page.getByRole('link', { name: projectName, exact: true }),
      ).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
