import { expect, test } from '@playwright/test';
import path from 'path';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * DBML 导入：上传 fixture → 模型树 + 画布 N 实体；前缀表自动建议 Frame；
 * 空态 CTA → 导入后首屏 fitView（ADR-0016 截图可分享）
 */
test.describe('DBML 导入', () => {
  test('上传 minimal.dbml 后画布可见 N 张表', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('dbml');
    const fixture = path.join(__dirname, '../fixtures/minimal.dbml');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dbml', 'dbml import');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('menuitem', { name: '导入DBML' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('导入 DBML')).toBeVisible({ timeout: 10_000 });

      await dlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /DBML 导入成功/);
      await expect(dlg).toBeHidden({ timeout: 10_000 });

      const tree = page.getByRole('complementary');
      await expect(tree.getByText('DBML导入', { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      // 导入后自动打开关系图；仍允许点树叶子（幂等）
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({
        timeout: 10_000,
      });
      await expect(rfNode(page, 'users')).toBeVisible({ timeout: 15_000 });
      await expect(rfNode(page, 'posts')).toBeVisible();
      const total = Number(
        await page.getByTestId('reactflow-canvas').getAttribute('data-node-total'),
      );
      expect(total).toBeGreaterThanOrEqual(2);

      // ADR-0016：导入后按 FK dagre LR（posts→users ⇒ posts.x < users.x）；旧 3 列网格 posts@360 > users@80
      const parseTx = (t: string) => {
        const m = t.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px/);
        return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: NaN, y: NaN };
      };
      const postsTx = parseTx(
        await rfNode(page, 'posts').evaluate((el) => (el as HTMLElement).style.transform),
      );
      const usersTx = parseTx(
        await rfNode(page, 'users').evaluate((el) => (el as HTMLElement).style.transform),
      );
      expect(postsTx.x, '外键侧 posts 应在主键侧 users 左侧（dagre LR）').toBeLessThan(usersTx.x);

      await page
        .getByTestId('reactflow-canvas')
        .screenshot({ path: 'test-results/ux-walkthrough/diagram-autolayout-import.png' });

      await expect(tree.getByText('users', { exact: true })).toBeVisible({
        timeout: 10_000,
      });
      await expect(tree.getByText('posts', { exact: true })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('空态导入 DBML：首屏 fitView 可截图', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('dbmlfit');
    const fixture = path.join(__dirname, '../fixtures/minimal.dbml');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dbmlfit', 'import first screen');
      await openRelationFromEmpty(page);

      await page.getByRole('button', { name: '导入 DBML' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('导入 DBML')).toBeVisible({ timeout: 10_000 });
      await dlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /DBML 导入成功/);
      await expect(dlg).toBeHidden({ timeout: 10_000 });

      // 导入直开关系图；旧空态 tab 可能仍挂在 DOM（antd 默认不销毁非活动页）
      await expect(rfNode(page, 'users')).toBeVisible({ timeout: 15_000 });
      await expect(rfNode(page, 'posts')).toBeVisible();
      await expect(page.getByTestId('canvas-empty-state')).toBeHidden();

      // fitView：两表节点落入画布可视区（截图敢分享）
      await page.waitForTimeout(300);
      const canvas = page
        .getByTestId('reactflow-canvas')
        .filter({ has: page.locator('.react-flow__node', { hasText: 'users' }) });
      await expect(canvas).toBeVisible();
      const c = await canvas.boundingBox();
      const u = await rfNode(page, 'users').boundingBox();
      const p = await rfNode(page, 'posts').boundingBox();
      expect(c && u && p).toBeTruthy();
      const slack = 8;
      expect(u!.x).toBeGreaterThanOrEqual(c!.x - slack);
      expect(u!.x + u!.width).toBeLessThanOrEqual(c!.x + c!.width + slack);
      expect(p!.x).toBeGreaterThanOrEqual(c!.x - slack);
      expect(p!.x + p!.width).toBeLessThanOrEqual(c!.x + c!.width + slack);
      expect(u!.y).toBeGreaterThanOrEqual(c!.y - slack);
      expect(p!.y).toBeGreaterThanOrEqual(c!.y - slack);

      await canvas.screenshot({
        path: 'test-results/ux-walkthrough/diagram-import-first-screen.png',
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('前缀表导入后自动建议 Frame 分组', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('dbmlpfx');
    const fixture = path.join(__dirname, '../fixtures/prefixed.dbml');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'pfx', 'dbml frame suggest');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('menuitem', { name: '导入DBML' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('导入 DBML')).toBeVisible({ timeout: 10_000 });

      await dlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /DBML 导入成功.*已建议 2 个分组/);
      await expect(dlg).toBeHidden({ timeout: 10_000 });

      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
      await expect(rfNode(page, 'sys_user')).toBeVisible({ timeout: 15_000 });
      await expect(rfNode(page, 'biz_order')).toBeVisible();

      const frames = page.getByTestId('diagram-frame');
      await expect(frames).toHaveCount(2, { timeout: 10_000 });
      await expect(page.locator('.erd-frame-label', { hasText: 'sys' })).toBeVisible();
      await expect(page.locator('.erd-frame-label', { hasText: 'biz' })).toBeVisible();

      await page
        .getByTestId('reactflow-canvas')
        .screenshot({ path: 'test-results/ux-walkthrough/diagram-import-frame-suggest.png' });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('导入弹层密度：与 22–28 chrome 同阶', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('dbmldense');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dense', 'dbml import dense');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('menuitem', { name: '导入DBML' }).click();
      const dlg = page.getByRole('dialog', { name: '导入 DBML' });
      await expect(dlg).toBeVisible({ timeout: 10_000 });
      await expect(dlg.getByLabel('DBML文本')).toBeVisible();

      // ADR-0016：导入弹层头/身/脚 8×12；禁头 10×14×8 / 脚 8×14 / body 12×14
      // 定位：dialog role「导入 DBML」+ label「DBML文本」（勿扫 .ant-* 业务语义）
      const metrics = await dlg.evaluate((dialog) => {
        const header = dialog.querySelector('.ant-modal-header') as HTMLElement | null;
        const body = dialog.querySelector('.ant-modal-body') as HTMLElement | null;
        const footer = dialog.querySelector('.ant-modal-footer') as HTMLElement | null;
        const title = dialog.querySelector('.ant-modal-title') as HTMLElement | null;
        const footerBtn = dialog.querySelector(
          '.ant-modal-footer .ant-btn-primary',
        ) as HTMLElement | null;
        const root =
          (dialog.closest('.ant-modal') as HTMLElement) ||
          (dialog as HTMLElement);
        const styleW = parseFloat(root.style.width || '') || NaN;
        const cssW = parseFloat(getComputedStyle(root).width) || NaN;
        const hcs = header ? getComputedStyle(header) : null;
        const bcs = body ? getComputedStyle(body) : null;
        const fcs = footer ? getComputedStyle(footer) : null;
        const tcs = title ? getComputedStyle(title) : null;
        const okCs = footerBtn ? getComputedStyle(footerBtn) : null;
        return {
          width: Number.isFinite(styleW) ? styleW : cssW,
          titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
          titleLh: tcs ? parseFloat(tcs.lineHeight) : NaN,
          headerPadT: hcs ? parseFloat(hcs.paddingTop) : NaN,
          headerPadB: hcs ? parseFloat(hcs.paddingBottom) : NaN,
          headerPadX: hcs ? parseFloat(hcs.paddingLeft) : NaN,
          bodyPadT: bcs ? parseFloat(bcs.paddingTop) : NaN,
          bodyPadX: bcs ? parseFloat(bcs.paddingLeft) : NaN,
          bodyPadY: bcs
            ? parseFloat(bcs.paddingTop) + parseFloat(bcs.paddingBottom)
            : NaN,
          footerPadT: fcs ? parseFloat(fcs.paddingTop) : NaN,
          footerPadX: fcs ? parseFloat(fcs.paddingLeft) : NaN,
          okH: okCs ? parseFloat(okCs.height) : NaN,
        };
      });
      expect(metrics.width).toBeGreaterThanOrEqual(480);
      expect(metrics.width).toBeLessThanOrEqual(560);
      expect(metrics.titleFont).toBeLessThanOrEqual(14);
      expect(metrics.titleLh).toBeLessThanOrEqual(24);
      expect(metrics.titleLh).toBeGreaterThanOrEqual(20);
      expect(metrics.headerPadT, `header padT 应 ≤8，得 ${metrics.headerPadT}`).toBeLessThanOrEqual(
        8,
      );
      expect(metrics.headerPadT).toBeGreaterThanOrEqual(6);
      expect(metrics.headerPadB, `header padB 应 ≤8，得 ${metrics.headerPadB}`).toBeLessThanOrEqual(
        8,
      );
      expect(
        metrics.headerPadX,
        `header padX 应 ≤12，得 ${metrics.headerPadX}`,
      ).toBeLessThanOrEqual(12);
      expect(metrics.headerPadX).toBeGreaterThanOrEqual(8);
      expect(metrics.bodyPadT, `body padT 应 ≤8，得 ${metrics.bodyPadT}`).toBeLessThanOrEqual(8);
      expect(metrics.bodyPadT).toBeGreaterThanOrEqual(6);
      expect(metrics.bodyPadX, `body padX 应 ≤12，得 ${metrics.bodyPadX}`).toBeLessThanOrEqual(
        12,
      );
      expect(metrics.bodyPadX).toBeGreaterThanOrEqual(8);
      expect(metrics.bodyPadY, `body padY 应 ≤16，得 ${metrics.bodyPadY}`).toBeLessThanOrEqual(
        16,
      );
      expect(metrics.footerPadT, `footer padT 应 ≤8，得 ${metrics.footerPadT}`).toBeLessThanOrEqual(
        8,
      );
      expect(
        metrics.footerPadX,
        `footer padX 应 ≤12，得 ${metrics.footerPadX}`,
      ).toBeLessThanOrEqual(12);
      expect(metrics.footerPadX).toBeGreaterThanOrEqual(8);
      expect(metrics.okH).toBeLessThanOrEqual(32);
      expect(metrics.okH, `OK 高应 ≥28，得 ${metrics.okH}`).toBeGreaterThanOrEqual(28);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-import-modal-dense.png',
        fullPage: false,
      });
      await page.keyboard.press('Escape');
      await expect(dlg).toBeHidden({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
