import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  openRelationFromEmpty,
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

      await page.getByRole('button', { name: '新建关系图' }).click();
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

      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
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

      await page.getByRole('button', { name: '新建关系图' }).click();
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
});
