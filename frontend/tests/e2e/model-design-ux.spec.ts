import { expect, test } from '@playwright/test';
import {
  addEntityViaTreeFolder,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  openRelationFromEmpty,
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

      // 工具条再收：~24 控件 + 次密距 4；禁 clip 图标；命中 ∈24–28
      const toolbarMetrics = await page.getByTestId('query-tree-toolbar').evaluate((toolbar) => {
        const btn = toolbar.querySelector(
          '[data-testid="design-tree-add-module"]',
        ) as HTMLElement | null;
        const searchBtn = toolbar.querySelector(
          '.ant-input-search-button',
        ) as HTMLElement | null;
        const input =
          (toolbar.querySelector(
            'input[aria-label="搜索表名"]',
          ) as HTMLElement | null) ||
          (toolbar.querySelector('input') as HTMLElement | null);
        if (!btn || !input) {
          return {
            toolbarH: -1,
            btnH: -1,
            btnW: -1,
            inputH: -1,
            addIconClipped: true,
            searchIconClipped: true,
            siderPadX: -1,
          };
        }
        const eps = 1;
        const fullyIn = (inner: DOMRect, outer: DOMRect) =>
          inner.top >= outer.top - eps &&
          inner.bottom <= outer.bottom + eps &&
          inner.left >= outer.left - eps &&
          inner.right <= outer.right + eps;
        const iconIn = (host: HTMLElement | null) => {
          if (!host) return true;
          const icon = host.querySelector('.anticon, svg') as HTMLElement | null;
          if (!icon) return true;
          return fullyIn(icon.getBoundingClientRect(), host.getBoundingClientRect());
        };
        const sider = document.querySelector(
          '.design-layout__sider-inner',
        ) as HTMLElement | null;
        const scs = sider ? getComputedStyle(sider) : null;
        return {
          toolbarH: toolbar.getBoundingClientRect().height,
          btnH: btn.getBoundingClientRect().height,
          btnW: btn.getBoundingClientRect().width,
          inputH: input.getBoundingClientRect().height,
          addIconClipped: !iconIn(btn),
          searchIconClipped: !iconIn(searchBtn),
          siderPadX: scs
            ? parseFloat(scs.paddingLeft) + parseFloat(scs.paddingRight)
            : -1,
        };
      });
      expect(
        toolbarMetrics.toolbarH,
        `工具条高应 ≤32（目标 ~28），得 ${toolbarMetrics.toolbarH}`,
      ).toBeLessThanOrEqual(32);
      expect(toolbarMetrics.toolbarH).toBeGreaterThanOrEqual(24);
      expect(
        toolbarMetrics.btnH,
        `新建钮高应 ∈24–28，得 ${toolbarMetrics.btnH}`,
      ).toBeGreaterThanOrEqual(24);
      expect(toolbarMetrics.btnH).toBeLessThanOrEqual(28);
      expect(toolbarMetrics.btnW).toBeGreaterThanOrEqual(24);
      expect(toolbarMetrics.btnW).toBeLessThanOrEqual(28);
      expect(
        toolbarMetrics.inputH,
        `搜索输入高应 ∈22–28，得 ${toolbarMetrics.inputH}`,
      ).toBeGreaterThanOrEqual(22);
      expect(toolbarMetrics.inputH).toBeLessThanOrEqual(28);
      expect(toolbarMetrics.addIconClipped, '新建图标不得裁切').toBe(false);
      expect(toolbarMetrics.searchIconClipped, '搜索图标不得裁切').toBe(false);
      expect(
        toolbarMetrics.siderPadX,
        `sider 次密距 padX 应 ≤20，得 ${toolbarMetrics.siderPadX}`,
      ).toBeLessThanOrEqual(20);
      expect(toolbarMetrics.siderPadX).toBeGreaterThanOrEqual(8);

      // focus-visible：搜索 → 搜索钮 → 新建（须经 Tab 触发 :focus-visible）
      const addBtn = page.getByTestId('design-tree-add-module');
      const search = page.getByLabel('搜索表名');
      await search.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(addBtn).toBeFocused();
      const focusRing = await addBtn.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
        };
      });
      expect(focusRing.outlineStyle).not.toBe('none');
      expect(parseFloat(focusRing.outlineWidth)).toBeGreaterThanOrEqual(1);

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

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();

      // 建表直开关系图后，菜单「编辑表」开表设计签（点树表节点改为画布定位）
      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '编辑表' }).click();
      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });
      await expect(designer.locator('.erd-table-design__title')).toHaveText('T_ORDER');
      await expect(designer.locator('.erd-table-design__module')).toHaveText('SHOP');

      // ADR-0016：CommonTabs ~24 + 表设计签头碎距 padX8/gap4；禁 clip；保留 focus-visible
      const chromeMetrics = await page.evaluate(() => {
        const common = document.querySelector(
          '[data-testid="common-tabs"]',
        ) as HTMLElement | null;
        const nav = common?.querySelector('.ant-tabs-nav') as HTMLElement | null;
        const header = document.querySelector(
          '[data-testid="table-design-header"]',
        ) as HTMLElement | null;
        const tab = common?.querySelector('.ant-tabs-tab') as HTMLElement | null;
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
            headerPadX: -1,
            headerGap: -1,
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
        const hcs = getComputedStyle(header);
        const eps = 2;
        const fullyIn = (inner: DOMRect, outer: DOMRect) =>
          inner.top >= outer.top - eps &&
          inner.bottom <= outer.bottom + eps &&
          inner.left >= outer.left - eps &&
          inner.right <= outer.right + eps;
        return {
          navH: nr.height,
          headerH: header.getBoundingClientRect().height,
          headerPadX: Math.max(parseFloat(hcs.paddingLeft), parseFloat(hcs.paddingRight)),
          headerGap: parseFloat(hcs.columnGap || hcs.gap) || 0,
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
      expect(
        chromeMetrics.headerPadX,
        `签头 padX 应 ≤8（碎距 8–12 族），得 ${chromeMetrics.headerPadX}`,
      ).toBeLessThanOrEqual(8);
      expect(chromeMetrics.headerPadX).toBeGreaterThanOrEqual(4);
      expect(
        chromeMetrics.headerGap,
        `签头 gap 应 ≤4，得 ${chromeMetrics.headerGap}`,
      ).toBeLessThanOrEqual(4);
      expect(chromeMetrics.closeClipped, '关闭钮不得被签栏裁切').toBe(false);
      expect(chromeMetrics.labelClipped, '签标签不得被裁切').toBe(false);
      expect(chromeMetrics.titleClipped, '表设计标题不得竖直裁切').toBe(false);

      // focus-visible：从签 btn Tab 到关闭钮（须经 Tab 触发 :focus-visible）
      const commonTabs = page.getByTestId('common-tabs');
      const tabBtn = commonTabs.locator('.ant-tabs-tab-active .ant-tabs-tab-btn').first();
      const removeBtn = commonTabs.locator('.ant-tabs-tab-active .ant-tabs-tab-remove').first();
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

      await expect(page.getByTestId('table-design-header')).toBeVisible();
      await expect(page.getByTestId('table-design-tabs')).toBeVisible();
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

  /**
   * ADR-0016：设计器次屏 JExcel（字段/索引元数据表）密度 —
   * 工具栏 ~24 + 表头/行 pad 4×8；禁 clip 工具栏图标；保留 Tab focus-visible
   */
  test('表设计 JExcel 行密度：与 22–28 chrome 同阶', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('jxdense');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await page.getByTestId('add-module-empty').click();
      await page.getByTestId('entity-modal-name').fill('SHOP');
      await page.getByTestId('entity-modal-chnname').fill('商城');
      await page.getByTestId('entity-modal-ok').click();
      await expect(page.getByTestId('tree-open-relation')).toHaveCount(1);

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();

      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '编辑表' }).click();
      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });

      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });
      await expect(fieldEdit.getByTestId('jexcel-root')).toBeVisible();

      const undoBtn = fieldEdit.getByRole('button', { name: '撤销' });
      await expect(undoBtn).toBeVisible();

      const metrics = await fieldEdit.evaluate((root) => {
        const host = root.querySelector('[data-testid="jexcel-root"]') as HTMLElement | null;
        const toolbar = host?.querySelector('.jexcel_toolbar') as HTMLElement | null;
        const toolItem = host?.querySelector(
          '.jexcel_toolbar_item',
        ) as HTMLElement | null;
        const headCell = host?.querySelector(
          'table.jexcel > thead > tr > td',
        ) as HTMLElement | null;
        const bodyCell = host?.querySelector(
          'table.jexcel > tbody > tr > td:not(:first-child)',
        ) as HTMLElement | null;
        const eps = 1;
        const fullyIn = (inner: DOMRect, outer: DOMRect) =>
          inner.top >= outer.top - eps &&
          inner.bottom <= outer.bottom + eps &&
          inner.left >= outer.left - eps &&
          inner.right <= outer.right + eps;
        let iconClipped = false;
        if (toolItem) {
          const iconRect = toolItem.getBoundingClientRect();
          // material icon 字形在 ≤24 盒内；测内容不溢出工具栏条
          if (toolbar) {
            iconClipped = !fullyIn(iconRect, toolbar.getBoundingClientRect());
          }
        }
        const headCs = headCell ? getComputedStyle(headCell) : null;
        const bodyCs = bodyCell ? getComputedStyle(bodyCell) : null;
        return {
          toolbarH: toolbar ? toolbar.getBoundingClientRect().height : -1,
          toolItemH: toolItem ? toolItem.getBoundingClientRect().height : -1,
          headPadBlock: headCs
            ? parseFloat(headCs.paddingTop) + parseFloat(headCs.paddingBottom)
            : -1,
          headPadInline: headCs
            ? parseFloat(headCs.paddingLeft) + parseFloat(headCs.paddingRight)
            : -1,
          bodyPadBlock: bodyCs
            ? parseFloat(bodyCs.paddingTop) + parseFloat(bodyCs.paddingBottom)
            : -1,
          bodyPadInline: bodyCs
            ? parseFloat(bodyCs.paddingLeft) + parseFloat(bodyCs.paddingRight)
            : -1,
          bodyRowH: bodyCell
            ? (bodyCell.parentElement as HTMLElement).getBoundingClientRect().height
            : -1,
          iconClipped,
        };
      });

      expect(
        metrics.toolbarH,
        `JExcel 工具栏高应 ≤32（目标 ~24），得 ${metrics.toolbarH}`,
      ).toBeLessThanOrEqual(32);
      expect(metrics.toolbarH).toBeGreaterThanOrEqual(22);
      expect(
        metrics.toolItemH,
        `工具栏项高应 ∈22–28，得 ${metrics.toolItemH}`,
      ).toBeGreaterThanOrEqual(22);
      expect(metrics.toolItemH).toBeLessThanOrEqual(28);
      expect(
        metrics.headPadBlock,
        `表头 padding-block 合计应 ≤10（目标 4+4），得 ${metrics.headPadBlock}`,
      ).toBeLessThanOrEqual(10);
      expect(metrics.headPadBlock).toBeGreaterThanOrEqual(4);
      expect(
        metrics.headPadInline,
        `表头 padding-inline 合计应 ≤20（目标 8+8），得 ${metrics.headPadInline}`,
      ).toBeLessThanOrEqual(20);
      expect(
        metrics.bodyPadBlock,
        `表行 padding-block 合计应 ≤10（目标 4+4），得 ${metrics.bodyPadBlock}`,
      ).toBeLessThanOrEqual(10);
      expect(metrics.bodyPadBlock).toBeGreaterThanOrEqual(4);
      expect(
        metrics.bodyPadInline,
        `表行 padding-inline 合计应 ≤20（目标 8+8），得 ${metrics.bodyPadInline}`,
      ).toBeLessThanOrEqual(20);
      expect(
        metrics.bodyRowH,
        `表行高应 ≤32（目标 ~24–28），得 ${metrics.bodyRowH}`,
      ).toBeLessThanOrEqual(32);
      expect(metrics.bodyRowH).toBeGreaterThanOrEqual(20);
      expect(metrics.iconClipped, '工具栏图标不得裁切').toBe(false);

      await fieldEdit.getByRole('button', { name: '重做' }).focus();
      await page.keyboard.press('Shift+Tab');
      await expect(undoBtn).toBeFocused();
      const focusRing = await undoBtn.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
        };
      });
      expect(focusRing.outlineStyle).not.toBe('none');
      expect(parseFloat(focusRing.outlineWidth)).toBeGreaterThanOrEqual(1);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-jexcel-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  /**
   * ADR-0016：元数据应用 CodeTab / DbTab 子签 chrome —
   * DB 签 + 模板签栏 ~24（对齐 CommonTabs）；禁 clip；保留 focus-visible + Cmd+1/2/3
   */
  test('元数据应用子签：CodeTab/DbTab chrome ~24', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('codedense');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await page.getByTestId('add-module-empty').click();
      await page.getByTestId('entity-modal-name').fill('SHOP');
      await page.getByTestId('entity-modal-chnname').fill('商城');
      await page.getByTestId('entity-modal-ok').click();
      await expect(page.getByTestId('tree-open-relation')).toHaveCount(1);

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();

      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '编辑表' }).click();
      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });

      await designer.getByRole('tab', { name: '元数据应用' }).click();
      const codePane = page.getByTestId('table-code-edit');
      await expect(codePane).toBeVisible({ timeout: 10_000 });
      await expect(codePane.getByRole('tab', { name: 'MYSQL' })).toBeVisible();
      await expect(codePane.getByRole('tab', { name: '创建表' })).toBeVisible();

      const chromeMetrics = await codePane.evaluate((root) => {
        const codeNav = root.querySelector('#codeNav > .ant-tabs-nav') as HTMLElement | null;
        // 仅测活动 DB 面板（多库 TabPane 并存时各有一份模板签）
        const activePane = root.querySelector(
          '#codeNav .ant-tabs-tabpane-active',
        ) as HTMLElement | null;
        const dbRoot = activePane?.querySelector('.erd-db-tab') as HTMLElement | null;
        const dbNav = dbRoot?.querySelector(':scope > .ant-tabs-nav') as HTMLElement | null;
        const codeTab = root.querySelector(
          '#codeNav > .ant-tabs-nav .ant-tabs-tab-active',
        ) as HTMLElement | null;
        const dbTab = dbNav?.querySelector('.ant-tabs-tab-active') as HTMLElement | null;
        const codeBtn = codeTab?.querySelector('.ant-tabs-tab-btn') as HTMLElement | null;
        const dbBtn = dbTab?.querySelector('.ant-tabs-tab-btn') as HTMLElement | null;
        if (!codeNav || !dbNav || !codeTab || !dbTab || !codeBtn || !dbBtn) {
          return {
            codeNavH: -1,
            dbNavH: -1,
            codeLabelClipped: true,
            dbLabelClipped: true,
          };
        }
        const eps = 2;
        const codeNr = codeNav.getBoundingClientRect();
        const dbNr = dbNav.getBoundingClientRect();
        const codeTr = codeTab.getBoundingClientRect();
        const dbTr = dbTab.getBoundingClientRect();
        const codeBr = codeBtn.getBoundingClientRect();
        const dbBr = dbBtn.getBoundingClientRect();
        return {
          codeNavH: codeNr.height,
          dbNavH: dbNr.height,
          // 竖直几何：标签落在签与栏内（水平 more/ellipsis 允许）
          codeLabelClipped:
            codeBr.top < codeTr.top - eps ||
            codeBr.bottom > codeTr.bottom + eps ||
            codeBr.top < codeNr.top - eps ||
            codeBr.bottom > codeNr.bottom + eps,
          dbLabelClipped:
            dbBr.top < dbTr.top - eps ||
            dbBr.bottom > dbTr.bottom + eps ||
            dbBr.top < dbNr.top - eps ||
            dbBr.bottom > dbNr.bottom + eps,
        };
      });

      expect(
        chromeMetrics.codeNavH,
        `CodeTab 栏高应 ≤26（目标 ~24），得 ${chromeMetrics.codeNavH}`,
      ).toBeLessThanOrEqual(26);
      expect(chromeMetrics.codeNavH).toBeGreaterThanOrEqual(20);
      expect(
        chromeMetrics.dbNavH,
        `DbTab 栏高应 ≤26（目标 ~24），得 ${chromeMetrics.dbNavH}`,
      ).toBeLessThanOrEqual(26);
      expect(chromeMetrics.dbNavH).toBeGreaterThanOrEqual(20);
      expect(chromeMetrics.codeLabelClipped, 'CodeTab 标签不得被裁切').toBe(false);
      expect(chromeMetrics.dbLabelClipped, 'DbTab 标签不得被裁切').toBe(false);

      // 子签可切；focus-visible：键盘 Tab 留在元数据应用内且有环
      await codePane.getByRole('tab', { name: 'ORACLE' }).click();
      await expect(codePane.getByRole('tab', { name: 'ORACLE' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await codePane.getByRole('tab', { name: 'MYSQL' }).click();
      await expect(codePane.getByRole('tab', { name: 'MYSQL' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      const mysqlDb = codePane.getByTestId('table-db-tab-MYSQL');
      await mysqlDb.getByRole('tab', { name: '表注释' }).click();
      await expect(mysqlDb.getByRole('tab', { name: '表注释' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await mysqlDb.getByRole('tab', { name: '创建表' }).click();
      await expect(mysqlDb.getByRole('tab', { name: '创建表' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      await mysqlDb.getByRole('tab', { name: '创建表' }).focus();
      await page.keyboard.press('Tab');
      const afterTab = await page.evaluate(() => {
        const ae = document.activeElement as HTMLElement | null;
        if (!ae) return null;
        const cs = getComputedStyle(ae);
        return {
          inCodePane: !!ae.closest('[data-testid="table-code-edit"]'),
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
        };
      });
      expect(afterTab?.inCodePane, 'Tab 应留在元数据应用签内').toBe(true);
      expect(afterTab?.outlineStyle).not.toBe('none');
      expect(parseFloat(afterTab?.outlineWidth || '0')).toBeGreaterThanOrEqual(1);

      // Cmd/Ctrl+1/2/3 回路不回归（元数据 → 字段 → 索引 → 元数据）
      const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.keyboard.press(`${mod}+1`);
      await expect(designer.getByRole('tab', { name: '字段' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await page.keyboard.press(`${mod}+2`);
      await expect(designer.getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await page.keyboard.press(`${mod}+3`);
      await expect(designer.getByRole('tab', { name: '元数据应用' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('table-code-edit')).toBeVisible();

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-code-tabs-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  /**
   * ADR-0016：表设计内签（字段/索引/元数据）栏显式 ~24 + gutter≤2 —
   * 对齐 CommonTabs / 子签；禁 clip；保留 focus-visible + Cmd+1/2/3
   */
  test('表设计内签：字段/索引/元数据栏 ~24', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('innerdense');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await page.getByTestId('add-module-empty').click();
      await page.getByTestId('entity-modal-name').fill('SHOP');
      await page.getByTestId('entity-modal-chnname').fill('商城');
      await page.getByTestId('entity-modal-ok').click();
      await expect(page.getByTestId('tree-open-relation')).toHaveCount(1);

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();

      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '编辑表' }).click();
      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('table-design-tabs')).toBeVisible();

      for (const name of ['字段', '索引', '元数据应用']) {
        await expect(designer.getByRole('tab', { name })).toBeVisible();
      }

      const chromeMetrics = await designer.evaluate((root) => {
        const tabsRoot = root.querySelector(
          '[data-testid="table-design-tabs"]',
        ) as HTMLElement | null;
        const switcher = tabsRoot;
        const tabs = Array.from(
          switcher?.querySelectorAll('[role="tab"]') || [],
        ) as HTMLElement[];
        const tab = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
        const btn = tab;
        if (!switcher || !tab || !btn || tabs.length < 2) {
          return { navH: -1, tabH: -1, gutter: -1, labelClipped: true };
        }
        const eps = 2;
        const sr = switcher.getBoundingClientRect();
        const tr = tab.getBoundingClientRect();
        const br = btn.getBoundingClientRect();
        const a = tabs[0].getBoundingClientRect();
        const b = tabs[1].getBoundingClientRect();
        const gutter = Math.max(0, Math.round(b.left - a.right));
        const tcs = getComputedStyle(tab);
        return {
          navH: sr.height,
          tabH: tr.height,
          gutter,
          marginR: parseFloat(tcs.marginRight) || 0,
          labelClipped:
            br.top < tr.top - eps ||
            br.bottom > tr.bottom + eps ||
            br.top < sr.top - eps ||
            br.bottom > sr.bottom + eps,
        };
      });

      expect(
        chromeMetrics.navH,
        `表设计内签栏高应 ≤26（目标 ~24），得 ${chromeMetrics.navH}`,
      ).toBeLessThanOrEqual(26);
      expect(chromeMetrics.navH).toBeGreaterThanOrEqual(20);
      expect(chromeMetrics.tabH).toBeLessThanOrEqual(26);
      expect(
        chromeMetrics.gutter,
        `内签 gutter 应 ≤2（对齐子签，禁 8），得 ${chromeMetrics.gutter}`,
      ).toBeLessThanOrEqual(2);
      expect(chromeMetrics.marginR, `内签 marginR 应 ≤2，得 ${chromeMetrics.marginR}`).toBeLessThanOrEqual(
        2,
      );
      expect(chromeMetrics.labelClipped, '内签标签不得被裁切').toBe(false);

      await designer.getByRole('tab', { name: '索引' }).click();
      await expect(designer.getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('table-index-edit')).toBeVisible();

      await designer.getByRole('tab', { name: '字段' }).focus();
      await page.keyboard.press('Tab');
      const afterTab = await page.evaluate(() => {
        const ae = document.activeElement as HTMLElement | null;
        if (!ae) return null;
        const cs = getComputedStyle(ae);
        return {
          inDesigner: !!ae.closest('[data-testid="table-design"]'),
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
        };
      });
      expect(afterTab?.inDesigner, 'Tab 应留在表设计内').toBe(true);
      expect(afterTab?.outlineStyle).not.toBe('none');
      expect(parseFloat(afterTab?.outlineWidth || '0')).toBeGreaterThanOrEqual(1);

      const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.keyboard.press(`${mod}+3`);
      await expect(designer.getByRole('tab', { name: '元数据应用' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await page.keyboard.press(`${mod}+1`);
      await expect(designer.getByRole('tab', { name: '字段' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await page.keyboard.press(`${mod}+2`);
      await expect(designer.getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-inner-tabs-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  /**
   * ADR-0016：设计器树/签右键与 Dropdown 菜单次密距 —
   * 项高 ~28（≤32）；禁 clip；保留 role=menuitem + 方向键
   */
  test('右键/树操作菜单密度 ~28', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('menudense');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await page.getByTestId('add-module-empty').click();
      await page.getByTestId('entity-modal-name').fill('SHOP');
      await page.getByTestId('entity-modal-chnname').fill('商城');
      await page.getByTestId('entity-modal-ok').click();
      await expect(page.getByTestId('tree-open-relation')).toHaveCount(1);

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();

      const trigger = page.getByLabel('表操作');
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const editItem = page.getByRole('menuitem', { name: '编辑表' });
      await expect(editItem).toBeVisible({ timeout: 5_000 });
      await expect(page.getByRole('menuitem', { name: '删除表' })).toBeVisible();
      // 等 Dropdown slide-up 结束再量（appear 阶段 scale 会把 28 读成 ~25–33）
      await expect
        .poll(
          async () =>
            editItem.evaluate((el) => el.getBoundingClientRect().height),
          { timeout: 3_000 },
        )
        .toBeGreaterThanOrEqual(27);

      const metrics = await editItem.evaluate((el) => {
        const item = el as HTMLElement;
        const menu =
          (item.closest('.erd-dense-menu') as HTMLElement | null) ||
          (item.closest('[role="menu"]') as HTMLElement | null);
        const icon = item.querySelector('.anticon, svg') as HTMLElement | null;
        const label =
          (item.querySelector('.ant-menu-title-content') as HTMLElement | null) ||
          item;
        const eps = 1;
        const fullyIn = (inner: DOMRect, outer: DOMRect) =>
          inner.top >= outer.top - eps &&
          inner.bottom <= outer.bottom + eps &&
          inner.left >= outer.left - eps &&
          inner.right <= outer.right + eps;
        const ir = item.getBoundingClientRect();
        const lr = label.getBoundingClientRect();
        const cs = getComputedStyle(item);
        const iconClipped = icon
          ? !fullyIn(icon.getBoundingClientRect(), ir)
          : false;
        const labelClipped = !fullyIn(lr, ir);
        return {
          h: ir.height,
          fontSize: parseFloat(cs.fontSize),
          padBlock: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
          padInline: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
          boxSizing: cs.boxSizing,
          iconClipped,
          labelClipped,
          denseClass: !!menu?.classList.contains('erd-dense-menu'),
        };
      });

      expect(
        metrics.h,
        `菜单项高应 ≈28（≤30），得 ${metrics.h}`,
      ).toBeLessThanOrEqual(30);
      expect(metrics.h).toBeGreaterThanOrEqual(26);
      expect(metrics.fontSize).toBeLessThanOrEqual(13);
      expect(
        metrics.padBlock,
        `菜单项 pad-block 应 ≤2（border-box 命中），得 ${metrics.padBlock}`,
      ).toBeLessThanOrEqual(2);
      expect(
        metrics.padInline,
        `菜单项 pad-inline 合计应 ∈12–24（目标 8+8），得 ${metrics.padInline}`,
      ).toBeGreaterThanOrEqual(12);
      expect(metrics.padInline).toBeLessThanOrEqual(24);
      expect(metrics.boxSizing, '菜单项须 border-box').toBe('border-box');
      expect(metrics.iconClipped, '菜单图标不得裁切').toBe(false);
      expect(metrics.labelClipped, '菜单文案不得裁切').toBe(false);
      expect(metrics.denseClass, '应挂 erd-dense-menu').toBe(true);

      await editItem.focus();
      await page.keyboard.press('ArrowDown');
      const afterArrow = await page.evaluate(() => {
        const ae = document.activeElement as HTMLElement | null;
        return {
          role: ae?.getAttribute('role'),
          name: (ae?.textContent || '').trim(),
        };
      });
      expect(afterArrow.role).toBe('menuitem');
      expect(afterArrow.name.length).toBeGreaterThan(0);

      await page.keyboard.press('Escape');
      await expect(editItem).toHaveCount(0);

      await trigger.click();
      await expect(page.getByRole('menuitem', { name: '编辑表' })).toBeVisible();
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-context-menu-dense.png',
        fullPage: false,
      });
      await page.keyboard.press('Escape');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  /**
   * ADR-0016：表设计签体内容次密距 —
   * 侧/底 pad 对齐 ~24 toolbar；hint/空态收紧；禁 clip JExcel；元数据 tip 不松
   */
  test('表设计签体内容次密距', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('tabbody');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await page.getByTestId('add-module-empty').click();
      await page.getByTestId('entity-modal-name').fill('SHOP');
      await page.getByTestId('entity-modal-chnname').fill('商城');
      await page.getByTestId('entity-modal-ok').click();
      await expect(page.getByTestId('tree-open-relation')).toHaveCount(1);

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();

      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '编辑表' }).click();
      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });

      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });
      await expect(fieldEdit.getByTestId('jexcel-root')).toBeVisible();
      await expect(page.getByTestId('field-unique-hint')).toBeVisible();

      const bodyMetrics = await designer.evaluate((root) => {
        const body = root.querySelector('.erd-table-design__body') as HTMLElement | null;
        const holder = root.querySelector(
          '.erd-table-design__panel',
        ) as HTMLElement | null;
        const hint = root.querySelector(
          '[data-testid="field-unique-hint"]',
        ) as HTMLElement | null;
        const jexcel = root.querySelector(
          '[data-testid="jexcel-root"]',
        ) as HTMLElement | null;
        const toolbar = jexcel?.querySelector('.jexcel_toolbar') as HTMLElement | null;
        const toolItem = jexcel?.querySelector(
          '.jexcel_toolbar_item',
        ) as HTMLElement | null;
        const eps = 2;
        const fullyIn = (inner: DOMRect, outer: DOMRect) =>
          inner.top >= outer.top - eps &&
          inner.bottom <= outer.bottom + eps &&
          inner.left >= outer.left - eps &&
          inner.right <= outer.right + eps;
        const tabsCs = body ? getComputedStyle(body) : null;
        const holderCs = holder ? getComputedStyle(holder) : null;
        const hintCs = hint ? getComputedStyle(hint) : null;
        // 竖直：工具栏落在签体可视区内；水平允许宽表横溢（与 JExcel 行密度用例同阶）
        let toolbarVertClipped = true;
        if (toolbar && holder) {
          const tr = toolbar.getBoundingClientRect();
          const hr = holder.getBoundingClientRect();
          toolbarVertClipped =
            tr.top < hr.top - eps || tr.bottom > hr.bottom + eps;
        }
        let iconClipped = false;
        if (toolItem && toolbar) {
          iconClipped = !fullyIn(
            toolItem.getBoundingClientRect(),
            toolbar.getBoundingClientRect(),
          );
        }
        return {
          padX:
            tabsCs != null
              ? parseFloat(tabsCs.paddingLeft) + parseFloat(tabsCs.paddingRight)
              : -1,
          padBottom: holderCs != null ? parseFloat(holderCs.paddingBottom) : -1,
          hintPadBlock:
            hintCs != null
              ? parseFloat(hintCs.paddingTop) + parseFloat(hintCs.paddingBottom)
              : -1,
          hintMb: hintCs != null ? parseFloat(hintCs.marginBottom) : -1,
          hintH: hint ? hint.getBoundingClientRect().height : -1,
          toolbarVertClipped,
          iconClipped,
          toolbarH: toolbar ? toolbar.getBoundingClientRect().height : -1,
        };
      });

      expect(
        bodyMetrics.padX,
        `签体侧 pad 合计应 ≤16（目标 6+6），得 ${bodyMetrics.padX}`,
      ).toBeLessThanOrEqual(16);
      expect(bodyMetrics.padX).toBeGreaterThanOrEqual(8);
      expect(
        bodyMetrics.padBottom,
        `签体底 pad 应 ≤6（目标 4），得 ${bodyMetrics.padBottom}`,
      ).toBeLessThanOrEqual(6);
      expect(bodyMetrics.padBottom).toBeGreaterThanOrEqual(2);
      expect(
        bodyMetrics.hintPadBlock,
        `unique hint pad-block 应 ≤10（目标 4+4），得 ${bodyMetrics.hintPadBlock}`,
      ).toBeLessThanOrEqual(10);
      expect(
        bodyMetrics.hintMb,
        `unique hint margin-bottom 应 ≤6（目标 4），得 ${bodyMetrics.hintMb}`,
      ).toBeLessThanOrEqual(6);
      expect(
        bodyMetrics.hintH,
        `unique hint 高应 ≤32（目标 ~24），得 ${bodyMetrics.hintH}`,
      ).toBeLessThanOrEqual(32);
      expect(
        bodyMetrics.toolbarVertClipped,
        'JExcel 工具栏不得被签体竖直裁切',
      ).toBe(false);
      expect(bodyMetrics.iconClipped, '工具栏图标不得裁切').toBe(false);
      expect(
        bodyMetrics.toolbarH,
        `JExcel 工具栏高应 ∈22–32，得 ${bodyMetrics.toolbarH}`,
      ).toBeGreaterThanOrEqual(22);
      expect(bodyMetrics.toolbarH).toBeLessThanOrEqual(32);

      await designer.getByRole('tab', { name: '元数据应用' }).click();
      const codeEdit = page.getByTestId('table-code-edit');
      await expect(codeEdit).toBeVisible({ timeout: 10_000 });
      await expect(codeEdit.getByRole('tab', { name: 'MYSQL' })).toBeVisible();

      const metaMetrics = await designer.evaluate((root) => {
        const hint = root.querySelector('.erd-meta-ddl-hint') as HTMLElement | null;
        const subHolder = root.querySelector(
          '.erd-code-tab__tabs > .ant-tabs-content-holder',
        ) as HTMLElement | null;
        const hintCs = hint ? getComputedStyle(hint) : null;
        const subCs = subHolder ? getComputedStyle(subHolder) : null;
        return {
          hintMb: hintCs != null ? parseFloat(hintCs.marginBottom) : -1,
          hintH: hint ? hint.getBoundingClientRect().height : -1,
          subPadY:
            subCs != null
              ? parseFloat(subCs.paddingTop) + parseFloat(subCs.paddingBottom)
              : -1,
        };
      });
      expect(
        metaMetrics.hintMb,
        `元数据 tip margin-bottom 应 ≤8（目标 4），得 ${metaMetrics.hintMb}`,
      ).toBeLessThanOrEqual(8);
      expect(
        metaMetrics.hintH,
        `元数据 tip 高应 ≤32（目标 ~24），得 ${metaMetrics.hintH}`,
      ).toBeLessThanOrEqual(32);
      expect(
        metaMetrics.subPadY,
        `CodeTab 签体 padY 应 ≤4（目标 0），得 ${metaMetrics.subPadY}`,
      ).toBeLessThanOrEqual(4);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-tab-body-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  /**
   * ADR-0016：设计器次屏 Empty 次密距 —
   * 压 antd Empty marginXL / 禁历史 marginTop:100；贴 --erd-tab-body-pad；保留字段空态 CTA
   */
  test('设计器空态次密距', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('paneempty');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await openRelationFromEmpty(page, { name: 'SHOP', chnname: '商城' });
      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      // RF 挂载后才能用 E2E 清字段钩子
      const cleared = await page.evaluate(() => {
        const api = (window as Window & {
          __ERD_E2E__?: { clearEntityFields?: (t: string) => boolean };
        }).__ERD_E2E__;
        return api?.clearEntityFields?.('T_ORDER') ?? false;
      });
      expect(cleared, '__ERD_E2E__.clearEntityFields(T_ORDER)').toBe(true);

      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '编辑表' }).click();
      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });

      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });
      await expect(fieldEdit.getByRole('button', { name: '添加第一个字段' })).toBeVisible();

      const fieldMetrics = await fieldEdit.evaluate((root) => {
        const wrap = root as HTMLElement;
        const empty = root.querySelector('.ant-empty') as HTMLElement | null;
        const wrapCs = getComputedStyle(wrap);
        const emptyCs = empty ? getComputedStyle(empty) : null;
        return {
          wrapPadX:
            parseFloat(wrapCs.paddingLeft) + parseFloat(wrapCs.paddingRight),
          wrapPadY:
            parseFloat(wrapCs.paddingTop) + parseFloat(wrapCs.paddingBottom),
          emptyMt: emptyCs != null ? parseFloat(emptyCs.marginTop) : -1,
          emptyMb: emptyCs != null ? parseFloat(emptyCs.marginBottom) : -1,
        };
      });

      expect(
        fieldMetrics.emptyMt,
        `字段空态 marginTop 应 ≤8（禁 100 / antd XL），得 ${fieldMetrics.emptyMt}`,
      ).toBeLessThanOrEqual(8);
      expect(
        fieldMetrics.emptyMb,
        `字段空态 marginBottom 应 ≤8，得 ${fieldMetrics.emptyMb}`,
      ).toBeLessThanOrEqual(8);
      expect(
        fieldMetrics.wrapPadX,
        `字段空态侧 pad 合计应 ≤16（目标 6+6），得 ${fieldMetrics.wrapPadX}`,
      ).toBeLessThanOrEqual(16);
      expect(fieldMetrics.wrapPadX).toBeGreaterThanOrEqual(8);
      expect(
        fieldMetrics.wrapPadY,
        `字段空态竖 pad 合计应 ≤16（目标 4+4），得 ${fieldMetrics.wrapPadY}`,
      ).toBeLessThanOrEqual(16);

      await designer.getByRole('tab', { name: '索引' }).click();
      const indexEdit = page.getByTestId('table-index-edit');
      await expect(indexEdit).toBeVisible({ timeout: 10_000 });
      await expect(indexEdit.getByRole('button', { name: '添加第一个索引' })).toBeVisible();

      const indexMetrics = await indexEdit.evaluate((root) => {
        const empty = root.querySelector('.ant-empty') as HTMLElement | null;
        const emptyCs = empty ? getComputedStyle(empty) : null;
        return {
          emptyMt: emptyCs != null ? parseFloat(emptyCs.marginTop) : -1,
          emptyMb: emptyCs != null ? parseFloat(emptyCs.marginBottom) : -1,
        };
      });
      expect(
        indexMetrics.emptyMt,
        `索引空态 marginTop 应 ≤8，得 ${indexMetrics.emptyMt}`,
      ).toBeLessThanOrEqual(8);
      expect(
        indexMetrics.emptyMb,
        `索引空态 marginBottom 应 ≤8，得 ${indexMetrics.emptyMb}`,
      ).toBeLessThanOrEqual(8);

      // 源码纪律：工作区兜底不得再写 marginTop:100
      expect(page.locator('.erd-design-workspace [style*="margin-top: 100"]')).toHaveCount(0);
      expect(page.locator('.erd-design-workspace [style*="marginTop: 100"]')).toHaveCount(0);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-pane-empty-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  /**
   * ADR-0016：欢迎空态内井碎距 + 标题碎距 —
   * pad ≤20（侧 ≤16）；标题 mt∈[8,12] / 字 ∈[16,18] / lh≈22；
   * 禁 32×24；禁压成画布 14/18；逆向链 + 左树新增模型保留
   */
  test('欢迎空态次密距', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('welcomeempty');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      const welcome = page.getByTestId('designer-welcome-empty');
      await expect(welcome).toBeVisible({ timeout: 20_000 });
      await expect(
        welcome.getByRole('heading', { name: '欢迎使用数据建模工具' }),
      ).toBeVisible();
      await expect(
        welcome.getByRole('link', { name: '从数据源逆向' }),
      ).toBeVisible();
      await expect(welcome.getByTestId('erd-empty-diagram')).toBeVisible();
      // 左树空态 CTA 与欢迎文案并存（建模入口不丢）
      await expect(page.getByTestId('add-module-empty')).toBeVisible();

      const metrics = await welcome.evaluate((root) => {
        const inner = root.querySelector(
          '[data-testid="designer-welcome-empty-inner"]',
        ) as HTMLElement | null;
        const title = root.querySelector('h2') as HTMLElement | null;
        const desc = root.querySelector('p') as HTMLElement | null;
        const svg = root.querySelector(
          '[data-testid="erd-empty-diagram"]',
        ) as SVGElement | null;
        const ics = inner ? getComputedStyle(inner) : null;
        const tcs = title ? getComputedStyle(title) : null;
        const dcs = desc ? getComputedStyle(desc) : null;
        return {
          padT: ics ? parseFloat(ics.paddingTop) : -1,
          padB: ics ? parseFloat(ics.paddingBottom) : -1,
          padL: ics ? parseFloat(ics.paddingLeft) : -1,
          padR: ics ? parseFloat(ics.paddingRight) : -1,
          titleMt: tcs ? parseFloat(tcs.marginTop) : -1,
          titleSize: tcs ? parseFloat(tcs.fontSize) : 0,
          titleLh: tcs ? parseFloat(tcs.lineHeight) : 0,
          titleWeight: tcs ? parseInt(tcs.fontWeight, 10) : 0,
          descMt: dcs ? parseFloat(dcs.marginTop) : -1,
          descSize: dcs ? parseFloat(dcs.fontSize) : 0,
          svgW: svg ? parseFloat(svg.getAttribute('width') || '0') : 0,
        };
      });

      expect(metrics.padT, `欢迎内 padTop 应 ≤20，得 ${metrics.padT}`).toBeLessThanOrEqual(20);
      expect(metrics.padB, `欢迎内 padBottom 应 ≤20，得 ${metrics.padB}`).toBeLessThanOrEqual(20);
      expect(metrics.padL, `欢迎内 padLeft 应 ≤16，得 ${metrics.padL}`).toBeLessThanOrEqual(16);
      expect(metrics.padR, `欢迎内 padRight 应 ≤16，得 ${metrics.padR}`).toBeLessThanOrEqual(16);
      // 勿压到画布空态级（14/18）——欢迎需可扫读层次
      expect(metrics.padT).toBeGreaterThanOrEqual(16);
      expect(metrics.padL).toBeGreaterThanOrEqual(12);
      // 标题碎距：8–12 族 + page-title lh22；禁 20/mt14；仍高于画布 14
      expect(metrics.titleMt, `标题 mt 应 ∈[8,12]，得 ${metrics.titleMt}`).toBeGreaterThanOrEqual(8);
      expect(metrics.titleMt, `标题 mt 应 ∈[8,12]，得 ${metrics.titleMt}`).toBeLessThanOrEqual(12);
      expect(metrics.titleSize, `标题字号应 ∈[16,18]，得 ${metrics.titleSize}`).toBeGreaterThanOrEqual(16);
      expect(metrics.titleSize, `标题字号应 ∈[16,18]，得 ${metrics.titleSize}`).toBeLessThanOrEqual(18);
      expect(metrics.titleLh, `标题 lh 应 ≈22，得 ${metrics.titleLh}`).toBeGreaterThanOrEqual(20);
      expect(metrics.titleLh, `标题 lh 应 ≈22，得 ${metrics.titleLh}`).toBeLessThanOrEqual(24);
      expect(metrics.titleWeight).toBeGreaterThanOrEqual(600);
      expect(metrics.descMt).toBeLessThanOrEqual(10);
      expect(metrics.descSize).toBeGreaterThanOrEqual(13);
      expect(metrics.svgW, `hero 剪影应 ≤180，得 ${metrics.svgW}`).toBeLessThanOrEqual(180);
      expect(metrics.svgW).toBeGreaterThan(132);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-welcome-empty-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
