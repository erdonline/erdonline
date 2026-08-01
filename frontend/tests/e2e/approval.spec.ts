import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  uniqueProjectName,
} from './helpers';

test.describe('版本工单/审批', () => {
  test('侧栏打开我的工单与我的审批，表头正确且有空态引导', async ({ page }) => {
    const projectName = uniqueProjectName('approval');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'approval', 'approval pages');

      await page.getByRole('menuitem', { name: '版本', exact: true }).click();
      await page.getByRole('link', { name: '我的工单' }).click();
      await expect(page.getByTestId('page-title-orders')).toHaveText('我的工单');
      await expect(page.getByText(/暂无工单/)).toBeVisible();

      await page.getByRole('menuitem', { name: '版本', exact: true }).click();
      await page.getByRole('link', { name: '我的审批' }).click();
      await expect(page.getByTestId('page-title-approvals')).toHaveText('我的审批');
      await expect(page.getByText(/暂无待审/)).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
