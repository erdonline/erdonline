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
  test.describe.configure({ retries: 1 });

  test('页密度：标题 / 表单 / 安全行与 22–28 chrome 同阶', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=base');

    const root = page.getByTestId('account-settings-page');
    await expect(root).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel('邮箱')).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('button', { name: '更新基本信息' }),
    ).toBeVisible();
    await expect(page.getByText('头像上传暂未开放')).toBeVisible();

    const baseMetrics = await root.evaluate((el) => {
      const title = el.querySelector(
        '.account-settings-page__title',
      ) as HTMLElement | null;
      const input = el.querySelector(
        '.account-settings-form .ant-input:not([disabled]):not(textarea)',
      ) as HTMLElement | null;
      const btn = el.querySelector(
        '.account-settings-form .ant-btn-primary',
      ) as HTMLElement | null;
      const item = el.querySelector(
        '.account-settings-form .ant-form-item',
      ) as HTMLElement | null;
      const tcs = title ? getComputedStyle(title) : null;
      const ics = input ? getComputedStyle(input) : null;
      const bcs = btn ? getComputedStyle(btn) : null;
      const mcs = item ? getComputedStyle(item) : null;
      const pcs = getComputedStyle(el);
      return {
        titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
        titleLh: tcs ? parseFloat(tcs.lineHeight) : NaN,
        pagePadY:
          parseFloat(pcs.paddingTop) + parseFloat(pcs.paddingBottom),
        inputH: ics ? parseFloat(ics.height) : NaN,
        btnH: bcs ? parseFloat(bcs.height) : NaN,
        itemMb: mcs ? parseFloat(mcs.marginBottom) : NaN,
      };
    });
    expect(
      baseMetrics.titleFont,
      `页标题字号应 ≤14（目标 13），得 ${baseMetrics.titleFont}`,
    ).toBeLessThanOrEqual(14);
    expect(baseMetrics.titleFont).toBeGreaterThanOrEqual(12);
    expect(
      baseMetrics.titleLh,
      `页标题行高应 ≤24（目标 22），得 ${baseMetrics.titleLh}`,
    ).toBeLessThanOrEqual(24);
    expect(
      baseMetrics.pagePadY,
      `页 padY 应 ≤24（目标 8+…），得 ${baseMetrics.pagePadY}`,
    ).toBeLessThanOrEqual(24);
    expect(
      baseMetrics.inputH,
      `输入框高度应 ≤32（目标 28），得 ${baseMetrics.inputH}`,
    ).toBeLessThanOrEqual(32);
    expect(baseMetrics.inputH).toBeGreaterThanOrEqual(24);
    expect(
      baseMetrics.btnH,
      `保存钮高度应 ≤32（目标 28），得 ${baseMetrics.btnH}`,
    ).toBeLessThanOrEqual(32);
    expect(
      baseMetrics.itemMb,
      `表单项 margin-bottom 应 ≤16（目标 12），得 ${baseMetrics.itemMb}`,
    ).toBeLessThanOrEqual(16);

    // ADR-0016：BaseView 左右列 gap 与壳 12×16 同族（禁 24）
    const baseView = page.getByTestId('account-settings-base-view');
    await expect(baseView).toBeVisible();
    const baseViewGap = await baseView.evaluate((el) =>
      parseFloat(getComputedStyle(el).gap || getComputedStyle(el).columnGap),
    );
    expect(
      baseViewGap,
      `BaseView 左右 gap 应 ≤16（目标 16，禁 24），得 ${baseViewGap}`,
    ).toBeLessThanOrEqual(16);
    expect(baseViewGap).toBeGreaterThanOrEqual(8);

    await page.getByRole('menuitem', { name: '安全设置' }).click();
    await expect(page).toHaveURL(/selectKey=security/);
    await expect(page.getByText('账户密码')).toBeVisible();
    await expect(page.getByRole('button', { name: '修改密码' })).toBeVisible();

    const securityMetrics = await root.evaluate((el) => {
      const item = el.querySelector('.ant-list-item') as HTMLElement | null;
      const title = el.querySelector(
        '.ant-list-item-meta-title',
      ) as HTMLElement | null;
      const ics = item ? getComputedStyle(item) : null;
      const tcs = title ? getComputedStyle(title) : null;
      return {
        itemPadY: ics
          ? parseFloat(ics.paddingTop) + parseFloat(ics.paddingBottom)
          : NaN,
        titleLh: tcs ? parseFloat(tcs.lineHeight) : NaN,
        titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
      };
    });
    expect(
      securityMetrics.itemPadY,
      `安全行 padY 应 ≤16（目标 ~12），得 ${securityMetrics.itemPadY}`,
    ).toBeLessThanOrEqual(16);
    expect(
      securityMetrics.titleLh,
      `安全行标题行高应 ≤24（目标 22），得 ${securityMetrics.titleLh}`,
    ).toBeLessThanOrEqual(24);
    expect(
      securityMetrics.titleFont,
      `安全行标题字号应 ≤14（目标 13），得 ${securityMetrics.titleFont}`,
    ).toBeLessThanOrEqual(14);

    await page.screenshot({
      path: 'test-results/ux-walkthrough/account-settings-page-dense.png',
      fullPage: false,
    });
  });

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
    await expect(page.getByRole('button', { name: '修改密码' })).toBeVisible();

    await page.getByRole('button', { name: '修改密码' }).click();
    const pwdDlg = page.getByRole('dialog');
    await expect(pwdDlg.getByText('修改密码')).toBeVisible({ timeout: 10_000 });
    await expect(pwdDlg.getByLabel('密码', { exact: true })).toBeVisible();
    await expect(pwdDlg.getByLabel('确认密码', { exact: true })).toBeVisible();
    await pwdDlg.getByRole('button', { name: /取\s*消/ }).click();
    await expect(pwdDlg).toBeHidden({ timeout: 10_000 });

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

  test('授权类型：密度面板 + brand token，无裸 Result', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=identification');

    const panel = page.getByTestId('account-settings-identification');
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByRole('heading', { name: /开源版|已取得授权/ })).toBeVisible();
    await expect(panel.getByText(/MIT 开源|授权给/)).toBeVisible();
    await expect(page.locator('.ant-result')).toHaveCount(0);

    const metrics = await panel.evaluate((el) => {
      const title = el.querySelector('h3') as HTMLElement | null;
      const sub = el.querySelector('p') as HTMLElement | null;
      const icon = el.querySelector(
        '[data-testid="identification-icon"]',
      ) as HTMLElement | null;
      const tcs = title ? getComputedStyle(title) : null;
      const scs = sub ? getComputedStyle(sub) : null;
      const ics = icon ? getComputedStyle(icon) : null;
      const brand = getComputedStyle(document.documentElement)
        .getPropertyValue('--erd-brand')
        .trim()
        .toLowerCase();
      return {
        titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
        titleLh: tcs ? parseFloat(tcs.lineHeight) : NaN,
        subFont: scs ? parseFloat(scs.fontSize) : NaN,
        iconColor: ics ? ics.color.replace(/\s/g, '').toLowerCase() : '',
        brand,
      };
    });
    expect(
      metrics.titleFont,
      `授权标题字号应 ≤14（目标 13），得 ${metrics.titleFont}`,
    ).toBeLessThanOrEqual(14);
    expect(metrics.titleFont).toBeGreaterThanOrEqual(12);
    expect(
      metrics.titleLh,
      `授权标题行高应 ≤24（目标 22），得 ${metrics.titleLh}`,
    ).toBeLessThanOrEqual(24);
    expect(
      metrics.subFont,
      `授权副文案字号应 ≤13（目标 12），得 ${metrics.subFont}`,
    ).toBeLessThanOrEqual(13);
    expect(metrics.brand.length).toBeGreaterThan(0);
    // currentColor → rgb；与 --erd-brand 同源（禁硬编码 #DE2910 字面量）
    expect(metrics.iconColor).toMatch(/^rgb/);
    expect(metrics.iconColor).not.toBe('rgba(0,0,0,0)');
    expect(metrics.iconColor).not.toBe('transparent');

    await page.screenshot({
      path: 'test-results/ux-walkthrough/account-settings-identification.png',
      fullPage: false,
    });
  });
});
