import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * ADR-0017 Phase 1：模型树默认展开 + 虚拟滚动 + 表设计三签美化
 * 定位纪律：e2e-locators（role / testid 优先；.ant-tree-list-* 为虚拟滚动结构断言）
 */
test.describe('模型设计 UX（ADR-0017）', () => {
  test.describe.configure({ retries: 1 });

  test('模型树「表/关系」默认展开且开启虚拟滚动', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('treeux');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await page.getByTestId('add-module-empty').click();
      await page.getByTestId('entity-modal-name').fill('SHOP');
      await page.getByTestId('entity-modal-chnname').fill('商城');
      await page.getByTestId('entity-modal-ok').click();

      // 不点任何 switcher：模块/表/关系三层默认展开，关系图入口直接可见
      const tree = page.getByRole('tree');
      await expect(tree.getByText('商城', { exact: true })).toBeVisible({ timeout: 10_000 });
      await expect(tree.getByText('表', { exact: true })).toBeVisible();
      await expect(tree.getByText('关系', { exact: true })).toBeVisible();
      await expect(page.getByTestId('tree-open-relation')).toHaveCount(1);

      // 虚拟滚动：Tree 带 height 后由 rc-virtual-list 承载
      await expect(page.locator('.ant-tree-list-holder')).toHaveCount(1);

      // ADR-0016：左树行高密度（与 22 chrome 同阶）；禁默认 ~28 松行
      const rowMetrics = await page.locator('.ant-tree-treenode').first().evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          h: el.getBoundingClientRect().height,
          mb: parseFloat(cs.marginBottom),
          fontSize: parseFloat(cs.fontSize),
        };
      });
      expect(
        rowMetrics.h,
        `树行高应 ≤24（目标 ~22），得 ${rowMetrics.h}`,
      ).toBeLessThanOrEqual(24);
      expect(rowMetrics.h).toBeGreaterThanOrEqual(18);
      expect(rowMetrics.mb).toBeLessThanOrEqual(2);
      expect(rowMetrics.fontSize).toBeLessThanOrEqual(13);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-left-tree-dense.png',
        fullPage: false,
      });

      // 用户手动折叠不被默认逻辑回顶
      const moduleNode = page
        .locator('.ant-tree-treenode')
        .filter({ has: page.getByText('商城', { exact: true }) })
        .first();
      await moduleNode.locator('.ant-tree-switcher').click();
      await expect(page.getByTestId('tree-open-relation')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('表设计三签：签头层级 + 字段/索引/元数据应用切换', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('tabux');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await page.getByTestId('add-module-empty').click();
      await page.getByTestId('entity-modal-name').fill('SHOP');
      await page.getByTestId('entity-modal-chnname').fill('商城');
      await page.getByTestId('entity-modal-ok').click();
      await expect(page.getByTestId('tree-open-relation')).toHaveCount(1);

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();

      // 建表直开关系图后，点树中表节点开表设计签
      await page.getByRole('tree').getByText('T_ORDER', { exact: true }).click();
      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });
      await expect(designer.locator('.erd-table-design__title')).toHaveText('T_ORDER');
      await expect(designer.locator('.erd-table-design__module')).toHaveText('SHOP');

      // ADR-0016：CommonTabs 签头 ~28（原 40）+ 表设计签头密度
      const chromeMetrics = await page.evaluate(() => {
        const nav = document.querySelector('.erd-common-tabs .ant-tabs-nav');
        const header = document.querySelector('.erd-table-design__header');
        if (!nav || !header) return { navH: -1, headerH: -1 };
        return {
          navH: nav.getBoundingClientRect().height,
          headerH: header.getBoundingClientRect().height,
        };
      });
      expect(
        chromeMetrics.navH,
        `CommonTabs 栏高应 ≤30（目标 ~28），得 ${chromeMetrics.navH}`,
      ).toBeLessThanOrEqual(30);
      expect(chromeMetrics.navH).toBeGreaterThanOrEqual(24);
      expect(
        chromeMetrics.headerH,
        `表设计签头高应 ≤32（目标 ~28），得 ${chromeMetrics.headerH}`,
      ).toBeLessThanOrEqual(32);
      expect(chromeMetrics.headerH).toBeGreaterThanOrEqual(22);

      for (const name of ['字段', '索引', '元数据应用']) {
        await expect(designer.getByRole('tab', { name })).toBeVisible();
      }
      await designer.getByRole('tab', { name: '索引' }).click();
      await expect(designer.getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await designer.getByRole('tab', { name: '元数据应用' }).click();
      await expect(designer.getByRole('tab', { name: '元数据应用' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-common-tabs-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
