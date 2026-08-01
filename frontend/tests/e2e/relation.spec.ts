import { expect, test } from '@playwright/test';
import { deleteAllPersonProjects, login } from './helpers';

/**
 * 关系图画布回归（ADR-0001 ReactFlow R0/R1/R2）
 *
 * 固化核心不变量：
 * 1. **实体即节点**——创建表后打开关系图，节点必须立即出现
 *    （旧 g6「实体≠画布节点、新建实体永远上不了画布」的断裂模型禁止回归）
 * 2. **节点即编辑器**——字段增删改全部画布内联完成，不依赖 handsontable 标签页
 * 3. **字段拖连线建关联**——from=外键侧右锚点，to=主键侧左锚点，持久化到 associations
 * 4. **破坏性操作守卫**——画布 Delete 不删表；拖动位置持久化
 */

/** 内联加字段：节点底部「+ 添加字段」→ 输名回车 */
async function addFieldInline(
  page: import('@playwright/test').Page,
  tableName: string,
  fieldName: string,
  type = 'String'
) {
  const node = page.locator('.react-flow__node', { hasText: tableName });
  await node.locator('.erd-field-add').click();
  const editRow = node.locator('.erd-field-editing');
  await editRow.locator('.erd-field-type-select').selectOption(type);
  await editRow.locator('.erd-field-input').fill(fieldName);
  await editRow.locator('.erd-field-input').press('Enter');
  await expect(node.locator('.erd-field-name', { hasText: fieldName })).toBeVisible();
}

/** 字段拖连线：from 表字段右锚点 → to 表字段左锚点 */
async function connectFields(
  page: import('@playwright/test').Page,
  fromTable: string,
  fromField: string,
  toTable: string,
  toField: string
) {
  // 先 fitView，避免节点增长后手柄落到可视区外
  await page.locator('.react-flow__controls-fitview').click();
  await page.waitForTimeout(500);
  const fromRow = page
    .locator('.react-flow__node', { hasText: fromTable })
    .locator('.erd-field-row', { hasText: fromField });
  const toRow = page
    .locator('.react-flow__node', { hasText: toTable })
    .locator('.erd-field-row', { hasText: toField });
  const src = fromRow.locator('.react-flow__handle-right');
  const tgt = toRow.locator('.react-flow__handle-left');
  await expect(src).toBeVisible();
  await expect(tgt).toBeVisible();
  // dragTo 比手写 mouse 序列更稳（RF 需要完整 pointer 事件流）
  await src.dragTo(tgt, { force: true });
  await page.waitForTimeout(1_000);
}

