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
 * 索引签 fields 单元格：列名 / 表达式自由文本（分号混写）→ `indexs[].fields[]`；
 * persist-on-200（与 TableIndexEdit / jexcel-index-failure 同形）。
 * 定位：role / testid；禁止 .ant-*
 */

type ModulesBody = {
  entities?: Array<{
    title?: string;
    name?: string;
    indexs?: Array<{
      name?: string;
      fields?: string | string[];
      isUnique?: boolean;
    }>;
  }>;
};

function modulesFromSave(postData: string | null): ModulesBody[] {
  try {
    const body = postData ? JSON.parse(postData) : {};
    const modules = body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
    return Array.isArray(modules) ? modules : [];
  } catch {
    return [];
  }
}

function tableIndexes(
  modules: ModulesBody[],
  table = 'T_TABLE_1',
): Array<{ name?: string; fields?: string | string[]; isUnique?: boolean }> {
  for (const m of modules) {
    const ent = (m.entities || []).find((e) => e?.title === table || e?.name === table);
    if (ent && Array.isArray(ent.indexs)) return ent.indexs;
  }
  return [];
}

function indexFieldsFlat(
  idxs: Array<{ fields?: string | string[] }>,
): string[] {
  const out: string[] = [];
  for (const i of idxs) {
    if (Array.isArray(i.fields)) out.push(...i.fields.map(String));
    else if (typeof i.fields === 'string' && i.fields.trim()) out.push(i.fields);
  }
  return out;
}

async function editFieldsCell(
  page: import('@playwright/test').Page,
  indexEdit: import('@playwright/test').Locator,
  value: string,
) {
  // 种子默认 id；失败回滚后亦为 id；成功后可能为混写串
  const cell = indexEdit
    .getByRole('cell', { name: /^(id|id;LOWER\(id\)|LOWER\(id\))$/ })
    .first();
  await expect(cell).toBeVisible();
  await cell.dblclick();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}

test.describe('表设计索引签字段/表达式可编辑', () => {
  test('表达式字段落盘：混写 → indexs[].fields[]；失败回滚可重试', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('idx-expr');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'idxe', 'index expression edit');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await node.getByTestId('canvas-open-index').evaluate((el: HTMLElement) => el.click());
      const indexEdit = page.getByTestId('table-index-edit');
      await expect(indexEdit.getByRole('button', { name: '添加第一个索引' })).toBeVisible();
      await indexEdit.getByRole('button', { name: '添加第一个索引' }).click();
      await expectToast(page, '索引更新成功');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await expect(indexEdit.getByText('字段/表达式*')).toBeVisible();
      await expect(indexEdit.getByTestId('index-unique-hint')).toContainText('分号分隔');
      await expect(indexEdit.getByTestId('index-unique-hint')).toHaveAttribute(
        'aria-label',
        '索引字段编辑说明',
      );

      let saveHits = 0;
      let persistedFields: string[] | null = null;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const idxs = tableIndexes(modulesFromSave(route.request().postData()));
        const flat = indexFieldsFlat(idxs);
        const hasExpr = flat.some((f) => f.includes('LOWER('));
        if (!hasExpr) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟索引表达式保存拒绝' }),
          });
          return;
        }
        persistedFields = flat;
        await route.continue();
      });

      try {
        await editFieldsCell(page, indexEdit, 'LOWER(id)');
        await expectToast(page, '模拟索引表达式保存拒绝');
        // 失败重挂：回到种子字段 id
        await expect(indexEdit.getByRole('cell', { name: 'id', exact: true })).toBeVisible({
          timeout: 10_000,
        });

        await editFieldsCell(page, indexEdit, 'id;LOWER(id)');
        await expectToast(page, '索引更新成功');
        await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
        await expect(indexEdit.getByRole('cell', { name: 'id;LOWER(id)', exact: true })).toBeVisible();
        expect(saveHits).toBeGreaterThanOrEqual(2);
        expect(persistedFields).toEqual(['id', 'LOWER(id)']);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }

      // 键盘：Enter 落盘后 Tab 不离开索引签；hint 仍可达
      await indexEdit.getByRole('cell', { name: 'T_TABLE_1_IDX1' }).click();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('table-index-edit')).toBeVisible();
      await expect(page.getByTestId('table-design').getByRole('tab', { name: '索引' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
