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
 * 画布对齐 / 自动布局：禁止本地 mutate 即坐标落盘；仅 project/save code===200
 */

function parseTranslate(transform: string): { x: number; y: number } | null {
  const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(transform);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

async function nodeTransform(page: import('@playwright/test').Page, title: string) {
  return rfNode(page, title).evaluate((el) => (el as HTMLElement).style.transform);
}

async function offsetTableRf(
  page: import('@playwright/test').Page,
  title: string,
  dx: number,
  dy: number,
) {
  const before = await nodeTransform(page, title);
  const ok = await page.evaluate(
    ({ t, x, y }) => {
      const hook = (window as Window & {
        __ERD_E2E__?: { offsetTable: (title: string, dx: number, dy: number) => boolean };
      }).__ERD_E2E__;
      if (!hook?.offsetTable) {
        throw new Error('__ERD_E2E__.offsetTable missing');
      }
      return hook.offsetTable(t, x, y);
    },
    { t: title, x: dx, y: dy },
  );
  expect(ok).toBe(true);
  await expect
    .poll(async () => nodeTransform(page, title), { timeout: 5_000 })
    .not.toBe(before);
}

async function selectTablesRf(page: import('@playwright/test').Page, titles: string[]) {
  await page.evaluate((ids) => {
    const hook = (window as Window & {
      __ERD_E2E__?: { selectTables: (titles: string[]) => void };
    }).__ERD_E2E__;
    if (!hook?.selectTables) {
      throw new Error('__ERD_E2E__.selectTables missing');
    }
    hook.selectTables(ids);
  }, titles);
}

test.describe('画布对齐/自动布局落盘失败可回滚', () => {
  test('左对齐业务码失败：可读 toast + 坐标回滚 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('align-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'afail', 'align layout fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await page.getByTestId('canvas-create-table').click();
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const store1 = await nodeTransform(page, 'T_TABLE_1');
      const store2 = await nodeTransform(page, 'T_TABLE_2');
      await offsetTableRf(page, 'T_TABLE_2', 220, 0);

      const p1 = parseTranslate(store1);
      const p2 = parseTranslate(await nodeTransform(page, 'T_TABLE_2'));
      expect(p1 && p2).toBeTruthy();
      expect(Math.abs(p1!.x - p2!.x)).toBeGreaterThan(20);

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
            body: JSON.stringify({ code: 500, msg: '模拟对齐保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await selectTablesRf(page, ['T_TABLE_1', 'T_TABLE_2']);
        await expect(page.getByTestId('align-left')).toBeVisible();
        armed = true;
        await page.getByTestId('align-left').click();

        await expectToast(page, '模拟对齐保存拒绝');
        // 打散未落盘：失败回滚到 store（与创建后坐标一致）
        await expect
          .poll(async () => nodeTransform(page, 'T_TABLE_1'), { timeout: 8_000 })
          .toBe(store1);
        await expect
          .poll(async () => nodeTransform(page, 'T_TABLE_2'), { timeout: 8_000 })
          .toBe(store2);

        await offsetTableRf(page, 'T_TABLE_2', 220, 0);
        await selectTablesRf(page, ['T_TABLE_1', 'T_TABLE_2']);
        await page.getByTestId('align-left').click();

        await expect(page.getByTestId('save-status')).toHaveText('已保存', {
          timeout: 15_000,
        });
        await expect
          .poll(async () => {
            const t1 = parseTranslate(await nodeTransform(page, 'T_TABLE_1'));
            const t2 = parseTranslate(await nodeTransform(page, 'T_TABLE_2'));
            return t1 && t2 ? Math.abs(t1.x - t2.x) : 999;
          }, { timeout: 8_000 })
          .toBeLessThan(2);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        armed = false;
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('自动布局业务码失败：可读 toast + 坐标回滚 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('layout-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'lfail', 'auto layout fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await page.getByTestId('canvas-create-table').click();
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const store1 = await nodeTransform(page, 'T_TABLE_1');
      const store2 = await nodeTransform(page, 'T_TABLE_2');
      await offsetTableRf(page, 'T_TABLE_2', 200, 160);
      const scrambled2 = await nodeTransform(page, 'T_TABLE_2');

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
            body: JSON.stringify({ code: 500, msg: '模拟布局保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        armed = true;
        await page.getByRole('button', { name: '自动布局' }).click();

        await expectToast(page, '模拟布局保存拒绝');
        await expect
          .poll(async () => nodeTransform(page, 'T_TABLE_1'), { timeout: 8_000 })
          .toBe(store1);
        await expect
          .poll(async () => nodeTransform(page, 'T_TABLE_2'), { timeout: 8_000 })
          .toBe(store2);

        await offsetTableRf(page, 'T_TABLE_2', 200, 160);
        await page.getByRole('button', { name: '自动布局' }).click();

        await expect(page.getByTestId('save-status')).toHaveText('已保存', {
          timeout: 15_000,
        });
        await expect
          .poll(async () => nodeTransform(page, 'T_TABLE_2'), { timeout: 8_000 })
          .not.toBe(scrambled2);
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
