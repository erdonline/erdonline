import { expect, test, type Locator, type Page } from '@playwright/test';
import { e2eAccount, login } from './helpers';

/**
 * 账号「修改密码」Modal 键盘闭环
 * — 打开首焦「密码」；Esc 关；焦点归还触发器；Tab trap 在 dialog
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

test.describe('修改密码弹层键盘', () => {
  test('修改密码：首焦密码；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(90_000);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=security');

    await expect(page.getByText('账户密码')).toBeVisible({ timeout: 15_000 });
    const trigger = page.getByRole('button', { name: '修改密码' });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: /修改密码/ });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByLabel('密码', { exact: true })).toBeFocused({
      timeout: 5_000,
    });

    await assertTabTrap(dialog, page);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused({ timeout: 5_000 });
  });
});
