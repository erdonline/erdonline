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

      // interactionWidth=24：常规 click 应能选中边（勿 force）
      await page.locator('.react-flow__edge').first().click();
      await page.keyboard.press('Delete');
      await expect(page.locator('.react-flow__edge')).toHaveCount(0);

      await rfNode(page, 'T_TABLE_1').click();
      await expect(page.locator('.react-flow__node.selected')).toHaveCount(1);
      await page.keyboard.press('Delete');
      await expectToast(page, '数据表的删除请在左侧模型树中操作');
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

      const titleFont = await orderNode.locator('.erd-table-title').evaluate(
        (el) => getComputedStyle(el).fontFamily,
      );
      expect(titleFont.toLowerCase()).toMatch(/mono|menlo|consolas/);

      const edge = page.locator('.react-flow__edge').first();
      await expect(edge).toHaveClass(/react-flow__edge-erdSmooth/);
      const edgePath = page.locator('.react-flow__edge-path').first();
      await expect(edgePath).toBeVisible();
      const marker = await edgePath.getAttribute('marker-end');
      expect(marker, '边应带闭合箭头 marker').toBeTruthy();

      await page.getByRole('button', { name: '适应画布' }).click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-node-polish.png',
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
      await expect(modeEl).toHaveAttribute('data-mode', /^(default|centerX|bypass)$/);
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

      await expect(page.getByRole('img', { name: '画布缩略图' })).toBeVisible();
      await expect(page.getByLabel('React Flow mini map')).toHaveCount(0);
      await expect(page.getByText('React Flow mini map')).toHaveCount(0);
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

      await expect(page.getByRole('button', { name: '撤销' })).toBeVisible();
      await expect(page.getByRole('button', { name: '重做' })).toBeVisible();
      await expect(page.getByRole('button', { name: '自动布局' })).toBeVisible();

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
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('删除字段：可访问按钮移除字段行', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fdel');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fdel', 'field delete a11y');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      const nameRow = node.locator('[data-field="NAME"]');
      await expect(nameRow).toBeVisible();

      // 删除钮仅 hover 可见；限定在字段行内避免同表多字段歧义
      await nameRow.hover();
      const delBtn = nameRow.getByRole('button', { name: '删除字段' });
      await expect(delBtn).toBeVisible();
      // 右侧 Handle 易挡指针；DOM click 与表头改名一致
      await delBtn.evaluate((el: HTMLElement) => el.click());
      await expect(node.locator('[data-field="NAME"]')).toHaveCount(0);
      await expect(node.locator('[data-field="id"]')).toBeVisible();
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
      await page.getByTestId('cmd-palette-input').fill('新建');
      await page.getByRole('option', { name: /新建表/ }).click();
      await expect(palette).toHaveCount(0);
      await expect(page.locator('.erd-table-node')).toHaveCount(2);

      // 工具条入口可再次打开；无匹配时 listbox 空态对读屏可感知
      await page.getByRole('button', { name: '命令' }).click();
      await expect(page.getByRole('dialog', { name: '命令面板' })).toBeVisible();
      await page.getByTestId('cmd-palette-input').fill('___no_such_cmd___');
      const empty = page.getByText('无匹配命令');
      await expect(empty).toBeVisible();
      await expect(empty).toHaveAttribute('aria-live', 'polite');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: '命令面板' })).toHaveCount(0);
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

      await page.locator('.react-flow__edge').first().click();
      await page.keyboard.press('Delete');
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
});
