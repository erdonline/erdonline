import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  gotoDesignModel,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 默认字段设置 JExcel：禁止本地 mutate 即 toast「默认字段已更新」；
 * 仅 project/save code===200；失败 toast + sheetEpoch 重挂回滚；可重试
 */

function profileFromSave(postData: string | null): { defaultFields?: unknown } {
  try {
    const body = postData ? JSON.parse(postData) : {};
    return body?.projectJSON?.profile ?? body?.data?.projectJSON?.profile ?? {};
  } catch {
    return {};
  }
}

function flattenDefaultFields(raw: unknown): Array<{ name?: string }> {
  if (!Array.isArray(raw)) return [];
  const flat = Array.isArray(raw[0]) ? (raw as unknown[]).flat() : raw;
  return (flat as Array<{ name?: string } | null>).filter(
    (f): f is { name?: string } => f != null && typeof f === 'object',
  );
}

function hasRenamedPk(postData: string | null, name: string): boolean {
  return flattenDefaultFields(profileFromSave(postData).defaultFields).some(
    (f) => f?.name === name,
  );
}

test.describe('默认字段落盘失败可重试', () => {
  test('改主键英文名：业务码失败回滚 → 重试成功 + 新表带字段', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const renamed = 'e2e_df_pk';
    const projectName = uniqueProjectName('df-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dff', 'default field fail');

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();
      await page.goto(
        `/design/table/setting/defaultField?projectId=${projectId}`,
      );
      await expect(page).toHaveURL(/\/design\/table\/setting\/defaultField/, {
        timeout: 15_000,
      });
      const sheet = page.getByTestId('default-field-page');
      await expect(sheet).toBeVisible({ timeout: 15_000 });
      await expect(sheet.getByTestId('jexcel-grid')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', {
        timeout: 15_000,
      });

      const idCell = sheet.getByRole('cell', { name: 'id', exact: true }).first();
      await expect(idCell).toBeVisible({ timeout: 10_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        if (!hasRenamedPk(route.request().postData(), renamed)) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟默认字段保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await idCell.dblclick();
        await page.keyboard.press('Meta+a');
        await page.keyboard.type(renamed);
        await page.keyboard.press('Enter');

        await expectToast(page, '模拟默认字段保存拒绝');
        // 失败不写 store：重挂后仍是 id
        await expect(
          sheet.getByRole('cell', { name: 'id', exact: true }).first(),
        ).toBeVisible({ timeout: 10_000 });
        await expect(
          sheet.getByRole('cell', { name: renamed, exact: true }),
        ).toHaveCount(0);

        const idAgain = sheet
          .getByRole('cell', { name: 'id', exact: true })
          .first();
        await idAgain.dblclick();
        await page.keyboard.press('Meta+a');
        await page.keyboard.type(renamed);
        await page.keyboard.press('Enter');
        await expectToast(page, '默认字段已更新');
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', {
          timeout: 15_000,
        });
        await expect(
          sheet.getByRole('cell', { name: renamed, exact: true }).first(),
        ).toBeVisible();
        expect(saveHits).toBeGreaterThanOrEqual(2);

        await gotoDesignModel(page);
        await openRelationFromEmpty(page);
        await page.getByTestId('canvas-empty-create').click();
        const firstNode = rfNode(page, 'T_TABLE_1');
        await expect(firstNode).toBeVisible({ timeout: 15_000 });
        await expect(firstNode).toContainText(renamed);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
