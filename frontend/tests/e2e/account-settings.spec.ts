import { expect, test } from '@playwright/test';
import { e2eAccount, expectToast, login, openUserMenu } from './helpers';

/**
 * W6 `/account/settings`：基本资料保存 toast；头像上传保持裁剪态；
 * security / identification 页签可切换有内容（从头像菜单进入）。
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

  test('头像进入后 security / identification 页签可切换有内容', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await login(page, e2eAccount());
    await page.goto('/home');
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible({
      timeout: 15_000,
    });

    await openUserMenu(page);
    await page.getByRole('menuitem', { name: '个人中心' }).click();
    await expect(page).toHaveURL(/selectKey=base/, { timeout: 15_000 });
    await expect(page.getByLabel('邮箱')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('menuitem', { name: '安全设置' }).click();
    await expect(page).toHaveURL(/selectKey=security/);
    await expect(page.getByText('账户密码')).toBeVisible();
    await expect(page.getByRole('button', { name: '修改' })).toBeVisible();

    await page.getByRole('menuitem', { name: '授权类型' }).click();
    await expect(page).toHaveURL(/selectKey=identification/);
    await expect(page.getByText(/开源版|已取得授权/)).toBeVisible({
      timeout: 15_000,
    });

    await page.goto('/home');
    await openUserMenu(page);
    await page.getByRole('menuitem', { name: '授权信息' }).click();
    await expect(page).toHaveURL(/selectKey=identification/, {
      timeout: 15_000,
    });
    await expect(page.getByText(/开源版|已取得授权/)).toBeVisible({
      timeout: 15_000,
    });
  });
});
