import { expect, test } from '@playwright/test';
import {
  addEntityViaTreeFolder,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  expectSavedToServer,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 左树剪切/粘贴表：禁止本地 mutate 即成功 toast；仅 project/save code===200
 */

const PASTE_TITLE = 'T_TABLE_1副本';

function modulesFromSaveBody(raw: string | null): any[] {
  try {
    const body = raw ? JSON.parse(raw) : {};
    const modules = body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
    return Array.isArray(modules) ? modules : [];
  } catch {
    return [];
  }
}

function entityTitles(modules: any[]): string[] {
  const out: string[] = [];
  for (const m of modules) {
    for (const e of m?.entities || []) {
      const t = e?.title || e?.name;
      if (t) out.push(t);
    }
  }
  return out;
}

test.describe('左树剪切/粘贴表落盘失败可重试', () => {
  test('粘贴表：业务码失败仍不建副本 → 重试成功出现', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('paste-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'pfail', 'paste fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expectSavedToServer(page, 15_000);

      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '复制表' }).click();
      await expectToast(page, /已成功复制到剪贴板/);

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const modules = modulesFromSaveBody(route.request().postData());
        const hasPaste = entityTitles(modules).includes(PASTE_TITLE);
        if (!hasPaste) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟粘贴表保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await page.getByLabel('表操作').click();
        await page.getByRole('menuitem', { name: '粘贴到表' }).click();

        await expectToast(page, '模拟粘贴表保存拒绝');
        await expect(page.getByRole('tree').getByText(PASTE_TITLE, { exact: true })).toHaveCount(0);
        await expect(rfNode(page, PASTE_TITLE)).toHaveCount(0);
        await expect(page.getByText(/已成功粘贴到模型/)).toHaveCount(0);

        await page.getByLabel('表操作').click();
        await page.getByRole('menuitem', { name: '粘贴到表' }).click();
        // 树行同时渲染 title + chnname，二者均可为「…副本」→ 勿对 tree getByText 用 strict 单点
        await expect(rfNode(page, PASTE_TITLE)).toBeVisible({ timeout: 15_000 });
        await expectToast(page, /已成功粘贴到模型/);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('剪切表：业务码失败仍保留表 → 重试成功移出', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('cut-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'cfail', 'cut fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expectSavedToServer(page, 15_000);

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_KEEP');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_KEEP')).toBeVisible();
      await expectSavedToServer(page, 15_000);

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const titles = entityTitles(modulesFromSaveBody(route.request().postData()));
        // 剪切 T_TABLE_1：仍有表但不含 T_TABLE_1，且含 T_KEEP
        const lacksCut =
          titles.includes('T_KEEP') && !titles.includes('T_TABLE_1');
        if (!lacksCut) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟剪切表保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        // 左树第一张表的「表操作」（T_TABLE_1）
        await page.getByLabel('表操作').first().click();
        await page.getByRole('menuitem', { name: '剪切表' }).click();

        await expectToast(page, '模拟剪切表保存拒绝');
        await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
        await expect(page.getByRole('tree').getByText('T_TABLE_1', { exact: true })).toBeVisible();
        await expect(page.getByText(/已成功剪切到剪贴板/)).toHaveCount(0);
        await expect(page.getByText('剪切成功')).toHaveCount(0);

        await page.getByLabel('表操作').first().click();
        await page.getByRole('menuitem', { name: '剪切表' }).click();
        await expect(rfNode(page, 'T_TABLE_1')).toHaveCount(0, { timeout: 15_000 });
        await expectToast(page, /已成功剪切到剪贴板/);
        await expect(rfNode(page, 'T_KEEP')).toBeVisible();
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
