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
 * 表设计索引签 JExcel / updateEntityIndex：禁止本地 mutate 即成功；
 * 仅 project/save code===200；失败 toast + 回滚（空态 / sheetEpoch 重挂）可重试
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

/** 索引网格首行「是否唯一」复选框（列：索引名 / 字段 / 是否唯一） */
async function uniqueCheckbox(indexEdit: import('@playwright/test').Locator) {
  const boxes = indexEdit.getByRole('checkbox');
  await expect(boxes.first()).toBeVisible();
  return boxes.first();
}

test.describe('表设计索引签落盘失败可重试', () => {
  test('添加第一个索引：业务码失败仍空态 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('jx-idx-add-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'jxia', 'jexcel index add fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await node.getByTestId('canvas-open-index').evaluate((el: HTMLElement) => el.click());
      const indexEdit = page.getByTestId('table-index-edit');
      await expect(indexEdit.getByRole('button', { name: '添加第一个索引' })).toBeVisible();

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const idxs = tableIndexes(modulesFromSave(route.request().postData()));
        if (idxs.length < 1) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟表设计索引添加保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await indexEdit.getByRole('button', { name: '添加第一个索引' }).click();
        await expectToast(page, '模拟表设计索引添加保存拒绝');
        // 失败不写 store：仍在空态，可再点
        await expect(indexEdit.getByRole('button', { name: '添加第一个索引' })).toBeVisible();
        await expect(indexEdit.getByTestId('index-empty-add')).toBeVisible();

        await indexEdit.getByRole('button', { name: '添加第一个索引' }).click();
        await expectToast(page, '索引更新成功');
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
        await expect(indexEdit.getByTestId('index-empty-add')).toHaveCount(0);
        await expect(indexEdit.getByText('索引名*')).toBeVisible();
        await expect(
          indexEdit.getByRole('button', { name: '删除索引 T_TABLE_1_IDX1' }),
        ).toBeVisible();
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('勾是否唯一：业务码失败回滚勾选 → 重试成功 + 画布 UK', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('jx-idx-uk-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'jxiu', 'jexcel index unique fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await node.getByTestId('canvas-open-index').evaluate((el: HTMLElement) => el.click());
      const indexEdit = page.getByTestId('table-index-edit');
      await indexEdit.getByRole('button', { name: '添加第一个索引' }).click();
      await expectToast(page, '索引更新成功');
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const idxs = tableIndexes(modulesFromSave(route.request().postData()));
        const hasUnique = idxs.some((i) => !!i?.isUnique);
        if (!hasUnique) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟表设计索引唯一保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const uk = await uniqueCheckbox(indexEdit);
        await expect(uk).not.toBeChecked();
        await uk.click();

        await expectToast(page, '模拟表设计索引唯一保存拒绝');
        const afterFail = await uniqueCheckbox(indexEdit);
        await expect(afterFail).not.toBeChecked();

        await afterFail.click();
        await expectToast(page, '索引更新成功');
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
        const afterOk = await uniqueCheckbox(indexEdit);
        await expect(afterOk).toBeChecked();
        expect(saveHits).toBeGreaterThanOrEqual(2);

        await page.getByTestId('tree-open-relation').click();
        await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
        // 默认种子字段 id：唯一索引 → 画布 UK
        await expect(
          rfNode(page, 'T_TABLE_1').getByText('UK', { exact: true }).first(),
        ).toBeVisible({ timeout: 10_000 });
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
