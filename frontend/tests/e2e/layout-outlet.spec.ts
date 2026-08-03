import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  gotoVersionSub,
  login,
  openRelationFromEmpty,
  uniqueProjectName,
} from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

async function apiToken(request: APIRequestContext, username: string, password: string) {
  const r = await request.post(`${API}/auth/login`, {
    data: { username, password },
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`login failed: ${username}`);
  return j.access_token as string;
}

/**
 * Wave 0：Home / Group / Design 布局壳必须渲染主内容。
 * Theme 内 Outlet；三壳同 erd chrome（顶栏 64、无水印 clutter）。
 */
test.describe('布局壳子路由出口', () => {
  test('HomeLayout：/home 与 /project/person 主内容可见', async ({ page }) => {
    await login(page);

    await page.goto('/home');
    const homeCta = page.getByTestId('home-link-new-project');
    await expect(homeCta).toBeVisible({ timeout: 15_000 });
    await expect(homeCta).toHaveCount(1);
    await expect(page.getByRole('link', { name: '新建模型' })).toBeVisible();
    // Home 不得挂载设计器顶栏动作；仍保留公众号 + GitHub
    await expect(page.getByTestId('save-status')).toHaveCount(0);
    await expect(page.getByTestId('collab-presence')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '只读分享' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'GitHub 仓库' })).toBeVisible();
    await expect(page.getByRole('img', { name: '公众号' })).toBeVisible();

    await page.goto('/project/person');
    await expect(page.getByText('个人项目').first()).toBeVisible({ timeout: 15_000 });
    // 列表工具栏「新建」或空态「立即创建」——任一可见即证明子路由已挂载
    const createBtn = page.getByRole('button', { name: /新\s*建|立即创建/ }).first();
    await expect(createBtn).toBeVisible({ timeout: 15_000 });
  });

  test('三壳同语言：顶栏 64 + 无水印 + Home 表面 token', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 15_000 });

    const homeChrome = await page.evaluate(() => {
      const layout = document.querySelector('[data-testid="home-layout"]');
      const header = document.querySelector('.erd-chrome-header');
      const menuIcon = document.querySelector(
        '.home-layout__menu .ant-menu-item .i-icon svg path, .home-layout__menu .ant-menu-item svg path',
      );
      const root = getComputedStyle(document.documentElement);
      return {
        hasWatermark: Boolean(document.querySelector('.ant-watermark')),
        headerH: header ? Math.round(header.getBoundingClientRect().height) : 0,
        brand: root.getPropertyValue('--erd-brand').trim(),
        surfaceSunk: root.getPropertyValue('--erd-surface-sunk').trim(),
        layoutBg: layout ? getComputedStyle(layout).backgroundColor : '',
        fontUi: root.getPropertyValue('--erd-font-ui').trim(),
        navIconFill: (menuIcon?.getAttribute('fill') || '').toLowerCase(),
      };
    });
    expect(homeChrome.hasWatermark).toBe(false);
    expect(homeChrome.headerH).toBe(64);
    expect(homeChrome.brand.toLowerCase()).toBe('#de2910');
    // 主导航图标走 erdColors.brand（与 --erd-brand 同源；禁组件内硬编码字面量）
    expect(homeChrome.navIconFill).toBe(homeChrome.brand.toLowerCase());
    // surface-sunk #fafbfc → rgb(250, 251, 252)
    expect(homeChrome.layoutBg).toMatch(/250,\s*251,\s*252/);
    expect(homeChrome.fontUi).toMatch(/IBM Plex Sans/i);

    await page.screenshot({
      path: 'test-results/ux-walkthrough/home-chrome-tokens.png',
      fullPage: false,
    });

    // Home IA：无快速操作墙 / 无竖排磁贴；CTA 在 hero
    await expect(page.getByText('快速操作')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '继续上次建模' })).toBeVisible();
    await expect(page.getByTestId('home-link-new-project')).toBeVisible();
    await expect(page.getByTestId('home-link-example')).toBeVisible();
    await page.screenshot({
      path: 'test-results/ux-walkthrough/home-redesign.png',
      fullPage: false,
    });
  });

  test('Home 项目卡密度：与 22–28 chrome 同阶', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, e2eAccount());
    await page.goto('/home');
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: '进行中的项目' }),
    ).toBeVisible();

    // 有卡则验卡密度；空态仍验区标题行高
    const metrics = await page.evaluate(() => {
      const pageEl = document.querySelector(
        '[data-testid="home-page"]',
      ) as HTMLElement | null;
      const title = pageEl?.querySelector('h2') as HTMLElement | null;
      const card = pageEl?.querySelector(
        '[data-testid="home-project-card"]',
      ) as HTMLElement | null;
      const tcs = title ? getComputedStyle(title) : null;
      const ccs = card ? getComputedStyle(card) : null;
      return {
        titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
        titleLh: tcs ? parseFloat(tcs.lineHeight) : NaN,
        cardPadY: ccs
          ? parseFloat(ccs.paddingTop) + parseFloat(ccs.paddingBottom)
          : null,
        cardMinH: ccs ? parseFloat(ccs.minHeight) : null,
        hasCard: Boolean(card),
      };
    });
    expect(
      metrics.titleFont,
      `区标题字号应 ≤14（目标 13），得 ${metrics.titleFont}`,
    ).toBeLessThanOrEqual(14);
    expect(metrics.titleFont).toBeGreaterThanOrEqual(12);
    expect(
      metrics.titleLh,
      `区标题行高应 ≤24（目标 22），得 ${metrics.titleLh}`,
    ).toBeLessThanOrEqual(24);
    if (metrics.hasCard) {
      expect(
        metrics.cardPadY,
        `项目卡 padY 应 ≤28（目标 ~20），得 ${metrics.cardPadY}`,
      ).toBeLessThanOrEqual(28);
      expect(
        metrics.cardMinH,
        `项目卡 min-height 应 ≤110（目标 96），得 ${metrics.cardMinH}`,
      ).toBeLessThanOrEqual(110);
    }

    await page.screenshot({
      path: 'test-results/ux-walkthrough/home-project-cards-dense.png',
      fullPage: false,
    });
  });

  test('GroupLayout：/project/group/setting/basic 主内容可见', async ({ page, request }) => {
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const name = `e2e-w${test.info().parallelIndex}-layout-${Date.now().toString(36)}`;
    const add = await request.post(`${API}/ncnb/project/group/add`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { projectName: name, description: 'layout outlet', tags: 'e2e' },
    });
    const addJson = await add.json();
    const projectId = addJson.data as string;
    expect(addJson.code).toBe(200);
    expect(projectId).toBeTruthy();

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByLabel('项目名')).toBeVisible();
      await expect(page.getByRole('heading', { name: '基本设置' })).toHaveCount(1);
    } finally {
      await request
        .post(`${API}/ncnb/project/group/delete`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { id: projectId },
        })
        .catch(() => {});
    }
  });

  test('DesignLayout：顶栏动作与子路由出口可见', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('design-layout');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      const projectMenuBtn = page.getByRole('button', { name: '项目菜单' });
      await expect(projectMenuBtn).toBeVisible({ timeout: 15_000 });
      await expect(projectMenuBtn).toContainText(projectName);
      await expect(page.getByTestId('save-status')).toBeVisible();
      await expect(page.getByRole('button', { name: '保存版本' })).toBeVisible();
      await expect(page.getByTestId('collab-presence')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole('button', { name: '只读分享' })).toBeVisible();
      // 顶栏右：工单 / 待审批 / 通知（真实路由）
      const workflow = page.getByTestId('design-workflow-links');
      await expect(workflow.getByRole('button', { name: '我的工单' })).toBeVisible();
      await expect(workflow.getByRole('button', { name: '待审批工单' })).toBeVisible();
      await expect(workflow.getByRole('button', { name: '通知' })).toBeVisible();
      // 主 tabs 仅 模型 | 版本；公众号/GitHub 收进「更多」
      const topTabs = page.getByTestId('design-top-tabs');
      await expect(topTabs.getByRole('menuitem', { name: '模型' })).toBeVisible();
      await expect(topTabs.getByRole('menuitem', { name: '版本' })).toBeVisible();
      await expect(topTabs.getByRole('menuitem')).toHaveCount(2);
      await page.getByRole('button', { name: '更多' }).click();
      await expect(page.getByRole('link', { name: 'GitHub 仓库' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page).toHaveURL(/\/design\/table\/model/);
      // 子路由已挂载：模型页欢迎空态或侧栏「新增模型」
      await expect(
        page
          .getByText('欢迎使用数据建模工具')
          .or(page.getByTestId('add-module-empty'))
          .first(),
      ).toBeVisible({ timeout: 20_000 });
      // W2 chrome：侧栏唯一左树，主区不再嵌套第二份 DataTable
      await expect(page.getByTestId('add-module-empty')).toHaveCount(1);
      await expect(page.locator('.design-layout__sider')).toHaveCSS('width', '320px');
      await expect(page.locator('.design-layout__sider-footer')).toHaveCount(0);

      await workflow.getByRole('button', { name: '我的工单' }).click();
      await expect(page).toHaveURL(/\/design\/table\/version\/order/);
      await expect(page.getByTestId('page-title-orders')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('design-workflow-links').getByRole('button', { name: '待审批工单' }).click();
      await expect(page).toHaveURL(/\/design\/table\/version\/approval/);
      await expect(page.getByTestId('page-title-approvals')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('design-workflow-links').getByRole('button', { name: '通知' }).click();
      await expect(page).toHaveURL(/\/project\/notice/);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('DesignLayout：模型树唯一 + 新建入口常显', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('chrome-tree');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);
      await openRelationFromEmpty(page, { name: 'CHROME', chnname: '铬' });
      // 树头「新建」唯一（页内另有「新建」勿用 role name 计数）
      await expect(page.getByTestId('design-tree-add')).toHaveCount(1);
      await expect(page.getByTestId('design-tree-add')).toHaveAttribute('aria-label', '新建');
      await expect(page.getByTestId('tree-open-relation')).toHaveCount(1);
      await expect(page.getByRole('tree')).toHaveCount(1);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('DesignLayout：模型树与版本页 flex 填满（无 calc(100vh)）', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('chrome-flex');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);
      await openRelationFromEmpty(page, { name: 'FLEX', chnname: '弹性' });

      await expect(page.getByTestId('query-tree')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('.erd-reactflow-container')).toBeVisible({ timeout: 15_000 });
      const fills = await page.evaluate(() => {
        const tree = document.querySelector('.tree-container');
        const sider = document.querySelector('.design-layout__sider-inner');
        const canvas = document.querySelector('.erd-reactflow-container');
        const content = document.querySelector('.design-layout__content');
        if (!tree || !sider || !canvas || !content) {
          return { treeGap: -1, canvasOk: false, canvasH: 0 };
        }
        const treeGap = sider.getBoundingClientRect().bottom - tree.getBoundingClientRect().bottom;
        const canvasH = canvas.getBoundingClientRect().height;
        const contentH = content.getBoundingClientRect().height;
        // CommonTabs 签头 ~24（再压，原 40→28→24）；画布应接近 content 高度（允许工具条/边距）
        return {
          treeGap,
          canvasOk: canvasH > 200 && canvasH > contentH * 0.5,
          canvasH,
        };
      });
      expect(fills.treeGap >= 0 && fills.treeGap < 24, `tree fill gap=${fills.treeGap}`).toBe(true);
      expect(fills.canvasOk, `canvas height=${fills.canvasH}`).toBe(true);

      await gotoVersionSub(page, 'all');
      await expect(page.getByTestId('version-page')).toBeVisible({ timeout: 15_000 });
      const versionFill = await page.evaluate(() => {
        const version = document.querySelector('[data-testid="version-page"]');
        const content = document.querySelector('.design-layout__content');
        if (!version || !content) return { ok: false, delta: -1 };
        const delta = Math.abs(
          version.getBoundingClientRect().height - content.getBoundingClientRect().height,
        );
        return { ok: delta < 8, delta };
      });
      expect(versionFill.ok, `version-page should fill content (delta=${versionFill.delta})`).toBe(
        true,
      );
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
