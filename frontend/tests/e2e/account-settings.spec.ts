import { expect, test } from '@playwright/test';
import { e2eAccount, expectToast, login } from './helpers';

/**
 * W6 `/account/settings`：基本资料保存 toast；头像上传保持裁剪态
 * 说明：e2e 种子用户无 phone，表单必填；提交前填入 worker 稳定号码。
 */
async function fillBaseForm(page: import('@playwright/test').Page) {
  await expect(page.getByLabel('邮箱')).toBeVisible({ timeout: 15_000 });
  const phone = `138${String(test.info().parallelIndex).padStart(8, '0')}`;
  await page.getByLabel('联系电话').fill(phone);
}

test.describe('账户设置', () => {
  test('基本资料保存成功有 toast；头像无假 Upload', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=base');
    await expect(page).toHaveURL(/\/account\/settings/, { timeout: 15_000 });

    await expect(page.getByText('头像上传暂未开放')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: '更换头像' })).toHaveCount(0);
    await expect(page.locator('input[type="file"]')).toHaveCount(0);

    await fillBaseForm(page);
    await page.getByRole('button', { name: '更新基本信息' }).click();
    await expectToast(page, '更新基本信息成功');
  });

  test('基本资料保存失败有 toast', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=base');
    await fillBaseForm(page);

    await page.route('**/syst/user/settings/update', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '更新基本信息失败' }),
      });
    });

    await page.getByRole('button', { name: '更新基本信息' }).click();
    await expectToast(page, '更新基本信息失败');
    await page.unroute('**/syst/user/settings/update');
  });
});
