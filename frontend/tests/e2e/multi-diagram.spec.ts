import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  openRelationFromEmpty,
  expectSavedToServer,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * ADR-0017 Phase 2a：多关系图切换器 + diagrams[] 持久化（最小竖切）
 */

test.describe('多关系图（ADR-0017 Phase 2a）', () => {
  test.describe.configure({ retries: 0 });

  test('新建/重命名/切换 + 树图列表 + 刷新仍在', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('md');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'md', 'multi diagram');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await expect(page.getByTestId('tree-open-relation')).toBeVisible();
      await expect(page.getByTestId('diagram-switcher')).toHaveCount(1);
      await expect(page.getByRole('tree').getByText('关系图', { exact: true })).toBeVisible();

      // 点关系图叶子只开画布，禁把图名当表名 →「表 … 不存在」
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByText(/表 ".+" 不存在/)).toHaveCount(0);
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible();

      await page
        .getByTestId('diagram-switcher')
        .getByRole('button', { name: '新建关系图' })
        .click();
      const createDialog = page.getByRole('dialog', { name: '新建关系图' });
      await expect(createDialog).toBeVisible();
      await createDialog.getByLabel('关系图名称').fill('鉴权域');
      await page.getByTestId('diagram-modal-ok').click();
      await expect(createDialog).toHaveCount(0);
      await expect(page.getByTestId('diagram-switcher')).toHaveCount(1);
      await expect(page.getByTestId('diagram-switcher')).toContainText('鉴权域');
      await expect(page.getByRole('tree').getByText('鉴权域', { exact: true })).toBeVisible();

      await page.getByRole('button', { name: '重命名关系图' }).click();
      const renameDialog = page.getByRole('dialog', { name: '重命名关系图' });
      await expect(renameDialog).toBeVisible();
      await renameDialog.getByLabel('关系图名称').fill('鉴权视图');
      await page.getByTestId('diagram-modal-ok').click();
      await expect(renameDialog).toHaveCount(0);
      await expect(page.getByTestId('diagram-switcher')).toContainText('鉴权视图');

      await page.getByTestId('diagram-switcher').locator('.ant-select-selector').click();
      await page.getByRole('option', { name: '主关系图' }).click();
      await expect(page.getByTestId('diagram-switcher')).toHaveCount(1);
      await expect(page.getByTestId('diagram-switcher')).toContainText('主关系图');

      await page.getByRole('tree').getByText('鉴权视图', { exact: true }).click();
      await expect(page.getByTestId('diagram-switcher')).toHaveCount(1);
      await expect(page.getByTestId('diagram-switcher')).toContainText('鉴权视图');

      await expectSavedToServer(page, 15_000);
      const designUrl = page.url();
      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('tree').getByText('鉴权视图', { exact: true })).toBeVisible({
        timeout: 20_000,
      });
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('diagram-switcher')).toHaveCount(1);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });

  test('左树删除关系图/模型二次确认：取消保留；确认移除', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('treedel');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'treedel', 'tree delete confirm');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page
        .getByTestId('diagram-switcher')
        .getByRole('button', { name: '新建关系图' })
        .click();
      const createDialog = page.getByRole('dialog', { name: '新建关系图' });
      await createDialog.getByLabel('关系图名称').fill('鉴权域');
      await page.getByTestId('diagram-modal-ok').click();
      await expect(page.getByRole('tree').getByText('鉴权域', { exact: true })).toBeVisible();

      const diagramItem = page.getByRole('treeitem').filter({ hasText: '鉴权域' });
      await diagramItem.getByLabel('关系图操作').click();
      await page.getByRole('menuitem', { name: '删除关系图' }).click();

      let dialog = page.getByRole('dialog').filter({ hasText: /确定删除关系图/ });
      await expect(dialog.getByText(/仅删除该关系图/).filter({ visible: true })).toBeVisible();
      await dialog.getByRole('button', { name: /取\s*消/ }).click();
      await expect(page.getByRole('dialog').filter({ hasText: /确定删除关系图/ })).toHaveCount(0);
      await expect(page.getByRole('tree').getByText('鉴权域', { exact: true })).toBeVisible();

      await diagramItem.getByLabel('关系图操作').click();
      await page.getByRole('menuitem', { name: '删除关系图' }).click();
      dialog = page.getByRole('dialog').filter({ hasText: /确定删除关系图/ });
      await dialog.getByRole('button', { name: /删\s*除/ }).click();
      await expect(page.getByRole('dialog').filter({ hasText: /确定删除关系图/ })).toHaveCount(0);
      await expect(page.getByText('关系图删除成功')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByRole('tree').getByText('鉴权域', { exact: true })).toHaveCount(0);

      await page.getByLabel('模型操作').click();
      await page.getByRole('menuitem', { name: '删除模型' }).click();
      dialog = page.getByRole('dialog').filter({ hasText: /确定删除模型/ });
      await expect(dialog.getByText(/全部表与关系图/).filter({ visible: true })).toBeVisible();
      await dialog.getByRole('button', { name: /取\s*消/ }).click();
      await expect(page.getByRole('dialog').filter({ hasText: /确定删除模型/ })).toHaveCount(0);
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page.getByLabel('模型操作').click();
      await page.getByRole('menuitem', { name: '删除模型' }).click();
      dialog = page.getByRole('dialog').filter({ hasText: /确定删除模型/ });
      await dialog.getByRole('button', { name: /删\s*除/ }).click();
      await expect(page.getByRole('dialog').filter({ hasText: /确定删除模型/ })).toHaveCount(0);
      await expect(page.getByText('模型删除成功')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('还没有任何模型哦')).toBeVisible({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });

  test('左树重命名关系图：菜单接通 renameDiagram；无空 FK 弹层', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('treeren');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'treeren', 'tree rename diagram');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await page
        .getByTestId('diagram-switcher')
        .getByRole('button', { name: '新建关系图' })
        .click();
      const createDialog = page.getByRole('dialog', { name: '新建关系图' });
      await createDialog.getByLabel('关系图名称').fill('鉴权域');
      await page.getByTestId('diagram-modal-ok').click();
      await expect(page.getByRole('tree').getByText('鉴权域', { exact: true })).toBeVisible();

      const diagramItem = page.getByRole('treeitem').filter({ hasText: '鉴权域' });
      await diagramItem.getByLabel('关系图操作').click();
      await expect(page.getByRole('menuitem', { name: '复制关系' })).toHaveCount(0);
      await expect(page.getByRole('menuitem', { name: '剪切关系' })).toHaveCount(0);
      await page.getByRole('menuitem', { name: '重命名关系图' }).click();

      const renameDialog = page.getByRole('dialog', { name: '重命名关系图' });
      await expect(renameDialog).toBeVisible();
      await expect(renameDialog.getByLabel('表1')).toHaveCount(0);
      await expect(renameDialog.getByLabel('表2')).toHaveCount(0);
      await renameDialog.getByLabel('关系图名称').fill('鉴权视图-树');
      await page.getByTestId('entity-modal-ok').click();
      await expect(renameDialog).toHaveCount(0);

      await expect(page.getByRole('tree').getByText('鉴权视图-树', { exact: true })).toBeVisible();
      await expect(page.getByTestId('diagram-switcher')).toContainText('鉴权视图-树');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });

  test('左树新建关系图：树头菜单接通 createDiagram', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('treecre');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'treecre', 'tree create diagram');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      // 树头「新建」下拉（非画布工具栏「新建关系图」）
      await page.getByRole('button', { name: '新建', exact: true }).click();
      await page.getByRole('menuitem', { name: '新建关系图' }).click();

      const createDialog = page.getByRole('dialog', { name: '新建关系图' });
      await expect(createDialog).toBeVisible();
      await expect(createDialog.getByLabel('表1')).toHaveCount(0);
      await expect(createDialog.getByLabel('表2')).toHaveCount(0);
      await createDialog.getByLabel('关系图名称').fill('鉴权域-树建');
      await page.getByTestId('entity-modal-ok').click();
      await expect(createDialog).toHaveCount(0);

      await expect(page.getByText('已新建关系图')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByRole('tree').getByText('鉴权域-树建', { exact: true })).toBeVisible();
      await expect(page.getByTestId('diagram-switcher')).toContainText('鉴权域-树建');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });

  test('左树「关系图」文件夹 + 直建图：tree-folder-add-relation → createDiagram', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('foldcre');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'foldcre', 'folder create diagram');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      // 「关系图」文件夹旁 +（非树头「新建」、非画布工具栏）
      await page.getByRole('tree').getByRole('button', { name: '新建关系图' }).click();

      const createDialog = page.getByRole('dialog', { name: '新建关系图' });
      await expect(createDialog).toBeVisible();
      await expect(createDialog.getByLabel('表1')).toHaveCount(0);
      await expect(createDialog.getByLabel('表2')).toHaveCount(0);
      await createDialog.getByLabel('关系图名称').fill('鉴权域-夹建');
      await page.getByTestId('entity-modal-ok').click();
      await expect(createDialog).toHaveCount(0);

      await expect(page.getByText('已新建关系图')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByRole('tree').getByText('鉴权域-夹建', { exact: true })).toBeVisible();
      await expect(page.getByTestId('diagram-switcher')).toContainText('鉴权域-夹建');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });

  test('左树「编辑表」开表设计字段签；「重命名表」仍走弹层', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('edittbl');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'edittbl', 'tree edit table');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expectSavedToServer(page, 15_000);

      const tableMenu = page.getByLabel('表操作');
      await tableMenu.click();
      await page.getByRole('menuitem', { name: '编辑表' }).click();

      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });
      await expect(designer.getByRole('tab', { name: '字段' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('table-field-edit')).toBeVisible();
      await expect(page.getByRole('dialog', { name: '重命名表' })).toHaveCount(0);
      await expect(page.getByRole('dialog', { name: '编辑表' })).toHaveCount(0);

      // 切索引后再经菜单「编辑表」仍落字段（对称画布入口）
      await designer.getByRole('tab', { name: '索引' }).click();
      await expect(designer.getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await tableMenu.click();
      await page.getByRole('menuitem', { name: '编辑表' }).click();
      await expect(page.getByTestId('table-design').getByRole('tab', { name: '字段' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      await tableMenu.click();
      await page.getByRole('menuitem', { name: '重命名表' }).click();
      const renameDialog = page.getByRole('dialog', { name: '重命名表' });
      await expect(renameDialog).toBeVisible();
      await renameDialog.getByLabel('名称').fill('T_RENAMED');
      await page.getByTestId('entity-modal-ok').click();
      await expect(renameDialog).toHaveCount(0);
      await expect(page.getByRole('tree').getByText('T_RENAMED', { exact: true })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });

  test('左树搜索：无匹配空态；× 清除残留过滤', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('treesrch');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'treesrch', 'tree search clear');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByRole('tree').getByText('T_TABLE_1', { exact: true })).toBeVisible();

      const search = page.getByLabel('搜索表名');
      await expect(search).toBeVisible();
      await search.fill('___no_such_table___');
      await search.press('Enter');

      await expect(page.getByTestId('tree-search-empty')).toBeVisible();
      await expect(page.getByText('未找到匹配的表')).toBeVisible();
      await expect(page.getByRole('tree')).toHaveCount(0);

      // antd allowClear ×（图标 a11y 名 close-circle；scope 左树，禁裸 .ant-*）
      await page.getByTestId('query-tree').getByRole('button', { name: 'close-circle' }).click();
      await expect(search).toHaveValue('');
      await expect(page.getByTestId('tree-search-empty')).toHaveCount(0);
      await expect(page.getByRole('tree').getByText('T_TABLE_1', { exact: true })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
