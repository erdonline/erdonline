import { expect, test } from '@playwright/test';

/**
 * P5 落地页：公开叙事 + CTA → demo / 登录；已登录主 CTA → /home
 */
test.describe('落地页', () => {
  test('加载可见品牌与主文案；CTA 可达 demo 与登录', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-page')).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: 'ERD Online' }).first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /数据库设计的 Git \+ Figma/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'ERD Online 设计器关系图画布' }),
    ).toBeVisible();

    // 落地页色板同源 --erd-*；主 CTA = brand（非橙魔法色）
    const tokenMetrics = await page.getByTestId('landing-page').evaluate((el) => {
      const root = getComputedStyle(document.documentElement);
      const pageCs = getComputedStyle(el);
      const primary = el.querySelector('.landingBtnPrimary');
      const mark3 = el.querySelector('.landingPillar:nth-child(3) .landingPillarMark');
      return {
        ink900: root.getPropertyValue('--erd-ink-900').trim(),
        brand: root.getPropertyValue('--erd-brand').trim(),
        warning: root.getPropertyValue('--erd-warning').trim(),
        pageBg: pageCs.backgroundColor,
        primaryBg: primary ? getComputedStyle(primary).backgroundColor : '',
        fontUi: pageCs.fontFamily,
        mark3Bg: mark3 ? getComputedStyle(mark3).backgroundColor : '',
      };
    });
    expect(tokenMetrics.ink900).toBe('#0b1c2c');
    expect(tokenMetrics.brand.toLowerCase()).toBe('#de2910');
    expect(tokenMetrics.pageBg).toMatch(/rgb\(\s*11,\s*28,\s*44\s*\)/);
    expect(tokenMetrics.primaryBg).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);
    expect(tokenMetrics.fontUi.toLowerCase()).toMatch(/ibm plex sans/);
    expect(tokenMetrics.mark3Bg).toMatch(/rgb\(\s*212,\s*136,\s*6\s*\)/); // --erd-warning

    await page.getByRole('link', { name: '在线试用 demo' }).click();
    await expect(page).toHaveURL(/\/(demo|s\/public-demo)/, { timeout: 15_000 });

    await page.goto('/');
    await page.getByRole('link', { name: '去登录' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('link', { name: '了解产品' })).toBeVisible();
    await page.getByRole('link', { name: '了解产品' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('landing-page')).toBeVisible();
  });

  test('已登录时主 CTA 进入工作台，不被营销页困住', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('Authorization', 'e2e-landing-session');
    });
    await page.goto('/');
    await expect(page.getByTestId('landing-page')).toBeVisible();
    const heroPrimary = page.locator('.landingHero .landingBtnPrimary');
    await expect(heroPrimary).toHaveAttribute('href', /\/home/);
    await expect(heroPrimary).toHaveAccessibleName('进入工作台');
    await expect(page.getByRole('navigation', { name: '落地页导航' }).getByRole('link', { name: '进入工作台' })).toBeVisible();
  });
});

