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
 * WORD 模板下载：空 / JSON 错误 blob 禁止伪装成 .docx 成功下载（零假成功）
 */

async function openDefaultConfigWordTab(
  page: import('@playwright/test').Page,
) {
  await page.getByRole('button', { name: '项目菜单' }).click();
  await page
    .getByTestId('project-menu-panel')
    .getByRole('menuitem', { name: '设置' })
    .click();
  await page.getByRole('menuitem', { name: '默认项设置' }).click();
  const dialog = page.getByRole('dialog', { name: '默认项设置' });
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole('tab', { name: '默认配置' }).click();
  return dialog;
}

test.describe('WORD 模板下载失败不落假文件', () => {
  test('JSON 错误体：toast + 无 download', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('wordtpl-json');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'wordtpl', 'word tpl json');

      const dialog = await openDefaultConfigWordTab(page);
      const downloadBtn = dialog.getByRole('button', { name: '下载模板' });
      await expect(downloadBtn).toBeVisible();

      await page.route('**/ncnb/doc/downloadWordTemplate**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '模拟模板下载拒绝' }),
        });
      });

      try {
        const downloadRace = page
          .waitForEvent('download', { timeout: 4_000 })
          .then(() => 'downloaded' as const)
          .catch(() => 'none' as const);

        await downloadBtn.click();
        await expectToast(page, /下载模板出错!出错原因：模拟模板下载拒绝/);
        expect(await downloadRace).toBe('none');
        await expect(dialog).toBeVisible();
      } finally {
        await page.unroute('**/ncnb/doc/downloadWordTemplate**').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('空 blob：toast + 无 download', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('wordtpl-empty');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'wordtpl', 'word tpl empty');

      const dialog = await openDefaultConfigWordTab(page);
      const downloadBtn = dialog.getByRole('button', { name: '下载模板' });
      await expect(downloadBtn).toBeVisible();

      await page.route('**/ncnb/doc/downloadWordTemplate**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/octet-stream',
          body: '',
        });
      });

      try {
        const downloadRace = page
          .waitForEvent('download', { timeout: 4_000 })
          .then(() => 'downloaded' as const)
          .catch(() => 'none' as const);

        await downloadBtn.click();
        await expectToast(page, /下载模板出错!出错原因：模板内容为空/);
        expect(await downloadRace).toBe('none');
        await expect(dialog).toBeVisible();
      } finally {
        await page.unroute('**/ncnb/doc/downloadWordTemplate**').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
