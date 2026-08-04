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
 * 画布建表 / 行内加字段：禁止本地 mutate 即成功；仅 project/save code===200
 */

const MOCK_FIELD = 'F_ADD_FAIL';

test.describe('画布建表/加字段落盘失败可重试', () => {
  test('建表：业务码失败不出现节点 → 重试成功上图', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('canvas-create-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ctfail', 'canvas create fail');

      await openRelationFromEmpty(page);

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let hasTable = false;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          const modules =
            body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
          hasTable = Array.isArray(modules)
            && modules.some(
              (m: { entities?: Array<{ title?: string; name?: string }> }) =>
                Array.isArray(m?.entities)
                && m.entities.some(
                  (e) => e?.title === 'T_TABLE_1' || e?.name === 'T_TABLE_1',
                ),
            );
        } catch {
          hasTable = false;
        }
        // 仅拦截含新表的落盘（勿误伤无关 autosave）
        if (!hasTable) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟建表保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await page.getByTestId('canvas-empty-create').click();
        await expectToast(page, '模拟建表保存拒绝');
        await expect(page.getByText('表添加成功')).toHaveCount(0);
        await expect(page.locator('.react-flow__node[data-id="T_TABLE_1"]')).toHaveCount(0);

        await page.getByTestId('canvas-empty-create').click();
        await expectToast(page, '表添加成功');
        await expect(rfNode(page, 'T_TABLE_1')).toBeVisible({ timeout: 15_000 });
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('行内加字段：业务码失败仍留编辑态 → 重试成功落盘', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('canvas-field-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'cffail', 'canvas field fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let hasField = false;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          const modules =
            body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
          hasField = Array.isArray(modules)
            && modules.some(
              (m: { entities?: Array<{ fields?: Array<{ name?: string }> }> }) =>
                Array.isArray(m?.entities)
                && m.entities.some(
                  (e) =>
                    Array.isArray(e?.fields)
                    && e.fields.some((f) => f?.name === MOCK_FIELD),
                ),
            );
        } catch {
          hasField = false;
        }
        // 仅拦截含新字段名的落盘（勿误伤无关 autosave）
        if (!hasField) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟加字段保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await node.getByTestId('canvas-add-field').click();
        const nameInput = page.getByRole('textbox', { name: '字段名' });
        await expect(nameInput).toBeVisible({ timeout: 10_000 });
        await nameInput.fill(MOCK_FIELD);
        await nameInput.press('Enter');

        await expectToast(page, '模拟加字段保存拒绝');
        // 仍在编辑：草稿保留；未成功落盘则无浏览行
        await expect(page.getByRole('textbox', { name: '字段名' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: '字段名' })).toHaveValue(MOCK_FIELD);
        await expect(node.locator(`[data-field="${MOCK_FIELD}"]`)).toHaveCount(0);

        await page.getByRole('textbox', { name: '字段名' }).press('Enter');
        await expect(node.locator(`[data-field="${MOCK_FIELD}"]`)).toBeVisible({
          timeout: 15_000,
        });
        await expect(page.getByRole('textbox', { name: '字段名' })).toHaveCount(0);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
