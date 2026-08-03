import { expect, test } from '@playwright/test';
import {
  addFieldInline,
  connectFields,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  login,
  openRelationCanvas,
  openRelationFromEmpty,
  rfNode,
  saveVersion,
  openVersionPage,
  gotoDesignModel,
  selectRelationEdge,
  uniqueProjectName,
} from './helpers';

/**
 * 关系图画布回归（ADR-0001 ReactFlow）
 * 定位：e2e-locators（role / testid；RF/自研 .erd-* 结构类名可作兜底）
 */

test.describe('关系图画布（ReactFlow）', () => {
  // 同账号并发下偶发读到保存前快照；本地也重试一次
  test.describe.configure({ retries: 1 });

  test('全旅程：空态引导→建表→内联字段→连线→守卫→持久化', async ({ page }) => {
    test.setTimeout(180_000);
    const projectName = uniqueProjectName('rf');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'rf', 'relation r2');

      await openRelationFromEmpty(page);

      await expect(page.getByTestId('canvas-empty-create')).toBeVisible();
      // 放慢落库，确保顶栏能看到「保存中…」→「已保存」
      await page.route('**/ncnb/project/save', async (route) => {
        await new Promise((r) => setTimeout(r, 600));
        await route.continue();
      });
      await page.getByTestId('canvas-empty-create').click();
      await expect(page.getByTestId('canvas-empty-create')).toHaveCount(0);
      const firstNode = rfNode(page, 'T_TABLE_1');
      await expect(firstNode).toBeVisible();
      await expect(firstNode).toContainText(/id|主键/i);
      const saveStatus = page.getByTestId('save-status');
      await expect(saveStatus).toBeVisible();
      await expect(saveStatus).toHaveText('保存中…', { timeout: 5_000 });
      await expect(saveStatus).toHaveText('已保存', { timeout: 15_000 });
      await page.unroute('**/ncnb/project/save');

      await expect(firstNode.locator('.erd-pk-badge.active')).toHaveCount(1);
      await addFieldInline(page, 'T_TABLE_1', 'NAME');

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();

      await addFieldInline(page, 'T_ORDER', 'T1_ID', 'IdOrKey');
      const orderNode = rfNode(page, 'T_ORDER');
      await connectFields(page, 'T_ORDER', 'T1_ID', 'T_TABLE_1', 'id');
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);

      await orderNode.locator('[data-field="T1_ID"]').dblclick();
      const renameRow = orderNode.locator('.erd-field-editing');
      await renameRow.locator('.erd-field-input').fill('USER_ID');
      await renameRow.locator('.erd-field-input').press('Enter');
      await expect(orderNode.locator('[data-field="USER_ID"]')).toBeVisible();
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);

      // interactionWidth=24；chip 叠中时 force 选边；删边二次确认
      await selectRelationEdge(page);
      await page.keyboard.press('Delete');
      {
        const edgeDialog = page.getByRole('dialog').filter({ hasText: /确定删除关系/ });
        await expect(edgeDialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
        await edgeDialog.getByRole('button', { name: /删\s*除/ }).filter({ visible: true }).click();
      }
      await expect(page.locator('.react-flow__edge')).toHaveCount(0);

      await page.locator('.react-flow__pane').click({ position: { x: 8, y: 8 }, force: true });
      await rfNode(page, 'T_TABLE_1').locator('.erd-table-title').click();
      await expect(rfNode(page, 'T_TABLE_1')).toHaveClass(/selected/);
      await page.keyboard.press('Delete');
      {
        const tableDialog = page.getByRole('dialog').filter({ hasText: /确定删除表/ });
        await expect(tableDialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
        await tableDialog.getByRole('button', { name: /取\s*消/ }).filter({ visible: true }).click();
      }
      await expect(page.locator('.erd-table-node')).toHaveCount(2);

      const t1Node = rfNode(page, 'T_TABLE_1');
      const box = await t1Node.boundingBox();
      await page.mouse.move(box!.x + 60, box!.y + 20);
      await page.mouse.down();
      await page.mouse.move(box!.x + 180, box!.y + 140, { steps: 8 });
      await page.mouse.up();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      // 并发下偶发读到保存前快照：再留一拍给落库
      await page.waitForTimeout(1_500);
      const draggedTransform = await t1Node.evaluate((el) => (el as HTMLElement).style.transform);
      expect(draggedTransform).toContain('translate');

      const designUrl = page.url();
      await page.goto(designUrl, { waitUntil: 'networkidle' });
      const shopInTree = page.getByRole('tree').getByText('商城', { exact: true });
      if (!(await shopInTree.isVisible().catch(() => false))) {
        await page.waitForTimeout(2_000);
        await page.goto(designUrl, { waitUntil: 'networkidle' });
      }
      await expect(shopInTree).toBeVisible({ timeout: 20_000 });
      await openRelationCanvas(page, '商城');
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.locator('.erd-field-row', { hasText: 'NAME' }).first()).toBeVisible();
      const reloadedTransform = await rfNode(page, 'T_TABLE_1').evaluate(
        (el) => (el as HTMLElement).style.transform,
      );
      expect(reloadedTransform, '拖动后的画布坐标必须在重载后保持').toBe(draggedTransform);

      // dagre-on-create 后坐标已是分层结果；先拖乱再自动布局，避免 after===before 假阳性
      const orderBeforeDrag = rfNode(page, 'T_ORDER');
      const orderBox = await orderBeforeDrag.boundingBox();
      await page.mouse.move(orderBox!.x + 40, orderBox!.y + 16);
      await page.mouse.down();
      await page.mouse.move(orderBox!.x + 220, orderBox!.y + 180, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(400);
      const beforeLayout = await rfNode(page, 'T_ORDER').evaluate(
        (el) => (el as HTMLElement).style.transform,
      );
      await page.getByRole('button', { name: '自动布局' }).click();
      await page.waitForTimeout(800);
      const afterLayout = await rfNode(page, 'T_ORDER').evaluate(
        (el) => (el as HTMLElement).style.transform,
      );
      expect(afterLayout, '拖乱后自动布局应改变坐标').not.toBe(beforeLayout);

      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
      await page.waitForTimeout(500);
      const undoneLayout = await rfNode(page, 'T_ORDER').evaluate(
        (el) => (el as HTMLElement).style.transform,
      );
      expect(undoneLayout, '撤销后应回到自动布局前的坐标').toBe(beforeLayout);

      await rfNode(page, 'T_TABLE_1').click();
      await rfNode(page, 'T_ORDER').click({ modifiers: ['Shift'] });
      await expect(page.locator('.react-flow__node.selected')).toHaveCount(2);
      await page.getByTestId('align-left').click();
      await page.waitForTimeout(400);
      const parseTx = (t: string) => {
        const m = t.match(/translate\(([-\d.]+)px/);
        return m ? Number(m[1]) : NaN;
      };
      const x1 = parseTx(
        await rfNode(page, 'T_TABLE_1').evaluate((el) => (el as HTMLElement).style.transform),
      );
      const x2 = parseTx(
        await rfNode(page, 'T_ORDER').evaluate((el) => (el as HTMLElement).style.transform),
      );
      expect(x1, '左对齐后两表 x 应相同').toBe(x2);

      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
      await expect(page.getByRole('dialog', { name: '命令面板' })).toBeVisible();
      await page.getByTestId('cmd-palette-input').fill('新建');
      await page.getByRole('option', { name: /新建表/ }).click();
      await expect(page.getByRole('dialog', { name: '命令面板' })).toHaveCount(0);
      await expect(page.locator('.erd-table-node')).toHaveCount(3);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('空态构图：ER 剪影 + 主次 CTA', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('emptyviz');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'emptyviz', 'empty composition');
      await openRelationFromEmpty(page);

      const empty = page.getByTestId('canvas-empty-state');
      await expect(empty).toBeVisible();
      await expect(page.getByTestId('erd-empty-diagram')).toBeVisible();
      await expect(empty.getByText('开始你的第一张关系图')).toBeVisible();
      await expect(page.getByTestId('canvas-empty-create')).toBeVisible();
      await expect(page.getByRole('button', { name: '导入 DBML' })).toBeVisible();
      await expect(page.getByRole('button', { name: '从数据源逆向' })).toBeVisible();
      await expect(page.getByLabel('画布缩略图')).toHaveCount(0);

      // ADR-0016：唯一实心主 CTA；导入/逆向降为次链，禁 outline 第二钮抢焦点
      await expect(empty.locator('.erd-empty-button')).toHaveCount(1);
      await expect(empty.locator('.erd-empty-outline')).toHaveCount(0);
      await expect(empty.locator('.erd-empty-secondary')).toHaveCount(2);

      const titleColor = await empty.locator('.erd-empty-title').evaluate(
        (el) => getComputedStyle(el).color,
      );
      expect(titleColor).toBe('rgb(11, 28, 44)'); // ink900

      // ADR-0016：空态面板再收（与 22 chrome 同阶）；禁 28/32 松卡片盖首屏
      const emptyMetrics = await empty.evaluate((el) => {
        const cs = getComputedStyle(el);
        const title = el.querySelector('.erd-empty-title') as HTMLElement | null;
        const desc = el.querySelector('.erd-empty-desc') as HTMLElement | null;
        const btn = el.querySelector('.erd-empty-button') as HTMLElement | null;
        const sec = el.querySelector('.erd-empty-secondary') as HTMLElement | null;
        const bcs = btn ? getComputedStyle(btn) : null;
        const tcs = title ? getComputedStyle(title) : null;
        const dcs = desc ? getComputedStyle(desc) : null;
        const scs = sec ? getComputedStyle(sec) : null;
        const svg = el.querySelector('[data-testid="erd-empty-diagram"]');
        return {
          padY: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
          padX: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
          maxW: parseFloat(cs.maxWidth),
          titleSize: tcs ? parseFloat(tcs.fontSize) : 0,
          titleWeight: tcs ? parseInt(tcs.fontWeight, 10) : 0,
          descSize: dcs ? parseFloat(dcs.fontSize) : 0,
          descColor: dcs ? dcs.color : '',
          btnH: bcs ? parseFloat(bcs.height) : 0,
          btnFont: bcs ? parseFloat(bcs.fontSize) : 0,
          btnWeight: bcs ? parseInt(bcs.fontWeight, 10) : 0,
          secColor: scs ? scs.color : '',
          svgW: svg ? parseFloat((svg as SVGElement).getAttribute('width') || '0') : 0,
        };
      });
      expect(emptyMetrics.padY, `空态 padY 应 ≤30，得 ${emptyMetrics.padY}`).toBeLessThanOrEqual(30);
      expect(emptyMetrics.padX).toBeLessThanOrEqual(40);
      expect(emptyMetrics.maxW).toBeLessThanOrEqual(300);
      expect(emptyMetrics.titleSize).toBeLessThanOrEqual(14);
      expect(emptyMetrics.titleWeight).toBeGreaterThanOrEqual(700);
      expect(emptyMetrics.descSize).toBeLessThanOrEqual(12);
      expect(emptyMetrics.descColor).toBe('rgb(138, 151, 163)'); // ink400
      expect(emptyMetrics.btnH).toBeLessThanOrEqual(28);
      expect(emptyMetrics.btnFont).toBeLessThanOrEqual(12);
      expect(emptyMetrics.btnWeight).toBeGreaterThanOrEqual(600);
      expect(emptyMetrics.secColor).toBe('rgb(68, 82, 95)'); // ink600，次链不抢 brand
      expect(emptyMetrics.svgW).toBeLessThanOrEqual(140);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-empty-composition.png',
        fullPage: false,
      });

      await page.getByTestId('canvas-empty-create').click();
      await expect(page.getByTestId('canvas-empty-state')).toHaveCount(0);
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByLabel('画布缩略图')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('表头 ✎ 可改名', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('rename');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'rename', 'table rename');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      const renameBtn = node.getByTestId('table-rename-btn');
      await expect(renameBtn).toBeVisible({ timeout: 10_000 });
      // pointer 易被 RF 吞；DOM click 可靠。改名后节点无可见文案，勿再挂 rfNode 链
      await renameBtn.evaluate((el: HTMLElement) => el.click());
      const nameInput = page.getByRole('textbox', { name: '表名' });
      await expect(nameInput).toBeVisible({ timeout: 10_000 });
      await nameInput.fill('T_USER');
      await nameInput.press('Enter');
      await expect(rfNode(page, 'T_USER')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('.react-flow__node', { hasText: 'T_TABLE_1' })).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('表头中文名内联编辑；Tab 入；Escape 丢弃', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('tchn');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'tchn', 'table chnname inline');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      let node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      // 编辑态标题进 input，勿用 hasText 链；用 page 级 role
      await node.getByTestId('table-rename-btn').evaluate((el: HTMLElement) => el.click());
      const nameInput = page.getByRole('textbox', { name: '表名' });
      const chnInput = page.getByRole('textbox', { name: '表中文名' });
      await expect(nameInput).toBeVisible({ timeout: 10_000 });
      await expect(chnInput).toBeVisible();

      // Tab 入中文名；Enter 落盘；浏览态可见 + save-status
      await nameInput.press('Tab');
      await expect(chnInput).toBeFocused();
      await chnInput.fill('用户表');
      await chnInput.press('Enter');
      await expect(page.getByRole('textbox', { name: '表中文名' })).toHaveCount(0);
      node = rfNode(page, 'T_TABLE_1');
      await expect(node.locator('.erd-table-chnname')).toHaveText('用户表');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      // Escape：中文名草稿不经 blur 落盘
      await node.getByTestId('table-rename-btn').evaluate((el: HTMLElement) => el.click());
      await expect(page.getByRole('textbox', { name: '表中文名' })).toHaveValue('用户表');
      await page.getByRole('textbox', { name: '表名' }).press('Tab');
      await page.getByRole('textbox', { name: '表中文名' }).fill('别名草稿');
      await page.getByRole('textbox', { name: '表中文名' }).press('Escape');
      await expect(page.getByRole('textbox', { name: '表中文名' })).toHaveCount(0);
      node = rfNode(page, 'T_TABLE_1');
      await expect(node.locator('.erd-table-chnname')).toHaveText('用户表');

      // 中文名可空提交
      await node.getByTestId('table-rename-btn').evaluate((el: HTMLElement) => el.click());
      await page.getByRole('textbox', { name: '表名' }).press('Tab');
      await page.getByRole('textbox', { name: '表中文名' }).fill('');
      await page.getByRole('textbox', { name: '表中文名' }).press('Enter');
      node = rfNode(page, 'T_TABLE_1');
      await expect(node.locator('.erd-table-chnname')).toHaveCount(0);
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  // ADR-0016：画布主色走品牌 ink，禁默认蓝
  test('表节点视觉：品牌 token', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('viz');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'viz', 'shareable diagram tokens');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const titleColor = await node.locator('.erd-table-title').evaluate(
        (el) => getComputedStyle(el).color,
      );
      // ink900 #0B1C2C
      expect(titleColor).toBe('rgb(11, 28, 44)');

      const headerBg = await node.locator('.erd-table-header').evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      // surfaceMuted #F3F5F7
      expect(headerBg).toBe('rgb(243, 245, 247)');

      const canvasBg = await page.getByTestId('reactflow-canvas').evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      // surfaceSunk #FAFBFC
      expect(canvasBg).toBe('rgb(250, 251, 252)');

      await node.click();
      const border = await node.locator('.erd-table-node').evaluate(
        (el) => getComputedStyle(el).borderColor,
      );
      // brand #DE2910
      expect(border).toContain('rgb(222, 41, 16)');
      // ADR-0016：选中环 brand a18（与 Frame 共用 --erd-selection-ring）
      const tableRing = await node.locator('.erd-table-node').evaluate((el) => {
        const shadow = getComputedStyle(el).boxShadow;
        const m = shadow.match(/rgba?\([^)]+\)\s+0px\s+0px\s+0px\s+2px/);
        return m?.[0] ?? shadow;
      });
      expect(tableRing).toMatch(/rgba\(222,\s*41,\s*16,\s*0\.18\)/);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-shareable-tokens.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  // ADR-0016：节点密度 / PK·FK 徽章 / 自定义边 + 箭头 — 敢分享截图
  test('表节点视觉：PK/FK 与边样式', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('polish');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'polish', 'node visual polish');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-chnname').fill('订单');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();

      await addFieldInline(page, 'T_ORDER', 'T1_ID', 'IdOrKey');
      await connectFields(page, 'T_ORDER', 'T1_ID', 'T_TABLE_1', 'id');
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);

      const orderNode = rfNode(page, 'T_ORDER');
      const fkRow = orderNode.locator('[data-field="T1_ID"]');
      await expect(fkRow.locator('.erd-fk-badge')).toBeVisible();
      await expect(fkRow).toHaveClass(/erd-field-fk/);

      const pkRow = rfNode(page, 'T_TABLE_1').locator('.erd-field-row.erd-field-pk').first();
      await expect(pkRow.locator('.erd-pk-badge.active')).toBeVisible();
      const pkAccent = await pkRow.evaluate((el) => {
        const before = getComputedStyle(el, '::before');
        return { w: before.width, bg: before.backgroundColor };
      });
      expect(pkAccent.w).toBe('2px');
      expect(pkAccent.bg).toBe('rgb(212, 136, 6)');

      // ADR-0016：表头标题层次 — 实体名主标题 vs muted 中文 meta；密度 pad ≤6
      const headerHierarchy = await orderNode.locator('.erd-table-header').evaluate((el) => {
        const title = el.querySelector('.erd-table-title');
        const chn = el.querySelector('.erd-table-chnname');
        if (!title || !chn) return null;
        const hs = getComputedStyle(el);
        const ts = getComputedStyle(title);
        const cs = getComputedStyle(chn);
        return {
          padTop: parseFloat(hs.paddingTop),
          padBottom: parseFloat(hs.paddingBottom),
          titleSize: parseFloat(ts.fontSize),
          titleWeight: parseInt(ts.fontWeight, 10),
          titleColor: ts.color,
          chnSize: parseFloat(cs.fontSize),
          chnWeight: parseInt(cs.fontWeight, 10),
          chnColor: cs.color,
          chnOpacity: parseFloat(cs.opacity),
          chnText: (chn.textContent || '').trim(),
        };
      });
      expect(headerHierarchy).not.toBeNull();
      expect(headerHierarchy!.chnText).toBe('订单');
      expect(headerHierarchy!.padTop).toBeLessThanOrEqual(6);
      expect(headerHierarchy!.padBottom).toBeLessThanOrEqual(6);
      expect(headerHierarchy!.titleSize).toBeGreaterThanOrEqual(14);
      expect(headerHierarchy!.titleWeight).toBeGreaterThanOrEqual(700);
      expect(headerHierarchy!.titleColor).toBe('rgb(11, 28, 44)'); // ink900
      expect(headerHierarchy!.chnSize).toBeLessThan(headerHierarchy!.titleSize);
      expect(headerHierarchy!.chnWeight).toBeLessThan(headerHierarchy!.titleWeight);
      expect(headerHierarchy!.chnOpacity).toBeLessThan(1);
      expect(headerHierarchy!.chnColor).toBe('rgb(138, 151, 163)'); // ink400

      // ADR-0016：字段行密表再压（minH 20 / lh 15 / pad 1；与 FIELD_ROW_H=24 对齐）
      const fieldRowBox = await fkRow.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          minH: parseFloat(s.minHeight),
          lineH: parseFloat(s.lineHeight),
          padTop: parseFloat(s.paddingTop),
        };
      });
      expect(fieldRowBox.minH).toBe(20);
      expect(fieldRowBox.lineH).toBe(15);
      expect(fieldRowBox.padTop).toBe(1);

      // ADR-0016：字段行扫读层次 — 名主列 500+、类型右对齐次要栏
      const fkScan = await fkRow.evaluate((el) => {
        const name = el.querySelector('.erd-field-name');
        const type = el.querySelector('.erd-field-type');
        if (!name || !type) return null;
        const ns = getComputedStyle(name);
        const ts = getComputedStyle(type);
        return {
          nameWeight: parseInt(ns.fontWeight, 10),
          typeAlign: ts.textAlign,
          typeOpacity: parseFloat(ts.opacity),
          typeMinW: parseFloat(ts.minWidth),
          typeSize: parseFloat(ts.fontSize),
        };
      });
      expect(fkScan).not.toBeNull();
      expect(fkScan!.nameWeight).toBeGreaterThanOrEqual(500);
      expect(fkScan!.typeAlign).toBe('right');
      expect(fkScan!.typeOpacity).toBeLessThan(1);
      expect(fkScan!.typeMinW).toBeGreaterThanOrEqual(4 * 10); // ≥4em @10px
      expect(fkScan!.typeSize).toBe(10);

      const pkNameWeight = await pkRow.locator('.erd-field-name').evaluate((el) =>
        parseInt(getComputedStyle(el).fontWeight, 10),
      );
      expect(pkNameWeight).toBeGreaterThanOrEqual(600);

      // ADR-0016：PK/FK 徽章扫读层次 — 角色标列 ≥10/700 + min-width 对齐；字段名字重不动
      const pkBadgeLook = await pkRow.locator('.erd-pk-badge.active').evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          fontSize: parseFloat(s.fontSize),
          fontWeight: parseInt(s.fontWeight, 10),
          minW: parseFloat(s.minWidth),
          color: s.color,
        };
      });
      expect(pkBadgeLook.fontSize).toBeGreaterThanOrEqual(10);
      expect(pkBadgeLook.fontWeight).toBeGreaterThanOrEqual(700);
      expect(pkBadgeLook.minW).toBeGreaterThanOrEqual(22);
      expect(pkBadgeLook.color).toBe('rgb(212, 136, 6)'); // warning
      expect(pkBadgeLook.fontSize).toBeLessThan(12); // 仍小于字段名 12，不抢主列

      const fkBadgeLook = await fkRow.locator('.erd-fk-badge').evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          fontSize: parseFloat(s.fontSize),
          fontWeight: parseInt(s.fontWeight, 10),
          minW: parseFloat(s.minWidth),
          color: s.color,
        };
      });
      expect(fkBadgeLook.fontSize).toBe(pkBadgeLook.fontSize);
      expect(fkBadgeLook.fontWeight).toBeGreaterThanOrEqual(700);
      expect(fkBadgeLook.minW).toBeGreaterThanOrEqual(22);
      expect(fkBadgeLook.color).toBe('rgb(47, 143, 123)'); // success

      const titleFont = await orderNode.locator('.erd-table-title').evaluate(
        (el) => getComputedStyle(el).fontFamily,
      );
      expect(titleFont.toLowerCase()).toMatch(/mono|menlo|consolas/);

      await page.getByRole('button', { name: '适应画布' }).click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-table-header-hierarchy.png',
        fullPage: false,
      });
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-table-node-density.png',
        fullPage: false,
      });
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-pk-fk-badge-hierarchy.png',
        fullPage: false,
      });

      const edge = page.locator('.react-flow__edge').first();
      await expect(edge).toHaveClass(/react-flow__edge-erdSmooth/);
      const edgePath = page.locator('.react-flow__edge-path').first();
      await expect(edgePath).toBeVisible();
      // ADR-0016：默认关系线权重/对比（ink900 + ≥2px；选中更粗但不胀撞 crow/chip）
      const edgeStroke = await edgePath.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          stroke: s.stroke,
          width: parseFloat(s.strokeWidth),
        };
      });
      expect(edgeStroke.stroke).toBe('rgb(11, 28, 44)'); // ink900
      expect(edgeStroke.width).toBeGreaterThanOrEqual(2);
      expect(edgeStroke.width).toBeLessThanOrEqual(2.5);
      await expect(page.getByTestId('erd-crowfoot-markers')).toBeAttached();
      // 默认 n:1 → 源 crow's foot(many) / 靶 one（IE）；chip 仍可编辑
      const crow = page.getByTestId('erd-edge-crowfoot');
      await expect(crow).toHaveAttribute('data-relation', 'n:1');
      await expect(crow).toHaveAttribute('data-marker-start', /erd-cf-many/);
      await expect(crow).toHaveAttribute('data-marker-end', /erd-cf-one/);
      const markerEnd = await edgePath.getAttribute('marker-end');
      const markerStart = await edgePath.getAttribute('marker-start');
      expect(markerEnd, '边端应带 crow foot marker').toMatch(/erd-cf-one/);
      expect(markerStart, '边源应带 crow foot marker').toMatch(/erd-cf-many/);

      // ADR-0016：连线后基数标签 chip 扫读（默认 n:1）；白底 + ink900/600 字重，碰撞 nudge 不动
      const edgeLabel = page.getByTestId('erd-edge-label');
      await expect(edgeLabel).toBeVisible();
      await expect(edgeLabel).toHaveText(/n:1/);
      const labelLook = await edgeLabel.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          color: s.color,
          bg: s.backgroundColor,
          opacity: s.opacity,
          fontSize: parseFloat(s.fontSize),
          fontWeight: s.fontWeight,
          padX: parseFloat(s.paddingLeft),
          padY: parseFloat(s.paddingTop),
          radius: parseFloat(s.borderTopLeftRadius),
        };
      });
      expect(labelLook.opacity).toBe('1');
      expect(labelLook.color).toBe('rgb(11, 28, 44)'); // ink900
      expect(labelLook.bg).toBe('rgb(255, 255, 255)');
      expect(labelLook.fontSize).toBeGreaterThanOrEqual(12);
      expect(parseInt(labelLook.fontWeight, 10)).toBeGreaterThanOrEqual(600);
      expect(labelLook.padX).toBeLessThanOrEqual(4);
      expect(labelLook.padY).toBeLessThanOrEqual(2);
      expect(labelLook.radius).toBeLessThanOrEqual(3);

      // 基数可编辑：点 chip → 选 1:1 → 刷新仍在
      await edgeLabel.click();
      await expect(page.getByTestId('erd-edge-cardinality')).toBeVisible({ timeout: 5_000 });
      await page.getByRole('option', { name: '1:1' }).click();
      await expect(page.getByTestId('erd-edge-label')).toHaveText('1:1');
      await expect(page.getByTestId('erd-edge-crowfoot')).toHaveAttribute(
        'data-marker-start',
        /erd-cf-one/,
      );
      await expect(page.getByTestId('erd-edge-crowfoot')).toHaveAttribute(
        'data-marker-end',
        /erd-cf-one/,
      );
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      const designUrl = page.url();
      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('erd-edge-label')).toHaveText('1:1', { timeout: 15_000 });
      await expect(page.getByTestId('erd-edge-crowfoot')).toHaveAttribute(
        'data-relation',
        '1:1',
      );

      // 默认新建表常竖叠：几何择柄应走同侧短 U（消 circle-route）
      const portEl = page.getByTestId('erd-edge-route-mode');
      await expect(portEl).toHaveAttribute('data-port', 'same');

      await page.getByRole('button', { name: '适应画布' }).click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-edge-stroke.png',
        fullPage: false,
      });
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-node-polish.png',
        fullPage: false,
      });
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-edge-label-chip.png',
        fullPage: false,
      });
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-port-same-side.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  // ADR-0016：同表对多 FK → 肘距分流（边路由）
  test('边路由：同表对双 FK 肘距分流', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('edgelane');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'edgelane', 'parallel edge lanes');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();

      await addFieldInline(page, 'T_ORDER', 'A_ID', 'IdOrKey');
      await addFieldInline(page, 'T_ORDER', 'B_ID', 'IdOrKey');
      await connectFields(page, 'T_ORDER', 'A_ID', 'T_TABLE_1', 'id');
      await connectFields(page, 'T_ORDER', 'B_ID', 'T_TABLE_1', 'id');
      await expect(page.locator('.react-flow__edge')).toHaveCount(2);

      const paths = page.locator('.react-flow__edge-path');
      await expect(paths).toHaveCount(2);
      const d0 = await paths.nth(0).getAttribute('d');
      const d1 = await paths.nth(1).getAttribute('d');
      expect(d0, '边 path 应存在').toBeTruthy();
      expect(d1, '边 path 应存在').toBeTruthy();
      expect(d0).not.toBe(d1);

      await page.getByRole('button', { name: '适应画布' }).click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-edge-lanes.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  // ADR-0016：障碍避让几何由 relationEdgeRoute 单测覆盖；E2E 验设计器接线
  test('边路由：erdSmooth 暴露 route-mode', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('edgeroute');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'edgeroute', 'edge route mode wire');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();

      await addFieldInline(page, 'T_ORDER', 'T1_ID', 'IdOrKey');
      await connectFields(page, 'T_ORDER', 'T1_ID', 'T_TABLE_1', 'id');
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);
      await expect(page.locator('.react-flow__edge').first()).toHaveClass(/react-flow__edge-erdSmooth/);

      const modeEl = page.getByTestId('erd-edge-route-mode');
      await expect(modeEl).toBeAttached();
      await expect(modeEl).toHaveAttribute(
        'data-mode',
        /^(default|centerX|bypass|twoBend|astar)$/,
      );
      await expect(modeEl).toHaveAttribute('data-bundle', /^-?\d+(\.\d+)?$/);

      await page.getByRole('button', { name: '适应画布' }).click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-edge-obstacle.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  // ADR-0016：同竖向走廊多 FK 干道 bundling（跨表对）
  test('边路由：干道 bundling 暴露 data-bundle', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('edgebundle');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'edgebundle', 'trunk bundle lanes');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ITEM');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ITEM')).toBeVisible();

      await addFieldInline(page, 'T_ORDER', 'T1_ID', 'IdOrKey');
      await addFieldInline(page, 'T_ITEM', 'T1_ID', 'IdOrKey');
      await connectFields(page, 'T_ORDER', 'T1_ID', 'T_TABLE_1', 'id');
      await connectFields(page, 'T_ITEM', 'T1_ID', 'T_TABLE_1', 'id');
      await expect(page.locator('.react-flow__edge')).toHaveCount(2);

      const modes = page.getByTestId('erd-edge-route-mode');
      await expect(modes).toHaveCount(2);
      const b0 = await modes.nth(0).getAttribute('data-bundle');
      const b1 = await modes.nth(1).getAttribute('data-bundle');
      expect(b0, 'bundle 应存在').toBeTruthy();
      expect(b1, 'bundle 应存在').toBeTruthy();
      // 两表对若落入同 midX 通道则偏移非全零且互异；否则各自 0（仍接线）
      if (b0 !== '0' || b1 !== '0') {
        expect(b0).not.toBe(b1);
      }

      const paths = page.locator('.react-flow__edge-path');
      const d0 = await paths.nth(0).getAttribute('d');
      const d1 = await paths.nth(1).getAttribute('d');
      expect(d0).not.toBe(d1);

      await page.getByRole('button', { name: '适应画布' }).click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-edge-bundle.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('save-status：aria-live 播报自动保存状态', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('savestatus');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'save', 'save-status aria-live');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      const saveStatus = page.getByTestId('save-status');
      await expect(saveStatus).toHaveText('已保存', { timeout: 15_000 });
      await expect(saveStatus).toHaveAttribute('aria-live', 'polite');
      await expect(saveStatus).toHaveAttribute('role', 'status');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('Controls：中文可访问名（放大/缩小/适应画布/切换交互）', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('ctrl');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ctrl', 'rf controls zh aria');
      await openRelationFromEmpty(page);
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible();

      await expect(page.getByRole('button', { name: '放大' })).toBeVisible();
      await expect(page.getByRole('button', { name: '缩小' })).toBeVisible();
      await expect(page.getByRole('button', { name: '适应画布' })).toBeVisible();
      await expect(page.getByRole('button', { name: '切换交互' })).toBeVisible();
      await expect(page.getByLabel('zoom in')).toHaveCount(0);
      await expect(page.getByLabel('zoom out')).toHaveCount(0);
      await expect(page.getByLabel('fit view')).toHaveCount(0);
      await expect(page.getByLabel('toggle interactivity')).toHaveCount(0);
      // ADR-0016：Controls 密度（22px）+ surface 底；适应画布为主操作
      const ctrl = await page.locator('.react-flow__controls').evaluate((el) => {
        const cs = getComputedStyle(el);
        const btn = el.querySelector('.react-flow__controls-button');
        const fit = el.querySelector('.erd-controls-primary');
        const bs = btn ? getComputedStyle(btn) : null;
        const fs = fit ? getComputedStyle(fit) : null;
        const svg = fit?.querySelector('svg');
        const svgMax = svg ? parseFloat(getComputedStyle(svg).maxWidth) : NaN;
        return {
          bg: cs.backgroundColor,
          btnH: bs ? parseFloat(bs.height) : NaN,
          btnW: bs ? parseFloat(bs.width) : NaN,
          fitColor: fs?.color ?? '',
          fitBg: fs?.backgroundColor ?? '',
          svgMax,
        };
      });
      expect(ctrl.bg, `Controls 底色不得为 RF 白：${ctrl.bg}`).not.toBe(
        'rgb(254, 254, 254)',
      );
      expect(ctrl.bg).toBe('rgb(255, 255, 255)'); // --erd-surface
      expect(ctrl.btnH, `Controls 按钮高应 ≤22，得 ${ctrl.btnH}`).toBeLessThanOrEqual(
        22,
      );
      expect(ctrl.btnH).toBeGreaterThanOrEqual(18);
      expect(ctrl.btnW).toBeLessThanOrEqual(22);
      // 适应画布：ink900 + muted 底（扫读主操作）
      expect(ctrl.fitColor).toBe('rgb(11, 28, 44)'); // --erd-ink-900
      expect(ctrl.fitBg).toBe('rgb(243, 245, 247)'); // --erd-surface-muted
      expect(ctrl.svgMax, `Controls 图标应 ≥12，得 ${ctrl.svgMax}`).toBeGreaterThanOrEqual(
        12,
      );
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-controls-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('MiniMap：中文可访问名（画布缩略图）', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('mmap');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'mmap', 'rf minimap zh aria');
      await openRelationFromEmpty(page);
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible();
      // 空态故意隐藏 MiniMap；先建表再验 aria + sunk 底色
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await expect(page.getByRole('img', { name: '画布缩略图' })).toBeVisible();
      await expect(page.getByLabel('React Flow mini map')).toHaveCount(0);
      await expect(page.getByText('React Flow mini map')).toHaveCount(0);
      // ADR-0016：MiniMap 与 sunk 画布同底（背景在 panel）+ 紧凑尺寸
      const mini = await page.locator('.react-flow__minimap').evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          bg: cs.backgroundColor,
          w: parseFloat(cs.width),
          h: parseFloat(cs.height),
        };
      });
      expect(mini.bg).toBe('rgb(250, 251, 252)');
      expect(mini.w, `MiniMap 宽应 ≤128，得 ${mini.w}`).toBeLessThanOrEqual(128);
      expect(mini.h, `MiniMap 高应 ≤96，得 ${mini.h}`).toBeLessThanOrEqual(96);
      expect(mini.w).toBeGreaterThanOrEqual(100);
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-minimap-sunk.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('工具栏：撤销/重做/自动布局与对齐可访问名', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('tbar');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'tbar', 'canvas toolbar aria');
      await openRelationFromEmpty(page);
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible();

      await expect(page.getByRole('button', { name: '新建表' })).toBeVisible();
      await expect(page.getByTestId('canvas-create-table')).toBeVisible();
      await expect(page.getByRole('button', { name: '撤销' })).toBeVisible();
      await expect(page.getByRole('button', { name: '重做' })).toBeVisible();
      await expect(page.getByRole('button', { name: '自动布局' })).toBeVisible();

      // ADR-0016：单块 chrome + 自动布局主操作层次；禁散粒描边钮
      const barMetrics = await page
        .locator('.erd-canvas-toolbar')
        .evaluate((bar) => {
          const cs = getComputedStyle(bar);
          const primary = bar.querySelector('.erd-canvas-tool--primary');
          const undo = Array.from(bar.querySelectorAll('.erd-canvas-tool')).find(
            (el) => el.getAttribute('aria-label') === '撤销',
          );
          const ps = primary ? getComputedStyle(primary) : null;
          const us = undo ? getComputedStyle(undo) : null;
          return {
            barBorder: cs.borderTopWidth,
            barBg: cs.backgroundColor,
            primaryFw: ps ? parseInt(ps.fontWeight, 10) : NaN,
            primaryColor: ps?.color ?? '',
            undoFw: us ? parseInt(us.fontWeight, 10) : NaN,
            undoColor: us?.color ?? '',
            undoH: us ? parseFloat(us.height) : NaN,
            undoPadY: us
              ? parseFloat(us.paddingTop) + parseFloat(us.paddingBottom)
              : NaN,
            undoFont: us ? parseFloat(us.fontSize) : NaN,
            undoBorder: us ? us.borderTopWidth : '',
          };
        });
      expect(barMetrics.barBg).toBe('rgb(255, 255, 255)'); // surface chrome
      expect(parseFloat(barMetrics.barBorder)).toBeGreaterThanOrEqual(1);
      expect(
        barMetrics.undoH,
        `工具栏按钮高应 ≤22，得 ${barMetrics.undoH}`,
      ).toBeLessThanOrEqual(22);
      expect(barMetrics.undoH).toBeGreaterThanOrEqual(18);
      expect(barMetrics.undoPadY).toBeLessThanOrEqual(4);
      expect(barMetrics.undoFont).toBeLessThanOrEqual(11);
      expect(barMetrics.undoBorder).toBe('0px'); // 禁散粒描边
      expect(barMetrics.primaryFw).toBeGreaterThanOrEqual(600);
      expect(barMetrics.primaryColor).toBe('rgb(11, 28, 44)'); // ink900
      expect(barMetrics.undoFw).toBeLessThan(600);
      expect(barMetrics.undoColor).toBe('rgb(68, 82, 95)'); // ink600

      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();

      await rfNode(page, 'T_TABLE_1').click();
      await rfNode(page, 'T_ORDER').click({ modifiers: ['Shift'] });
      await expect(page.locator('.react-flow__node.selected')).toHaveCount(2);
      await expect(page.getByRole('group', { name: '对齐' })).toBeVisible();
      await expect(page.getByRole('button', { name: '左对齐' })).toBeVisible();
      await expect(page.getByRole('button', { name: '水平居中' })).toBeVisible();
      await expect(page.getByRole('button', { name: '右对齐' })).toBeVisible();
      await expect(page.getByRole('button', { name: '顶对齐' })).toBeVisible();
      await expect(page.getByRole('button', { name: '垂直居中' })).toBeVisible();
      await expect(page.getByRole('button', { name: '底对齐' })).toBeVisible();

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-canvas-toolbar-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  // ADR-0016 建模回路：非空画布不必再绕左树/Cmd+K 建第二张表
  test('工具栏新建表：非空画布一键上图', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('newtbl');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'newtbl', 'toolbar create table');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.locator('.erd-table-node')).toHaveCount(1);

      await page.getByTestId('canvas-create-table').click();
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('.erd-table-node')).toHaveCount(2);
      await expectToast(page, '表添加成功');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  // ADR-0016 建模回路：连线失败不得静默（重复关联 / 非法锚点）
  test('连线失败反馈：重复关联与非法锚点有 toast', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('connfb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'connfb', 'connect fail feedback');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();
      await addFieldInline(page, 'T_ORDER', 'T1_ID', 'IdOrKey');

      // 非法：拖到目标表体（未对准接入点）→ 可行动 toast；边不增加
      await page.getByRole('button', { name: '适应画布' }).click();
      await page.waitForTimeout(500);
      const orderNode = rfNode(page, 'T_ORDER');
      const t1Node = rfNode(page, 'T_TABLE_1');
      await orderNode.hover();
      const src = orderNode.locator('[data-field="T1_ID"]').locator('[data-handleid="T1_ID-src-r"]');
      await expect(src).toBeVisible();
      const header = t1Node.locator('.erd-table-header');
      await expect(header).toBeVisible();
      await src.dragTo(header, { force: true, steps: 12 });
      await expectToast(page, /接入点|空心圆/);
      await expect(page.locator('.react-flow__edge')).toHaveCount(0);

      // 合法连线一次
      await connectFields(page, 'T_ORDER', 'T1_ID', 'T_TABLE_1', 'id');
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);

      // 重复同一对：边不变 + 明确 toast
      await page.getByRole('button', { name: '适应画布' }).click();
      await page.waitForTimeout(400);
      await orderNode.hover();
      const src2 = orderNode.locator('[data-field="T1_ID"]').locator('[data-handleid="T1_ID-src-r"]');
      await t1Node.hover();
      const tgt = t1Node.locator('[data-field="id"]').locator('[data-handleid="id-tgt-l"]');
      await src2.dragTo(tgt, { force: true, steps: 12 });
      await expectToast(page, /关联已存在|无需重复连线/);
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('字段 ✎ 可改名；空名有 toast', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fedit');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fedit', 'field edit affordance');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      const nameRow = node.locator('[data-field="NAME"]');
      await expect(nameRow).toBeVisible();

      // hover 露 ✎；DOM click 避开 RF Handle 吞指针（对齐表头改名）
      await nameRow.hover();
      const editBtn = nameRow.getByRole('button', { name: '编辑字段' });
      await expect(editBtn).toBeVisible();
      await editBtn.evaluate((el: HTMLElement) => el.click());
      const nameInput = node.getByRole('textbox', { name: '字段名' });
      await expect(nameInput).toBeVisible();
      await nameInput.fill('NICK');
      await nameInput.press('Enter');
      await expect(node.locator('[data-field="NICK"]')).toBeVisible();
      await expect(node.locator('[data-field="NAME"]')).toHaveCount(0);
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      // 空名不得静默丢改动
      const nickRow = node.locator('[data-field="NICK"]');
      await nickRow.hover();
      await nickRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      const emptyInput = node.getByRole('textbox', { name: '字段名' });
      await emptyInput.fill('');
      await emptyInput.press('Enter');
      await expectToast(page, '字段名不能为空');
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await emptyInput.fill('NICK');
      await emptyInput.press('Escape');
      await expect(node.locator('[data-field="NICK"]')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('字段 Tab 跳下一行；末行新建；类型即时 save-status', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('ftab');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ftab', 'field tab type save');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      await addFieldInline(page, 'T_TABLE_1', 'AGE');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      // Tab：字段名 → 中文名 → 类型 → 默认值 → 提交并进下一字段
      const nameRow = node.locator('[data-field="NAME"]');
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      const nameInput = node.getByRole('textbox', { name: '字段名' });
      await expect(nameInput).toHaveValue('NAME');
      await nameInput.press('Tab');
      await expect(node.getByRole('textbox', { name: '中文名' })).toBeFocused();
      await node.getByRole('textbox', { name: '中文名' }).press('Tab');
      await expect(node.getByRole('combobox', { name: '字段类型' })).toBeFocused();
      await node.getByRole('combobox', { name: '字段类型' }).press('Tab');
      await expect(node.getByRole('textbox', { name: '默认值' })).toBeFocused();
      await node.getByRole('textbox', { name: '默认值' }).press('Tab');
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await expect(node.getByRole('textbox', { name: '字段名' })).toHaveValue('AGE');

      // 空名 toast 仍保留（字段名空 + Tab 同路径）
      await node.getByRole('textbox', { name: '字段名' }).fill('');
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await expectToast(page, '字段名不能为空');
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await node.getByRole('textbox', { name: '字段名' }).fill('AGE');

      // 末行：名→中文名→类型→默认值 Tab → 新建行；填名后再走完 Tab 落盘
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await node.getByRole('textbox', { name: '中文名' }).press('Tab');
      await node.getByRole('combobox', { name: '字段类型' }).press('Tab');
      await node.getByRole('textbox', { name: '默认值' }).press('Tab');
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await expect(node.getByRole('textbox', { name: '字段名' })).toHaveValue('');
      await node.getByRole('textbox', { name: '字段名' }).fill('CODE');
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await node.getByRole('textbox', { name: '中文名' }).press('Tab');
      await node.getByRole('combobox', { name: '字段类型' }).press('Tab');
      await node.getByRole('textbox', { name: '默认值' }).press('Tab');
      await expect(node.locator('[data-field="CODE"]')).toBeVisible();
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await expect(node.getByRole('textbox', { name: '字段名' })).toHaveValue('');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');

      // 仅改类型：不必 Enter/blur，顶栏 save-status 即时回到已保存
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('textbox', { name: '字段名' })).toBeVisible();
      await node.getByRole('combobox', { name: '字段类型' }).selectOption('Integer');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');
      await expect(node.locator('[data-field="NAME"] .erd-field-type')).toHaveText('Integer');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('画布打开索引签：直达表设计索引；无死 affordance', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('idxnav');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'idxnav', 'canvas open index');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const openIndex = node.getByTestId('canvas-open-index');
      await expect(openIndex).toBeVisible();
      await expect(openIndex).toHaveAttribute('aria-label', '打开索引');
      // pointer 易被 RF 吞；DOM click 可靠
      await openIndex.evaluate((el: HTMLElement) => el.click());

      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });
      await expect(designer.getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('table-index-edit')).toBeVisible();

      // 可切回字段；再经画布入口仍落索引（非死 affordance / 非粘滞）
      await designer.getByRole('tab', { name: '字段' }).click();
      await expect(designer.getByRole('tab', { name: '字段' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
      await rfNode(page, 'T_TABLE_1')
        .getByTestId('canvas-open-index')
        .evaluate((el: HTMLElement) => el.click());
      await expect(page.getByTestId('table-design').getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('索引签空态 CTA：画布→索引→添加第一个索引', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('idxempty');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'idxempty', 'index empty cta');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await node.getByTestId('canvas-open-index').evaluate((el: HTMLElement) => el.click());
      const designer = page.getByTestId('table-design');
      await expect(designer.getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      const indexEdit = page.getByTestId('table-index-edit');
      await expect(indexEdit.getByText('还没有索引')).toBeVisible();
      await expect(indexEdit.getByRole('button', { name: '添加第一个索引' })).toBeVisible();
      await indexEdit.getByRole('button', { name: '添加第一个索引' }).click();

      await expectToast(page, '索引更新成功');
      await expect(indexEdit.getByTestId('index-empty-add')).toHaveCount(0);
      await expect(indexEdit.getByText('索引名*')).toBeVisible();
      await expect(indexEdit.getByText('T_TABLE_1_IDX1')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('索引签再加一行 CTA：首条后表内引导；无死 affordance', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('idxadd');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'idxadd', 'index add row cta');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await node.getByTestId('canvas-open-index').evaluate((el: HTMLElement) => el.click());
      const indexEdit = page.getByTestId('table-index-edit');
      await expect(indexEdit.getByRole('button', { name: '添加第一个索引' })).toBeVisible();
      await indexEdit.getByRole('button', { name: '添加第一个索引' }).click();
      await expectToast(page, '索引更新成功');
      await expect(indexEdit.getByText('T_TABLE_1_IDX1')).toBeVisible();

      const addRow = indexEdit.getByRole('button', { name: '再添加一条索引' });
      await expect(addRow).toBeVisible();
      await expect(addRow).toHaveAttribute('aria-label', '再添加一条索引');
      await addRow.click();

      await expectToast(page, '索引更新成功');
      await expect(indexEdit.getByText('T_TABLE_1_IDX2')).toBeVisible();
      await expect(indexEdit.getByTestId('index-add-row')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('索引签删除二次确认：取消保留；确认后回空态', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('idxdel');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'idxdel', 'index delete confirm');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await node.getByTestId('canvas-open-index').evaluate((el: HTMLElement) => el.click());
      const indexEdit = page.getByTestId('table-index-edit');
      await indexEdit.getByRole('button', { name: '添加第一个索引' }).click();
      await expectToast(page, '索引更新成功');
      await expect(indexEdit.getByRole('cell', { name: 'T_TABLE_1_IDX1' })).toBeVisible();

      const delBtn = indexEdit.getByRole('button', { name: '删除索引 T_TABLE_1_IDX1' });
      await expect(delBtn).toBeVisible();
      await expect(delBtn).toHaveAttribute('aria-label', '删除索引 T_TABLE_1_IDX1');
      await delBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /不可逆/ });
      await expect(dialog.getByText(/确定删除索引/).filter({ visible: true })).toBeVisible();
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      await dialog.getByRole('button', { name: /取\s*消/ }).click();
      await expect(indexEdit.getByRole('cell', { name: 'T_TABLE_1_IDX1' })).toBeVisible();
      await expect(indexEdit.getByTestId('index-empty-add')).toHaveCount(0);

      await indexEdit.getByRole('button', { name: '删除索引 T_TABLE_1_IDX1' }).click();
      const dialogOk = page.getByRole('dialog').filter({ hasText: /不可逆/ });
      await dialogOk.getByRole('button', { name: /删\s*除/ }).click();

      await expectToast(page, '索引更新成功');
      await expect(indexEdit.getByText('还没有索引')).toBeVisible();
      await expect(indexEdit.getByRole('button', { name: '添加第一个索引' })).toBeVisible();
      await expect(indexEdit.getByTestId('index-delete-list')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('字段级 unique 说明：索引唯一 CTA → 画布 UK；字段签跳索引', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fielduk');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fielduk', 'field unique clarity');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      // 字段签：无 unique 列 → 引导去索引
      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());
      const designer = page.getByTestId('table-design');
      await expect(designer.getByRole('tab', { name: '字段' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      const fieldHint = page.getByTestId('field-unique-hint');
      await expect(fieldHint).toBeVisible();
      await expect(fieldHint).toContainText(/没有独立的「唯一」列/);
      await page.getByRole('button', { name: '去索引签设置唯一' }).click();
      await expect(designer.getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      const indexEdit = page.getByTestId('table-index-edit');
      await expect(indexEdit.getByTestId('index-unique-hint')).toBeVisible();
      await expect(indexEdit.getByRole('button', { name: '添加唯一索引' })).toBeVisible();
      await indexEdit.getByRole('button', { name: '添加唯一索引' }).click();
      await expectToast(page, '索引更新成功');
      await expect(indexEdit.getByRole('cell', { name: 'T_TABLE_1_IDX1' })).toBeVisible();
      await expect(indexEdit.getByTestId('index-unique-hint')).toContainText(/UNIQUE/);

      // 画布字段行出现 UK（只读徽章；编辑仍在索引签）
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
      const pkRow = rfNode(page, 'T_TABLE_1').locator('.erd-field-row').first();
      await expect(pkRow.getByTestId('field-uk-badge')).toBeVisible();
      await expect(pkRow.getByLabel('唯一')).toHaveText('UK');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('JExcel 工具栏删除二次确认：取消保留；确认后行消失', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('jxdel');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'jxdel', 'jexcel toolbar delete');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());

      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });
      const nameCell = fieldEdit.getByRole('cell', { name: 'NAME' });
      await expect(nameCell).toBeVisible();
      await nameCell.click();

      const removeBtn = fieldEdit.getByRole('button', { name: '删除选中行' });
      await expect(removeBtn).toBeVisible();
      await expect(removeBtn).toHaveAttribute('aria-label', '删除选中行');
      await removeBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /不可逆/ });
      await expect(dialog.getByText(/确定删除选定行/).filter({ visible: true })).toBeVisible();
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      await dialog.getByRole('button', { name: /取\s*消/ }).click();
      await expect(fieldEdit.getByRole('cell', { name: 'NAME' })).toBeVisible();

      await fieldEdit.getByRole('cell', { name: 'NAME' }).click();
      await fieldEdit.getByRole('button', { name: '删除选中行' }).click();
      const dialogOk = page.getByRole('dialog').filter({ hasText: /不可逆/ });
      await dialogOk.getByRole('button', { name: /删\s*除/ }).click();

      await expect(fieldEdit.getByRole('cell', { name: 'NAME' })).toHaveCount(0, {
        timeout: 10_000,
      });
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
      await expect(rfNode(page, 'T_TABLE_1').locator('[data-field="NAME"]')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('表设计字段签：工具栏 Tab 可达且 Enter 增行；网格无 trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('jxtab');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'jxtab', 'jexcel tab focus');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());

      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });
      await expect(fieldEdit.getByRole('cell', { name: 'NAME' })).toBeVisible();

      const toolbarNames = [
        '撤销',
        '重做',
        '末尾增加一行',
        '删除选中行',
        '在此前插入行',
        '在此后插入行',
        '快捷操作',
      ] as const;
      for (const name of toolbarNames) {
        await expect(fieldEdit.getByRole('button', { name })).toBeVisible();
      }

      // Tab 序：hint CTA → 撤销 → … → 末尾增加一行 → 网格（禁跳过工具栏）
      await fieldEdit.getByTestId('field-goto-index').focus();
      await page.keyboard.press('Tab');
      await expect(fieldEdit.getByRole('button', { name: '撤销' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(fieldEdit.getByRole('button', { name: '重做' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(fieldEdit.getByRole('button', { name: '末尾增加一行' })).toBeFocused();

      // Enter 激活增行（修 `<i tabindex>` 死 affordance）
      const rowsBefore = await fieldEdit.getByRole('row').count();
      await page.keyboard.press('Enter');
      await expect
        .poll(async () => fieldEdit.getByRole('row').count(), { timeout: 5_000 })
        .toBeGreaterThan(rowsBefore);

      // 网格可 Tab 到达；Shift+Tab 退回工具栏（无 trap）
      const grid = fieldEdit.getByTestId('jexcel-grid');
      await grid.focus();
      await expect(grid).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(fieldEdit.getByRole('button', { name: '快捷操作' })).toBeFocused();

      // Enter 进入选区后 Tab 右移选中格（原生 right；非 trap）
      await grid.focus();
      await page.keyboard.press('Enter');
      await fieldEdit.getByRole('cell', { name: 'NAME' }).click();
      await page.keyboard.press('Tab');
      await expect(fieldEdit.locator('td.highlight').first()).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('设计器 Skip：首项 Tab 达跳过链；落到模型树/主工作区无 trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('skip');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'skip', 'designer skip focus');
      await openRelationFromEmpty(page);
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('erd-skip-nav')).toBeAttached();
      await expect(page.getByTestId('erd-skip-tree')).toBeAttached();
      await expect(page.getByTestId('erd-design-tree')).toBeAttached();
      await expect(page.getByTestId('erd-design-workspace')).toBeAttached();

      // 建模操作会把「顺序焦点起点」留在画布；点左上角复位后再 Tab
      await page.mouse.click(2, 2);
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('erd-skip-tree')).toBeFocused({ timeout: 5_000 });
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('erd-design-tree')).toBeFocused();

      // 树地标 → Tab 进搜索（无 trap）
      await page.keyboard.press('Tab');
      await expect(page.getByPlaceholder('搜索表名')).toBeFocused();

      // 跳到主工作区（签/画布）
      await page.mouse.click(2, 2);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('erd-skip-workspace')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('erd-design-workspace')).toBeFocused();

      // 工作区 → Tab 离开地标（无 trap）
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('erd-design-workspace')).not.toBeFocused();
      const afterWs = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ||
          (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') ||
          (document.activeElement as HTMLElement | null)?.tagName ||
          '',
      );
      // 落点应离开工作区地标（下一 Tab 可能是签/画布控件；不要求特定控件）
      expect(afterWs).not.toBe('erd-design-workspace');
      expect(afterWs.length).toBeGreaterThan(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  // ADR-0016：画布 chrome Tab 序 — Controls → 工具栏（MiniMap 装饰出序）
  test('画布 chrome Tab 序：Controls→工具栏；MiniMap 不出序；focus-visible', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('chrtab');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'chrtab', 'canvas chrome tab order');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByRole('img', { name: '画布缩略图' })).toBeVisible();

      // d3-zoom 默认 tabindex=0；ErdMiniMap 强制 -1（仍保留角色名）
      await expect(page.locator('.react-flow__minimap svg')).toHaveAttribute('tabindex', '-1');

      const zoomIn = page.getByRole('button', { name: '放大' });
      await zoomIn.focus();
      await expect(zoomIn).toBeFocused();

      // Controls 四钮连续 Tab，且不落入 MiniMap
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: '缩小' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: '适应画布' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: '切换交互' })).toBeFocused();
      await page.keyboard.press('Tab');
      const afterControls = await page.evaluate(() => {
        const ae = document.activeElement as HTMLElement | null;
        if (!ae) return { inMinimap: false, inToolbar: false, tag: '' };
        return {
          inMinimap: !!ae.closest('.react-flow__minimap'),
          inToolbar: !!ae.closest('.erd-canvas-toolbar'),
          tag: ae.tagName,
        };
      });
      expect(afterControls.inMinimap, 'Tab 不得落入 MiniMap').toBe(false);
      expect(afterControls.inToolbar, 'Controls 后应进画布工具栏').toBe(true);

      // 工具栏内再 Tab 可达「新建表」（无 trap）
      const createBtn = page.getByTestId('canvas-create-table');
      let steps = 0;
      while (steps < 12) {
        const focused = await createBtn.evaluate((el) => el === document.activeElement);
        if (focused) break;
        await page.keyboard.press('Tab');
        steps += 1;
      }
      await expect(createBtn).toBeFocused();

      // Shift+Tab 能退回 Controls（无 trap）；且中途不进 MiniMap
      await page.getByRole('button', { name: '放大' }).focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(page.getByRole('button', { name: '切换交互' })).toBeFocused();
      const mid = await page.evaluate(
        () => !!document.activeElement?.closest('.react-flow__minimap'),
      );
      expect(mid).toBe(false);

      // Controls 键盘焦点环可见（brand）：须经 Tab 触发 :focus-visible
      await page.getByRole('button', { name: '缩小' }).focus();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: '适应画布' })).toBeFocused();
      const ring = await page.getByRole('button', { name: '适应画布' }).evaluate((el) => {
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
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('画布字段浏览器 Tab 环：选中表穿字段无 trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('ftbrowse');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ftbrowse', 'field browser tab ring');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await page.getByTestId('canvas-create-table').click();
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      await addFieldInline(page, 'T_TABLE_1', 'AGE');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const t1 = rfNode(page, 'T_TABLE_1');
      const t2 = rfNode(page, 'T_TABLE_2');
      // 点字段行选中表（勿点表头：已选中时会进改名）
      await t1.locator('[data-field="NAME"]').click();
      await expect(t1).toHaveClass(/selected/);
      await expect(t1.getByLabel('字段 NAME')).toHaveAttribute('tabindex', '0');
      await expect(t2.locator('[data-field]').first()).toHaveAttribute('tabindex', '-1');
      await expect(t2.getByTestId('canvas-add-field')).toHaveAttribute('tabindex', '-1');
      await expect(t2.getByTestId('canvas-open-field')).toHaveAttribute('tabindex', '-1');

      // Tab：字段→字段（跳过 PK/✎/×）；Shift+Tab 回退；再出环到添加字段（无 trap）
      await t1.getByLabel('字段 NAME').focus();
      await expect(t1.getByLabel('字段 NAME')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(t1.getByLabel('字段 AGE')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(t1.getByLabel('字段 NAME')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(t1.getByLabel('字段 AGE')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(t1.getByTestId('canvas-add-field')).toBeFocused();

      // 出环：再 Tab 到表设计入口后应能离开节点
      await page.keyboard.press('Tab');
      await expect(t1.getByTestId('canvas-open-field')).toBeFocused();
      await page.keyboard.press('Tab'); // 索引
      await page.keyboard.press('Tab'); // 元数据
      await page.keyboard.press('Tab');
      const leftNode = await page.evaluate(() => {
        const ae = document.activeElement as HTMLElement | null;
        if (!ae) return true;
        return !ae.closest('.react-flow__node.selected');
      });
      expect(leftNode).toBe(true);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('表设计字段签：半成品行不静默丢字段；Esc 停在网格', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('jxhalf');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'jxhalf', 'jexcel incomplete save');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());

      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });
      await expect(fieldEdit.getByRole('cell', { name: 'NAME' })).toBeVisible();

      // 键盘：选中英文名 → Tab 到类型 → Delete 清空 → Enter 确认落盘意图
      await fieldEdit.getByRole('cell', { name: 'NAME' }).click();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Delete');
      await page.keyboard.press('Enter');

      await expectToast(page, /有行未填完必填项|未保存以免丢数据/);

      // Esc：取消格编辑且签页仍在（勿冒泡关签）
      await fieldEdit.getByRole('cell', { name: 'NAME' }).dblclick();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('table-field-edit')).toBeVisible();
      await expect(page.getByTestId('table-design').getByRole('tab', { name: '字段' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      // 切回画布：NAME 仍在（禁半成品过滤写回把字段静默删掉）
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
      await expect(rfNode(page, 'T_TABLE_1').locator('[data-field="NAME"]')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('表设计索引签：半成品行不静默丢索引；Esc 停在网格', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('idxhalf');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'idxhalf', 'index incomplete save');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await node.getByTestId('canvas-open-index').evaluate((el: HTMLElement) => el.click());
      const indexEdit = page.getByTestId('table-index-edit');
      await indexEdit.getByRole('button', { name: '添加第一个索引' }).click();
      await expectToast(page, '索引更新成功');
      await expect(indexEdit.getByRole('cell', { name: 'T_TABLE_1_IDX1' })).toBeVisible();

      // 键盘：索引名 → Tab 到字段 → Delete 清空 → Enter（半成品不得静默丢索引）
      await indexEdit.getByRole('cell', { name: 'T_TABLE_1_IDX1' }).click();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Delete');
      await page.keyboard.press('Enter');

      await expectToast(page, /有行未填完必填项|未保存以免丢数据/);

      // Esc：停在索引签（与字段签同形）
      await indexEdit.getByRole('cell', { name: 'T_TABLE_1_IDX1' }).dblclick();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('table-index-edit')).toBeVisible();
      await expect(page.getByTestId('table-design').getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      // store 未冲掉：删除入口仍在；切出再入仍见索引名
      await expect(
        indexEdit.getByRole('button', { name: '删除索引 T_TABLE_1_IDX1' }),
      ).toBeVisible();
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
      await rfNode(page, 'T_TABLE_1')
        .getByTestId('canvas-open-index')
        .evaluate((el: HTMLElement) => el.click());
      const again = page.getByTestId('table-index-edit');
      await expect(again.getByRole('cell', { name: 'T_TABLE_1_IDX1' })).toBeVisible();
      await expect(again.getByTestId('index-empty-add')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('画布打开字段签：直达表设计字段；无死 affordance', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fldnav');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fldnav', 'canvas open field');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const openField = node.getByTestId('canvas-open-field');
      await expect(openField).toBeVisible();
      await expect(openField).toHaveAttribute('aria-label', '打开字段');
      await openField.evaluate((el: HTMLElement) => el.click());

      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });
      await expect(designer.getByRole('tab', { name: '字段' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('table-field-edit')).toBeVisible();

      // 切到索引后再经画布「字段」仍落字段（对称；非粘滞）
      await designer.getByRole('tab', { name: '索引' }).click();
      await expect(designer.getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
      await rfNode(page, 'T_TABLE_1')
        .getByTestId('canvas-open-field')
        .evaluate((el: HTMLElement) => el.click());
      await expect(page.getByTestId('table-design').getByRole('tab', { name: '字段' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('table-field-edit')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('画布打开元数据应用签：直达表设计元数据；无死 affordance', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('codenav');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'codenav', 'canvas open code');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const openCode = node.getByTestId('canvas-open-code');
      await expect(openCode).toBeVisible();
      await expect(openCode).toHaveAttribute('aria-label', '打开元数据应用');
      await openCode.evaluate((el: HTMLElement) => el.click());

      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });
      await expect(designer.getByRole('tab', { name: '元数据应用' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('table-code-edit')).toBeVisible();

      // 切到字段后再经画布「元数据」仍落元数据应用（非粘滞；exact——CodeTab 内有「添加字段」等子签）
      await designer.getByRole('tab', { name: '字段', exact: true }).click();
      await expect(designer.getByRole('tab', { name: '字段', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
      await rfNode(page, 'T_TABLE_1')
        .getByTestId('canvas-open-code')
        .evaluate((el: HTMLElement) => el.click());
      await expect(
        page.getByTestId('table-design').getByRole('tab', { name: '元数据应用' }),
      ).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByTestId('table-code-edit')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('元数据应用：修改/删除字段签标签对齐模板（非错标 DROP/MODIFY）', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('metaddl');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'metaddl', 'meta ddl tab labels');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await openVersionPage(page);
      await saveVersion(page);
      await gotoDesignModel(page);
      await openRelationCanvas(page, '商城');
      const nodeAfter = rfNode(page, 'T_TABLE_1');
      await expect(nodeAfter).toBeVisible({ timeout: 15_000 });

      // 基线后改类型 → 差异为 update（MODIFY），不得挂在「删除字段」
      const nameRow = nodeAfter.locator('[data-field="NAME"]');
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(nodeAfter.getByRole('textbox', { name: '字段名' })).toHaveValue('NAME');
      await nodeAfter.getByRole('combobox', { name: '字段类型' }).selectOption('Integer');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      if (await nodeAfter.locator('.erd-field-editing').count()) {
        await nodeAfter.getByRole('textbox', { name: '字段名' }).press('Enter');
        await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      }

      await nodeAfter.getByTestId('canvas-open-code').evaluate((el: HTMLElement) => el.click());
      const codePane = page.getByTestId('table-code-edit');
      await expect(codePane).toBeVisible({ timeout: 10_000 });

      await codePane.getByRole('tab', { name: '修改字段' }).click();
      await expect(
        codePane.getByTestId('meta-ddl-sql-updateFieldTemplate'),
      ).toContainText(/MODIFY/i, { timeout: 15_000 });
      await expect(
        codePane.getByTestId('meta-ddl-sql-updateFieldTemplate'),
      ).not.toContainText(/DROP/i);

      // 仅类型更新时「删除字段」不得冒出 MODIFY（回归错标）
      await codePane.getByRole('tab', { name: '删除字段' }).click();
      await expect(codePane.getByTestId('meta-ddl-sql-deleteFieldTemplate')).toHaveText(
        /^\s*$/,
      );
      await expect(
        codePane.getByTestId('meta-ddl-sql-deleteFieldTemplate'),
      ).not.toContainText(/MODIFY|DROP/i);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('字段默认值内联编辑；Tab 入 default；Escape 丢弃', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fdef');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fdef', 'field defaultValue inline');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'STATUS');
      const statusRow = node.locator('[data-field="STATUS"]');
      await statusRow.hover();
      await statusRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('textbox', { name: '字段名' })).toHaveValue('STATUS');

      // Tab：名 → 中文名 → 类型 → 默认值；Enter 落盘；浏览态可见 =DEFAULT
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await node.getByRole('textbox', { name: '中文名' }).press('Tab');
      await node.getByRole('combobox', { name: '字段类型' }).press('Tab');
      const defInput = node.getByRole('textbox', { name: '默认值' });
      await expect(defInput).toBeFocused();
      await defInput.fill("'NEW'");
      await defInput.press('Enter');
      await expect(node.locator('.erd-field-editing')).toHaveCount(0);
      await expect(statusRow.locator('.erd-field-default')).toHaveText(/\s*='NEW'/);
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      // Escape：默认值草稿不经 blur 落盘
      await statusRow.hover();
      await statusRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('textbox', { name: '默认值' })).toHaveValue("'NEW'");
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await node.getByRole('textbox', { name: '中文名' }).press('Tab');
      await node.getByRole('combobox', { name: '字段类型' }).press('Tab');
      await expect(node.getByRole('textbox', { name: '默认值' })).toBeFocused();
      await node.getByRole('textbox', { name: '默认值' }).fill('0');
      await node.getByRole('textbox', { name: '默认值' }).press('Escape');
      await expect(node.locator('.erd-field-editing')).toHaveCount(0);
      await expect(statusRow.locator('.erd-field-default')).toHaveText(/\s*='NEW'/);

      // 类型即时落盘与默认值草稿正交：改类型后 Escape 默认草稿仍丢、类型保留
      await statusRow.hover();
      await statusRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('textbox', { name: '字段名' })).toBeVisible();
      await node.getByRole('combobox', { name: '字段类型' }).selectOption('Integer');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      // selectOption 可能 blur→commit 退出编辑；浏览态已见类型即可
      if (await node.locator('.erd-field-editing').count()) {
        await node.getByRole('textbox', { name: '字段名' }).press('Tab');
        await node.getByRole('textbox', { name: '中文名' }).press('Tab');
        await node.getByRole('combobox', { name: '字段类型' }).press('Tab');
        await node.getByRole('textbox', { name: '默认值' }).fill('DRAFT');
        await node.getByRole('textbox', { name: '默认值' }).press('Escape');
      }
      await expect(statusRow.locator('.erd-field-default')).toHaveText(/\s*='NEW'/);
      await expect(statusRow.locator('.erd-field-type')).toContainText('Integer');

      // 默认值可空提交；名→中文名→类型 Tab 序仍通
      await statusRow.hover();
      await statusRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await expect(node.getByRole('textbox', { name: '中文名' })).toBeFocused();
      await node.getByRole('textbox', { name: '中文名' }).press('Tab');
      await expect(node.getByRole('combobox', { name: '字段类型' })).toBeFocused();
      await node.getByRole('combobox', { name: '字段类型' }).press('Tab');
      await node.getByRole('textbox', { name: '默认值' }).fill('');
      await node.getByRole('textbox', { name: '默认值' }).press('Enter');
      await expect(statusRow.locator('.erd-field-default')).toHaveCount(0);
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('字段中文名内联编辑；Tab 入 chnname；Escape 丢弃', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fchn');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fchn', 'field chnname inline');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      const nameRow = node.locator('[data-field="NAME"]');
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('textbox', { name: '字段名' })).toHaveValue('NAME');

      // Tab 入中文名；Enter 落盘；浏览态可见
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      const chnInput = node.getByRole('textbox', { name: '中文名' });
      await expect(chnInput).toBeFocused();
      await chnInput.fill('姓名');
      await chnInput.press('Enter');
      await expect(node.locator('.erd-field-editing')).toHaveCount(0);
      await expect(nameRow.locator('.erd-field-chnname')).toHaveText(/\s*姓名/);
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      // Escape：中文名草稿不经 blur 落盘；PK 即时落盘仍保留
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('textbox', { name: '中文名' })).toHaveValue('姓名');
      await node.getByRole('checkbox', { name: '主键' }).check();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await node.getByRole('textbox', { name: '中文名' }).fill('别名草稿');
      await node.getByRole('textbox', { name: '中文名' }).press('Escape');
      await expect(node.locator('.erd-field-editing')).toHaveCount(0);
      await expect(nameRow.locator('.erd-field-chnname')).toHaveText(/\s*姓名/);
      await expect(nameRow.getByRole('button', { name: '取消主键' })).toBeVisible();

      // 空名 toast；中文名可空提交
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await node.getByRole('textbox', { name: '字段名' }).fill('');
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await expectToast(page, '字段名不能为空');
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await node.getByRole('textbox', { name: '字段名' }).fill('NAME');
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await node.getByRole('textbox', { name: '中文名' }).fill('');
      await node.getByRole('textbox', { name: '中文名' }).press('Enter');
      await expect(nameRow.locator('.erd-field-chnname')).toHaveCount(0);
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('编辑态 PK 勾选即时 save-status；空名 toast 保留', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fpk');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fpk', 'edit pk save-status');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      const nameRow = node.locator('[data-field="NAME"]');
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('textbox', { name: '字段名' })).toHaveValue('NAME');

      // 编辑态勾 PK：立刻落盘，不必 Enter/blur
      const pkBox = node.getByRole('checkbox', { name: '主键' });
      await expect(pkBox).not.toBeChecked();
      await pkBox.check();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');
      await expect(nameRow.getByRole('button', { name: '取消主键' })).toBeVisible();

      // 再进编辑取消 PK；空名 toast 路径不变
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await node.getByRole('checkbox', { name: '主键' }).uncheck();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await node.getByRole('textbox', { name: '字段名' }).fill('');
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await expectToast(page, '字段名不能为空');
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await node.getByRole('textbox', { name: '字段名' }).fill('NAME');
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');
      await nameRow.hover();
      await expect(nameRow.getByRole('button', { name: '设为主键' })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('编辑态非空勾选即时 save-status；空名 toast 保留', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fnn');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fnn', 'edit notNull save-status');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      const nameRow = node.locator('[data-field="NAME"]');
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('textbox', { name: '字段名' })).toHaveValue('NAME');

      const nnBox = node.getByRole('checkbox', { name: '非空' });
      await expect(nnBox).not.toBeChecked();
      await expect(nnBox).toBeEnabled();
      await nnBox.check();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');

      // 再进编辑：非空仍勾选；取消后即时落盘；空名 toast 路径不变
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('checkbox', { name: '非空' })).toBeChecked();
      await node.getByRole('checkbox', { name: '非空' }).uncheck();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await node.getByRole('textbox', { name: '字段名' }).fill('');
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await expectToast(page, '字段名不能为空');
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await node.getByRole('textbox', { name: '字段名' }).fill('NAME');
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');

      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('checkbox', { name: '非空' })).not.toBeChecked();
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('编辑态自增勾选即时 save-status；空名 toast 保留', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fai');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fai', 'edit autoIncrement save-status');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      const nameRow = node.locator('[data-field="NAME"]');
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('textbox', { name: '字段名' })).toHaveValue('NAME');

      const aiBox = node.getByRole('checkbox', { name: '自增' });
      await expect(aiBox).not.toBeChecked();
      await aiBox.check();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');

      // 再进编辑：自增仍勾选；取消后即时落盘；空名 toast 路径不变
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('checkbox', { name: '自增' })).toBeChecked();
      await node.getByRole('checkbox', { name: '自增' }).uncheck();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await node.getByRole('textbox', { name: '字段名' }).fill('');
      await node.getByRole('textbox', { name: '字段名' }).press('Tab');
      await expectToast(page, '字段名不能为空');
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await node.getByRole('textbox', { name: '字段名' }).fill('NAME');
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');

      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('checkbox', { name: '自增' })).not.toBeChecked();
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('编辑态 Escape 取消改名；不经 blur 落盘', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fesc');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fesc', 'field escape cancel');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      const nameRow = node.locator('[data-field="NAME"]');
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      const nameInput = node.getByRole('textbox', { name: '字段名' });
      await expect(nameInput).toHaveValue('NAME');
      await nameInput.fill('OTHER');
      await nameInput.press('Escape');
      await expect(node.locator('.erd-field-editing')).toHaveCount(0);
      await expect(node.locator('[data-field="NAME"]')).toBeVisible();
      await expect(node.locator('[data-field="OTHER"]')).toHaveCount(0);

      // 新建行 Escape：不得经 blur 落盘
      await node.getByTestId('canvas-add-field').click();
      await expect(node.getByRole('textbox', { name: '字段名' })).toBeVisible();
      await node.getByRole('textbox', { name: '字段名' }).fill('DRAFT');
      await node.getByRole('textbox', { name: '字段名' }).press('Escape');
      await expect(node.locator('.erd-field-editing')).toHaveCount(0);
      await expect(node.locator('[data-field="DRAFT"]')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('编辑态隐藏即时 save-status；toast + 表底恢复显示', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fhide');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fhide', 'edit relationNoShow hide');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      const nameRow = node.locator('[data-field="NAME"]');
      await nameRow.hover();
      await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      await expect(node.getByRole('textbox', { name: '字段名' })).toHaveValue('NAME');

      // 勾选后行立刻卸下；勿用 .check()（会等 checked，而控件已卸载且始终受控 false）
      await node.getByRole('checkbox', { name: '在关系图中隐藏' }).evaluate((el: HTMLElement) => el.click());
      await expectToast(page, '已在关系图中隐藏「NAME」');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await expect(node.locator('[data-field="NAME"]')).toHaveCount(0);
      // 默认字段可能已有若干 relationNoShow；只断言 NAME 进表底列表并可恢复
      await expect(node.getByTestId('field-hidden-toggle')).toBeVisible();
      await expect(node.getByRole('button', { name: /已隐藏 \d+ 个字段/ })).toBeVisible();
      await expect(node.getByTestId('field-hidden-NAME')).toBeVisible();
      await node.getByRole('button', { name: '在关系图中显示 NAME' }).evaluate((el: HTMLElement) => el.click());
      await expectToast(page, '已在关系图中显示「NAME」');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await expect(node.locator('[data-field="NAME"]')).toBeVisible();
      await expect(node.getByTestId('field-hidden-NAME')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('删除字段：按钮二次确认；选中 Delete/Backspace；编辑态 Backspace 不删', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('fdel');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fdel', 'field delete confirm');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      const nameRow = node.locator('[data-field="NAME"]');
      await expect(nameRow).toBeVisible();

      // 按钮：二次确认；取消不删
      await nameRow.hover();
      const delBtn = nameRow.getByRole('button', { name: '删除字段' });
      await expect(delBtn).toBeVisible();
      await delBtn.evaluate((el: HTMLElement) => el.click());
      const dialog = page.getByRole('dialog').filter({ hasText: /不可逆/ });
      await expect(dialog.getByText(/确定删除字段/).filter({ visible: true })).toBeVisible();
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      await dialog.getByRole('button', { name: /取\s*消/ }).click();
      await expect(node.locator('[data-field="NAME"]')).toBeVisible();

      // 浏览态选中 → Backspace → 确认删除
      await nameRow.click({ position: { x: 40, y: 8 } });
      await expect(nameRow).toBeFocused();
      await page.keyboard.press('Backspace');
      const dialogBs = page.getByRole('dialog').filter({ hasText: /不可逆/ });
      await expect(dialogBs.getByText(/确定删除字段/).filter({ visible: true })).toBeVisible();
      await dialogBs.getByRole('button', { name: /删\s*除/ }).click();
      await expect(node.locator('[data-field="NAME"]')).toHaveCount(0);
      await expect(node.locator('[data-field="id"]')).toBeVisible();

      // 再加字段：编辑态 Backspace 只改字，不弹删确认
      await addFieldInline(page, 'T_TABLE_1', 'TITLE');
      const titleRow = node.locator('[data-field="TITLE"]');
      await titleRow.hover();
      await titleRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
      const titleInput = node.getByRole('textbox', { name: '字段名' });
      await expect(titleInput).toHaveValue('TITLE');
      await titleInput.press('Backspace');
      await expect(page.getByRole('dialog').filter({ hasText: /不可逆/ })).toHaveCount(0);
      await expect(titleInput).toHaveValue('TITL');
      // Escape / 空名路径保留
      await titleInput.fill('');
      await titleInput.press('Tab');
      await expectToast(page, '字段名不能为空');
      await expect(node.locator('.erd-field-editing')).toBeVisible();
      await titleInput.fill('TITLE');
      await titleInput.press('Escape');
      await expect(node.locator('[data-field="TITLE"]')).toBeVisible();

      // Delete 键确认删
      await titleRow.click({ position: { x: 40, y: 8 } });
      await page.keyboard.press('Delete');
      const dialogDel = page.getByRole('dialog').filter({ hasText: /不可逆/ });
      await expect(dialogDel.getByText(/确定删除字段/).filter({ visible: true })).toBeVisible();
      await dialogDel.getByRole('button', { name: /删\s*除/ }).click();
      await expect(node.locator('[data-field="TITLE"]')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('PK 徽标可取消再恢复', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('pk');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'pk', 'pk toggle');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();

      const pkOff = node.getByRole('button', { name: '取消主键' });
      await expect(pkOff).toBeVisible();
      await pkOff.click();
      await expect(node.getByRole('button', { name: '设为主键' })).toBeVisible();

      // inactive 仅 hover 可见
      await node.locator('[data-field="id"]').hover();
      await node.getByRole('button', { name: '设为主键' }).click();
      await expect(node.getByRole('button', { name: '取消主键' })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('命令面板：Cmd+K 打开并执行新建表', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('cmdk');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'cmd', 'command palette');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.locator('.erd-table-node')).toHaveCount(1);

      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
      const palette = page.getByRole('dialog', { name: '命令面板' });
      await expect(palette).toBeVisible();
      await expect(palette.getByRole('listbox', { name: '命令列表' })).toBeVisible();

      // ADR-0016：命令面板密度（与 22 chrome / 空态同阶）；禁 48 高输入 + 10/12 松行
      const cmdMetrics = await palette.evaluate((el) => {
        const panel = el as HTMLElement;
        const input = el.querySelector('.erd-cmd-input') as HTMLElement | null;
        const item = el.querySelector('.erd-cmd-item') as HTMLElement | null;
        const footer = el.querySelector('.erd-cmd-footer') as HTMLElement | null;
        const ics = input ? getComputedStyle(input) : null;
        const mcs = item ? getComputedStyle(item) : null;
        const fcs = footer ? getComputedStyle(footer) : null;
        return {
          panelW: panel.getBoundingClientRect().width,
          panelMaxH: parseFloat(getComputedStyle(panel).maxHeight),
          inputH: ics ? parseFloat(ics.height) : NaN,
          inputFont: ics ? parseFloat(ics.fontSize) : NaN,
          itemPadY: mcs
            ? parseFloat(mcs.paddingTop) + parseFloat(mcs.paddingBottom)
            : NaN,
          itemFont: mcs ? parseFloat(mcs.fontSize) : NaN,
          footerFont: fcs ? parseFloat(fcs.fontSize) : NaN,
        };
      });
      expect(cmdMetrics.panelW, `面板宽应 ≤460，得 ${cmdMetrics.panelW}`).toBeLessThanOrEqual(
        460,
      );
      expect(cmdMetrics.panelMaxH).toBeLessThanOrEqual(360);
      expect(cmdMetrics.inputH, `输入高应 ≤40，得 ${cmdMetrics.inputH}`).toBeLessThanOrEqual(
        40,
      );
      expect(cmdMetrics.inputH).toBeGreaterThanOrEqual(32);
      expect(cmdMetrics.inputFont).toBeLessThanOrEqual(13);
      expect(cmdMetrics.itemPadY).toBeLessThanOrEqual(16);
      expect(cmdMetrics.itemFont).toBeLessThanOrEqual(12);
      expect(cmdMetrics.footerFont).toBeLessThanOrEqual(11);

      await page.getByTestId('cmd-palette-input').fill('新建');
      await page.getByRole('option', { name: /新建表/ }).click();
      await expect(palette).toHaveCount(0);
      await expect(page.locator('.erd-table-node')).toHaveCount(2);

      // 工具条入口可再次打开；无匹配时 listbox 空态对读屏可感知
      await page.getByRole('button', { name: '命令' }).click();
      await expect(page.getByRole('dialog', { name: '命令面板' })).toBeVisible();
      await page.getByTestId('cmd-palette-input').fill('___no_such_cmd___');
      const empty = page.getByText('无匹配命令或表');
      await expect(empty).toBeVisible();
      await expect(empty).toHaveAttribute('aria-live', 'polite');
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-cmd-palette-dense.png',
        fullPage: false,
      });
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: '命令面板' })).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('命令面板：搜表定位选中并高亮', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('cmdlocate');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'loc', 'cmd palette locate');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await page.getByTestId('canvas-create-table').click();
      await expect(page.locator('.erd-table-node')).toHaveCount(2);
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible();

      // 把视口挪开：定位应把目标表拉回视口中心并选中高亮
      await page.evaluate(() => {
        (window as Window & { __ERD_E2E__?: { setViewport: (vp: { x: number; y: number; zoom: number }) => void } })
          .__ERD_E2E__?.setViewport({ x: -2400, y: -1800, zoom: 0.6 });
      });
      await expect
        .poll(async () => {
          const box = await rfNode(page, 'T_TABLE_2').boundingBox();
          if (!box) return false;
          const vw = page.viewportSize();
          if (!vw) return false;
          return (
            box.x + box.width < 0 ||
            box.y + box.height < 0 ||
            box.x > vw.width ||
            box.y > vw.height
          );
        })
        .toBe(true);

      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
      const palette = page.getByRole('dialog', { name: '命令面板' });
      await expect(palette).toBeVisible();
      await page.getByTestId('cmd-palette-input').fill('T_TABLE_2');
      const locateOpt = page.getByRole('option', { name: /T_TABLE_2/ });
      await expect(locateOpt).toBeVisible();
      await expect(locateOpt).toContainText('定位');
      await locateOpt.click();
      await expect(palette).toHaveCount(0);

      const target = rfNode(page, 'T_TABLE_2');
      await expect(target).toBeVisible({ timeout: 5_000 });
      await expect(target.locator('.erd-table-node')).toHaveClass(/selected/);
      await expect(target.locator('.erd-table-node')).toHaveAttribute('data-locate-flash', '1');
      await expect
        .poll(async () => {
          const box = await target.boundingBox();
          if (!box) return false;
          const vw = page.viewportSize();
          if (!vw) return false;
          const cx = box.x + box.width / 2;
          const cy = box.y + box.height / 2;
          return cx >= 0 && cy >= 0 && cx <= vw.width && cy <= vw.height;
        })
        .toBe(true);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('左树点表：定位选中并高亮', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('treeloc');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'tloc', 'tree locate table');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await page.getByTestId('canvas-create-table').click();
      await expect(page.locator('.erd-table-node')).toHaveCount(2);
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible();
      await expect(page.getByRole('tree').getByText('T_TABLE_2', { exact: true })).toBeVisible();

      await page.evaluate(() => {
        (window as Window & { __ERD_E2E__?: { setViewport: (vp: { x: number; y: number; zoom: number }) => void } })
          .__ERD_E2E__?.setViewport({ x: -2400, y: -1800, zoom: 0.6 });
      });
      await expect
        .poll(async () => {
          const box = await rfNode(page, 'T_TABLE_2').boundingBox();
          if (!box) return false;
          const vw = page.viewportSize();
          if (!vw) return false;
          return (
            box.x + box.width < 0 ||
            box.y + box.height < 0 ||
            box.x > vw.width ||
            box.y > vw.height
          );
        })
        .toBe(true);

      await page.getByRole('tree').getByText('T_TABLE_2', { exact: true }).click();

      const target = rfNode(page, 'T_TABLE_2');
      await expect(target).toBeVisible({ timeout: 5_000 });
      await expect(target.locator('.erd-table-node')).toHaveClass(/selected/);
      await expect(target.locator('.erd-table-node')).toHaveAttribute('data-locate-flash', '1');
      await expect(page.getByTestId('table-design')).toHaveCount(0);
      await expect
        .poll(async () => {
          const box = await target.boundingBox();
          if (!box) return false;
          const vw = page.viewportSize();
          if (!vw) return false;
          const cx = box.x + box.width / 2;
          const cy = box.y + box.height / 2;
          return cx >= 0 && cy >= 0 && cx <= vw.width && cy <= vw.height;
        })
        .toBe(true);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('表设计 Cmd/Ctrl+1/2/3：直切字段/索引/元数据应用', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('panekeys');
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'pk', 'pane digit shortcuts');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());
      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });
      await expect(designer.getByRole('tab', { name: '字段', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      // 点签栏卸掉输入焦点，避免 contentEditable 守卫吞键
      await designer.getByRole('tab', { name: '字段', exact: true }).click();
      await page.keyboard.press(`${mod}+2`);
      await expect(designer.getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('table-index-edit')).toBeVisible();

      await page.keyboard.press(`${mod}+3`);
      await expect(designer.getByRole('tab', { name: '元数据应用' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('table-code-edit')).toBeVisible();

      await page.keyboard.press(`${mod}+1`);
      await expect(designer.getByRole('tab', { name: '字段', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('table-field-edit')).toBeVisible();

      // 输入框内不拦截（浏览器可继续用修饰键，或保持字段签）
      const nameInput = designer.locator('input').first();
      if (await nameInput.count()) {
        await nameInput.focus();
        await page.keyboard.press(`${mod}+2`);
        await expect(designer.getByRole('tab', { name: '字段', exact: true })).toHaveAttribute(
          'aria-selected',
          'true',
        );
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('快捷键速查：? 打开 aria dialog', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('helpkeys');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'hk', 'shortcut help');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      // 点 pane 卸掉可能残留焦点，保证 ? 不被输入框吞
      await page.locator('.react-flow__pane').click({ position: { x: 8, y: 8 }, force: true });
      await page.keyboard.press('Shift+/');
      const help = page.getByRole('dialog', { name: '快捷键' });
      await expect(help).toBeVisible();
      await expect(help).toHaveAttribute('aria-modal', 'true');
      await expect(help.getByText('命令面板（搜表定位、建表、布局）')).toBeVisible();
      await expect(help.getByText('表设计：字段 / 索引 / 元数据应用')).toBeVisible();
      await expect(help.getByText(/二次确认/)).toBeVisible();
      await expect(help.getByText(/字段环|下一\/上一列或行|下一 \/ 上一列或行/)).toBeVisible();
      await expect(help.locator('kbd', { hasText: '⌘/Ctrl+K' })).toBeVisible();
      await expect(help.locator('kbd', { hasText: '⌘/Ctrl+1' })).toBeVisible();
      await expect(help.locator('kbd', { hasText: 'Tab' })).toBeVisible();
      await expect(help.locator('kbd', { hasText: 'Delete' })).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(help).toHaveCount(0);

      await page.getByRole('button', { name: '快捷键' }).click();
      await expect(page.getByRole('dialog', { name: '快捷键' })).toBeVisible();
      await page.getByRole('button', { name: '关闭快捷键' }).click();
      await expect(page.getByRole('dialog', { name: '快捷键' })).toHaveCount(0);

      // 再按 ? 开合；与命令面板互斥
      await page.locator('.react-flow__pane').click({ position: { x: 8, y: 8 }, force: true });
      await page.keyboard.press('Shift+/');
      await expect(page.getByRole('dialog', { name: '快捷键' })).toBeVisible();
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
      await expect(page.getByRole('dialog', { name: '快捷键' })).toHaveCount(0);
      await expect(page.getByRole('dialog', { name: '命令面板' })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('实体新建弹层密度：与 22 chrome 同阶', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('emodal');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'em', 'entity modal density');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      const dialog = page.getByRole('dialog', { name: '新增表' });
      await expect(dialog).toBeVisible();
      await expect(page.getByTestId('entity-modal-name')).toBeVisible();

      // ADR-0016：实体弹层密度（与命令面板 / 22 chrome 同阶）；禁 520 宽 + 24 pad 松卡片
      // 量 style/computed（勿用 zoom 中的 getBoundingClientRect）
      const metrics = await page.evaluate(() => {
        const root =
          (document.querySelector('.erd-entity-modal-root .ant-modal') as HTMLElement) ||
          (document.querySelector('.erd-entity-modal') as HTMLElement);
        if (!root) return { err: 'no-modal' } as const;
        const title = root.querySelector('.ant-modal-title') as HTMLElement | null;
        const body = root.querySelector('.ant-modal-body') as HTMLElement | null;
        const item = root.querySelector('.ant-form-item') as HTMLElement | null;
        const input = root.querySelector(
          '[data-testid="entity-modal-name"]',
        ) as HTMLElement | null;
        const ok = document.querySelector(
          '[data-testid="entity-modal-ok"]',
        ) as HTMLElement | null;
        const styleW = parseFloat(root.style.width || '') || NaN;
        const cssW = parseFloat(getComputedStyle(root).width) || NaN;
        const bcs = body ? getComputedStyle(body) : null;
        const ics = item ? getComputedStyle(item) : null;
        const tcs = title ? getComputedStyle(title) : null;
        return {
          width: Number.isFinite(styleW) ? styleW : cssW,
          titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
          bodyPadY: bcs
            ? parseFloat(bcs.paddingTop) + parseFloat(bcs.paddingBottom)
            : NaN,
          itemMarginB: ics ? parseFloat(ics.marginBottom) : NaN,
          inputH: input ? parseFloat(getComputedStyle(input).height) : NaN,
          okH: ok ? parseFloat(getComputedStyle(ok).height) : NaN,
          cls: root.className,
        };
      });
      expect(metrics, '应找到 .erd-entity-modal').not.toHaveProperty('err');
      expect(
        metrics.width,
        `弹层宽应 ∈[360,420]，得 ${metrics.width} cls=${(metrics as any).cls}`,
      ).toBeGreaterThanOrEqual(360);
      expect(metrics.width).toBeLessThanOrEqual(420);
      expect(metrics.titleFont).toBeLessThanOrEqual(14);
      expect(metrics.bodyPadY, `body padY 应 ≤28，得 ${metrics.bodyPadY}`).toBeLessThanOrEqual(
        28,
      );
      expect(metrics.itemMarginB).toBeLessThanOrEqual(14);
      expect(metrics.inputH, `输入高应 ≤32，得 ${metrics.inputH}`).toBeLessThanOrEqual(
        32,
      );
      expect(metrics.inputH).toBeGreaterThanOrEqual(24);
      expect(metrics.okH).toBeLessThanOrEqual(32);

      await page.getByTestId('entity-modal-name').fill('T_DENSE');
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-entity-modal-dense.png',
        fullPage: false,
      });
      await page.getByTestId('entity-modal-ok').click();
      await expect(dialog).toHaveCount(0);
      await expect(rfNode(page, 'T_DENSE')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('删边后刷新关系图仍无边', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('edgedel');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'edge', 'edge delete persist');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();

      await addFieldInline(page, 'T_ORDER', 'USER_ID', 'IdOrKey');
      await connectFields(page, 'T_ORDER', 'USER_ID', 'T_TABLE_1', 'id');
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 20_000 });
      await page.waitForTimeout(1_000);

      await selectRelationEdge(page);
      await page.keyboard.press('Delete');
      {
        const edgeDialog = page.getByRole('dialog').filter({ hasText: /确定删除关系/ });
        await expect(edgeDialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
        await edgeDialog.getByRole('button', { name: /删\s*除/ }).filter({ visible: true }).click();
      }
      await expect(page.locator('.react-flow__edge')).toHaveCount(0);
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await page.waitForTimeout(1_500);

      const designUrl = page.url();
      await page.goto(designUrl, { waitUntil: 'networkidle' });
      await openRelationCanvas(page, '商城');
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();
      await expect(page.locator('.react-flow__edge')).toHaveCount(0, { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('画布删表/删边二次确认：取消保留；确认后移除', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('cvdel');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'cvdel', 'canvas delete confirm');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();

      await addFieldInline(page, 'T_ORDER', 'USER_ID', 'IdOrKey');
      await connectFields(page, 'T_ORDER', 'USER_ID', 'T_TABLE_1', 'id');
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);

      // 删边：取消保留
      await selectRelationEdge(page);
      await page.keyboard.press('Delete');
      let dialog = page.getByRole('dialog').filter({ hasText: /确定删除关系/ });
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      await dialog.getByRole('button', { name: /取\s*消/ }).filter({ visible: true }).click();
      await expect(page.getByRole('dialog').filter({ hasText: /确定删除关系/ })).toHaveCount(0);
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);

      // 删边：确认移除
      await selectRelationEdge(page);
      await page.keyboard.press('Delete');
      dialog = page.getByRole('dialog').filter({ hasText: /确定删除关系/ });
      await dialog.getByRole('button', { name: /删\s*除/ }).filter({ visible: true }).click();
      await expect(page.getByRole('dialog').filter({ hasText: /确定删除关系/ })).toHaveCount(0);
      await expect(page.locator('.react-flow__edge')).toHaveCount(0);

      // 删表：取消保留（selectNodesOnDrag=false 后表头可单击选中；勿二点进改名）
      await page.locator('.react-flow__pane').click({ position: { x: 8, y: 8 }, force: true });
      await rfNode(page, 'T_ORDER').locator('.erd-table-title').click();
      await expect(rfNode(page, 'T_ORDER')).toHaveClass(/selected/);
      await expect(rfNode(page, 'T_ORDER').locator('input[aria-label="表名"]')).toHaveCount(0);
      await page.keyboard.press('Delete');
      dialog = page.getByRole('dialog').filter({ hasText: /确定删除表/ });
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      await dialog.getByRole('button', { name: /取\s*消/ }).filter({ visible: true }).click();
      await expect(page.getByRole('dialog').filter({ hasText: /确定删除表/ })).toHaveCount(0);
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();

      // 删表：确认移除
      await page.locator('.react-flow__pane').click({ position: { x: 8, y: 8 }, force: true });
      await rfNode(page, 'T_ORDER').locator('.erd-table-title').click();
      await expect(rfNode(page, 'T_ORDER')).toHaveClass(/selected/);
      await page.keyboard.press('Delete');
      dialog = page.getByRole('dialog').filter({ hasText: /确定删除表/ });
      await dialog.getByRole('button', { name: /删\s*除/ }).filter({ visible: true }).click();
      await expectToast(page, '表删除成功');
      await expect(rfNode(page, 'T_ORDER')).toHaveCount(0);
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
