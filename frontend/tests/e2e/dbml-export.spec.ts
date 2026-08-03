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

      // ADR-0016：导出弹层与导入同源 body 8×12；定位 dialog role「导出 DBML」
      const metrics = await exportDlg.evaluate((dialog) => {
        const body = dialog.querySelector('.ant-modal-body') as HTMLElement | null;
        const title = dialog.querySelector('.ant-modal-title') as HTMLElement | null;
        const select = dialog.querySelector('.ant-select-selector') as HTMLElement | null;
        const footerBtn = dialog.querySelector(
          '.ant-modal-footer .ant-btn-primary',
        ) as HTMLElement | null;
        const root =
          (dialog.closest('.ant-modal') as HTMLElement) ||
          (dialog as HTMLElement);
        const styleW = parseFloat(root.style.width || '') || NaN;
        const cssW = parseFloat(getComputedStyle(root).width) || NaN;
        const bcs = body ? getComputedStyle(body) : null;
        const tcs = title ? getComputedStyle(title) : null;
        const scs = select ? getComputedStyle(select) : null;
        const fcs = footerBtn ? getComputedStyle(footerBtn) : null;
        return {
          width: Number.isFinite(styleW) ? styleW : cssW,
          titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
          bodyPadT: bcs ? parseFloat(bcs.paddingTop) : NaN,
          bodyPadX: bcs ? parseFloat(bcs.paddingLeft) : NaN,
          bodyPadY: bcs
            ? parseFloat(bcs.paddingTop) + parseFloat(bcs.paddingBottom)
            : NaN,
          selectH: scs ? parseFloat(scs.height) : NaN,
          okH: fcs ? parseFloat(fcs.height) : NaN,
        };
      });
      expect(metrics.width).toBeGreaterThanOrEqual(520);
      expect(metrics.width).toBeLessThanOrEqual(600);
      expect(metrics.titleFont).toBeLessThanOrEqual(14);
      expect(metrics.bodyPadT, `body padT 应 ≤8，得 ${metrics.bodyPadT}`).toBeLessThanOrEqual(8);
      expect(metrics.bodyPadX, `body padX 应 ≤12，得 ${metrics.bodyPadX}`).toBeLessThanOrEqual(
        12,
      );
      expect(metrics.bodyPadY, `body padY 应 ≤16，得 ${metrics.bodyPadY}`).toBeLessThanOrEqual(
        16,
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
