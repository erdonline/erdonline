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
 * 画布拖表 reposition：禁止本地 mutate 即坐标落盘；仅 project/save code===200
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

function tableLayoutPos(
  modules: any[],
  title: string,
): { x: number; y: number } | null {
  for (const m of modules) {
    for (const d of m?.diagrams || []) {
      for (const n of d?.layout?.nodes || []) {
        const id = n?.id || (n?.title || '').split(':')[0];
        if (id === title && typeof n?.x === 'number' && typeof n?.y === 'number') {
          return { x: n.x, y: n.y };
        }
      }
    }
  }
  return null;
}

function parseTranslate(transform: string): { x: number; y: number } | null {
  const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(transform);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

async function nodeTransform(page: import('@playwright/test').Page, title: string) {
  return rfNode(page, title).evaluate((el) => (el as HTMLElement).style.transform);
}

/** 从表字段行拖动（表头 erd-table-header 带 nodrag，点头拖不动） */
async function dragTableByField(
  page: import('@playwright/test').Page,
  title: string,
  dx: number,
  dy: number,
) {
  const node = rfNode(page, title);
  const field = node.locator('[data-field]').first();
  await expect(field).toBeVisible();
  const box = await field.boundingBox();
  expect(box).toBeTruthy();
  const sx = box!.x + Math.min(40, box!.width / 2);
  const sy = box!.y + box!.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + dx, sy + dy, { steps: 15 });
  await page.mouse.up();
}

test.describe('画布拖表坐标落盘失败可回滚', () => {
  test('业务码失败：可读 toast + 坐标回滚 → 重试拖动成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('drag-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dfail', 'drag reposition fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const beforeTransform = await nodeTransform(page, 'T_TABLE_1');
      const before = parseTranslate(beforeTransform);
      expect(before).toBeTruthy();

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const pos = tableLayoutPos(modulesFromSaveBody(route.request().postData()), 'T_TABLE_1');
        const moved =
          !!pos
          && !!before
          && (Math.abs(pos.x - before.x) > 15 || Math.abs(pos.y - before.y) > 15);
        if (!moved) {
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
        await dragTableByField(page, 'T_TABLE_1', 180, 120);

        await expectToast(page, '模拟布局保存拒绝');
        await expect
          .poll(async () => nodeTransform(page, 'T_TABLE_1'), { timeout: 8_000 })
          .toBe(beforeTransform);

        await dragTableByField(page, 'T_TABLE_1', 180, 120);

        await expect(page.getByTestId('save-status')).toHaveText('已保存', {
          timeout: 15_000,
        });
        await expect
          .poll(async () => nodeTransform(page, 'T_TABLE_1'), { timeout: 8_000 })
          .not.toBe(beforeTransform);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
