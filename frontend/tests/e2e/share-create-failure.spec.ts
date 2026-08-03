import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 只读分享创建失败：禁止禁用主钮死 affordance；可读 toast；可「重新生成」重试
 */

test.describe('只读分享创建失败可读可重试', () => {
  test('业务码失败：toast + 重新生成 → 成功可复制', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('share-create-fail');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'scf', 'share create fail');

      let createHits = 0;
      await page.route('**/ncnb/share/create', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        createHits += 1;
        if (createHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟创建分享拒绝' }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: { token: `e2e-share-retry-${Date.now().toString(36)}`, path: '/s/x' },
          }),
        });
      });

      const trigger = page.getByRole('button', { name: '只读分享' });
      await expect(trigger).toBeVisible({ timeout: 15_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /只读分享/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expectToast(page, '模拟创建分享拒绝');
      await expect(dialog.getByRole('textbox', { name: '分享链接' })).toHaveValue('');
      await expect(page.getByText('只读链接已复制')).toHaveCount(0);

      const retry = dialog.getByRole('button', { name: '重新生成链接' });
      await expect(retry).toBeEnabled();
      await retry.click();

      await expect(dialog.getByRole('textbox', { name: '分享链接' })).toHaveValue(
        /\/s\//,
        { timeout: 10_000 },
      );
      await expect(dialog.getByRole('button', { name: '复制链接' })).toBeEnabled();
      expect(createHits).toBe(2);
    } finally {
      await page.unroute('**/ncnb/share/create').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
