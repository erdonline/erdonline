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
 * 画布删表：禁止本地 mutate 即「表删除成功」；仅 project/save code===200
 */

const TABLE = 'T_TABLE_1';

test.describe('画布删表落盘失败可重试', () => {
  test('业务码失败仍保留节点+确认可重试 → 重试成功移出', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('table-del-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'tdfail', 'table delete fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, TABLE);
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let lacksTable = false;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          const modules =
            body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
          // 删表：全项目不再含该 title（勿用 some 空实体误伤）
          lacksTable = Array.isArray(modules)
            && modules.length > 0
            && modules.every(
              (m: { entities?: Array<{ title?: string; name?: string }> }) =>
                !Array.isArray(m?.entities)
                || !m.entities.some((e) => e?.title === TABLE || e?.name === TABLE),
            );
        } catch {
          lacksTable = false;
        }
        // 仅拦截「缺 T_TABLE_1」的落盘（勿误伤建表）
        if (!lacksTable) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟删表保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        // 选中表头（勿双击进改名）；与 relation / canvas-delete-table-keyboard 同形
        await page.locator('.react-flow__pane').click({ position: { x: 8, y: 8 }, force: true });
        await node.locator('.erd-table-title').click();
        await expect(node).toHaveClass(/selected/);
        await expect(node.locator('input[aria-label="表名"]')).toHaveCount(0);
        await page.keyboard.press('Delete');

        const dialog = page.getByRole('dialog').filter({ hasText: /确定删除表/ });
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
        await dialog.getByRole('button', { name: /删\s*除/ }).filter({ visible: true }).click();

        await expectToast(page, '模拟删表保存拒绝');
        // 表仍在；确认窗保持可重试（antd Promise.reject）
        await expect(rfNode(page, TABLE)).toBeVisible();
        await expect(dialog).toBeVisible();
        await expect(page.getByText('表删除成功')).toHaveCount(0);

        await dialog.getByRole('button', { name: /删\s*除/ }).filter({ visible: true }).click();
        await expect(rfNode(page, TABLE)).toHaveCount(0, { timeout: 15_000 });
        await expectToast(page, '表删除成功');
        await expect(dialog).toHaveCount(0);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
