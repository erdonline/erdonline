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
 * 画布拖连线建关联：禁止本地 mutate 即上边；仅 project/save code===200
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

function hasTargetAssoc(modules: any[]): boolean {
  return modules.some(
    (m: { associations?: Array<{ from?: { entity?: string; field?: string }; to?: { entity?: string; field?: string } }> }) =>
      (m?.associations || []).some(
        (a) =>
          a?.from?.entity === 'T_ORDER'
          && a?.from?.field === 'USER_ID'
          && a?.to?.entity === 'T_TABLE_1'
          && a?.to?.field === 'id',
      ),
  );
}

test.describe('画布连线落盘失败可重试', () => {
  test('连线业务码失败：可读 toast + 不上边 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('edge-add-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'eafail', 'edge add fail');

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
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      expect(await page.locator('.react-flow__edge').count()).toBe(0);

      let saveHits = 0;
      let armed = false;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST' || !armed) {
          await route.continue();
          return;
        }
        const modules = modulesFromSaveBody(route.request().postData());
        if (!hasTargetAssoc(modules)) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟连线保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        armed = true;
        // 首拒：不走 helpers.connectFields（其断言边+1）；手工拖后断言不上边
        await page.getByRole('button', { name: '适应画布' }).click();
        await page.waitForTimeout(500);
        const fromNode = rfNode(page, 'T_ORDER');
        const toNode = rfNode(page, 'T_TABLE_1');
        await fromNode.hover();
        const src = fromNode.locator('[data-field="USER_ID"]').locator('[data-handleid="USER_ID-src-r"]');
        await toNode.hover();
        const tgt = toNode.locator('[data-field="id"]').locator('[data-handleid="id-tgt-l"]');
        await expect(src).toBeVisible();
        await expect(tgt).toBeVisible();
        await src.dragTo(tgt, { force: true, steps: 12 });

        await expectToast(page, /模拟连线保存拒绝/);
        await expect(page.locator('.react-flow__edge')).toHaveCount(0);
        await expect(page.getByTestId('erd-edge-label')).toHaveCount(0);

        // 重试：helpers 等待上边
        await connectFields(page, 'T_ORDER', 'USER_ID', 'T_TABLE_1', 'id');
        await expect(page.getByTestId('erd-edge-label')).toHaveCount(1);
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
