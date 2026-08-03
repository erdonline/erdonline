import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * ADR-0016：设计器次屏碎密度 —
 * 逆向 / 高级导出 DDL / 设置井 / 同步配置弹层 与 22–28 chrome 同源；
 * 禁 Steps marginTop:16 / marginBottom:24 + 裸 Card mb16
 */
test.describe('设计器次屏碎密度', () => {
  test.describe.configure({ retries: 1 });

  test('逆向·DDL·设置·同步配置 densify', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('secpane');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'sec', 'secondary pane densify');

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await page.goto(`/design/table/import/reverse?projectId=${projectId}`);
      const reversePage = page.getByTestId('import-reverse-page');
      await expect(reversePage).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole('heading', { name: '解析已有数据源' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /下一步/ })).toBeVisible();

      const reverseMetrics = await reversePage.evaluate((el) => {
        const title = el.querySelector('.erd-secondary-pane__title') as HTMLElement | null;
        const steps = el.querySelector('.erd-secondary-pane__steps') as HTMLElement | null;
        const item = el.querySelector(
          '.erd-secondary-pane__form .ant-form-item',
        ) as HTMLElement | null;
        const pcs = getComputedStyle(el);
        const tcs = title ? getComputedStyle(title) : null;
        const scs = steps ? getComputedStyle(steps) : null;
        const ics = item ? getComputedStyle(item) : null;
        return {
          pagePadT: parseFloat(pcs.paddingTop),
          pagePadX: parseFloat(pcs.paddingLeft),
          titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
          stepsMt: scs ? parseFloat(scs.marginTop) : NaN,
          stepsMb: scs ? parseFloat(scs.marginBottom) : NaN,
          itemMb: ics ? parseFloat(ics.marginBottom) : NaN,
        };
      });
      expect(reverseMetrics.pagePadT, `逆向页 padT 应 ≤8，得 ${reverseMetrics.pagePadT}`).toBeLessThanOrEqual(8);
      expect(reverseMetrics.pagePadX).toBeLessThanOrEqual(12);
      expect(reverseMetrics.titleFont).toBeLessThanOrEqual(14);
      expect(reverseMetrics.titleFont).toBeGreaterThanOrEqual(12);
      expect(
        reverseMetrics.stepsMt,
        `Steps marginTop 应 ≤10（禁 16），得 ${reverseMetrics.stepsMt}`,
      ).toBeLessThanOrEqual(10);
      expect(
        reverseMetrics.stepsMb,
        `Steps marginBottom 应 ≤12（禁 24），得 ${reverseMetrics.stepsMb}`,
      ).toBeLessThanOrEqual(12);
      expect(reverseMetrics.itemMb).toBeLessThanOrEqual(16);

      await page.goto(`/design/table/export/more?projectId=${projectId}`);
      const ddlPage = page.getByTestId('export-ddl-page');
      await expect(ddlPage).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('heading', { name: '导出 DDL' })).toBeVisible();

      const ddlMetrics = await ddlPage.evaluate((el) => {
        const steps = el.querySelector('.erd-secondary-pane__steps') as HTMLElement | null;
        const pcs = getComputedStyle(el);
        const scs = steps ? getComputedStyle(steps) : null;
        return {
          pagePadT: parseFloat(pcs.paddingTop),
          stepsMb: scs ? parseFloat(scs.marginBottom) : NaN,
        };
      });
      expect(ddlMetrics.pagePadT).toBeLessThanOrEqual(8);
      expect(
        ddlMetrics.stepsMb,
        `DDL Steps mb 应 ≤12（禁 24），得 ${ddlMetrics.stepsMb}`,
      ).toBeLessThanOrEqual(12);

      await page.goto(`/design/table/setting/default?projectId=${projectId}`);
      const setupPage = page.getByTestId('default-setup-page');
      await expect(setupPage).toBeVisible({ timeout: 15_000 });
      const setupMetrics = await setupPage.evaluate((el) => {
        const hint = el.querySelector('.setting-common-page__hint') as HTMLElement | null;
        const pcs = getComputedStyle(el);
        const hcs = hint ? getComputedStyle(hint) : null;
        return {
          pagePadT: parseFloat(pcs.paddingTop),
          hintMb: hcs ? parseFloat(hcs.marginBottom) : NaN,
        };
      });
      expect(setupMetrics.pagePadT).toBeLessThanOrEqual(8);
      expect(
        setupMetrics.hintMb,
        `设置 hint mb 应 ≤8，得 ${setupMetrics.hintMb}`,
      ).toBeLessThanOrEqual(8);

      await page.goto(`/design/table/version/all?projectId=${projectId}`);
      await expect(page.getByRole('button', { name: '同步配置' })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('button', { name: '同步配置' }).click();
      const syncDialog = page.getByRole('dialog', { name: '同步配置' });
      await expect(syncDialog).toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId('sync-config-upgrade-type')).toBeVisible();

      const syncMetrics = await syncDialog.evaluate((el) => {
        const header = el.querySelector('.ant-modal-header') as HTMLElement | null;
        const body = el.querySelector('.ant-modal-body') as HTMLElement | null;
        const btn = el.querySelector('.ant-modal-footer .ant-btn') as HTMLElement | null;
        const hcs = header ? getComputedStyle(header) : null;
        const bcs = body ? getComputedStyle(body) : null;
        const btnCs = btn ? getComputedStyle(btn) : null;
        return {
          headerPadT: hcs ? parseFloat(hcs.paddingTop) : NaN,
          bodyPadT: bcs ? parseFloat(bcs.paddingTop) : NaN,
          btnH: btnCs ? parseFloat(btnCs.height) : NaN,
          hasIo: el.classList.contains('erd-io-modal') || !!el.closest('.erd-io-modal'),
        };
      });
      expect(syncMetrics.hasIo, '同步配置应挂 .erd-io-modal').toBeTruthy();
      expect(syncMetrics.headerPadT).toBeLessThanOrEqual(12);
      expect(syncMetrics.bodyPadT).toBeLessThanOrEqual(8);
      expect(syncMetrics.btnH).toBeLessThanOrEqual(32);

      await syncDialog.getByRole('button', { name: '取 消' }).click();
      await expect(syncDialog).toBeHidden({ timeout: 5_000 });

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-secondary-pane-dense.png',
        fullPage: true,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
