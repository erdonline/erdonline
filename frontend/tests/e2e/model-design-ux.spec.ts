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

      // 建表直开关系图后，菜单「编辑表」开表设计签（点树表节点改为画布定位）
      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '编辑表' }).click();
      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });
      await expect(designer.locator('.erd-table-design__title')).toHaveText('T_ORDER');
      await expect(designer.locator('.erd-table-design__module')).toHaveText('SHOP');

      // ADR-0016：CommonTabs / 表设计签头再压 ~24；禁 clip 标签/关闭钮；保留 focus-visible
      const chromeMetrics = await page.evaluate(() => {
        const nav = document.querySelector(
          '.erd-common-tabs .ant-tabs-nav',
        ) as HTMLElement | null;
        const header = document.querySelector(
          '.erd-table-design__header',
        ) as HTMLElement | null;
        const tab = document.querySelector(
          '.erd-common-tabs .ant-tabs-tab',
        ) as HTMLElement | null;
        const btn = tab?.querySelector('.ant-tabs-tab-btn') as HTMLElement | null;
        const remove = tab?.querySelector(
          '.ant-tabs-tab-remove',
        ) as HTMLElement | null;
        const title = document.querySelector(
          '.erd-table-design__title',
        ) as HTMLElement | null;
        if (!nav || !header || !tab || !btn || !remove || !title) {
          return {
            navH: -1,
            headerH: -1,
            labelClipped: true,
            closeClipped: true,
            titleClipped: true,
          };
        }
        const nr = nav.getBoundingClientRect();
        const tr = tab.getBoundingClientRect();
        const br = btn.getBoundingClientRect();
        const rr = remove.getBoundingClientRect();
        const label = btn.querySelector('.erd-common-tabs__label') as HTMLElement | null;
        const lr = (label || btn).getBoundingClientRect();
        const eps = 2;
        const fullyIn = (inner: DOMRect, outer: DOMRect) =>
          inner.top >= outer.top - eps &&
          inner.bottom <= outer.bottom + eps &&
          inner.left >= outer.left - eps &&
          inner.right <= outer.right + eps;
        return {
          navH: nr.height,
          headerH: header.getBoundingClientRect().height,
          // 竖直几何：标签/关闭落在签与栏内（水平 ellipsis 允许）
          labelClipped: lr.top < tr.top - eps || lr.bottom > tr.bottom + eps,
          closeClipped: !fullyIn(rr, nr) || rr.top < tr.top - eps || rr.bottom > tr.bottom + eps,
          titleClipped: title.scrollHeight > title.clientHeight + 1,
          btnH: br.height,
          tabH: tr.height,
        };
      });
      expect(
        chromeMetrics.navH,
        `CommonTabs 栏高应 ≤26（目标 ~24），得 ${chromeMetrics.navH}`,
      ).toBeLessThanOrEqual(26);
      expect(chromeMetrics.navH).toBeGreaterThanOrEqual(22);
      expect(
        chromeMetrics.headerH,
        `表设计签头高应 ≤28（目标 ~24），得 ${chromeMetrics.headerH}`,
      ).toBeLessThanOrEqual(28);
      expect(chromeMetrics.headerH).toBeGreaterThanOrEqual(20);
      expect(chromeMetrics.closeClipped, '关闭钮不得被签栏裁切').toBe(false);
      expect(chromeMetrics.labelClipped, '签标签不得被裁切').toBe(false);
      expect(chromeMetrics.titleClipped, '表设计标题不得竖直裁切').toBe(false);

      // focus-visible：从签 btn Tab 到关闭钮（须经 Tab 触发 :focus-visible）
      const tabBtn = page.locator('.erd-common-tabs .ant-tabs-tab-active .ant-tabs-tab-btn').first();
      const removeBtn = page.locator('.erd-common-tabs .ant-tabs-tab-active .ant-tabs-tab-remove').first();
      await tabBtn.focus();
      await page.keyboard.press('Tab');
      await expect(removeBtn).toBeFocused();
      const focusRing = await removeBtn.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          outlineColor: cs.outlineColor,
        };
      });
      expect(focusRing.outlineStyle).not.toBe('none');
      expect(parseFloat(focusRing.outlineWidth)).toBeGreaterThanOrEqual(1);

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
