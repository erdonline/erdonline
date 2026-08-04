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
 * Frame 新建 / 加入成员：禁止本地 mutate 即落盘；仅 project/save code===200
 */

type DiagramGroupE2E = {
  memberEntityIds: string[];
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

async function getDiagramGroups(page: import('@playwright/test').Page): Promise<DiagramGroupE2E[]> {
  return page.evaluate(() => {
    const api = (
      window as unknown as {
        __ERD_E2E__?: { getDiagramGroups?: () => DiagramGroupE2E[] };
      }
    ).__ERD_E2E__;
    return api?.getDiagramGroups?.() || [];
  });
}

async function ensureTwoTablesOnCanvas(page: import('@playwright/test').Page) {
  await openRelationFromEmpty(page);
  await page.getByTestId('canvas-empty-create').click();
  await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
  await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
  await page.getByTestId('canvas-create-table').click();
  await expect(rfNode(page, 'T_TABLE_2')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
}

async function selectTables(page: import('@playwright/test').Page, titles: string[]) {
  await page.evaluate((ids) => {
    const api = (
      window as unknown as {
        __ERD_E2E__?: { selectTables?: (t: string[]) => void };
      }
    ).__ERD_E2E__;
    if (!api?.selectTables) {
      throw new Error('__ERD_E2E__.selectTables missing');
    }
    api.selectTables(ids);
  }, titles);
  // 等 RF selection 刷新进 React 闭包（对齐工具条仅 ≥2 张表时出现）
  if (titles.length >= 2) {
    await expect(page.getByTestId('align-left')).toBeVisible({ timeout: 5_000 });
  }
}

test.describe('Frame 新建/成员加减落盘失败可回滚', () => {
  test('新建分组业务码失败：可读 toast + 不上图 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('fcre-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fcref', 'frame create fail');

      await ensureTwoTablesOnCanvas(page);
      expect((await getDiagramGroups(page)).length).toBe(0);

      let saveHits = 0;
      let armed = false;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST' || !armed) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟分组保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await selectTables(page, ['T_TABLE_1', 'T_TABLE_2']);
        armed = true;
        await page.getByRole('button', { name: '新建分组' }).click();

        await expectToast(page, '模拟分组保存拒绝');
        await expect(page.getByText('已新建分组')).toHaveCount(0);
        await expect(page.getByTestId('diagram-frame')).toHaveCount(0);
        expect((await getDiagramGroups(page)).length).toBe(0);

        await selectTables(page, ['T_TABLE_1', 'T_TABLE_2']);
        await page.getByRole('button', { name: '新建分组' }).click();
        await expect(page.getByText('已新建分组')).toBeVisible({ timeout: 8_000 });
        await expect(page.getByTestId('diagram-frame')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
        const groups = await getDiagramGroups(page);
        expect(groups.length).toBe(1);
        expect(groups[0].memberEntityIds.sort()).toEqual(['T_TABLE_1', 'T_TABLE_2']);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        armed = false;
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('加入分组成员业务码失败：可读 toast + store 不改 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('fmem-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fmemf', 'frame members fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await page.getByTestId('reactflow-canvas').click({ position: { x: 20, y: 20 } });
      await page.getByRole('button', { name: '新建分组' }).click();
      await expect(page.getByTestId('diagram-frame')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      expect((await getDiagramGroups(page))[0]?.memberEntityIds || []).toEqual([]);

      let saveHits = 0;
      let armed = false;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST' || !armed) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟分组保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await rfNode(page, 'T_TABLE_1').click();
        armed = true;
        await page.getByRole('button', { name: '加入分组' }).click();

        await expectToast(page, '模拟分组保存拒绝');
        await expect(page.getByText(/已加入/)).toHaveCount(0);
        await expect
          .poll(async () => (await getDiagramGroups(page))[0]?.memberEntityIds?.length ?? -1, {
            timeout: 8_000,
          })
          .toBe(0);
        await expect(page.getByTestId('diagram-frame')).not.toContainText('1 张表');

        await page.getByRole('button', { name: '加入分组' }).click();
        await expect(page.getByText(/已加入/)).toBeVisible({ timeout: 8_000 });
        await expect(page.getByTestId('diagram-frame')).toContainText('1 张表', { timeout: 10_000 });
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
        expect((await getDiagramGroups(page))[0]?.memberEntityIds).toContain('T_TABLE_1');
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        armed = false;
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
