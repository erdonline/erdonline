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
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible();
    await expect(page.getByRole('button', { name: /注\s*册/ })).toBeVisible();
    await expect(page.getByRole('link', { name: '去登录' })).toBeVisible();
    await expect(page.getByRole('link', { name: '打开演示' }).first()).toBeVisible();

    // ADR-0016：注册壳与登录同源碎距二压（20×16）；品牌字号不弱化
    const densify = await page.getByTestId('auth-brand-panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      const form = document.querySelector('[data-testid="auth-form-panel"]') as HTMLElement | null;
      const title = el.querySelector('.auth-shell__brand-title') as HTMLElement | null;
      const fcs = form ? getComputedStyle(form) : null;
      const tcs = title ? getComputedStyle(title) : null;
      return {
        brandPadT: parseFloat(cs.paddingTop),
        brandPadL: parseFloat(cs.paddingLeft),
        formPadT: fcs ? parseFloat(fcs.paddingTop) : -1,
        formPadL: fcs ? parseFloat(fcs.paddingLeft) : -1,
        titleSize: tcs ? parseFloat(tcs.fontSize) : 0,
      };
    });
    expect(densify.brandPadT).toBeLessThanOrEqual(20);
    expect(densify.brandPadL).toBeLessThanOrEqual(16);
    expect(densify.formPadT).toBeLessThanOrEqual(20);
    expect(densify.formPadL).toBeLessThanOrEqual(16);
    expect(densify.titleSize).toBeGreaterThanOrEqual(24);
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

  // ADR-0016：登录壳键盘 — Skip 绕开品牌面板；表单 Tab 序；Enter 提交；focus-visible；无 trap
  test('登录壳键盘：Skip→表单；Tab 序；Enter 提交；focus-visible；无 trap', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto('/login');
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible();
    await expect(page.getByTestId('auth-skip-nav')).toBeAttached();
    await expect(page.getByTestId('auth-skip-form')).toBeAttached();
    await expect(page.getByTestId('auth-form-anchor')).toHaveAttribute('tabindex', '-1');

    // 首项 Tab = Skip；Enter 落到表单锚点
    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('auth-skip-form')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('auth-form-anchor')).toBeFocused();

    // 地标 → Tab 离开（无 trap）→ 用户名
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('auth-form-anchor')).not.toBeFocused();
    await expect(page.getByRole('textbox', { name: '用户名' })).toBeFocused();

    // 表单内序：用户名 → 密码 → 登录
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: '密码' })).toBeFocused();
    await page.keyboard.press('Tab');
    // antd Password 显隐钮可能进序；最多再 Tab 一次落到登录
    const loginBtn = page.getByRole('button', { name: /登\s*录/ });
    if (!(await loginBtn.evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press('Tab');
    }
    await expect(loginBtn).toBeFocused();

    // 登录 → footer「去注册」；Shift+Tab 可逆（无 trap）
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '去注册' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(loginBtn).toBeFocused();

    // focus-visible brand 环（须经 Tab 触发 :focus-visible）
    await page.getByRole('textbox', { name: '密码' }).focus();
    await page.keyboard.press('Tab');
    if (!(await loginBtn.evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press('Tab');
    }
    await expect(loginBtn).toBeFocused();
    const ring = await loginBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineColor: cs.outlineColor,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
      };
    });
    expect(ring.outlineStyle).not.toBe('none');
    expect(parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(1);
    expect(ring.outlineColor).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);

    // 密码框 Enter 提交（错误凭证 → toast + 停留 /login）
    await page.getByRole('textbox', { name: '用户名' }).fill('nobody');
    await page.getByRole('textbox', { name: '密码' }).fill('wrong-pass');
    await page.getByRole('textbox', { name: '密码' }).press('Enter');
    await expectToast(page, '查无此用户');
    await expect(page).toHaveURL(/\/login/);
  });

  // ADR-0016：注册壳键盘 — 共用 AuthBrandShell；Tip 出序；密码眼进序可容；Enter 校验；无 trap
  test('注册壳键盘：Skip→表单；Tab 序；Enter 校验；focus-visible；无 trap', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto('/register');
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible();
    await expect(page.getByTestId('auth-skip-form')).toHaveText('跳到注册表单');
    await expect(page.getByTestId('auth-form-anchor')).toHaveAttribute('tabindex', '-1');

    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('auth-skip-form')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('auth-form-anchor')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('auth-form-anchor')).not.toBeFocused();
    await expect(page.getByRole('textbox', { name: '用户名' })).toBeFocused();

    // 用户名 → 密码（Hint 出序；Password 显隐可能进序）
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: '密码', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    const confirmPwd = page.getByRole('textbox', { name: '确认密码' });
    if (!(await confirmPwd.evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press('Tab');
    }
    await expect(confirmPwd).toBeFocused();

    await page.keyboard.press('Tab');
    const email = page.getByRole('textbox', { name: '邮箱' });
    if (!(await email.evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press('Tab');
    }
    await expect(email).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: '手机号码' })).toBeFocused();
    await page.keyboard.press('Tab');
    const registerBtn = page.getByRole('button', { name: /注\s*册/ });
    await expect(registerBtn).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '去登录' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(registerBtn).toBeFocused();

    // focus-visible brand 环（须经 Tab 触发 :focus-visible）
    await page.getByRole('textbox', { name: '手机号码' }).focus();
    await page.keyboard.press('Tab');
    await expect(registerBtn).toBeFocused();
    const ring = await registerBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineColor: cs.outlineColor,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
      };
    });
    expect(ring.outlineStyle).not.toBe('none');
    expect(parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(1);
    expect(ring.outlineColor).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);

    // 末字段 Enter → onFinish 密码不一致 toast；停留 /register
    await page.getByRole('textbox', { name: '用户名' }).fill('kbuser01');
    await page.getByRole('textbox', { name: '密码', exact: true }).fill('ab12cd34');
    await page.getByRole('textbox', { name: '确认密码' }).fill('ab12cd99');
    await page.getByRole('textbox', { name: '邮箱' }).fill('kbuser01@example.com');
    await page.getByRole('textbox', { name: '手机号码' }).fill('13912345678');
    await page.getByRole('textbox', { name: '手机号码' }).press('Enter');
    await expectToast(page, '两次输入的密码不一致');
    await expect(page).toHaveURL(/\/register/);
  });
});
