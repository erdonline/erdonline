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
      await page.getByTestId('canvas-empty-create').click();
      await expect(page.getByTestId('canvas-empty-create')).toHaveCount(0);
      const firstNode = rfNode(page, 'T_TABLE_1');
      await expect(firstNode).toBeVisible();
      await expect(firstNode).toContainText(/id|主键/i);
      await expect(page.getByTestId('save-status')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

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

      await page.locator('.react-flow__edge').first().click({ force: true });
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

      const beforeLayout = await rfNode(page, 'T_ORDER').evaluate(
        (el) => (el as HTMLElement).style.transform,
      );
      await page.getByRole('button', { name: '自动布局' }).click();
      await page.waitForTimeout(800);
      const afterLayout = await rfNode(page, 'T_ORDER').evaluate(
        (el) => (el as HTMLElement).style.transform,
      );
      expect(afterLayout).not.toBe(beforeLayout);

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
});
