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
 * 左树删关系图 / 删模型：禁止本地 mutate 即成功 toast；仅 project/save code===200
 */

const DIAGRAM = '鉴权域';
const MODULE = 'SHOP';

function modulesFromSaveBody(raw: string | null): any[] {
  try {
    const body = raw ? JSON.parse(raw) : {};
    const modules = body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
    return Array.isArray(modules) ? modules : [];
  } catch {
    return [];
  }
}

test.describe('左树删关系图/模型落盘失败可重试', () => {
  test('删关系图：业务码失败仍保留树节点+确认可重试 → 重试成功移出', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('diag-del-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ddfail', 'diagram delete fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await page
        .getByTestId('diagram-switcher')
        .getByRole('button', { name: '新建关系图' })
        .click();
      const createDialog = page.getByRole('dialog', { name: '新建关系图' });
      await createDialog.getByLabel('关系图名称').fill(DIAGRAM);
      await page.getByTestId('diagram-modal-ok').click();
      await expect(page.getByRole('tree').getByText(DIAGRAM, { exact: true })).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const modules = modulesFromSaveBody(route.request().postData());
        // 删关系图：仍有模块，但任意图列表均无「鉴权域」
        const lacksDiagram =
          modules.length > 0
          && modules.every(
            (m: { diagrams?: Array<{ name?: string }> }) =>
              !Array.isArray(m?.diagrams)
              || !m.diagrams.some((d) => d?.name === DIAGRAM),
          )
          && modules.some(
            (m: { diagrams?: unknown[] }) =>
              Array.isArray(m?.diagrams) && m.diagrams.length >= 1,
          );
        if (!lacksDiagram) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟删关系图保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const diagramItem = page.getByRole('treeitem').filter({ hasText: DIAGRAM });
        await diagramItem.getByLabel('关系图操作').click();
        await page.getByRole('menuitem', { name: '删除关系图' }).click();

        const dialog = page.getByRole('dialog').filter({ hasText: /确定删除关系图/ });
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        await expect(dialog.getByText(/仅删除该关系图/).filter({ visible: true })).toBeVisible();
        await dialog.getByRole('button', { name: /删\s*除/ }).filter({ visible: true }).click();

        await expectToast(page, '模拟删关系图保存拒绝');
        await expect(page.getByRole('tree').getByText(DIAGRAM, { exact: true })).toBeVisible();
        await expect(dialog).toBeVisible();
        await expect(page.getByText('关系图删除成功')).toHaveCount(0);

        // toast/HMR iframe 可能挡指针；确认窗已开用 force 重试
        await dialog
          .getByRole('button', { name: /删\s*除/ })
          .filter({ visible: true })
          .click({ force: true });
        await expect(page.getByRole('tree').getByText(DIAGRAM, { exact: true })).toHaveCount(0, {
          timeout: 15_000,
        });
        await expectToast(page, '关系图删除成功');
        await expect(dialog).toHaveCount(0);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('删模型：业务码失败仍保留树+表+确认可重试 → 重试成功移出', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('mod-del-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'mdfail', 'module delete fail');

      await openRelationFromEmpty(page, { name: MODULE, chnname: '商城' });
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const modules = modulesFromSaveBody(route.request().postData());
        // 删模型：payload 含 modules 且已无 SHOP（空数组=删光）
        const lacksModule =
          Array.isArray(modules)
          && !modules.some((m: { name?: string }) => m?.name === MODULE);
        // 仅拦截「缺 SHOP」的落盘（需能识别为项目 JSON：有 projectJSON 键）
        let looksLikeProjectSave = false;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          looksLikeProjectSave =
            !!body?.projectJSON || !!body?.data?.projectJSON;
        } catch {
          looksLikeProjectSave = false;
        }
        if (!looksLikeProjectSave || !lacksModule) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟删模型保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await page.getByLabel('模型操作').click();
        await page.getByRole('menuitem', { name: '删除模型' }).click();

        const dialog = page.getByRole('dialog').filter({ hasText: /确定删除模型/ });
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        await expect(dialog.getByText(/全部表与关系图/).filter({ visible: true })).toBeVisible();
        await dialog.getByRole('button', { name: /删\s*除/ }).filter({ visible: true }).click();

        await expectToast(page, '模拟删模型保存拒绝');
        await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
        await expect(page.getByRole('tree').getByText('商城', { exact: true })).toBeVisible();
        await expect(dialog).toBeVisible();
        await expect(page.getByText('模型删除成功')).toHaveCount(0);

        // toast/HMR iframe 可能挡指针；确认窗已开用 force 重试
        await dialog
          .getByRole('button', { name: /删\s*除/ })
          .filter({ visible: true })
          .click({ force: true });
        await expect(page.getByText('还没有任何模型哦')).toBeVisible({ timeout: 15_000 });
        await expectToast(page, '模型删除成功');
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
