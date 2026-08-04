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
 * 画布表头改名：禁止本地 mutate 即退出编辑；仅 project/save code===200 成功
 */

const MOCK_TITLE = 'T_RENAME_FAIL';

test.describe('画布表头改名落盘失败不退出编辑', () => {
  test('业务码失败：可读 toast + 编辑态仍开 → 重试成功退出', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('table-rename-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'trfail', 'table rename fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await node.getByTestId('table-rename-btn').evaluate((el: HTMLElement) => el.click());
      const nameInput = page.getByRole('textbox', { name: '表名' });
      await expect(nameInput).toBeVisible({ timeout: 10_000 });
      await nameInput.fill(MOCK_TITLE);

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let hasRenamed = false;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          const modules =
            body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
          hasRenamed = Array.isArray(modules)
            && modules.some(
              (m: { entities?: Array<{ title?: string; name?: string }> }) =>
                Array.isArray(m?.entities)
                && m.entities.some(
                  (e) => e?.title === MOCK_TITLE || e?.name === MOCK_TITLE,
                ),
            );
        } catch {
          hasRenamed = false;
        }
        // 仅拦截含新表名的落盘（勿误伤无关 autosave）
        if (!hasRenamed) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟表改名保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await nameInput.press('Enter');
        await expectToast(page, '模拟表改名保存拒绝');
        // 仍在编辑：草稿保留；未成功落盘则节点 id 仍为旧名（编辑态无表头可见文案，用 data-id）
        await expect(page.getByRole('textbox', { name: '表名' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: '表名' })).toHaveValue(MOCK_TITLE);
        await expect(page.locator(`.react-flow__node[data-id="T_TABLE_1"]`)).toBeVisible();
        await expect(page.locator(`.react-flow__node[data-id="${MOCK_TITLE}"]`)).toHaveCount(0);

        await page.getByRole('textbox', { name: '表名' }).press('Enter');
        await expect(rfNode(page, MOCK_TITLE)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('textbox', { name: '表名' })).toHaveCount(0);
        await expect(page.locator('.react-flow__node', { hasText: 'T_TABLE_1' })).toHaveCount(0);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
