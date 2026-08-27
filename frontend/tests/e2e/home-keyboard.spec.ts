import { expect, test } from '@playwright/test';
import {
  createPersonProject,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * Home 工作台键盘：Skip 进主区；CTA / 项目卡 Tab 序；focus-visible；无 trap
 * + hero CTA 簇 / 空态·公告区次密距（ADR-0016）
 */
test.describe('Home 工作台键盘', () => {
  // ADR-0016：HomeLayout Skip 绕开顶栏；主区 CTA 与项目卡 Tab 序；brand focus-visible
  test('Home 键盘：Skip→主内容；CTA/项目卡 Tab 序；focus-visible；无 trap', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await login(page, e2eAccount());

    // ADR-0016：空态/公告次密 — mock 空 recent + 新鲜公告，锁定 pad/gap；保留空态 CTA
    const freshTs = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await page.route('**/ncnb/project/recent**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { records: [], total: 0, size: 1, sizeSize: 6 },
        }),
      });
    });
    await page.route('**/syst/sysAnnouncement', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            records: [
              {
                id: 'e2e-home-announce-1',
                title: 'E2E Home 公告密度',
                url: 'https://example.com/erd-announce',
                createTime: freshTs,
              },
            ],
            total: 1,
          },
        }),
      });
    });
    await page.goto('/home');
    await expect(page.getByTestId('home-page')).toBeVisible();
    const empty = page.getByTestId('home-empty-state');
    await expect(empty).toBeVisible({ timeout: 15_000 });
    await expect(empty.getByRole('button', { name: '新建模型' })).toBeVisible();
    await expect(empty.getByRole('button', { name: '从示例开始' })).toBeVisible();
    const announce = page.getByTestId('home-announce');
    await expect(announce).toBeVisible();
    await expect(announce.getByRole('link', { name: '更多公告' })).toBeVisible();
    await expect(announce.getByRole('link', { name: 'E2E Home 公告密度' })).toBeVisible();

    const emptyAnnounceDense = await page.evaluate(() => {
      const emptyEl = document.querySelector('[data-testid="home-empty-state"]') as HTMLElement;
      const section = document.querySelector(
        '[data-testid="home-project-section"]',
      ) as HTMLElement;
      const nav = document.querySelector('nav[aria-label="项目入口"]') as HTMLElement;
      const announceEl = document.querySelector(
        '[data-testid="home-announce"]',
      ) as HTMLElement;
      const head = announceEl?.querySelector('div') as HTMLElement | null;
      const li = announceEl?.querySelector('li') as HTMLElement | null;
      const title = announceEl?.querySelector('h5, .ant-typography') as HTMLElement | null;
      const gapOf = (cs: CSSStyleDeclaration) => {
        const g = parseFloat(cs.gap);
        if (!Number.isNaN(g) && g > 0) return g;
        return Math.max(parseFloat(cs.rowGap) || 0, parseFloat(cs.columnGap) || 0);
      };
      const ecs = getComputedStyle(emptyEl);
      const scs = getComputedStyle(section);
      const ncs = getComputedStyle(nav);
      const acs = getComputedStyle(announceEl);
      const hcs = head ? getComputedStyle(head) : null;
      const lcs = li ? getComputedStyle(li) : null;
      const tcs = title ? getComputedStyle(title) : null;
      return {
        emptyPadY: parseFloat(ecs.paddingTop),
        emptyPadX: parseFloat(ecs.paddingLeft),
        sectionMb: parseFloat(scs.marginBottom),
        navMb: parseFloat(ncs.marginBottom),
        announcePt: parseFloat(acs.paddingTop),
        headMb: hcs ? parseFloat(hcs.marginBottom) : 99,
        rowPadY: lcs ? parseFloat(lcs.paddingTop) : 99,
        rowGap: lcs ? gapOf(lcs) : 99,
        titleSize: tcs ? parseFloat(tcs.fontSize) : 0,
      };
    });
    expect(
      emptyAnnounceDense.emptyPadY,
      `空态 padY 应 ≤24，得 ${emptyAnnounceDense.emptyPadY}`,
    ).toBeLessThanOrEqual(24);
    expect(
      emptyAnnounceDense.emptyPadX,
      `空态 padX 应 ≤12，得 ${emptyAnnounceDense.emptyPadX}`,
    ).toBeLessThanOrEqual(12);
    expect(
      emptyAnnounceDense.sectionMb,
      `项目区 mb 应 ≤20，得 ${emptyAnnounceDense.sectionMb}`,
    ).toBeLessThanOrEqual(20);
    expect(
      emptyAnnounceDense.navMb,
      `二级入口 mb 应 ≤16，得 ${emptyAnnounceDense.navMb}`,
    ).toBeLessThanOrEqual(16);
    expect(
      emptyAnnounceDense.announcePt,
      `公告区 pt 应 ≤4，得 ${emptyAnnounceDense.announcePt}`,
    ).toBeLessThanOrEqual(4);
    expect(
      emptyAnnounceDense.headMb,
      `区块头 mb 应 ≤8，得 ${emptyAnnounceDense.headMb}`,
    ).toBeLessThanOrEqual(8);
    expect(
      emptyAnnounceDense.rowPadY,
      `公告行 padY 应 ≤4，得 ${emptyAnnounceDense.rowPadY}`,
    ).toBeLessThanOrEqual(4);
    expect(
      emptyAnnounceDense.rowGap,
      `公告行 gap 应 ≤10，得 ${emptyAnnounceDense.rowGap}`,
    ).toBeLessThanOrEqual(10);
    expect(
      emptyAnnounceDense.titleSize,
      `公告标题字应 ≤13，得 ${emptyAnnounceDense.titleSize}`,
    ).toBeLessThanOrEqual(13);

    await page.unroute('**/ncnb/project/recent**');
    await page.unroute('**/syst/sysAnnouncement');

    // 保证有最近项目：「继续上次建模」进序 + 至少一张项目卡
    await page.goto('/project/person');
    const projectName = uniqueProjectName('home-kb');
    await createPersonProject(page, projectName, 'kb', 'home keyboard');

    await page.goto('/home');
    await expect(page.getByTestId('home-layout')).toBeVisible();
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('home-skip-main')).toHaveText('跳到主内容');
    await expect(page.getByTestId('home-main-content')).toHaveAttribute('tabindex', '-1');
    await expect(page.getByTestId('home-continue-modeling')).toBeEnabled({ timeout: 15_000 });
    await expect(page.getByTestId('home-project-card').first()).toBeVisible();

    // ADR-0016：hero CTA 簇次密 — actions gap≤8 / secondary pad≤4×10；主 CTA large 不压；Skip·Tab 不弱化
    const densify = await page.getByTestId('home-continue-modeling').evaluate((btn) => {
      const actions = btn.parentElement as HTMLElement;
      const secondary = actions.querySelector('a')?.parentElement as HTMLElement;
      const secondaryBtn = actions.querySelector('a') as HTMLElement;
      const hero = actions.parentElement as HTMLElement;
      const title = hero.querySelector('h2') as HTMLElement | null;
      const acs = getComputedStyle(actions);
      const scs = getComputedStyle(secondary);
      const sbcs = getComputedStyle(secondaryBtn);
      const hcs = getComputedStyle(hero);
      const gapOf = (cs: CSSStyleDeclaration) => {
        const g = parseFloat(cs.gap);
        if (!Number.isNaN(g) && g > 0) return g;
        return Math.max(parseFloat(cs.rowGap) || 0, parseFloat(cs.columnGap) || 0);
      };
      return {
        actionsGap: gapOf(acs),
        secondaryGap: gapOf(scs),
        secondaryPadT: parseFloat(sbcs.paddingTop),
        secondaryPadX: parseFloat(sbcs.paddingLeft),
        heroGap: gapOf(hcs),
        heroMb: parseFloat(hcs.marginBottom),
        heroPb: parseFloat(hcs.paddingBottom),
        continueH: (btn as HTMLElement).getBoundingClientRect().height,
        titleSize: title ? parseFloat(getComputedStyle(title).fontSize) : 0,
      };
    });
    expect(densify.actionsGap, `CTA 簇 gap 应 ≤8，得 ${densify.actionsGap}`).toBeLessThanOrEqual(8);
    expect(densify.secondaryGap, `次链 gap 应 ≤12，得 ${densify.secondaryGap}`).toBeLessThanOrEqual(12);
    expect(densify.secondaryPadT, `新建钮 padY 应 ≤4，得 ${densify.secondaryPadT}`).toBeLessThanOrEqual(4);
    expect(densify.secondaryPadX, `新建钮 padX 应 ≤10，得 ${densify.secondaryPadX}`).toBeLessThanOrEqual(10);
    expect(densify.heroGap, `hero gap 应 ≤24，得 ${densify.heroGap}`).toBeLessThanOrEqual(24);
    expect(densify.heroMb, `hero mb 应 ≤16，得 ${densify.heroMb}`).toBeLessThanOrEqual(16);
    expect(densify.heroPb, `hero pb 应 ≤16，得 ${densify.heroPb}`).toBeLessThanOrEqual(16);
    expect(densify.continueH, `主 CTA 高应 ≥40（large），得 ${densify.continueH}`).toBeGreaterThanOrEqual(40);
    // ADR-0026：Home hero 精密字号 24（禁回退松 28+）
    expect(densify.titleSize, `问候字号应 ∈[22,26]，得 ${densify.titleSize}`).toBeGreaterThanOrEqual(22);
    expect(densify.titleSize).toBeLessThanOrEqual(26);

    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-skip-main')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('home-main-content')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-continue-modeling')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /新建模型/ })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '从示例开始' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-mcp-docs')).toBeFocused();
    await expect(page.getByTestId('home-mcp-docs')).toHaveAttribute(
      'href',
      'https://doc.erdonline.com/docs/guide/api-and-mcp/',
    );

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '个人项目' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '最近项目' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '团队项目' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-link-all-models')).toBeFocused();

    // Tab 至首张项目卡（自然 DOM 序；可能中间还有其它可焦）
    let reachedCard = false;
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      if (await page.getByTestId('home-project-card').first().evaluate((el) => el === document.activeElement)) {
        reachedCard = true;
        break;
      }
    }
    expect(reachedCard).toBe(true);
    await expect(page.getByTestId('home-project-card').first()).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByTestId('home-project-card').first()).not.toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-project-card').first()).toBeFocused();

    // focus-visible brand 环（须经 Tab 触发 :focus-visible）
    await page.getByRole('button', { name: '从示例开始' }).focus();
    await page.keyboard.press('Shift+Tab');
    const newModel = page.getByRole('link', { name: /新建模型/ });
    await expect(newModel).toBeFocused();
    const ring = await newModel.evaluate((el) => {
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

    // 不按 Skip：DOM 序首焦后为品牌链（Skip 非唯一入口）
    await page.goto('/home');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-skip-main')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'ERD Online 首页' })).toBeFocused();
  });

  test('顶栏品牌链统一回产品首页 /', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await page.getByRole('link', { name: 'ERD Online 首页' }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    await expect(page.getByTestId('landing-page')).toBeVisible();
  });
});
