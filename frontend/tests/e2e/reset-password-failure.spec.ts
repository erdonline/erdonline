import { expect, test } from '@playwright/test';
import { e2eAccount, expectToast, login } from './helpers';

/**
 * 修改密码失败：禁止静默关窗伪装成功；业务码 toast 后窗仍开，可重试
 */

test.describe('修改密码失败不关窗', () => {
  test('业务码失败：可读 toast + 窗仍开 → 重试成功', async ({ page }) => {
    test.setTimeout(90_000);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=security');
    await expect(page.getByText('账户密码')).toBeVisible({ timeout: 15_000 });

    let updateHits = 0;
    await page.route('**/syst/user/settings/update', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      updateHits += 1;
      if (updateHits === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '模拟更新密码拒绝' }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: true }),
      });
    });

    try {
      const trigger = page.getByRole('button', { name: '修改密码' });
      await expect(trigger).toBeVisible();
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /修改密码/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      await dialog.getByLabel('密码', { exact: true }).fill('pass12');
      await dialog.getByLabel('确认密码', { exact: true }).fill('pass12');
      await dialog.getByRole('button', { name: /确\s*定/ }).click();

      await expectToast(page, '模拟更新密码拒绝');
      await expect(dialog).toBeVisible();
      await expect(page.getByText('更新密码信息成功')).toHaveCount(0);

      await dialog.getByRole('button', { name: /确\s*定/ }).click();
      await expectToast(page, '更新密码信息成功');
      await expect(dialog).toHaveCount(0);
      expect(updateHits).toBe(2);
    } finally {
      await page.unroute('**/syst/user/settings/update').catch(() => {});
    }
  });
});
