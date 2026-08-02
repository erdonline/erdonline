import { expect, test } from '@playwright/test';
import path from 'path';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  rfNode,
  uniqueProjectName,
} from './helpers';

/** DirectoryTree expandAction=click：点标题展开，避免 switcher 图标恒为 down 的误导 */
async function expandByTitle(
  page: import('@playwright/test').Page,
  title: string,
) {
  const tree = page.getByTestId('query-tree');
  const label = tree.getByText(title, { exact: true }).first();
  await expect(label).toBeVisible({ timeout: 15_000 });
  await label.click();
  await page.waitForTimeout(400);
}

/**
 * DBML 导入：上传 fixture → 模型树 + 画布 N 实体
 */
test.describe('DBML 导入', () => {
  test('上传 minimal.dbml 后画布可见 N 张表', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('dbml');
    const fixture = path.join(__dirname, '../fixtures/minimal.dbml');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dbml', 'dbml import');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('button', { name: '导入DBML' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('导入 DBML')).toBeVisible({ timeout: 10_000 });

      await dlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /DBML 导入成功/);
      await expect(dlg).toBeHidden({ timeout: 10_000 });

      const tree = page.getByRole('complementary');
      await expect(tree.getByText('DBML导入', { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      await expandByTitle(page, 'DBML导入');
      await expect(tree.getByText('关系', { exact: true })).toBeVisible({
        timeout: 10_000,
      });
      await expandByTitle(page, '关系');
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({
        timeout: 10_000,
      });

      await expect(rfNode(page, 'users')).toBeVisible({ timeout: 15_000 });
      await expect(rfNode(page, 'posts')).toBeVisible();
      const total = Number(
        await page.getByTestId('reactflow-canvas').getAttribute('data-node-total'),
      );
      expect(total).toBeGreaterThanOrEqual(2);

      await expandByTitle(page, '表');
      await expect(tree.getByText('users', { exact: true })).toBeVisible({
        timeout: 10_000,
      });
      await expect(tree.getByText('posts', { exact: true })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
