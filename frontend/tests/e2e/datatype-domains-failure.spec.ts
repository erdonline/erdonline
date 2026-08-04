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
 * 数据类型字典：禁止本地 mutate 即 toast/关窗；
 * 仅 project/save code===200；失败 toast + 窗仍开可重试
 */

const TYPE_CODE = 'e2e_dt_fail';
const TYPE_NAME = 'E2E失败重试类型';

function hasTargetType(postData: string | null): boolean {
  try {
    const body = postData ? JSON.parse(postData) : {};
    const list =
      body?.projectJSON?.dataTypeDomains?.datatype ??
      body?.data?.projectJSON?.dataTypeDomains?.datatype ??
      [];
    return Array.isArray(list) && list.some((t: { code?: string }) => t?.code === TYPE_CODE);
  } catch {
    return false;
  }
}

test.describe('数据类型字典落盘失败可重试', () => {
  test('新增类型业务码失败：可读 toast + 窗仍开 → 重试成功入表', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('dt-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dtfail', 'datatype fail');

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

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        if (!hasTargetType(route.request().postData())) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟数据类型保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await page.getByRole('button', { name: '新增字段类型' }).click();
        const dialog = page.getByRole('dialog', { name: '新增字段类型' });
        await expect(dialog).toBeVisible({ timeout: 5_000 });
        await dialog.getByLabel('类型名称').fill(TYPE_NAME);
        await dialog.getByLabel('类型代码').fill(TYPE_CODE);
        await dialog.getByRole('button', { name: /提\s*交/ }).click();

        await expectToast(page, /模拟数据类型保存拒绝/);
        await expect(dialog).toBeVisible();
        await expect(
          page.getByTestId('datatype-domains-page').getByText(TYPE_CODE),
        ).toHaveCount(0);

        await dialog.getByRole('button', { name: /提\s*交/ }).click();
        await expect(dialog).toBeHidden({ timeout: 15_000 });
        await expect(
          page.getByTestId('datatype-domains-page').getByText(TYPE_CODE),
        ).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', {
          timeout: 15_000,
        });
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save');
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
