import { test, expect } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 导出去 G6：Markdown 导出走 DOM+html2canvas
 */
test.describe('导出（无 G6）', () => {
  test.describe.configure({ mode: 'serial' });

  test('普通导出 Markdown 成功下载', async ({ page }) => {
    await login(page);
    await deleteOwnPersonProjects(page);
    const projectName = uniqueProjectName('export');
    await createAndOpenPersonProject(page, projectName, 'export', 'export test');

    try {
      await page.goto(`/design/table/export/common`);
      await expect(page.getByText('导出文件')).toBeVisible({ timeout: 15_000 });

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30_000 }),
        page.getByText('导出Markdown').click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.md$/i);
      expect(await download.path()).toBeTruthy();
    } finally {
      try {
        await deleteOwnPersonProjects(page);
      } catch { /* ignore */ }
    }
  });

  test('导出 HTML 成功下载', async ({ page }) => {
    test.setTimeout(180_000);
    await login(page);
    await deleteOwnPersonProjects(page);
    const projectName = uniqueProjectName('exhtml');
    await createAndOpenPersonProject(page, projectName, 'export', 'export html');

    try {
      const projectId = new URL(page.url()).searchParams.get('projectId');
      await page.goto(`/design/table/export/common?projectId=${projectId}`);
      await expect(page.getByText('导出文件')).toBeVisible({ timeout: 15_000 });

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 120_000 }),
        page.getByText('导出HTML').click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.html$/i);
      expect(await download.path()).toBeTruthy();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('导出 ERD 成功下载', async ({ page }) => {
    await login(page);
    await deleteOwnPersonProjects(page);
    const projectName = uniqueProjectName('exerd');
    await createAndOpenPersonProject(page, projectName, 'export', 'export erd');

    try {
      const projectId = new URL(page.url()).searchParams.get('projectId');
      await page.goto(`/design/table/export/common?projectId=${projectId}`);
      await expect(page.getByText('导出文件')).toBeVisible({ timeout: 15_000 });

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30_000 }),
        page.getByText('导出ERD').click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.erd\.json$/i);
      expect(await download.path()).toBeTruthy();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
