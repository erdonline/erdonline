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

/**
 * DBML 导入：上传 fixture → 模型树 + 画布 N 实体；前缀表自动建议 Frame
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
      await page.getByRole('menuitem', { name: '导入DBML' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('导入 DBML')).toBeVisible({ timeout: 10_000 });

      await dlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /DBML 导入成功/);
      await expect(dlg).toBeHidden({ timeout: 10_000 });

      const tree = page.getByRole('complementary');
      await expect(tree.getByText('DBML导入', { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      // ADR-0017：导入后自动展开；勿点标题（会收起）
      const openRelation = page.getByTestId('tree-open-relation');
      await expect(openRelation).toBeVisible({ timeout: 15_000 });
      await openRelation.click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({
        timeout: 10_000,
      });

      await expect(rfNode(page, 'users')).toBeVisible({ timeout: 15_000 });
      await expect(rfNode(page, 'posts')).toBeVisible();
      const total = Number(
        await page.getByTestId('reactflow-canvas').getAttribute('data-node-total'),
      );
      expect(total).toBeGreaterThanOrEqual(2);

      // ADR-0016：导入后按 FK dagre LR（posts→users ⇒ posts.x < users.x）；旧 3 列网格 posts@360 > users@80
      const parseTx = (t: string) => {
        const m = t.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px/);
        return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: NaN, y: NaN };
      };
      const postsTx = parseTx(
        await rfNode(page, 'posts').evaluate((el) => (el as HTMLElement).style.transform),
      );
      const usersTx = parseTx(
        await rfNode(page, 'users').evaluate((el) => (el as HTMLElement).style.transform),
      );
      expect(postsTx.x, '外键侧 posts 应在主键侧 users 左侧（dagre LR）').toBeLessThan(usersTx.x);

      await page
        .getByTestId('reactflow-canvas')
        .screenshot({ path: 'test-results/ux-walkthrough/diagram-autolayout-import.png' });

      await expect(tree.getByText('users', { exact: true })).toBeVisible({
        timeout: 10_000,
      });
      await expect(tree.getByText('posts', { exact: true })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('前缀表导入后自动建议 Frame 分组', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('dbmlpfx');
    const fixture = path.join(__dirname, '../fixtures/prefixed.dbml');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'pfx', 'dbml frame suggest');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('menuitem', { name: '导入DBML' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('导入 DBML')).toBeVisible({ timeout: 10_000 });

      await dlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /DBML 导入成功.*已建议 2 个分组/);
      await expect(dlg).toBeHidden({ timeout: 10_000 });

      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });

      await expect(rfNode(page, 'sys_user')).toBeVisible({ timeout: 15_000 });
      await expect(rfNode(page, 'biz_order')).toBeVisible();

      const frames = page.getByTestId('diagram-frame');
      await expect(frames).toHaveCount(2, { timeout: 10_000 });
      await expect(page.locator('.erd-frame-label', { hasText: 'sys' })).toBeVisible();
      await expect(page.locator('.erd-frame-label', { hasText: 'biz' })).toBeVisible();

      await page
        .getByTestId('reactflow-canvas')
        .screenshot({ path: 'test-results/ux-walkthrough/diagram-import-frame-suggest.png' });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
