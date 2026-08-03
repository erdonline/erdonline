import { expect, test } from '@playwright/test';
import path from 'path';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  expandTreeTitle,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * ERD 文件导入：禁止本地 setProjectJson 即 toast「导入成功」；
 * 仅 project/save code===200 写 store；失败 toast + 窗仍开可重试
 */

function hasErdImportPayload(postData: string | null): boolean {
  try {
    const body = postData ? JSON.parse(postData) : {};
    const modules =
      body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
    if (!Array.isArray(modules)) {
      return false;
    }
    return modules.some(
      (m: { name?: string; entities?: Array<{ title?: string }> }) =>
        m?.name === 'ERD导入' ||
        (m?.entities || []).some((e) => e?.title === 'T_ERD_ITEM'),
    );
  } catch {
    return false;
  }
}

test.describe('ERD 导入落盘失败可重试', () => {
  test('业务码失败：可读 toast + 窗仍开 → 重试成功入树', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('erd-fail');
    const fixture = path.join(__dirname, '../fixtures/minimal.erd.json');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'erdfail', 'erd fail');

      await expect(page.getByTestId('save-status')).toHaveText('已保存', {
        timeout: 15_000,
      });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        if (!hasErdImportPayload(route.request().postData())) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟ERD导入保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await page.getByRole('button', { name: '项目菜单' }).click();
        await page
          .getByTestId('project-menu-panel')
          .getByRole('menuitem', { name: '导入' })
          .click();
        await page.getByRole('menuitem', { name: '解析ERD文件' }).click();
        const dlg = page.getByRole('dialog', { name: /解析已有ERD文件/ });
        await expect(dlg).toBeVisible({ timeout: 10_000 });

        await dlg.locator('input[type="file"]').setInputFiles(fixture);
        await expectToast(page, /模拟ERD导入保存拒绝/);
        await expect(dlg).toBeVisible();
        await expect(
          page.getByRole('complementary').getByText('ERD导入', { exact: true }),
        ).toHaveCount(0);
        await expect(page.getByText(/ERD文件导入成功/)).toHaveCount(0);

        await dlg.locator('input[type="file"]').setInputFiles(fixture);
        await expectToast(page, /ERD文件导入成功/);
        await expect(
          page.getByRole('complementary').getByText('ERD导入', { exact: true }),
        ).toBeVisible({ timeout: 15_000 });
        await expandTreeTitle(page, 'ERD导入');
        await expandTreeTitle(page, '表');
        await expect(
          page.getByRole('complementary').getByText('T_ERD_ITEM', { exact: true }),
        ).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId('save-status')).toHaveText('已保存', {
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
