import { expect, test } from '@playwright/test';
import { e2eAccount, login } from './helpers';

/**
 * ADR-0016：/databaseConfig 页 chrome 密度（与 22–28 / .setting-common-page 同阶）
 */
test.describe('数据库配置页', () => {
  test.describe.configure({ retries: 1 });

  test('页密度：标题 / 工具条 / 抽屉表单与 22–28 chrome 同阶', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, e2eAccount());
    await page.goto('/databaseConfig');

    const root = page.getByTestId('database-config-page');
    await expect(root).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: '数据库连接管理' }),
    ).toBeVisible();
    await expect(page.getByText('数据库连接列表')).toBeVisible();
    await expect(page.getByRole('button', { name: '新建连接' })).toBeVisible();
    await expect(page.getByLabel('搜索连接名称')).toBeVisible();

    const pageMetrics = await root.evaluate((el) => {
      const title = el.querySelector(
        '.database-config-page__title',
      ) as HTMLElement | null;
      const btn = el.querySelector(
        '.database-config-page__toolbar .ant-btn-primary',
      ) as HTMLElement | null;
      const tcs = title ? getComputedStyle(title) : null;
      const bcs = btn ? getComputedStyle(btn) : null;
      const pcs = getComputedStyle(el);
      return {
        titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
        titleLh: tcs ? parseFloat(tcs.lineHeight) : NaN,
        pagePadY:
          parseFloat(pcs.paddingTop) + parseFloat(pcs.paddingBottom),
        btnH: bcs ? parseFloat(bcs.height) : NaN,
      };
    });
    expect(
      pageMetrics.titleFont,
      `页标题字号应 ≤14（目标 13），得 ${pageMetrics.titleFont}`,
    ).toBeLessThanOrEqual(14);
    expect(pageMetrics.titleFont).toBeGreaterThanOrEqual(12);
    expect(
      pageMetrics.titleLh,
      `页标题行高应 ≤24（目标 22），得 ${pageMetrics.titleLh}`,
    ).toBeLessThanOrEqual(24);
    expect(
      pageMetrics.pagePadY,
      `页 padY 应 ≤24（目标 8+…），得 ${pageMetrics.pagePadY}`,
    ).toBeLessThanOrEqual(24);
    expect(
      pageMetrics.btnH,
      `新建连接钮高度应 ≤32（目标 28），得 ${pageMetrics.btnH}`,
    ).toBeLessThanOrEqual(32);

    await page.getByRole('button', { name: '新建连接' }).click({ force: true });
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible({ timeout: 10_000 });
    await expect(drawer.getByText('新建数据库连接')).toBeVisible();
    await expect(
      drawer.getByPlaceholder('例如：生产环境主数据库'),
    ).toBeVisible();
    await expect(drawer.getByRole('button', { name: '保存连接' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: '测试连接' })).toBeVisible();

    const formMetrics = await drawer.evaluate((el) => {
      const input = el.querySelector(
        '.database-config-form .ant-input:not(textarea)',
      ) as HTMLElement | null;
      const btn = el.querySelector(
        '.database-config-form .ant-btn-primary',
      ) as HTMLElement | null;
      const item = el.querySelector(
        '.database-config-form .ant-form-item',
      ) as HTMLElement | null;
      const ics = input ? getComputedStyle(input) : null;
      const bcs = btn ? getComputedStyle(btn) : null;
      const mcs = item ? getComputedStyle(item) : null;
      return {
        inputH: ics ? parseFloat(ics.height) : NaN,
        btnH: bcs ? parseFloat(bcs.height) : NaN,
        itemMb: mcs ? parseFloat(mcs.marginBottom) : NaN,
      };
    });
    expect(
      formMetrics.inputH,
      `输入框高度应 ≤32（目标 28），得 ${formMetrics.inputH}`,
    ).toBeLessThanOrEqual(32);
    expect(formMetrics.inputH).toBeGreaterThanOrEqual(24);
    expect(
      formMetrics.btnH,
      `保存钮高度应 ≤32（目标 28），得 ${formMetrics.btnH}`,
    ).toBeLessThanOrEqual(32);
    expect(
      formMetrics.itemMb,
      `表单项 margin-bottom 应 ≤16（目标 12），得 ${formMetrics.itemMb}`,
    ).toBeLessThanOrEqual(16);

    await page.screenshot({
      path: 'test-results/ux-walkthrough/database-config-page-dense.png',
      fullPage: false,
    });
  });
});
