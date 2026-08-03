import { expect, test } from '@playwright/test';
import {
  addFieldInline,
  connectFields,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  selectRelationEdge,
  uniqueProjectName,
} from './helpers';

/**
 * 画布删边 / 删分组：禁止本地 mutate 即成功 toast；仅 project/save code===200
 */

function modulesFromSaveBody(raw: string | null): any[] {
  try {
    const body = raw ? JSON.parse(raw) : {};
    const modules = body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
    return Array.isArray(modules) ? modules : [];
  } catch {
    return [];
  }
}

test.describe('画布删边/删分组落盘失败可重试', () => {
  test('删边：业务码失败仍保留边+确认可重试 → 重试成功移出', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('edge-del-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'edfail', 'edge delete fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await page.getByTestId('design-tree-add').click();
      await page.getByTestId('menu-add-entity').click();
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_ORDER', 'USER_ID', 'IdOrKey');
      await connectFields(page, 'T_ORDER', 'USER_ID', 'T_TABLE_1', 'id');
      await expect(page.getByTestId('erd-edge-label')).toHaveCount(1);
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const modules = modulesFromSaveBody(route.request().postData());
        const hasOrder = modules.some(
          (m: { entities?: Array<{ title?: string; name?: string }> }) =>
            Array.isArray(m?.entities)
            && m.entities.some((e) => e?.title === 'T_ORDER' || e?.name === 'T_ORDER'),
        );
        const lacksAssoc =
          hasOrder
          && modules.every(
            (m: { associations?: Array<{ from?: { entity?: string; field?: string }; to?: { entity?: string; field?: string } }> }) =>
              !(m?.associations || []).some(
                (a) =>
                  a?.from?.entity === 'T_ORDER'
                  && a?.from?.field === 'USER_ID'
                  && a?.to?.entity === 'T_TABLE_1'
                  && a?.to?.field === 'id',
              ),
          );
        if (!lacksAssoc) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟删边保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await selectRelationEdge(page);
        await page.keyboard.press('Delete');

        const dialog = page.getByRole('dialog').filter({ hasText: /确定删除关系/ });
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
        await dialog.getByRole('button', { name: /删\s*除/ }).filter({ visible: true }).click();

        await expectToast(page, '模拟删边保存拒绝');
        await expect(page.getByTestId('erd-edge-label')).toHaveCount(1);
        await expect(dialog).toBeVisible();
        await expect(page.getByText('关系删除成功')).toHaveCount(0);

        await dialog
          .getByRole('button', { name: /删\s*除/ })
          .filter({ visible: true })
          .click({ force: true });
        await expect(page.getByTestId('erd-edge-label')).toHaveCount(0, { timeout: 15_000 });
        await expectToast(page, '关系删除成功');
        await expect(dialog).toHaveCount(0);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('删分组：业务码失败仍保留框+确认可重试 → 重试成功移出', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('frame-del-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fdfail', 'frame delete fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await page.getByRole('button', { name: '命令' }).click();
      await expect(page.getByRole('dialog', { name: '命令面板' })).toBeVisible();
      await page.getByTestId('cmd-palette-input').fill('新建');
      await page.getByRole('option', { name: /新建表/ }).click();
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await rfNode(page, 'T_TABLE_1').click();
      await rfNode(page, 'T_TABLE_2').click({ modifiers: ['Shift'] });
      await page.getByRole('button', { name: '新建分组' }).click();
      const frame = page.getByTestId('diagram-frame');
      await expect(frame).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const modules = modulesFromSaveBody(route.request().postData());
        const hasTwoTables =
          modules.length > 0
          && modules.some((m: { entities?: unknown[] }) => (m?.entities || []).length >= 2);
        const lacksFrame =
          hasTwoTables
          && modules.every(
            (m: { diagrams?: Array<{ groups?: unknown[] }> }) =>
              !Array.isArray(m?.diagrams)
              || m.diagrams.every(
                (d) => !Array.isArray(d?.groups) || d.groups.length === 0,
              ),
          );
        if (!lacksFrame) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟删分组保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await frame.click({ position: { x: 16, y: 12 }, force: true });
        await expect(page.getByRole('button', { name: '适应成员' })).toBeVisible({
          timeout: 5_000,
        });
        const trigger = page.getByTestId('frame-rename-label');
        await trigger.focus();
        await expect(trigger).toBeFocused();
        await page.keyboard.press('Delete');

        const dialog = page.getByRole('dialog').filter({ hasText: /确定删除分组/ });
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        await expect(dialog.getByText(/仅删除分组框/).filter({ visible: true })).toBeVisible();
        await dialog.getByRole('button', { name: /删\s*除/ }).filter({ visible: true }).click();

        await expectToast(page, '模拟删分组保存拒绝');
        await expect(page.getByTestId('diagram-frame')).toBeVisible();
        await expect(dialog).toBeVisible();
        await expect(page.getByText('已删除分组')).toHaveCount(0);

        await dialog
          .getByRole('button', { name: /删\s*除/ })
          .filter({ visible: true })
          .click({ force: true });
        await expect(page.getByTestId('diagram-frame')).toHaveCount(0, { timeout: 15_000 });
        await expectToast(page, '已删除分组');
        await expect(dialog).toHaveCount(0);
        await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
        await expect(rfNode(page, 'T_TABLE_2')).toBeVisible();
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
