import { expect, test } from '@playwright/test';
import {
  addFieldInline,
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
 * 表设计 JExcel 字段 meta：禁止本地 mutate 即成功；仅 project/save code===200
 * 失败：toast + 重挂网格回滚勾选；可重试
 */

const FIELD = 'NAME';

type ModulesBody = {
  entities?: Array<{
    title?: string;
    name?: string;
    fields?: Array<{
      name?: string;
      pk?: boolean;
      relationNoShow?: boolean;
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

function tableFields(
  modules: ModulesBody[],
  table = 'T_TABLE_1',
): Array<{ name?: string; pk?: boolean; relationNoShow?: boolean }> {
  for (const m of modules) {
    const ent = (m.entities || []).find((e) => e?.title === table || e?.name === table);
    if (ent && Array.isArray(ent.fields)) return ent.fields;
  }
  return [];
}

/** 字段行：英文名 cell + 复选框序 pk / notNull / autoIncrement / relationNoShow */
async function fieldMetaCheckboxes(
  fieldEdit: import('@playwright/test').Locator,
  fieldName: string,
) {
  const row = fieldEdit.getByRole('row').filter({
    has: fieldEdit.page().getByRole('cell', { name: fieldName, exact: true }),
  });
  await expect(row).toBeVisible();
  const boxes = row.getByRole('checkbox');
  // 至少含 PK；勿硬绑 4——列集随产品可增减
  await expect(boxes.first()).toBeVisible();
  const count = await boxes.count();
  expect(count).toBeGreaterThanOrEqual(4);
  return {
    row,
    pk: boxes.nth(0),
    notNull: boxes.nth(1),
    autoIncrement: boxes.nth(2),
    hide: boxes.nth(3),
  };
}

test.describe('表设计 JExcel 字段 meta 落盘失败可重试', () => {
  test('勾 PK：业务码失败回滚勾选 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('jx-field-pk-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'jxpk', 'jexcel field pk fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await addFieldInline(page, 'T_TABLE_1', FIELD);
      await expect(node.locator(`[data-field="${FIELD}"]`)).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());
      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });
      await expect(fieldEdit.getByRole('cell', { name: FIELD, exact: true })).toBeVisible();

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const fields = tableFields(modulesFromSave(route.request().postData()));
        const namePk = fields.some((f) => f?.name === FIELD && !!f?.pk);
        if (!namePk) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟表设计字段PK保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        // jspreadsheet checkbox：用 click，Playwright check() 偶发不触发 onchange
        const { pk } = await fieldMetaCheckboxes(fieldEdit, FIELD);
        await expect(pk).not.toBeChecked();
        await pk.click();

        await expectToast(page, '模拟表设计字段PK保存拒绝');
        // 重挂回滚：勾选恢复未选
        const afterFail = await fieldMetaCheckboxes(fieldEdit, FIELD);
        await expect(afterFail.pk).not.toBeChecked();

        await afterFail.pk.click();
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
        const afterOk = await fieldMetaCheckboxes(fieldEdit, FIELD);
        await expect(afterOk.pk).toBeChecked();
        expect(saveHits).toBeGreaterThanOrEqual(2);

        // 画布侧亦已落盘（禁仅网格伪装）
        await page.getByTestId('tree-open-relation').click();
        await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
        await expect(
          rfNode(page, 'T_TABLE_1').locator(`[data-field="${FIELD}"]`).getByRole('button', {
            name: '取消主键',
          }),
        ).toBeVisible();
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('勾隐藏：业务码失败回滚勾选 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('jx-field-hide-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'jxhd', 'jexcel field hide fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await addFieldInline(page, 'T_TABLE_1', FIELD);
      await expect(node.locator(`[data-field="${FIELD}"]`)).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());
      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const fields = tableFields(modulesFromSave(route.request().postData()));
        const nameHidden = fields.some((f) => f?.name === FIELD && !!f?.relationNoShow);
        if (!nameHidden) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟表设计字段隐藏保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const { hide } = await fieldMetaCheckboxes(fieldEdit, FIELD);
        await expect(hide).not.toBeChecked();
        await hide.click();

        await expectToast(page, '模拟表设计字段隐藏保存拒绝');
        const afterFail = await fieldMetaCheckboxes(fieldEdit, FIELD);
        await expect(afterFail.hide).not.toBeChecked();

        await afterFail.hide.click();
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
        const afterOk = await fieldMetaCheckboxes(fieldEdit, FIELD);
        await expect(afterOk.hide).toBeChecked();
        expect(saveHits).toBeGreaterThanOrEqual(2);

        await page.getByTestId('tree-open-relation').click();
        await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
        // 隐藏后浏览行不在；表底可恢复
        await expect(
          rfNode(page, 'T_TABLE_1').locator(`[data-field="${FIELD}"]`),
        ).toHaveCount(0);
        await expect(
          rfNode(page, 'T_TABLE_1').getByRole('button', { name: /已隐藏/ }),
        ).toBeVisible();
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
