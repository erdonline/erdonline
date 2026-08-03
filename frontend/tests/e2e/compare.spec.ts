import { expect, test } from '@playwright/test';

/**
 * 竞品对照子页 `/compare`：诚实对照表 + CTA → demo / 首页
 */
test.describe('竞品对照页', () => {
  test('加载对照表；顶栏/CTA 可达 demo 与首页', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.getByTestId('compare-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: '诚实对照' })).toBeVisible();

    const table = page.getByRole('table');
    await expect(table.getByRole('columnheader', { name: 'ERD Online' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'dbdiagram' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'dbml 生态' })).toBeVisible();
    await expect(table.getByRole('cell', { name: '版本与 diff' })).toBeVisible();
    await expect(table.getByRole('cell', { name: '开源自部署' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'MIT + compose' })).toBeVisible();

    await page.getByRole('link', { name: '打开演示' }).click();
    await expect(page).toHaveURL(/\/(demo|s\/public-demo)/, { timeout: 15_000 });

    await page.goto('/compare');
    await page.getByRole('link', { name: '返回产品首页' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('landing-page')).toBeVisible();
  });

  test('落地页「对比」与完整对照链进入 /compare', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-page')).toBeVisible();
    await page.getByRole('navigation', { name: '落地页导航' }).getByRole('link', { name: '竞品对照' }).click();
    await expect(page).toHaveURL(/\/compare/);
    await expect(page.getByTestId('compare-page')).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: '查看完整对照' }).click();
    await expect(page).toHaveURL(/\/compare/);
    await expect(page.getByRole('heading', { name: '诚实对照' })).toBeVisible();
  });

  // ADR-0016：`/compare` 共用 LandingChrome — Skip 绕开顶栏；CTA Tab 序；focus-visible；无 trap
  test('竞品对照页键盘：Skip→主 CTA；Tab 序；focus-visible；无 trap', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/compare');
    await expect(page.getByTestId('compare-page')).toBeVisible();
    await expect(page.getByTestId('landing-skip-cta')).toHaveText('跳到主操作');
    await expect(page.getByTestId('landing-main-cta')).toHaveAttribute('tabindex', '-1');

    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('landing-skip-cta')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('landing-main-cta')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('landing-main-cta')).not.toBeFocused();
    const primaryCta = page.getByRole('link', { name: '打开演示' });
    await expect(primaryCta).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '自部署指南' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '返回产品首页' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('link', { name: '自部署指南' })).toBeFocused();

    // focus-visible surface 环（深色门面；须经 Tab 触发 :focus-visible）
    await page.getByRole('link', { name: '自部署指南' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(primaryCta).toBeFocused();
    const ring = await primaryCta.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineColor: cs.outlineColor,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
      };
    });
    expect(ring.outlineStyle).not.toBe('none');
    expect(parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(1);
    expect(ring.outlineColor).toMatch(/rgb\(\s*255,\s*255,\s*255\s*\)/);

    // 不按 Skip：DOM 序首焦为品牌链（Skip 非唯一入口）
    await page.goto('/compare');
    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('landing-skip-cta')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'ERD Online 首页' })).toBeFocused();
  });
});
