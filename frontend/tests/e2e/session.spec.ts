import { expect, test } from '@playwright/test';
import {
  clickAndExpectUrl,
  e2eAccount,
  expectToast,
  login,
  openUserMenu,
} from './helpers';

/**
 * W1：获客与会话闭环（登录链接 / 注册 / 头像菜单 / 退出清会话）
 */

test.describe('会话闭环', () => {
  test('登录页「去注册」导航到注册页', async ({ page }) => {
    await page.goto('/login');
    await clickAndExpectUrl(
      page,
      page.getByRole('link', { name: '去注册' }),
      /\/register/,
    );
    await expect(page.getByRole('button', { name: /注\s*册/ })).toBeVisible();
    await expect(page.getByRole('link', { name: '去登录' })).toBeVisible();
  });

  test('注册成功进入 /home', async ({ page }) => {
    test.setTimeout(60_000);
    const suffix = `${Date.now().toString(36)}${test.info().parallelIndex}`;
    const username = `r${suffix}`.slice(0, 18);
    const password = 'ab12cd34';
    const phone = `139${String(Date.now()).slice(-8)}`;

    await page.goto('/register');
    await page.getByLabel('用户名').fill(username);
    await page.getByLabel('密码', { exact: true }).fill(password);
    await page.getByLabel('确认密码').fill(password);
    await page.getByLabel('邮箱').fill(`${username}@example.com`);
    await page.getByLabel('手机号码').fill(phone);
    await page.getByRole('button', { name: /注\s*册/ }).click();

    await expectToast(page, '注册成功');
    await expect(page).toHaveURL(/\/home/, { timeout: 20_000 });
    await expect(page.getByTestId('home-link-new-project')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('头像菜单：个人中心 / 授权信息 / 退出清会话', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible({
      timeout: 15_000,
    });

    await openUserMenu(page);
    await clickAndExpectUrl(
      page,
      page.getByRole('menuitem', { name: '个人中心' }),
      /\/account\/settings/,
    );
    expect(page.url()).toContain('selectKey=base');

    await page.goto('/home');
    await openUserMenu(page);
    await clickAndExpectUrl(
      page,
      page.getByRole('menuitem', { name: '授权信息' }),
      /\/account\/settings/,
    );
    expect(page.url()).toContain('selectKey=identification');

    await page.goto('/home');
    await openUserMenu(page);
    await page.getByRole('menuitem', { name: '退出登录' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    const auth = await page.evaluate(() => localStorage.getItem('Authorization'));
    expect(auth).toBeNull();

    // 清会话后受保护页应回登录
    await page.goto('/project/person');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test('已登录账号可退出（worker 账号）', async ({ page }) => {
    const account = e2eAccount();
    await login(page, account);
    await page.goto('/home');
    await openUserMenu(page);
    await page.getByRole('menuitem', { name: '退出登录' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByRole('textbox', { name: '用户名' })).toBeVisible();
  });
});
