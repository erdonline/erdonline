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
  uniqueProjectName,
} from './helpers';

/**
 * 画布边 ON DELETE / ON UPDATE：点 chip → 选参照动作 → persist-on-200；失败可重试。
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

function hasCascadeDelete(modules: any[]): boolean {
  return modules.some(
    (m: {
      associations?: Array<{
        deleteRule?: string;
        from?: { entity?: string; field?: string };
        to?: { entity?: string; field?: string };
      }>;
    }) =>
      (m?.associations || []).some(
        (a) =>
          a?.from?.entity === 'T_ORDER'
          && a?.from?.field === 'USER_ID'
          && a?.to?.entity === 'T_TABLE_1'
          && a?.to?.field === 'id'
          && a?.deleteRule === 'CASCADE',
      ),
  );
}

test.describe('画布边 FK 参照动作可编辑', () => {
  test('ON DELETE/UPDATE 落盘 + 失败可重试', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('edge-fk-meta');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'efk', 'edge fk meta');

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
      await expect(page.getByTestId('erd-edge-label')).toHaveText('n:1');
      await expect(page.getByTestId('erd-edge-fk-meta')).toHaveAttribute('data-delete-rule', '');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      let saveHits = 0;
      let armed = false;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST' || !armed) {
          await route.continue();
          return;
        }
        const raw = route.request().postData();
        const mods = modulesFromSaveBody(raw);
        if (hasCascadeDelete(mods)) {
          saveHits += 1;
          if (saveHits === 1) {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ code: 500, msg: '模拟 FK 规则保存拒绝' }),
            });
            return;
          }
        }
        await route.continue();
      });

      try {
        armed = true;
        const edgeLabel = page.getByTestId('erd-edge-label');
        await edgeLabel.click();
        await expect(page.getByTestId('erd-edge-fk-editor')).toBeVisible({ timeout: 5_000 });
        await expect(page.getByTestId('erd-edge-delete-rule')).toBeVisible();
        await expect(page.getByTestId('erd-edge-update-rule')).toBeVisible();
        // 先收基数下拉，避免盖住 ON DELETE 选项
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('erd-edge-fk-editor')).toBeVisible();

        await page.getByTestId('erd-edge-delete-rule').click();
        await page.getByRole('option', { name: 'ON DELETE CASCADE' }).click();
        await expectToast(page, /模拟 FK 规则保存拒绝/);
        await expect(page.getByTestId('erd-edge-fk-meta')).toHaveAttribute(
          'data-delete-rule',
          '',
        );

        await page.getByTestId('erd-edge-delete-rule').click();
        await page.getByRole('option', { name: 'ON DELETE CASCADE' }).click();
        await expect(page.getByTestId('erd-edge-fk-meta')).toHaveAttribute(
          'data-delete-rule',
          'CASCADE',
          { timeout: 15_000 },
        );
        await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

        // 若 toast 误关编辑器则重开
        if ((await page.getByTestId('erd-edge-fk-editor').count()) === 0) {
          await page.getByTestId('erd-edge-label').click();
          await page.keyboard.press('Escape'); // 收基数下拉
        }
        await expect(page.getByTestId('erd-edge-fk-editor')).toBeVisible({ timeout: 5_000 });

        await page.getByTestId('erd-edge-update-rule').click();
        await page.getByRole('option', { name: 'ON UPDATE RESTRICT' }).click();
        await expect(page.getByTestId('erd-edge-fk-meta')).toHaveAttribute(
          'data-update-rule',
          'RESTRICT',
          { timeout: 15_000 },
        );
        await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

        // Esc 关编辑器（基数下拉已收则一次）
        await page.keyboard.press('Escape');
        if ((await page.getByTestId('erd-edge-fk-editor').count()) > 0) {
          await page.keyboard.press('Escape');
        }
        await expect(page.getByTestId('erd-edge-fk-editor')).toHaveCount(0);
        await expect(page.getByTestId('erd-edge-label')).toHaveAttribute(
          'title',
          /ON DELETE CASCADE/,
        );
        await expect(page.getByTestId('erd-edge-label')).toHaveAttribute(
          'title',
          /ON UPDATE RESTRICT/,
        );

        const designUrl = page.url();
        await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
        await page.getByTestId('tree-open-relation').click();
        await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByTestId('erd-edge-fk-meta')).toHaveAttribute(
          'data-delete-rule',
          'CASCADE',
          { timeout: 15_000 },
        );
        await expect(page.getByTestId('erd-edge-fk-meta')).toHaveAttribute(
          'data-update-rule',
          'RESTRICT',
        );
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save');
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
