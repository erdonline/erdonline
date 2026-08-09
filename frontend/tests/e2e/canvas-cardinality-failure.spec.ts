import { expect, test } from '@playwright/test';
import {
  addFieldInline,
  addEntityViaTreeFolder,
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
 * 画布改边基数：禁止本地 mutate 即换 chip；仅 project/save code===200
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

function hasTargetCardOneToOne(modules: any[]): boolean {
  return modules.some(
    (m: {
      associations?: Array<{
        relation?: string;
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
          && a?.relation === '1:1',
      ),
  );
}

test.describe('画布改边基数落盘失败可重试', () => {
  test('改基数业务码失败：可读 toast + 保持 n:1 → 重试成功变为 1:1', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('edge-card-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ecfail', 'edge card fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await addFieldInline(page, 'T_ORDER', 'USER_ID', 'IdOrKey');
      await connectFields(page, 'T_ORDER', 'USER_ID', 'T_TABLE_1', 'id');
      await expect(page.getByTestId('erd-edge-label')).toHaveText('n:1');
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      let saveHits = 0;
      let armed = false;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST' || !armed) {
          await route.continue();
          return;
        }
        const modules = modulesFromSaveBody(route.request().postData());
        if (!hasTargetCardOneToOne(modules)) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟基数保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        armed = true;
        const edgeLabel = page.getByTestId('erd-edge-label');
        await edgeLabel.click();
        await expect(page.getByTestId('erd-edge-cardinality')).toBeVisible({ timeout: 5_000 });
        await page.getByRole('option', { name: '1:1' }).click();

        await expectToast(page, /模拟基数保存拒绝/);
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('erd-edge-fk-editor')).toHaveCount(0);
        await expect(page.getByTestId('erd-edge-label')).toHaveText('n:1');
        await expect(page.getByTestId('erd-edge-crowfoot')).toHaveAttribute(
          'data-relation',
          'n:1',
        );

        // 重试：再开 Select 选 1:1
        await page.getByTestId('erd-edge-label').click();
        await expect(page.getByTestId('erd-edge-cardinality')).toBeVisible({ timeout: 5_000 });
        await page.getByRole('option', { name: '1:1' }).click();
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('erd-edge-label')).toHaveText('1:1', { timeout: 15_000 });
        await expect(page.getByTestId('erd-edge-crowfoot')).toHaveAttribute(
          'data-relation',
          '1:1',
        );
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save');
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
