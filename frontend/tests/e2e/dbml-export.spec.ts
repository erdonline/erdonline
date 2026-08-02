import { expect, test } from '@playwright/test';
import path from 'path';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * DBML 导出：导入 fixture → 导出 → 下载内容含 Table / Ref
 */
test.describe('DBML 导出', () => {
  test('导入后导出下载 .dbml 含 Table 与 Ref', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('dbmlexp');
    const fixture = path.join(__dirname, '../fixtures/minimal.dbml');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dbmlexp', 'dbml export');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('menuitem', { name: '导入DBML' }).click();
      const importDlg = page.getByRole('dialog');
      await expect(importDlg.getByText('导入 DBML')).toBeVisible({
        timeout: 10_000,
      });
      await importDlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /DBML 导入成功/);
      await expect(importDlg).toBeHidden({ timeout: 10_000 });

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导出' })
        .click();
      await page.getByRole('menuitem', { name: '导出DBML' }).click();

      const exportDlg = page.getByRole('dialog');
      await expect(exportDlg.getByText('导出 DBML')).toBeVisible({
        timeout: 10_000,
      });
      const preview = exportDlg.getByLabel('DBML预览');
      await expect(preview).toBeVisible();
      await expect
        .poll(async () => preview.inputValue(), { timeout: 15_000 })
        .toMatch(/Table\s+users/);
      const content = await preview.inputValue();
      expect(content).toMatch(/Table\s+posts/);
      expect(content).toMatch(/Ref:\s*posts\.user_id\s*>\s*users\.id/);

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15_000 }),
        exportDlg.getByRole('button', { name: '下载DBML' }).click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.dbml$/i);
      const dlPath = await download.path();
      expect(dlPath).toBeTruthy();
      const fs = await import('fs');
      const body = fs.readFileSync(dlPath!, 'utf8');
      expect(body).toMatch(/Table\s+users/);
      await expectToast(page, /已下载 DBML/);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('导出弹层密度：与 22–28 chrome 同阶', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('dbmlexpd');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'exdense', 'dbml export dense');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导出' })
        .click();
      await page.getByRole('menuitem', { name: '导出DBML' }).click();

      const exportDlg = page.getByRole('dialog', { name: '导出 DBML' });
      await expect(exportDlg).toBeVisible({ timeout: 10_000 });
      await expect(exportDlg.getByRole('combobox', { name: '导出模型' })).toBeVisible();

      const metrics = await page.evaluate(() => {
        const root =
          (document.querySelector('.erd-io-modal-root .ant-modal') as HTMLElement) ||
          (document.querySelector('.erd-io-modal') as HTMLElement);
        if (!root) return { err: 'no-modal' } as const;
        const title = root.querySelector('.ant-modal-title') as HTMLElement | null;
        const body = root.querySelector('.ant-modal-body') as HTMLElement | null;
        const select = root.querySelector('.ant-select-selector') as HTMLElement | null;
        const footerBtn = root.querySelector(
          '.ant-modal-footer .ant-btn-primary',
        ) as HTMLElement | null;
        const styleW = parseFloat(root.style.width || '') || NaN;
        const cssW = parseFloat(getComputedStyle(root).width) || NaN;
        const bcs = body ? getComputedStyle(body) : null;
        const tcs = title ? getComputedStyle(title) : null;
        const scs = select ? getComputedStyle(select) : null;
        const fcs = footerBtn ? getComputedStyle(footerBtn) : null;
        return {
          width: Number.isFinite(styleW) ? styleW : cssW,
          titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
          bodyPadY: bcs
            ? parseFloat(bcs.paddingTop) + parseFloat(bcs.paddingBottom)
            : NaN,
          selectH: scs ? parseFloat(scs.height) : NaN,
          okH: fcs ? parseFloat(fcs.height) : NaN,
        };
      });
      expect(metrics, '应找到 .erd-io-modal').not.toHaveProperty('err');
      expect(metrics.width).toBeGreaterThanOrEqual(520);
      expect(metrics.width).toBeLessThanOrEqual(600);
      expect(metrics.titleFont).toBeLessThanOrEqual(14);
      expect(metrics.bodyPadY, `body padY 应 ≤28，得 ${metrics.bodyPadY}`).toBeLessThanOrEqual(
        28,
      );
      expect(metrics.selectH, `Select 高应 ≤32，得 ${metrics.selectH}`).toBeLessThanOrEqual(
        32,
      );
      expect(metrics.selectH).toBeGreaterThanOrEqual(24);
      expect(metrics.okH).toBeLessThanOrEqual(32);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-export-modal-dense.png',
        fullPage: false,
      });
      await page.keyboard.press('Escape');
      await expect(exportDlg).toBeHidden({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
