import { expect, test } from '@playwright/test';

/**
 * P5 落地页：公开叙事 + CTA → demo / 登录；已登录主 CTA → /home
 */
test.describe('落地页', () => {
  test('静态 HTML 含 GSC 查询词与 JSON-LD（爬虫首屏）', async ({ request }) => {
    const res = await request.get('/');
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toContain('Draw ER Diagram Online — Free Editor | ERD Online');
    expect(html).toMatch(/Draw ER diagrams online for free/i);
    expect(html).toContain('suggest-erd-version');
    expect(html).toMatch(/ERD editor and maker/i);
    expect(html).toMatch(/entity-relationship models/i);
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"alternateName"');
    expect(html).toContain('Draw ER diagram online');
    expect(html).toContain('ERD editor');
    expect(html).not.toMatch(/file viewer/i);
    expect(html).not.toMatch(/Google Draw/i);
    expect(html).toContain('rel="canonical"');
    // Other public paths: first-HTML canonical is a dist/ prerender (not this dev shell).
    // Gate: `yarn test:seo-static` + prod-smoke 「crawler first HTML」.
  });

  test('加载可见品牌与主文案；CTA 可达 demo 与登录', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-page')).toBeVisible();
    await expect(page.getByTestId('locale-switcher')).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: 'ERD Online' }).first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /数据库设计的 Git \+ Figma/ }),
    ).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'draw.io' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '连线 ≠ 外键' })).toBeVisible();
    await expect(page.getByTestId('compare-row-agent')).toContainText('Agent / MCP');
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
        voidBg: root.getPropertyValue('--erd-void').trim(),
        hairline: root.getPropertyValue('--erd-hairline').trim(),
        pageBg: pageCs.backgroundColor,
        primaryBg: primary ? getComputedStyle(primary).backgroundColor : '',
        fontUi: pageCs.fontFamily,
        mark3Bg: mark3 ? getComputedStyle(mark3).backgroundColor : '',
      };
    });
    expect(tokenMetrics.ink900).toBe('#0b1c2c');
    expect(tokenMetrics.brand.toLowerCase()).toBe('#de2910');
    expect(tokenMetrics.voidBg).toBe('#070d14');
    expect(tokenMetrics.hairline.length).toBeGreaterThan(0);
    expect(tokenMetrics.pageBg).toMatch(/rgb\(\s*7,\s*13,\s*20\s*\)/);
    expect(tokenMetrics.primaryBg).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);
    expect(tokenMetrics.fontUi.toLowerCase()).toMatch(/ibm plex sans/);
    expect(tokenMetrics.mark3Bg).toMatch(/rgb\(\s*212,\s*136,\s*6\s*\)/); // --erd-warning

    // ADR-0016：次屏 section / 对照表 / footer 次密；hero 品牌字仍醒目 + 全幅
    const densify = await page.getByTestId('landing-page').evaluate((el) => {
      const section = el.querySelector('#pillars') as HTMLElement | null;
      const cell = el.querySelector('.landingCompare td') as HTMLElement | null;
      const footer = el.querySelector('.landingFooter') as HTMLElement | null;
      const nav = el.querySelector('.landingNav') as HTMLElement | null;
      const hero = el.querySelector('.landingHero') as HTMLElement | null;
      const brand = el.querySelector('.landingHeroBrand') as HTMLElement | null;
      const heroCs = hero ? getComputedStyle(hero) : null;
      return {
        sectionPadT: section ? parseFloat(getComputedStyle(section).paddingTop) : -1,
        cellPadT: cell ? parseFloat(getComputedStyle(cell).paddingTop) : -1,
        footerPadT: footer ? parseFloat(getComputedStyle(footer).paddingTop) : -1,
        navPadT: nav ? parseFloat(getComputedStyle(nav).paddingTop) : -1,
        heroMinH: heroCs?.minHeight ?? '',
        brandSize: brand ? parseFloat(getComputedStyle(brand).fontSize) : 0,
      };
    });
    expect(densify.sectionPadT, `次屏 padTop 应 ≤52，得 ${densify.sectionPadT}`).toBeLessThanOrEqual(52);
    expect(densify.sectionPadT).toBeGreaterThanOrEqual(36);
    expect(densify.cellPadT, `对照表行 pad 应 ≤12，得 ${densify.cellPadT}`).toBeLessThanOrEqual(12);
    expect(densify.footerPadT).toBeLessThanOrEqual(36);
    expect(densify.navPadT).toBeLessThanOrEqual(20);
    expect(densify.brandSize, `hero 品牌字应 ≥36，得 ${densify.brandSize}`).toBeGreaterThanOrEqual(36);
    expect(densify.heroMinH).toMatch(/100v|px/);

    await page.getByRole('link', { name: '在线试用 demo' }).click();
    await expect(page).toHaveURL(/\/(demo|s\/public-demo)/, { timeout: 15_000 });

    await page.goto('/');
    await page.getByRole('link', { name: '去登录' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('auth-brand-home')).toBeVisible();
    await page.getByTestId('auth-brand-home').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('landing-page')).toBeVisible();
  });

  test('落地页族顶栏跨页尺寸一致', async ({ page }) => {
    const measureNav = async () =>
      page.locator('.landingNav').evaluate((el) => {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const bodyCs = getComputedStyle(document.body);
        return {
          height: Math.round(rect.height),
          width: Math.round(rect.width),
          padLeft: parseFloat(cs.paddingLeft),
          position: cs.position,
          bodyMarginTop: parseFloat(bodyCs.marginTop),
          viewportWidth: window.innerWidth,
          itemCount: el.querySelectorAll('.landingNavLinks > *').length,
        };
      });

    await page.goto('/');
    const homeNav = await measureNav();

    await page.goto('/catalog');
    const catalogNav = await measureNav();

    await page.goto('/compare');
    const compareNav = await measureNav();

    for (const nav of [homeNav, catalogNav, compareNav]) {
      expect(nav.bodyMarginTop).toBe(0);
      expect(nav.width).toBeGreaterThanOrEqual(nav.viewportWidth - 2);
    }
    expect(homeNav.height).toBe(catalogNav.height);
    expect(homeNav.height).toBe(compareNav.height);
    expect(homeNav.padLeft).toBe(0);
    expect(catalogNav.padLeft).toBe(0);
    expect(homeNav.itemCount).toBe(catalogNav.itemCount);
    expect(homeNav.itemCount).toBe(compareNav.itemCount);
    expect(homeNav.position).toBe('sticky');
    expect(catalogNav.position).toBe('sticky');
    expect(compareNav.position).toBe('sticky');
  });

  test('顶栏与 Hero 可进入模板广场', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-nav-catalog')).toBeVisible();
    await expect(page.getByTestId('landing-hero-catalog')).toBeVisible();
    const mcpDocs = page.getByTestId('landing-mcp-docs');
    await expect(mcpDocs).toBeVisible();
    await expect(mcpDocs).toHaveAttribute(
      'href',
      'https://doc.erdonline.com/docs/guide/api-and-mcp/',
    );
    await expect(mcpDocs).toHaveAccessibleName(/MCP/);
    await expect(mcpDocs).toContainText(/提交一版|suggest a version/);
    await expect(page.getByRole('cell', { name: /projectJSON \+ MCP/ })).toBeVisible();
    await expect(page.locator('#compare')).not.toContainText('路线图中');
    await page.getByTestId('landing-nav-catalog').click();
    await expect(page).toHaveURL(/\/catalog/, { timeout: 15_000 });
    await expect(page.getByTestId('catalog-list-page')).toBeVisible({ timeout: 15_000 });
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

  // ADR-0016：落地页键盘 — Skip 绕开顶栏；主 CTA 区 Tab 序；focus-visible；无 trap
  test('落地页键盘：Skip→主 CTA；Tab 序；focus-visible；无 trap', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await expect(page.getByTestId('landing-page')).toBeVisible();
    await expect(page.getByTestId('landing-skip-cta')).toHaveText('跳到主操作');
    await expect(page.getByTestId('landing-main-cta')).toHaveAttribute('tabindex', '-1');

    // 首项 Tab = Skip；Enter 落到主 CTA 地标
    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('landing-skip-cta')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('landing-main-cta')).toBeFocused();

    // 地标 tabIndex=-1：下一 Tab 离开，进首个主 CTA（无 trap）
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('landing-main-cta')).not.toBeFocused();
    const primaryCta = page.getByRole('link', { name: '在线试用 demo' });
    await expect(primaryCta).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '浏览模板广场' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '注册' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '去登录' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('link', { name: '注册' })).toBeFocused();

    // focus-visible surface 环（深色门面；须经 Tab 触发 :focus-visible）
    await page.getByRole('link', { name: '注册' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('link', { name: '浏览模板广场' })).toBeFocused();
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
    // --erd-surface 白环（暗底门面）
    expect(ring.outlineColor).toMatch(/rgb\(\s*255,\s*255,\s*255\s*\)/);

    // 不按 Skip：DOM 序首焦为品牌链（Skip 非唯一入口）
    await page.goto('/');
    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('landing-skip-cta')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'ERD Online 首页' })).toBeFocused();
  });
});

