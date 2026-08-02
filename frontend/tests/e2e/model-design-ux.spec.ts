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
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
