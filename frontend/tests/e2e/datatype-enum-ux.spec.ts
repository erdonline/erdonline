import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 数据类型字典 · 枚举域 UX
 * — 「新增枚举」→ kind=enum + values[] 落盘；列表显示种类/取值；编辑可改 values
 * — 定位：role/aria/testid，勿扫 `.ant-*`
 */

const ENUM_CODE = 'e2e_color_t';
const ENUM_NAME = 'E2E颜色枚举';

function findEnumInSave(postData: string | null): {
  kind?: string;
  values?: Array<{ name?: string; chnname?: string }>;
} | null {
  try {
    const body = postData ? JSON.parse(postData) : {};
    const list =
      body?.projectJSON?.dataTypeDomains?.datatype ??
      body?.data?.projectJSON?.dataTypeDomains?.datatype ??
      [];
    if (!Array.isArray(list)) {
      return null;
    }
    return (
      list.find((t: { code?: string }) => t?.code === ENUM_CODE) ?? null
    );
  } catch {
    return null;
  }
}

test.describe('数据类型字典枚举域', () => {
  test('新增枚举 values[] 落盘 → 列表密化可见 → 编辑追加取值', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('dt-enum');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dtenum', 'datatype enum ux');

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();
      await page.goto(
        `/design/table/setting/dataType?projectId=${projectId}`,
      );
      await expect(page).toHaveURL(/\/design\/table\/setting\/dataType/, {
        timeout: 15_000,
      });
      await expect(page.getByTestId('datatype-domains-page')).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', {
        timeout: 15_000,
      });

      let savedEnum: ReturnType<typeof findEnumInSave> = null;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() === 'POST') {
          const hit = findEnumInSave(route.request().postData());
          if (hit) {
            savedEnum = hit;
          }
        }
        await route.continue();
      });

      try {
        await page.getByRole('button', { name: '新增枚举' }).click();
        const dialog = page.getByRole('dialog', { name: '新增枚举' });
        await expect(dialog).toBeVisible({ timeout: 5_000 });
        await expect(dialog.getByRole('textbox', { name: '类型名称' })).toBeFocused({
          timeout: 5_000,
        });

        await expect(dialog.getByRole('radio', { name: '枚举' })).toBeChecked();
        await expect(dialog.getByRole('radio', { name: '逻辑类型' })).not.toBeChecked();

        await dialog.getByLabel('类型名称').fill(ENUM_NAME);
        await dialog.getByLabel('类型代码').fill(ENUM_CODE);

        await dialog.getByRole('textbox', { name: '枚举值名 1' }).fill('red');
        await dialog.getByRole('textbox', { name: '枚举显示名 1' }).fill('红');
        await dialog.getByRole('button', { name: '添加枚举取值' }).click();
        await dialog.getByRole('textbox', { name: '枚举值名 2' }).fill('blue');

        await dialog.getByRole('button', { name: /提\s*交/ }).click();
        await expect(dialog).toHaveCount(0, { timeout: 15_000 });
        await expectToast(page, /提交成功/);

        const pageRoot = page.getByTestId('datatype-domains-page');
        await expect(pageRoot.getByText(ENUM_CODE)).toBeVisible({
          timeout: 10_000,
        });
        await expect(page.getByTestId(`datatype-kind-${ENUM_CODE}`)).toHaveText(
          '枚举',
        );
        await expect(
          page.getByTestId(`datatype-values-${ENUM_CODE}`),
        ).toContainText('red');
        await expect(
          page.getByTestId(`datatype-values-${ENUM_CODE}`),
        ).toContainText('blue');

        expect(savedEnum?.kind).toBe('enum');
        expect(savedEnum?.values?.map((v) => v.name)).toEqual(['red', 'blue']);
        expect(savedEnum?.values?.[0]?.chnname).toBe('红');

        await page
          .getByRole('button', { name: `编辑类型 ${ENUM_CODE}` })
          .click();
        const editDialog = page.getByRole('dialog', { name: '编辑枚举' });
        await expect(editDialog).toBeVisible({ timeout: 5_000 });
        await editDialog.getByRole('button', { name: '添加枚举取值' }).click();
        await editDialog.getByRole('textbox', { name: '枚举值名 3' }).fill('green');
        await editDialog.getByRole('button', { name: /保\s*存/ }).click();
        await expect(editDialog).toHaveCount(0, { timeout: 15_000 });
        await expectToast(page, /修改成功/);
        await expect(
          page.getByTestId(`datatype-values-${ENUM_CODE}`),
        ).toContainText('green');
        expect(savedEnum?.values?.map((v) => v.name)).toEqual([
          'red',
          'blue',
          'green',
        ]);
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', {
          timeout: 15_000,
        });
      } finally {
        await page.unroute('**/ncnb/project/save');
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
