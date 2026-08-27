import { expect, test } from '@playwright/test';

/**
 * 竞品对照子页 `/compare`：诚实对照表 + CTA → demo / 首页
 */
test.describe('竞品对照页', () => {
  test('加载对照表；顶栏/CTA 可达 demo 与首页', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.getByTestId('compare-page')).toBeVisible();
    await expect(page).toHaveTitle(/draw\.io/i);
    await expect(page.getByRole('heading', { name: '诚实对照' })).toBeVisible();

    const table = page.getByRole('table');
    await expect(table.getByRole('columnheader', { name: 'ERD Online' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'draw.io' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'dbdiagram' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'dbml 生态' })).toBeVisible();
    await expect(table.getByRole('cell', { name: '关系语义 / 外键' })).toBeVisible();
    await expect(table.getByRole('cell', { name: '连线 ≠ 外键' })).toBeVisible();
    const agentRow = page.getByTestId('compare-row-agent');
    await expect(agentRow).toBeVisible();
    await expect(agentRow).toContainText('Agent / MCP');
    await expect(agentRow).toContainText('projectJSON + MCP');
    await expect(agentRow).toContainText('绘图 XML，无外键语义');
    await expect(agentRow).not.toContainText(/ChatSQL|一句话生成/);
    await expect(table.getByRole('cell', { name: '版本与 diff' })).toBeVisible();
    await expect(table.getByRole('cell', { name: '开源自部署' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'MIT + compose' })).toBeVisible();

    // ADR-0016：/compare 次密距 — section / 表行收紧；品牌 eyebrow 仍醒目；键盘用例不改
    const densify = await page.getByTestId('compare-page').evaluate((el) => {
      const hero = el.querySelector('.landingCompareHero') as HTMLElement | null;
      const section = el.querySelector('.landingSection:not(.landingCompareHero)') as HTMLElement | null;
      const cell = el.querySelector('.landingCompare td') as HTMLElement | null;
      const eyebrow = el.querySelector('.landingCompareEyebrow') as HTMLElement | null;
      const nav = el.querySelector('.landingNav') as HTMLElement | null;
      return {
        heroPadT: hero ? parseFloat(getComputedStyle(hero).paddingTop) : -1,
        sectionPadT: section ? parseFloat(getComputedStyle(section).paddingTop) : -1,
        cellPadT: cell ? parseFloat(getComputedStyle(cell).paddingTop) : -1,
        eyebrowSize: eyebrow ? parseFloat(getComputedStyle(eyebrow).fontSize) : 0,
        navPadT: nav ? parseFloat(getComputedStyle(nav).paddingTop) : -1,
      };
    });
    expect(densify.heroPadT, `compare hero padTop 应 ≤36，得 ${densify.heroPadT}`).toBeLessThanOrEqual(36);
    expect(densify.sectionPadT, `对照区 padTop 应 ≤52，得 ${densify.sectionPadT}`).toBeLessThanOrEqual(52);
    expect(densify.cellPadT, `对照表行 pad 应 ≤12，得 ${densify.cellPadT}`).toBeLessThanOrEqual(12);
    expect(densify.eyebrowSize).toBeGreaterThanOrEqual(22);
    expect(densify.navPadT).toBeLessThanOrEqual(20);

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
    await page.getByTestId('landing-nav-compare').click();
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
    await expect(page.getByTestId('compare-page')).toBeVisible({ timeout: 15_000 });
    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('landing-skip-cta')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'ERD Online 首页' })).toBeFocused();
  });
});
