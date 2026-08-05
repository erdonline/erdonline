import { expect, test, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * Vision #26 / ADR-0022：落库失败顶栏重试 vs 409 冲突 Modal 不得混态。
 * - 失败重试：`save-status`「保存失败，点击重试」+ retry aria；无冲突 Modal
 * - 409 冲突：`save-status`「保存冲突，点击查看选项」+ 冲突 Modal；无失败重试 CTA
 */

const RETRY_FAILURE_ARIA = '自动保存失败，改动已存本地，点击重试';

async function openDesignerWithTable(page: Page, projectName: string) {
  await login(page);
  await deleteOwnPersonProjects(page);
  await createAndOpenPersonProject(page, projectName, 'routing', 'save status routing');
  await openRelationFromEmpty(page);
  await page.getByTestId('canvas-empty-create').click();
  await expect(rfNode(page, 'T_TABLE_1')).toBeVisible({ timeout: 25_000 });
  await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 25_000 });
  await page.waitForTimeout(1_500);
}

async function assertNoConflictUi(page: Page) {
  await expect(page.getByRole('dialog', { name: '保存冲突' })).toHaveCount(0);
  await expect(page.getByTestId('project-save-conflict-modal')).toHaveCount(0);
  await expect(page.getByTestId('save-status')).not.toHaveText('保存冲突，点击查看选项');
}

async function assertNoRetryFailureUi(page: Page) {
  await expect(page.getByRole('button', { name: RETRY_FAILURE_ARIA })).toHaveCount(0);
  await expect(page.getByTestId('save-status')).not.toHaveText('保存失败，点击重试');
}

test.describe('顶栏失败态分流：重试 vs 409 冲突', () => {
  test('落库失败 → 顶栏重试 CTA，不出现冲突 Modal', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('fail-routing');
    try {
      await openDesignerWithTable(page, projectName);

      await page.route('**/ncnb/project/save', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '模拟落库拒绝' }),
        });
      });

      await page.getByTestId('canvas-create-table').click();
      await expectToast(page, '模拟落库拒绝');

      const retry = page.getByRole('button', { name: RETRY_FAILURE_ARIA });
      await expect(retry).toBeVisible({ timeout: 15_000 });
      await expect(retry).toHaveText('保存失败，点击重试');
      await expect(page.getByTestId('save-status')).toHaveAttribute('aria-label', RETRY_FAILURE_ARIA);

      await assertNoConflictUi(page);
    } finally {
      await page.unroute('**/ncnb/project/save').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('409 冲突 → 冲突 Modal + 顶栏冲突态，不出现失败重试 CTA', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('conflict-routing');
    try {
      await openDesignerWithTable(page, projectName);

      await page.route('**/ncnb/project/save', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 409,
            msg: '项目已被其他窗口或协作者更新，请刷新后再保存',
            data: null,
          }),
        });
      });

      await page.getByTestId('canvas-create-table').click();
      await expect(page.getByRole('dialog', { name: '保存冲突' })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByTestId('project-save-conflict-modal')).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByTestId('save-status')).toHaveText('保存冲突，点击查看选项');

      await assertNoRetryFailureUi(page);
      await expect(page.getByTestId('save-status')).not.toHaveText('已落盘');
    } finally {
      await page.unroute('**/ncnb/project/save').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
