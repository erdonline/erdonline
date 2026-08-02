import { expect, test } from '@playwright/test';
import { expectToast, login } from './helpers';

/**
 * W2 `/project/notice`：首页「更多公告」→ 列表可读；失败有 toast；22–28 密度。
 */

test.describe('项目公告', () => {
  test('首页更多公告 → 列表可见', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto('/home');
    const moreLink = page.getByRole('link', { name: '更多公告' });
    // Home 仅在 90 天内公告时渲染「更多公告」；过期则直达列表仍验收闭环
    if (await moreLink.isVisible().catch(() => false)) {
      await moreLink.click();
    } else {
      await page.goto('/project/notice');
    }
    await expect(page).toHaveURL(/\/project\/notice/, { timeout: 15_000 });
    await expect(page.getByTestId('project-notice-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: '公告' })).toBeVisible({
      timeout: 10_000,
    });
    // 种子库有历史公告标题
    await expect(
      page.getByTestId('project-notice-page').getByRole('link', { name: /ERDOnline/ }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('公告加载失败有 toast', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.route('**/syst/sysAnnouncement', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '加载公告失败' }),
      });
    });
    await page.goto('/project/notice');
    await expect(page.getByTestId('project-notice-page')).toBeVisible({
      timeout: 15_000,
    });
    await expectToast(page, '加载公告失败');
    await page.unroute('**/syst/sysAnnouncement');
  });

  test('公告列表行密度：与 22–28 chrome 同阶', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto('/project/notice');
    const pageEl = page.getByTestId('project-notice-page');
    await expect(pageEl).toBeVisible({ timeout: 15_000 });
    await expect(pageEl.getByRole('heading', { name: '公告' })).toBeVisible();

    const row = pageEl
      .getByRole('listitem')
      .filter({ has: page.getByRole('link', { name: /ERDOnline/ }) })
      .first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    // ADR-0016：列表行 pad/标题/工具条与 22–28 chrome 同阶；禁 Title level4 + List large
    const metrics = await row.evaluate((el) => {
      const cs = getComputedStyle(el);
      const title = el.querySelector('.ant-list-item-meta-title');
      const titleCs = title ? getComputedStyle(title) : null;
      const pageRoot = el.closest('.project-list-page') as HTMLElement | null;
      const pageTitle = pageRoot?.querySelector(
        '.project-list-page__title',
      ) as HTMLElement | null;
      const toolbar = pageRoot?.querySelector(
        '.project-list-page__toolbar',
      ) as HTMLElement | null;
      const link = el.querySelector(
        '.project-list-page__notice-row > a',
      ) as HTMLElement | null;
      const linkCs = link ? getComputedStyle(link) : null;
      const tcs = pageTitle ? getComputedStyle(pageTitle) : null;
      return {
        padBlock: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
        padInline: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
        titleFont: titleCs ? parseFloat(titleCs.fontSize) : -1,
        titleLh: titleCs ? parseFloat(titleCs.lineHeight) : -1,
        linkFont: linkCs ? parseFloat(linkCs.fontSize) : -1,
        pageTitleFont: tcs ? parseFloat(tcs.fontSize) : -1,
        pageTitleLh: tcs ? parseFloat(tcs.lineHeight) : -1,
        toolbarH: toolbar ? toolbar.getBoundingClientRect().height : -1,
      };
    });

    expect(
      metrics.padBlock,
      `列表行 padding-block 合计应 ≤10（目标 4+4），得 ${metrics.padBlock}`,
    ).toBeLessThanOrEqual(10);
    expect(metrics.padBlock).toBeGreaterThanOrEqual(4);
    expect(
      metrics.padInline,
      `列表行 padding-inline 合计应 ≤20（目标 8+8），得 ${metrics.padInline}`,
    ).toBeLessThanOrEqual(20);
    expect(
      metrics.titleFont,
      `公告标题字号应 ≤14（目标 13），得 ${metrics.titleFont}`,
    ).toBeLessThanOrEqual(14);
    expect(metrics.titleFont).toBeGreaterThanOrEqual(12);
    expect(
      metrics.titleLh,
      `公告标题行高应 ≤24（目标 22），得 ${metrics.titleLh}`,
    ).toBeLessThanOrEqual(24);
    expect(
      metrics.linkFont,
      `公告链字号应 ≤14（继承标题），得 ${metrics.linkFont}`,
    ).toBeLessThanOrEqual(14);
    expect(
      metrics.pageTitleFont,
      `页标题字号应 ≤14（目标 13），得 ${metrics.pageTitleFont}`,
    ).toBeLessThanOrEqual(14);
    expect(
      metrics.pageTitleLh,
      `页标题行高应 ≤24（目标 22），得 ${metrics.pageTitleLh}`,
    ).toBeLessThanOrEqual(24);
    expect(
      metrics.toolbarH,
      `工具条高应 ≤40（目标 ~28），得 ${metrics.toolbarH}`,
    ).toBeLessThanOrEqual(40);
    expect(metrics.toolbarH).toBeGreaterThanOrEqual(22);

    await page.screenshot({
      path: 'test-results/ux-walkthrough/project-notice-list-dense.png',
      fullPage: false,
    });
  });
});
