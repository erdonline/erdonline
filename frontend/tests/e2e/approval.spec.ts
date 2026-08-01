import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  uniqueProjectName,
} from './helpers';

/** 模型页侧栏是树，ProLayout「版本」menuitem 不可见；与 version.spec 一致用 goto */
async function gotoVersionSub(
  page: import('@playwright/test').Page,
  sub: 'order' | 'approval',
) {
  const projectId = new URL(page.url()).searchParams.get('projectId');
  await page.goto(
    `/design/table/version/${sub}${projectId ? `?projectId=${projectId}` : ''}`,
  );
  await expect(page).toHaveURL(new RegExp(`/design/table/version/${sub}`), {
    timeout: 15_000,
  });
}

test.describe('版本工单/审批', () => {
  test('侧栏打开我的工单与我的审批，表头正确且有空态引导', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('approval');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'approval', 'approval pages');

      await gotoVersionSub(page, 'order');
      await expect(page.getByTestId('page-title-orders')).toHaveText('我的工单');
      await expect(page.getByText(/暂无工单/)).toBeVisible();

      await gotoVersionSub(page, 'approval');
      await expect(page.getByTestId('page-title-approvals')).toHaveText('我的审批');
      await expect(page.getByText(/暂无待审/)).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
