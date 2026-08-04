import { expect, test } from '@playwright/test';
import {
  addFieldInline,
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
 * 画布字段改名 / 删字段：禁止本地 mutate 即成功；仅 project/save code===200
 */

const FIELD_OLD = 'NAME';
const FIELD_RENAMED = 'F_RENAME_FAIL';

test.describe('画布字段改名/删字段落盘失败可重试', () => {
  test('改名：业务码失败仍留编辑态 → 重试成功落盘', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('field-rename-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'frfail', 'field rename fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await addFieldInline(page, 'T_TABLE_1', FIELD_OLD);
      await expect(node.locator(`[data-field="${FIELD_OLD}"]`)).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

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
              (m: { entities?: Array<{ fields?: Array<{ name?: string }> }> }) =>
                Array.isArray(m?.entities)
                && m.entities.some(
                  (e) =>
                    Array.isArray(e?.fields)
                    && e.fields.some((f) => f?.name === FIELD_RENAMED),
                ),
            );
        } catch {
          hasRenamed = false;
        }
        // 仅拦截含新字段名的落盘（勿误伤无关 autosave）
        if (!hasRenamed) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟字段改名保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const nameRow = node.locator(`[data-field="${FIELD_OLD}"]`);
        await nameRow.hover();
        await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
        const nameInput = page.getByRole('textbox', { name: '字段名' });
        await expect(nameInput).toBeVisible({ timeout: 10_000 });
        await nameInput.fill(FIELD_RENAMED);
        await nameInput.press('Enter');

        await expectToast(page, '模拟字段改名保存拒绝');
        // 仍在编辑：草稿保留；未成功落盘则浏览行仍为旧名
        await expect(page.getByRole('textbox', { name: '字段名' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: '字段名' })).toHaveValue(FIELD_RENAMED);
        await expect(node.locator(`[data-field="${FIELD_RENAMED}"]`)).toHaveCount(0);

        await page.getByRole('textbox', { name: '字段名' }).press('Enter');
        await expect(node.locator(`[data-field="${FIELD_RENAMED}"]`)).toBeVisible({
          timeout: 15_000,
        });
        await expect(page.getByRole('textbox', { name: '字段名' })).toHaveCount(0);
        await expect(node.locator(`[data-field="${FIELD_OLD}"]`)).toHaveCount(0);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('删字段：业务码失败仍保留行+确认可重试 → 重试成功移出', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('field-delete-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fdfail', 'field delete fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await addFieldInline(page, 'T_TABLE_1', FIELD_OLD);
      await expect(node.locator(`[data-field="${FIELD_OLD}"]`)).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let lacksField = false;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          const modules =
            body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
          // 删 NAME：payload 中任一实体不再含该字段名（且表仍在）
          lacksField = Array.isArray(modules)
            && modules.some(
              (m: { entities?: Array<{ title?: string; name?: string; fields?: Array<{ name?: string }> }> }) =>
                Array.isArray(m?.entities)
                && m.entities.some((e) => {
                  if (e?.title !== 'T_TABLE_1' && e?.name !== 'T_TABLE_1') return false;
                  if (!Array.isArray(e?.fields)) return false;
                  return !e.fields.some((f) => f?.name === FIELD_OLD);
                }),
            );
        } catch {
          lacksField = false;
        }
        // 仅拦截「缺 NAME」的落盘（勿误伤建表/加字段）
        if (!lacksField) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟删字段保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const nameRow = node.locator(`[data-field="${FIELD_OLD}"]`);
        await nameRow.hover();
        const delBtn = nameRow.getByRole('button', { name: '删除字段' });
        // 右柄常挡 ×；与 relation 删字段一致用 DOM click
        await delBtn.evaluate((el: HTMLElement) => el.click());

        const dialog = page.getByRole('dialog').filter({ hasText: /不可逆/ });
        await expect(dialog.getByText(/确定删除字段/).filter({ visible: true })).toBeVisible();
        // antd 确认钮文案可能含空格（删\s*除）
        await dialog.getByRole('button', { name: /删\s*除/ }).click();

        await expectToast(page, '模拟删字段保存拒绝');
        // 字段仍在；确认窗保持可重试（antd Promise.reject）
        await expect(node.locator(`[data-field="${FIELD_OLD}"]`)).toBeVisible();
        await expect(dialog).toBeVisible();

        await dialog.getByRole('button', { name: /删\s*除/ }).click();
        await expect(node.locator(`[data-field="${FIELD_OLD}"]`)).toHaveCount(0, {
          timeout: 15_000,
        });
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
