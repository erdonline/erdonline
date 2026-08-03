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
 * 字段类型下拉 · 枚举 vs 逻辑分组
 * — 字典建枚举后，画布 type select 出现 optgroup「枚举」，可选 code 落盘
 * — 定位：role=combobox / optgroup label / data-testid；勿扫 `.ant-*`
 */

const ENUM_CODE = 'e2e_pick_color';
const ENUM_NAME = 'E2E挑选色';

function findFieldTypeInSave(
  postData: string | null,
  fieldName: string,
): string | null {
  try {
    const body = postData ? JSON.parse(postData) : {};
    const modules =
      body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
    for (const m of modules || []) {
      for (const e of m?.entities || []) {
        for (const f of e?.fields || []) {
          if (f?.name === fieldName) {
            return f.type ?? null;
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

test.describe('字段类型下拉区分枚举', () => {
  test('画布 type select：optgroup 枚举可选 code 落盘', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('type-enum');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(
        page,
        projectName,
        'typeenum',
        'field type enum group',
      );

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      // 1) 字典新建枚举
      await page.goto(
        `/design/table/setting/dataType?projectId=${projectId}`,
      );
      await expect(page.getByTestId('datatype-domains-page')).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByTestId('save-status')).toHaveText('已保存', {
        timeout: 15_000,
      });

      await page.getByRole('button', { name: '新增枚举' }).click();
      const dialog = page.getByRole('dialog', { name: '新增枚举' });
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await dialog.getByLabel('类型名称').fill(ENUM_NAME);
      await dialog.getByLabel('类型代码').fill(ENUM_CODE);
      await dialog.getByRole('textbox', { name: '枚举值名 1' }).fill('red');
      await dialog.getByRole('button', { name: /提\s*交/ }).click();
      await expect(dialog).toHaveCount(0, { timeout: 15_000 });
      await expectToast(page, /提交成功/);
      await expect(page.getByTestId(`datatype-kind-${ENUM_CODE}`)).toHaveText(
        '枚举',
      );

      // 2) 画布建表 + 字段 → 类型下拉应有「枚举」分组
      await page.goto(`/design/table/model?projectId=${projectId}`);
      await expect(page).toHaveURL(/\/design\/table\/model/, {
        timeout: 15_000,
      });
      await openRelationFromEmpty(page, {
        name: 'M_COLOR',
        chnname: '颜色模型',
      });
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已保存', {
        timeout: 15_000,
      });

      await node.getByTestId('canvas-add-field').click();
      const typeSelect = node.getByRole('combobox', { name: '字段类型' });
      await expect(typeSelect).toBeVisible();
      await expect(typeSelect.getByTestId('field-type-group-logic')).toHaveCount(
        1,
      );
      await expect(typeSelect.getByTestId('field-type-group-enum')).toHaveCount(
        1,
      );
      await expect(
        typeSelect.getByTestId(`field-type-enum-${ENUM_CODE}`),
      ).toHaveCount(1);

      let savedType: string | null = null;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() === 'POST') {
          const hit = findFieldTypeInSave(route.request().postData(), 'COLOR');
          if (hit) {
            savedType = hit;
          }
        }
        await route.continue();
      });

      try {
        await typeSelect.selectOption(ENUM_CODE);
        await node.getByRole('textbox', { name: '字段名' }).fill('COLOR');
        await node.getByRole('textbox', { name: '字段名' }).press('Enter');
        await expect(node.locator('[data-field="COLOR"]')).toBeVisible({
          timeout: 10_000,
        });
        await expect(page.getByTestId('save-status')).toHaveText('已保存', {
          timeout: 15_000,
        });
        await expect(
          node.getByTestId('field-type-enum-badge-COLOR'),
        ).toHaveText(/枚举/);
        await expect(
          node.locator('[data-field="COLOR"] .erd-field-type'),
        ).toContainText(ENUM_CODE);
        expect(savedType).toBe(ENUM_CODE);
      } finally {
        await page.unroute('**/ncnb/project/save');
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
