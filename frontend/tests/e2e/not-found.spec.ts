import { expect, test } from '@playwright/test';
import { login } from './helpers';

/**
 * 404/403：AuthBrandShell + 主 CTA「打开示例 demo」+「返回首页」（ADR-0016）；无裸 Result。
 */
test.describe('404 页', () => {
  test('未知路径见品牌壳并可返回首页', async ({ page }) => {
    await login(page);
    await page.goto(`/this-path-does-not-exist-${Date.now().toString(36)}`);
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('auth-brand-panel')).toBeVisible();
    await expect(page.getByTestId('exception-404-gate')).toBeVisible();
    await expect(page.getByRole('heading', { name: '页面不存在' })).toBeVisible();
    await expect(page.getByText('抱歉，你访问的页面不存在')).toBeVisible();

    const brandMetrics = await page.getByTestId('auth-brand-panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      const root = getComputedStyle(document.documentElement);
      return {
        widthRatio: el.getBoundingClientRect().width / window.innerWidth,
        ink900: root.getPropertyValue('--erd-ink-900').trim(),
        bgImage: cs.backgroundImage,
      };
    });
    expect(brandMetrics.widthRatio).toBeGreaterThan(0.32);
    expect(brandMetrics.widthRatio).toBeLessThan(0.48);
    expect(brandMetrics.ink900).toBe('#0b1c2c');
    expect(brandMetrics.bgImage).toMatch(/linear-gradient/i);

    await page.screenshot({
      path: 'test-results/ux-walkthrough/exception-404-brand-shell.png',
      fullPage: false,
    });

    await page.getByRole('button', { name: '返回首页' }).click();
    await expect(page).not.toHaveURL(/this-path-does-not-exist/, {
      timeout: 15_000,
    });
    // `/` 或登录后落到 `/home`
    await expect(page).toHaveURL(/\/($|home)/, { timeout: 15_000 });
  });

  test('未知路径可打开示例 demo', async ({ page }) => {
    await login(page);
    await page.goto(`/this-path-does-not-exist-demo-${Date.now().toString(36)}`);
    await expect(page.getByTestId('exception-404-gate')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('抱歉，你访问的页面不存在')).toBeVisible();
    await page.getByRole('button', { name: '打开示例 demo' }).click();
    await expect(page).toHaveURL(/\/(demo|s\/public-demo)/, { timeout: 15_000 });
  });

  // ADR-0016：404 壳键盘 — Skip 绕开品牌面板；主 CTA Tab 序；focus-visible；无 trap
  test('404 壳键盘：Skip→主 CTA；Tab 序；focus-visible；无 trap', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(`/this-path-does-not-exist-kb-${Date.now().toString(36)}`);
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('auth-skip-form')).toHaveText('跳到主操作');
    await expect(page.getByTestId('exception-404-gate')).toHaveAttribute('tabindex', '-1');

    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('auth-skip-form')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('exception-404-gate')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('exception-404-gate')).not.toBeFocused();
    const primaryCta = page.getByRole('button', { name: '打开示例 demo' });
    await expect(primaryCta).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '返回首页' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(primaryCta).toBeFocused();

    // focus-visible brand 环（须经 Tab 触发 :focus-visible）
    await page.getByRole('button', { name: '返回首页' }).focus();
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
    expect(ring.outlineColor).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);
  });
});

test.describe('403 页', () => {
  // ADR-0016：403 壳键盘 — 与 404 同构 Skip/CTA/focus-visible
  test('403 壳键盘：Skip→主 CTA；Tab 序；focus-visible；无 trap', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/403');
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('exception-403-gate')).toBeVisible();
    await expect(page.getByRole('heading', { name: '无权访问' })).toBeVisible();
    await expect(page.getByTestId('auth-skip-form')).toHaveText('跳到主操作');
    await expect(page.getByTestId('exception-403-gate')).toHaveAttribute('tabindex', '-1');

    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('auth-skip-form')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('exception-403-gate')).toBeFocused();

    await page.keyboard.press('Tab');
    const primaryCta = page.getByRole('button', { name: '打开示例 demo' });
    await expect(primaryCta).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '返回首页' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(primaryCta).toBeFocused();

    await page.getByRole('button', { name: '返回首页' }).focus();
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
    expect(ring.outlineColor).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);
  });
});
