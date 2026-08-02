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

  test('导出 Word 成功下载（无 MinIO，classpath 默认模板）', async ({ page }) => {
    test.setTimeout(180_000);
    await login(page);
    await deleteOwnPersonProjects(page);
    const projectName = uniqueProjectName('exword');
    await createAndOpenPersonProject(page, projectName, 'export', 'export word');

    try {
      const projectId = new URL(page.url()).searchParams.get('projectId');
      await page.goto(`/design/table/export/common?projectId=${projectId}`);
      await expect(page.getByText('导出文件')).toBeVisible({ timeout: 15_000 });

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 120_000 }),
        page.getByText('导出Word').click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.doc$/i);
      const path = await download.path();
      expect(path).toBeTruthy();
      const fs = await import('fs');
      const buf = fs.readFileSync(path!);
      expect(buf[0]).toBe(0x50); // P
      expect(buf[1]).toBe(0x4b); // K — OOXML zip
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('普通导出页密度：与 22–28 chrome 同阶', async ({ page }) => {
    test.setTimeout(90_000);
    await login(page);
    await deleteOwnPersonProjects(page);
    const projectName = uniqueProjectName('exdense');
    await createAndOpenPersonProject(page, projectName, 'export', 'export dense');

    try {
      const projectId = new URL(page.url()).searchParams.get('projectId');
      await page.goto(`/design/table/export/common?projectId=${projectId}`);
      const pageRoot = page.getByTestId('export-common-page');
      await expect(pageRoot).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('heading', { name: '导出文件' })).toBeVisible();
      await expect(page.getByRole('button', { name: '导出Markdown' })).toBeVisible();
      await expect(page.getByTestId('export-common-markdown')).toBeVisible();

      // ADR-0016：页头 13/22、卡片 pad ≤10×12；禁 16 pad + Title level4 松卡片
      const metrics = await pageRoot.evaluate((el) => {
        const title = el.querySelector('.export-common-page__title') as HTMLElement | null;
        const card = el.querySelector('.export-common-card') as HTMLElement | null;
        const avatar = el.querySelector('.ant-list-item-meta-avatar') as HTMLElement | null;
        const svgPath = avatar?.querySelector('path');
        const tcs = title ? getComputedStyle(title) : null;
        const ccs = card ? getComputedStyle(card) : null;
        const acs = avatar ? getComputedStyle(avatar) : null;
        const brand = getComputedStyle(document.documentElement)
          .getPropertyValue('--erd-brand')
          .trim()
          .toLowerCase();
        return {
          titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
          titleLh: tcs ? parseFloat(tcs.lineHeight) : NaN,
          cardPadY: ccs
            ? parseFloat(ccs.paddingTop) + parseFloat(ccs.paddingBottom)
            : NaN,
          cardPadX: ccs
            ? parseFloat(ccs.paddingLeft) + parseFloat(ccs.paddingRight)
            : NaN,
          pagePadY: parseFloat(getComputedStyle(el).paddingTop) +
            parseFloat(getComputedStyle(el).paddingBottom),
          avatarColor: acs ? acs.color.replace(/\s/g, '').toLowerCase() : '',
          pathFillAttr: (svgPath?.getAttribute('fill') || '').toLowerCase(),
          brand,
        };
      });
      expect(metrics.titleFont, `页标题字号应 ≤14（目标 13），得 ${metrics.titleFont}`).toBeLessThanOrEqual(
        14,
      );
      expect(metrics.titleFont).toBeGreaterThanOrEqual(12);
      expect(metrics.titleLh, `页标题行高应 ≤24（目标 22），得 ${metrics.titleLh}`).toBeLessThanOrEqual(
        24,
      );
      expect(
        metrics.cardPadY,
        `卡片 padding-block 合计应 ≤20（目标 8+8），得 ${metrics.cardPadY}`,
      ).toBeLessThanOrEqual(20);
      expect(metrics.cardPadY).toBeGreaterThanOrEqual(12);
      expect(
        metrics.cardPadX,
        `卡片 padding-inline 合计应 ≤24（目标 10+10），得 ${metrics.cardPadX}`,
      ).toBeLessThanOrEqual(24);
      expect(
        metrics.pagePadY,
        `页 chrome padY 应 ≤24（目标 8+…），得 ${metrics.pagePadY}`,
      ).toBeLessThanOrEqual(24);
      expect(metrics.brand.length).toBeGreaterThan(0);
      // currentColor → rgb；与 --erd-brand 同源（禁硬编码 #DE2910 字面量）
      expect(metrics.pathFillAttr).toBe('currentcolor');
      expect(metrics.avatarColor).toMatch(/^rgb/);
      expect(metrics.avatarColor).not.toBe('rgba(0,0,0,0)');
      expect(metrics.avatarColor).not.toBe('transparent');

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-export-common-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
