import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 画布「新建关系图」：禁止本地 mutate 即 toast/关窗；仅 project/save code===200 成功
 */

const MOCK_DIAGRAM = 'E2E_DIAG_FAIL';

test.describe('画布关系图弹层落盘失败不关窗', () => {
  test('业务码失败：可读 toast + 窗仍开 → 重试成功关窗', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('diagram-modal-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'diagfail', 'diagram modal fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      // 画布工具栏「新建图」（勿点左树 folder +）
      await page
        .getByRole('button', { name: '新建关系图' })
        .filter({ hasText: '新建图' })
        .click();
      const dialog = page.getByRole('dialog', { name: '新建关系图' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByRole('textbox', { name: '关系图名称' }).fill(MOCK_DIAGRAM);

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let hasDiagram = false;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          const modules =
            body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
          hasDiagram = Array.isArray(modules)
            && modules.some(
              (m: { diagrams?: Array<{ name?: string }> }) =>
                Array.isArray(m?.diagrams)
                && m.diagrams.some((d) => d?.name === MOCK_DIAGRAM),
            );
        } catch {
          hasDiagram = false;
        }
        // 仅拦截含本次新图名的落盘（勿误伤无关 autosave）
        if (!hasDiagram) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟关系图保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await dialog.getByRole('button', { name: /创\s*建/ }).click();
        await expectToast(page, '模拟关系图保存拒绝');
        await expect(dialog).toBeVisible();
        await expect(page.getByText('已新建关系图')).toHaveCount(0);

        await dialog.getByRole('button', { name: /创\s*建/ }).click();
        await expectToast(page, '已新建关系图');
        await expect(dialog).toHaveCount(0);
        await expect(page.getByTestId('diagram-switcher')).toContainText(MOCK_DIAGRAM);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
