import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 只读分享「吊销」确认 Modal 键盘闭环
 * — 首焦「吊销」；Esc 关确认且不吊销、归还吊销钮；外层分享窗仍开；Tab trap
 * — 不踩 share-project-keyboard / share-invalid-gate 旅程
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

test.describe('只读分享吊销确认键盘', () => {
  test('吊销确认：首焦吊销；Esc 归还不吊销；Tab trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('share-revoke-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(
        page,
        projectName,
        'sharerevokekb',
        'share revoke confirm keyboard',
      );

      const createRespPromise = page.waitForResponse(
        (r) => r.url().includes('/share/create') && r.request().method() === 'POST',
      );
      const shareTrigger = page.getByRole('button', { name: '只读分享' });
      await expect(shareTrigger).toBeVisible({ timeout: 15_000 });
      await shareTrigger.click();

      const shareDialog = page.getByRole('dialog', { name: /只读分享/ });
      await expect(shareDialog).toBeVisible({ timeout: 10_000 });
      const createResp = await createRespPromise;
      expect(createResp.ok()).toBeTruthy();

      const shareUrl = shareDialog.getByRole('textbox', { name: '分享链接' });
      await expect(shareUrl).not.toHaveValue('', { timeout: 10_000 });
      const urlBefore = await shareUrl.inputValue();
      expect(urlBefore).toMatch(/\/s\//);

      const revokeBtn = shareDialog.getByRole('button', { name: '吊销分享' });
      await expect(revokeBtn).toBeEnabled({ timeout: 5_000 });
      await revokeBtn.click();

      const confirm = page.getByRole('dialog', { name: /确认吊销分享/ });
      await expect(confirm).toBeVisible({ timeout: 10_000 });
      await expect(confirm.getByRole('button', { name: /吊\s*销/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(confirm, page);

      await page.keyboard.press('Escape');
      await expect(confirm).toHaveCount(0);
      await expect(shareDialog).toBeVisible();
      await expect(revokeBtn).toBeFocused({ timeout: 5_000 });
      await expect(shareUrl).toHaveValue(urlBefore);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
