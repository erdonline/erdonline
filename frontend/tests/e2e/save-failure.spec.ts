import { expect, test } from '@playwright/test';
import {
  addFieldInline,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 建模回路：自动保存失败须有可见反馈 + 顶栏重试 CTA（对齐全设计原则「保存失败，点击重试」）
 */
test.describe('自动保存失败可重试', () => {
  test('断网保存失败：单条 toast + 顶栏重试落库', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('savefail');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'savefail', 'autosave retry');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await page.route('**/ncnb/project/save', (route) => route.abort('failed'));
      await addFieldInline(page, 'T_TABLE_1', 'NAME');

      await expectToast(page, '网络异常，请检查网络连接');
      // errorHandler 已弹网络异常；勿再叠「自动保存失败」
      await expect(page.getByText('自动保存失败')).toHaveCount(0);

      const retry = page.getByRole('button', { name: '自动保存失败，点击重试' });
      await expect(retry).toBeVisible({ timeout: 10_000 });
      await expect(retry).toHaveText('保存失败，点击重试');
      await expect(page.getByTestId('save-status')).toHaveAttribute(
        'aria-label',
        '自动保存失败，点击重试',
      );

      await page.unroute('**/ncnb/project/save');
      await retry.click();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await expect(page.getByRole('button', { name: '自动保存失败，点击重试' })).toHaveCount(0);

      const designUrl = page.url();
      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 15_000 });
      await expect(rfNode(page, 'T_TABLE_1').locator('[data-field="NAME"]')).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('业务码失败：toast 指引顶栏重试并恢复', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('savebiz');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'savebiz', 'autosave biz fail');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await page.route('**/ncnb/project/save', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '模拟保存拒绝' }),
        });
      });
      await addFieldInline(page, 'T_TABLE_1', 'CODE');

      await expectToast(page, '模拟保存拒绝');
      const retry = page.getByRole('button', { name: '自动保存失败，点击重试' });
      await expect(retry).toBeVisible({ timeout: 10_000 });

      await page.unroute('**/ncnb/project/save');
      await retry.click();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
