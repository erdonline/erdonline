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
 * 数据类型字典 · 逻辑类型 apply 方言映射 UX
 * — 新增/编辑按 MYSQL/PG/… 密表填写物理类型；落盘 apply[code].type
 * — 枚举种类不展示 apply 编辑器（仍走 buildEnumApply）
 * — 定位：role/aria/testid，勿扫 `.ant-*`
 */

const TYPE_CODE = 'e2e_apply_str';
const TYPE_NAME = 'E2E方言映射字串';

type ApplyMap = Record<string, { type?: string } | undefined>;

function findApplyInSave(postData: string | null): ApplyMap | null {
  try {
    const body = postData ? JSON.parse(postData) : {};
    const list =
      body?.projectJSON?.dataTypeDomains?.datatype ??
      body?.data?.projectJSON?.dataTypeDomains?.datatype ??
      [];
    if (!Array.isArray(list)) {
      return null;
    }
    const hit = list.find((t: { code?: string }) => t?.code === TYPE_CODE);
    return (hit?.apply as ApplyMap) ?? null;
  } catch {
    return null;
  }
}

test.describe('数据类型字典方言 apply', () => {
  test('逻辑类型按方言编辑 apply → 落盘 → 再编辑改 MYSQL', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('dt-apply');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(
        page,
        projectName,
        'dtapply',
        'datatype apply ux',
      );

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
      await expect(page.getByTestId('save-status')).toHaveText('已保存', {
        timeout: 15_000,
      });

      let savedApply: ApplyMap | null = null;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() === 'POST') {
          const hit = findApplyInSave(route.request().postData());
          if (hit) {
            savedApply = hit;
          }
        }
        await route.continue();
      });

      try {
        await page.getByRole('button', { name: '新增字段类型' }).click();
        const dialog = page.getByRole('dialog', { name: '新增字段类型' });
        await expect(dialog).toBeVisible({ timeout: 5_000 });
        await expect(
          dialog.getByRole('textbox', { name: '类型名称' }),
        ).toBeFocused({ timeout: 5_000 });

        await expect(
          dialog.getByRole('radio', { name: '逻辑类型' }),
        ).toBeChecked();
        await expect(dialog.getByTestId('datatype-apply-map')).toBeVisible();
        await expect(dialog.getByTestId('datatype-enum-values')).toHaveCount(0);

        await dialog.getByLabel('类型名称').fill(TYPE_NAME);
        await dialog.getByLabel('类型代码').fill(TYPE_CODE);

        await dialog
          .getByRole('textbox', { name: '方言 MYSQL 物理类型' })
          .fill('VARCHAR(64)');
        await dialog
          .getByRole('textbox', { name: '方言 PostgreSQL 物理类型' })
          .fill('TEXT');
        await dialog
          .getByRole('textbox', { name: '方言 ORACLE 物理类型' })
          .fill('NVARCHAR2(64)');

        await dialog.getByRole('button', { name: /提\s*交/ }).click();
        await expect(dialog).toHaveCount(0, { timeout: 15_000 });
        await expectToast(page, /提交成功/);

        await expect(
          page.getByTestId('datatype-domains-page').getByText(TYPE_CODE),
        ).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId(`datatype-kind-${TYPE_CODE}`)).toHaveText(
          '逻辑',
        );

        expect(savedApply?.MYSQL?.type).toBe('VARCHAR(64)');
        expect(savedApply?.PostgreSQL?.type).toBe('TEXT');
        expect(savedApply?.ORACLE?.type).toBe('NVARCHAR2(64)');

        await page
          .getByRole('button', { name: `编辑类型 ${TYPE_CODE}` })
          .click();
        const editDialog = page.getByRole('dialog', { name: '编辑字段类型' });
        await expect(editDialog).toBeVisible({ timeout: 5_000 });
        await expect(
          editDialog.getByRole('textbox', { name: '方言 MYSQL 物理类型' }),
        ).toHaveValue('VARCHAR(64)');
        await editDialog
          .getByRole('textbox', { name: '方言 MYSQL 物理类型' })
          .fill('VARCHAR(128)');
        await editDialog.getByRole('button', { name: /保\s*存/ }).click();
        await expect(editDialog).toHaveCount(0, { timeout: 15_000 });
        await expectToast(page, /修改成功/);

        expect(savedApply?.MYSQL?.type).toBe('VARCHAR(128)');
        expect(savedApply?.PostgreSQL?.type).toBe('TEXT');
        await expect(page.getByTestId('save-status')).toHaveText('已保存', {
          timeout: 15_000,
        });

        // 切到枚举：隐藏 apply，展示 values（不破坏枚举入口）
        await page.getByRole('button', { name: '新增枚举' }).click();
        const enumDialog = page.getByRole('dialog', { name: '新增枚举' });
        await expect(enumDialog).toBeVisible({ timeout: 5_000 });
        await expect(
          enumDialog.getByTestId('datatype-enum-values'),
        ).toBeVisible();
        await expect(
          enumDialog.getByTestId('datatype-apply-map'),
        ).toHaveCount(0);
        await enumDialog.getByRole('button', { name: /取\s*消/ }).click();
        await expect(enumDialog).toHaveCount(0, { timeout: 5_000 });
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => undefined);
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
