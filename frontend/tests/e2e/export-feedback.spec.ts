import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  E2E_SERIAL,
  expectToast,
  login,
  openRelationFromEmpty,
  uniqueProjectName,
  withExclusiveAccount,
} from './helpers';

/**
 * 导出失败可见（下一季②信任链）：500 / 网络失败须有原因+重试引导；DDL 失败不关窗
 */
test.describe('导出失败反馈', () => {
  test.describe.configure({ mode: 'serial' });

  test('导出失败：Word 后端 500 可见原因与重试引导', async ({ page }) => {
    test.setTimeout(120_000);
    await withExclusiveAccount(async () => {
      const projectName = uniqueProjectName('exfail500');
      try {
        await login(page, E2E_SERIAL);
        await deleteOwnPersonProjects(page);
        await createAndOpenPersonProject(page, projectName, 'export', 'export fail 500');

        const projectId = new URL(page.url()).searchParams.get('projectId');
        await page.goto(`/design/table/export/common?projectId=${projectId}`);
        await expect(page.getByText('导出文件')).toBeVisible({ timeout: 15_000 });

        await page.route('**/ncnb/doc/gendocx', async (route) => {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '文档服务不可用' }),
          });
        });

        await page.getByText('导出Word').click();
        await expectToast(page, /Word导出失败!请重试！出错原因：/);
        await expect(page.getByText(/文档服务不可用|服务器发生错误/)).toBeVisible({
          timeout: 15_000,
        });
        // 仍停留在导出页（未因失败跳转/空白）
        await expect(page.getByText('导出文件')).toBeVisible();
        await page.unroute('**/ncnb/doc/gendocx');
      } finally {
        await deleteOwnPersonProjects(page).catch(() => {});
      }
    });
  });

  test('导出失败：Word 网络中断可见重试引导', async ({ page }) => {
    test.setTimeout(120_000);
    await withExclusiveAccount(async () => {
      const projectName = uniqueProjectName('exfailnet');
      try {
        await login(page, E2E_SERIAL);
        await deleteOwnPersonProjects(page);
        await createAndOpenPersonProject(page, projectName, 'export', 'export fail net');

        const projectId = new URL(page.url()).searchParams.get('projectId');
        await page.goto(`/design/table/export/common?projectId=${projectId}`);
        await expect(page.getByText('导出文件')).toBeVisible({ timeout: 15_000 });

        await page.route('**/ncnb/doc/gendocx', (route) => route.abort('failed'));

        await page.getByText('导出Word').click();
        await expectToast(page, /Word导出失败!请重试！出错原因：网络异常/);
        await expect(page.getByText('导出文件')).toBeVisible();
        await page.unroute('**/ncnb/doc/gendocx');
      } finally {
        await deleteOwnPersonProjects(page).catch(() => {});
      }
    });
  });

  test('导出失败：DDL 无可导出内容时提示且对话框不关闭', async ({ page, request }) => {
    test.setTimeout(120_000);
    await withExclusiveAccount(async () => {
      const API = process.env.API_URL || 'http://localhost:9502';
      const projectName = uniqueProjectName('exfailddl');
      let dsId = '';
      try {
        await login(page, E2E_SERIAL);
        await deleteOwnPersonProjects(page);
        await createAndOpenPersonProject(page, projectName, 'export', 'export fail ddl');

        await openRelationFromEmpty(page);
        await page.getByTestId('canvas-empty-create').click();
        await expect(page.getByText('T_TABLE_1').first()).toBeVisible({ timeout: 15_000 });

        const token = await page.evaluate(() => localStorage.getItem('Authorization'));
        expect(token).toBeTruthy();
        dsId = crypto.randomUUID();
        const createDs = await request.post(`${API}/ncnb/dataSources`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            id: dsId,
            name: `e2e-ddl-fail-${Date.now().toString(36)}`,
            type: 'MYSQL',
            url: 'jdbc:mysql://127.0.0.1:3306/e2e',
            username: 'e2e',
            password: 'e2e',
            driverClassName: 'com.mysql.cj.jdbc.Driver',
          },
        });
        expect(createDs.status()).toBe(200);

        await page.getByRole('button', { name: '项目菜单' }).click();
        await page.getByTestId('project-menu-panel').getByRole('menuitem', { name: '导出' }).click();
        await page.getByRole('menuitem', { name: '导出DDL' }).click();
        const dlg = page.getByRole('dialog');
        await expect(dlg.getByText('SQL导出配置')).toBeVisible({ timeout: 10_000 });
        await expect(dlg.getByTitle(/e2e-ddl-fail-/)).toBeVisible({ timeout: 10_000 });

        await dlg.getByRole('combobox', { name: /导出数据表/ }).click();
        const exportTree = page.getByRole('tree').filter({ hasText: /SHOP/ });
        await expect(exportTree).toBeVisible({ timeout: 10_000 });
        await exportTree.getByText('T_TABLE_1', { exact: true }).click();
        // TreeSelect 下拉挡住 Modal footer（与 project-menu DDL 用例同）
        await dlg.getByText('SQL导出配置').click();
        await expect(exportTree).toBeHidden({ timeout: 5_000 });

        await dlg.getByRole('button', { name: '下一步' }).click({ force: true });
        await expect(dlg.getByRole('button', { name: '导出' })).toBeVisible({ timeout: 10_000 });

        // 自定义且不勾选任何内容 → SQL 为空 → 失败路径
        await dlg.getByText('自定义', { exact: true }).click();
        await dlg.getByRole('button', { name: '导出' }).click();

        await expectToast(page, /DDL导出失败!请重试！出错原因：/);
        await expect(dlg.getByText('SQL导出配置')).toBeVisible();
        await expect(dlg.getByRole('button', { name: '导出' })).toBeVisible();
      } finally {
        if (dsId) {
          const token = await page
            .evaluate(() => localStorage.getItem('Authorization'))
            .catch(() => null);
          if (token) {
            await request
              .delete(`${API}/ncnb/dataSources/${dsId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .catch(() => {});
          }
        }
        await deleteOwnPersonProjects(page).catch(() => {});
      }
    });
  });
});
