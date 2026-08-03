import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 设计器顶栏「只读分享」Modal 键盘闭环
 * — 打开首焦「分享链接」；Esc 关；焦点归还触发器；Tab trap 在 dialog
 * — 不提交复制/吊销；不踩分享失效门 / 只读壳旅程
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

test.describe('只读分享弹层键盘', () => {
  test('只读分享：首焦分享链接；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('share-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'sharekb', 'share modal keyboard');

      const createRespPromise = page.waitForResponse(
        (r) => r.url().includes('/share/create') && r.request().method() === 'POST',
      );
      const trigger = page.getByRole('button', { name: '只读分享' });
      await expect(trigger).toBeVisible({ timeout: 15_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /只读分享/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('textbox', { name: '分享链接' })).toBeFocused({
        timeout: 5_000,
      });

      const createResp = await createRespPromise;
      expect(createResp.ok()).toBeTruthy();

      // ADR-0016：链接已生成时弹层次密（.erd-io-modal body + hint/link-row）
      await expect(dialog.getByRole('textbox', { name: '分享链接' })).toHaveValue(/\/s\//);
      const modalDense = await dialog.evaluate((dlg) => {
        const body = dlg.querySelector('.ant-modal-body') as HTMLElement | null;
        const hint = dlg.querySelector('.erd-share-modal__hint') as HTMLElement | null;
        const linkRow = dlg.querySelector('.erd-share-modal__link-row') as HTMLElement | null;
        const input = dlg.querySelector('[aria-label="分享链接"]') as HTMLElement | null;
        const bodyCs = body ? getComputedStyle(body) : null;
        const hintCs = hint ? getComputedStyle(hint) : null;
        const linkCs = linkRow ? getComputedStyle(linkRow) : null;
        return {
          bodyPadT: bodyCs ? parseFloat(bodyCs.paddingTop) : -1,
          hintMb: hintCs ? parseFloat(hintCs.marginBottom) : -1,
          linkMb: linkCs ? parseFloat(linkCs.marginBottom) : -1,
          inputH: input ? input.getBoundingClientRect().height : -1,
        };
      });
      expect(modalDense.bodyPadT, `分享弹层 body pad 应 ≤8，得 ${modalDense.bodyPadT}`).toBeLessThanOrEqual(8);
      expect(modalDense.hintMb, `hint mb 应 ≤8，得 ${modalDense.hintMb}`).toBeLessThanOrEqual(8);
      expect(modalDense.linkMb, `链接行 mb 应 ≤10，得 ${modalDense.linkMb}`).toBeLessThanOrEqual(10);
      expect(modalDense.inputH, `链接输入高应 ∈[26,30]，得 ${modalDense.inputH}`).toBeGreaterThanOrEqual(26);
      expect(modalDense.inputH).toBeLessThanOrEqual(30);

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
