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
 * Word gendocx 导出：空 / JSON 错误 blob 禁止伪装成文档成功下载（零假成功）
 * 定位：export-common 卡 `role=button` aria-label「导出Word」/ testid（勿扫 `.ant-*`）
 */

async function openExportCommon(page: import('@playwright/test').Page) {
  const projectId = new URL(page.url()).searchParams.get('projectId');
  expect(projectId).toBeTruthy();
  await page.goto(`/design/table/export/common?projectId=${projectId}`);
  await expect(page.getByTestId('export-common-page')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('导出文件')).toBeVisible();
}

test.describe('Word gendocx 导出失败不落假文件', () => {
  test('JSON 错误体：toast + 无 download', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('gendocx-json');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'export', 'gendocx json');

      await openExportCommon(page);
      const wordCard = page.getByRole('button', { name: '导出Word' });
      await expect(wordCard).toBeVisible();

      await page.route('**/ncnb/doc/gendocx', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '模拟文档生成拒绝' }),
        });
      });

      try {
        const downloadRace = page
          .waitForEvent('download', { timeout: 4_000 })
          .then(() => 'downloaded' as const)
          .catch(() => 'none' as const);

        await wordCard.click();
        await expectToast(page, /Word导出失败!请重试！出错原因：模拟文档生成拒绝/);
        expect(await downloadRace).toBe('none');
        await expect(page.getByTestId('export-common-page')).toBeVisible();
      } finally {
        await page.unroute('**/ncnb/doc/gendocx').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('空 blob：toast + 无 download', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('gendocx-empty');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'export', 'gendocx empty');

      await openExportCommon(page);
      const wordCard = page.getByRole('button', { name: '导出Word' });
      await expect(wordCard).toBeVisible();

      await page.route('**/ncnb/doc/gendocx', async (route) => {
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

        await wordCard.click();
        await expectToast(page, /Word导出失败!请重试！出错原因：文档内容为空/);
        expect(await downloadRace).toBe('none');
        await expect(page.getByTestId('export-common-page')).toBeVisible();
      } finally {
        await page.unroute('**/ncnb/doc/gendocx').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('非 ZIP octet-stream：toast + 无 download', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('gendocx-garbage');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'export', 'gendocx garbage');

      await openExportCommon(page);
      const wordCard = page.getByRole('button', { name: '导出Word' });
      await expect(wordCard).toBeVisible();

      await page.route('**/ncnb/doc/gendocx', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/octet-stream',
          body: 'not-a-zip-document',
        });
      });

      try {
        const downloadRace = page
          .waitForEvent('download', { timeout: 4_000 })
          .then(() => 'downloaded' as const)
          .catch(() => 'none' as const);

        await wordCard.click();
        await expectToast(page, /Word导出失败!请重试！出错原因：返回内容不是 Word 文档/);
        expect(await downloadRace).toBe('none');
        await expect(page.getByTestId('export-common-page')).toBeVisible();
      } finally {
        await page.unroute('**/ncnb/doc/gendocx').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