test.describe('关系图画布（ReactFlow）', () => {
  test('全旅程：空态引导→建表→内联字段→连线→守卫→持久化', async ({ page }) => {
    // 全旅程含多次落库等待与重载，默认 60s 不足（超时连锁占用配额曾致后续用例失败）
    test.setTimeout(180_000);
    const projectName = `rf-${Date.now()}`;
    try {
      await login(page);

      // 开头先清空个人项目：自愈历史泄漏（免费版配额仅 1，泄漏会让建项目 500）
      await deleteAllPersonProjects(page);

      // 建项目进设计器
      await page.getByRole('button', { name: /新\s*建/ }).click();
      await page.getByPlaceholder('请输入项目名').fill(projectName);
      await page.locator('.ant-modal .ant-select').first().click();
      await page.locator('.ant-select-item-option', { hasText: '个人项目' }).click();
      await page.locator('.ant-modal .ant-select').nth(1).click();
      await page.keyboard.type('rf');
      await page.keyboard.press('Enter');
      await page.getByPlaceholder('请输入项目描述').fill('relation r2');
      await page.locator('.ant-modal').getByRole('button', { name: /确\s*定/ }).click();
      await expect(page.getByText(projectName).first()).toBeVisible();
      await page.getByRole('button', { name: '打开模型' }).first().click();
      await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });

      // 建模块
      await page.getByRole('button', { name: /新增模型/ }).click();
      const moduleModal = page.locator('.ant-modal:visible').last();
      await moduleModal.locator('input').first().fill('SHOP');
      await moduleModal.locator('input').nth(1).fill('商城');
      await moduleModal.getByRole('button', { name: /确\s*定/ }).click();
      await expect(page.locator('.ant-tree')).toContainText('商城');

      // 打开关系图（按精确文本定位避免树重渲染抖动）
      const expandNode = async (exactTitle: string) => {
        const node = page.locator('.ant-tree-treenode', {
          has: page.getByText(exactTitle, { exact: true }),
        }).first();
        await node.locator('.ant-tree-switcher').first().click();
        await page.waitForTimeout(500);
      };
      const openRelation = async () => {
        await expandNode('商城');
        await expandNode('关系');
        await page.locator('.ant-tree [class*=title]', { hasText: '关系图' }).last().click();
        await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10_000 });
      };
      await openRelation();

      // 不变量：空态有可操作引导（非静态插图）→ 点击即建表上图
      await expect(page.locator('.erd-empty-cta')).toBeVisible();
      await page.locator('.erd-empty-button').click();
      await expect(page.locator('.erd-empty-cta')).toHaveCount(0);
      await expect(page.locator('.react-flow__node', { hasText: 'T_TABLE_1' })).toBeVisible();
      // 自动保存状态可见：编辑后最终「已保存」
      await expect(page.getByTestId('save-status')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      // 不变量：节点即编辑器——内联加字段立即生效（告别双击开标签+handsontable）
      await addFieldInline(page, 'T_TABLE_1', 'ID', 'IdOrKey');
      // IdOrKey 默认即 PK
      await expect(page.locator('.react-flow__node', { hasText: 'T_TABLE_1' }).locator('.erd-pk-badge.active')).toHaveCount(1);
      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      // 表头改名 / PK 切换：浏览器 MCP 已实证；RF 节点层吞 Playwright click，改名自动化待命令面板轮补

      // 第二张表：左侧 + 菜单（既有入口），画布开着即建即上图
      await page.locator('button:has(.anticon-plus)').last().click();
      await page.getByRole('menuitem', { name: /新增表/ }).click();
      const tableModal = page.locator('.ant-modal:visible').last();
      const inputs = tableModal.locator('input');
      const n = await inputs.count();
      await inputs.nth(n - 2).fill('T_ORDER');
      await inputs.nth(n - 1).fill('订单表');
      await tableModal.getByRole('button', { name: /确\s*定/ }).click();
      await expect(page.locator('.react-flow__node', { hasText: 'T_ORDER' })).toBeVisible();
      // 仅加外键字段（避免两表都有 ID 时手柄定位歧义）
      await addFieldInline(page, 'T_ORDER', 'T1_ID', 'IdOrKey');

      // 不变量：字段拖连线建关联（外键 → 主键）
      await connectFields(page, 'T_ORDER', 'T1_ID', 'T_TABLE_1', 'ID');
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);

      // 不变量：内联改字段名——双击 → 改名 → 立即可见（associations 锚点同步在 store 内完成）
      const orderNode = page.locator('.react-flow__node', { hasText: 'T_ORDER' });
      await orderNode.locator('.erd-field-row', { hasText: 'T1_ID' }).dblclick();
      const renameRow = orderNode.locator('.erd-field-editing');
      await renameRow.locator('.erd-field-input').fill('USER_ID');
      await renameRow.locator('.erd-field-input').press('Enter');
      await expect(orderNode.locator('.erd-field-name', { hasText: 'USER_ID' })).toBeVisible();
      // 改名后边应仍在（锚点跟随字段名）
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);

      // 不变量：删边——force 选中（边中点常被节点遮挡）+ Delete，边与关联同步清除
      await page.locator('.react-flow__edge').first().click({ force: true });
      await page.keyboard.press('Delete');
      await expect(page.locator('.react-flow__edge')).toHaveCount(0);

      // 不变量：节点可选中；画布 Delete 不删表（破坏性操作守卫）
      await page.locator('.react-flow__node', { hasText: 'T_TABLE_1' }).click();
      await expect(page.locator('.react-flow__node.selected')).toHaveCount(1);
      await page.keyboard.press('Delete');
      await expect(
        page.locator('.ant-message-notice', { hasText: '数据表的删除请在左侧模型树中操作' })
      ).toBeVisible();
      await expect(page.locator('.erd-table-node')).toHaveCount(2);

      // 不变量：拖动位置持久化——拖后重载，画布坐标不变
      const t1Node = page.locator('.react-flow__node', { hasText: 'T_TABLE_1' });
      const box = await t1Node.boundingBox();
      await page.mouse.move(box!.x + 60, box!.y + 20);
      await page.mouse.down();
      await page.mouse.move(box!.x + 180, box!.y + 140, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(2_000); // store 订阅自动保存落库
      const draggedTransform = await t1Node.evaluate(el => (el as HTMLElement).style.transform);
      expect(draggedTransform).toContain('translate');

      await page.reload();
      await page.waitForSelector('.ant-tree', { timeout: 15_000 });
      await page.waitForTimeout(1_500);
      await openRelation();
      // 重载后：节点、字段、布局全部恢复
      await expect(page.locator('.react-flow__node', { hasText: 'T_TABLE_1' })).toBeVisible();
      await expect(page.locator('.erd-field-row', { hasText: 'NAME' }).first()).toBeVisible();
      const reloadedTransform = await page
        .locator('.react-flow__node', { hasText: 'T_TABLE_1' })
        .evaluate(el => (el as HTMLElement).style.transform);
      expect(reloadedTransform, '拖动后的画布坐标必须在重载后保持').toBe(draggedTransform);

      // 不变量：dagre 自动布局按钮可用且改变坐标
      const beforeLayout = await page
        .locator('.react-flow__node', { hasText: 'T_ORDER' })
        .evaluate(el => (el as HTMLElement).style.transform);
      await page.getByRole('button', { name: '自动布局' }).click();
      await page.waitForTimeout(800);
      const afterLayout = await page
        .locator('.react-flow__node', { hasText: 'T_ORDER' })
        .evaluate(el => (el as HTMLElement).style.transform);
      expect(afterLayout).not.toBe(beforeLayout);

      // 不变量：undo 撤销最近一次布局（Cmd/Ctrl+Z）
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
      await page.waitForTimeout(500);
      const undoneLayout = await page
        .locator('.react-flow__node', { hasText: 'T_ORDER' })
        .evaluate(el => (el as HTMLElement).style.transform);
      expect(undoneLayout, '撤销后应回到自动布局前的坐标').toBe(beforeLayout);

      // 不变量：Shift 多选 → 左对齐（两节点 x 相同）
      await page.locator('.react-flow__node', { hasText: 'T_TABLE_1' }).click();
      await page.locator('.react-flow__node', { hasText: 'T_ORDER' }).click({ modifiers: ['Shift'] });
      await expect(page.locator('.react-flow__node.selected')).toHaveCount(2);
      await page.getByTestId('align-left').click();
      await page.waitForTimeout(400);
      const parseTx = (t: string) => {
        const m = t.match(/translate\(([-\d.]+)px/);
        return m ? Number(m[1]) : NaN;
      };
      const x1 = parseTx(await page.locator('.react-flow__node', { hasText: 'T_TABLE_1' }).evaluate(el => (el as HTMLElement).style.transform));
      const x2 = parseTx(await page.locator('.react-flow__node', { hasText: 'T_ORDER' }).evaluate(el => (el as HTMLElement).style.transform));
      expect(x1, '左对齐后两表 x 应相同').toBe(x2);

      // 不变量：命令面板 Cmd/Ctrl+K → 执行「新建表」
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
      await expect(page.getByRole('dialog', { name: '命令面板' })).toBeVisible();
      await page.locator('.erd-cmd-input').fill('新建');
      await page.locator('.erd-cmd-item', { hasText: '新建表' }).click();
      await expect(page.getByRole('dialog', { name: '命令面板' })).toHaveCount(0);
      await expect(page.locator('.erd-table-node')).toHaveCount(3);
    } finally {
      // 清空回收（全量清而非按名找：中途失败时页面状态不可控，全量清最可靠）
      try {
        await deleteAllPersonProjects(page);
      } catch { /* 清理失败不掩盖测试结果 */ }
    }
  });
});
