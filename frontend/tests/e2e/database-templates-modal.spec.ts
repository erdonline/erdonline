import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * DDL 模板：设置内 Modal 编辑，不跳转独立路由
 */
test.describe('DDL 模板弹窗', () => {
  test('数据类型字典页打开 DDL 模板 Modal', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('ddl-tpl');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ddltpl', 'ddl templates modal');

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();
      await page.goto(`/design/table/setting/dataType?projectId=${projectId}`);
      await expect(page.getByTestId('datatype-domains-page')).toBeVisible({
        timeout: 15_000,
      });

      await page.getByTestId('datatype-open-ddl-templates').click();
      await expect(page.getByTestId('database-templates-editor')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByTestId('database-templates-dialect')).toBeVisible();
      await expect(page.getByTestId('database-templates-tab')).toBeVisible();
      await expect(page.getByTestId('database-templates-preview')).toBeVisible();

      const dialectSelect = page.getByTestId('database-templates-dialect');
      await expect(dialectSelect).toContainText('MYSQL');

      await expect(page.getByTestId('database-templates-preview-sql')).toBeVisible();
      await expect(page.getByTestId('database-templates-preview-loading')).toBeHidden({
        timeout: 15_000,
      });
      await expect(page.getByTestId('database-templates-preview-sql')).toContainText(
        'CREATE TABLE',
        { timeout: 5_000 },
      );

      await page.getByRole('button', { name: '关闭 DDL 模板' }).click();
      await expect(page.getByTestId('database-templates-editor')).toBeHidden({
        timeout: 5_000,
      });
    } finally {
      await deleteOwnPersonProjects(page);
    }
  });

  test('旧深链重定向至 dataType 并自动打开 Modal', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('ddl-redir');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ddlredir', 'ddl redirect');

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();
      await page.goto(
        `/design/table/setting/databaseTemplates?projectId=${projectId}`,
      );
      await expect(page).toHaveURL(/\/design\/table\/setting\/dataType/, {
        timeout: 15_000,
      });
      await expect(page.getByTestId('database-templates-editor')).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await deleteOwnPersonProjects(page);
    }
  });
});
