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
});
