import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  gotoDesignModel,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * W6 `/design/table/setting/defaultField`：编辑有 toast，新表带默认字段
 */
test.describe('默认字段设置', () => {
  test.describe.configure({ retries: 1 });

  test('编辑保存有 toast，新建表带更新后的默认字段', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('deffield');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();
      await page.goto(
        `/design/table/setting/defaultField?projectId=${projectId}`,
      );
      await expect(page).toHaveURL(/\/design\/table\/setting\/defaultField/, {
        timeout: 15_000,
      });
      const sheet = page.getByTestId('default-field-page');
      await expect(sheet).toBeVisible({ timeout: 15_000 });
      // jspreadsheet 结构单元格（非 antd）；改主键英文字段名验证闭环
      const idCell = sheet.getByText('id', { exact: true }).first();
      await expect(idCell).toBeVisible({ timeout: 10_000 });
      await idCell.dblclick();
      await page.keyboard.type('e2e_pk');
      await page.keyboard.press('Enter');
      await expectToast(page, '默认字段已更新');

      await gotoDesignModel(page);
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const firstNode = rfNode(page, 'T_TABLE_1');
      await expect(firstNode).toBeVisible({ timeout: 15_000 });
      await expect(firstNode).toContainText('e2e_pk');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
