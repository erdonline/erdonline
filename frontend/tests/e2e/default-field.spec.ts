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
 * W6 `/design/table/setting/defaultField`：编辑有 toast，新表带默认字段
 * ADR-0016：设置页 chrome 密度（DefaultField / DefaultSetUp）
 */
test.describe('默认字段设置', () => {
  test.describe.configure({ retries: 1 });

  test('设置页密度：默认字段 / 系统默认项与 22–28 chrome 同阶', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('setdense');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await page.goto(
        `/design/table/setting/defaultField?projectId=${projectId}`,
      );
      const fieldPage = page.getByTestId('default-field-page');
      await expect(fieldPage).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole('heading', { name: '默认字段设置' }),
      ).toBeVisible();

      const fieldMetrics = await fieldPage.evaluate((el) => {
        const title = el.querySelector(
          '.setting-common-page__title',
        ) as HTMLElement | null;
        const tcs = title ? getComputedStyle(title) : null;
        const pcs = getComputedStyle(el);
        return {
          titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
          titleLh: tcs ? parseFloat(tcs.lineHeight) : NaN,
          pagePadY:
            parseFloat(pcs.paddingTop) + parseFloat(pcs.paddingBottom),
        };
      });
      expect(
        fieldMetrics.titleFont,
        `默认字段页标题字号应 ≤14（目标 13），得 ${fieldMetrics.titleFont}`,
      ).toBeLessThanOrEqual(14);
      expect(fieldMetrics.titleFont).toBeGreaterThanOrEqual(12);
      expect(
        fieldMetrics.titleLh,
        `默认字段页标题行高应 ≤24（目标 22），得 ${fieldMetrics.titleLh}`,
      ).toBeLessThanOrEqual(24);
      expect(
        fieldMetrics.pagePadY,
        `默认字段页 padY 应 ≤24（目标 8+…），得 ${fieldMetrics.pagePadY}`,
      ).toBeLessThanOrEqual(24);

      await page.goto(
        `/design/table/setting/default?projectId=${projectId}`,
      );
      const setupPage = page.getByTestId('default-setup-page');
      await expect(setupPage).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole('heading', { name: '系统默认项设置' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
      await expect(page.getByLabel('ERD秘钥')).toBeVisible();

      const setupMetrics = await setupPage.evaluate((el) => {
        const title = el.querySelector(
          '.setting-common-page__title',
        ) as HTMLElement | null;
        const input = el.querySelector(
          '.setting-common-form .ant-input:not(textarea)',
        ) as HTMLElement | null;
        const btn = el.querySelector(
          '.setting-common-form .ant-btn-primary',
        ) as HTMLElement | null;
        const item = el.querySelector(
          '.setting-common-form .ant-form-item',
        ) as HTMLElement | null;
        const tcs = title ? getComputedStyle(title) : null;
        const ics = input ? getComputedStyle(input) : null;
        const bcs = btn ? getComputedStyle(btn) : null;
        const mcs = item ? getComputedStyle(item) : null;
        return {
          titleFont: tcs ? parseFloat(tcs.fontSize) : NaN,
          titleLh: tcs ? parseFloat(tcs.lineHeight) : NaN,
          inputH: ics ? parseFloat(ics.height) : NaN,
          btnH: bcs ? parseFloat(bcs.height) : NaN,
          itemMb: mcs ? parseFloat(mcs.marginBottom) : NaN,
        };
      });
      expect(setupMetrics.titleFont).toBeLessThanOrEqual(14);
      expect(setupMetrics.titleLh).toBeLessThanOrEqual(24);
      expect(
        setupMetrics.inputH,
        `输入框高度应 ≤32（目标 28），得 ${setupMetrics.inputH}`,
      ).toBeLessThanOrEqual(32);
      expect(setupMetrics.inputH).toBeGreaterThanOrEqual(24);
      expect(
        setupMetrics.btnH,
        `保存钮高度应 ≤32（目标 28），得 ${setupMetrics.btnH}`,
      ).toBeLessThanOrEqual(32);
      expect(
        setupMetrics.itemMb,
        `表单项 margin-bottom 应 ≤16（目标 12），得 ${setupMetrics.itemMb}`,
      ).toBeLessThanOrEqual(16);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-setting-page-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('编辑保存有 toast，新建表带更新后的默认字段', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('deffield');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

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
      // jspreadsheet 结构单元格（非 antd）；改主键英文字段名验证闭环
      const idCell = sheet.getByText('id', { exact: true }).first();
      await expect(idCell).toBeVisible({ timeout: 10_000 });
      await idCell.dblclick();
      await page.keyboard.type('e2e_pk');
      await page.keyboard.press('Enter');
      await expectToast(page, '默认字段已更新');

      await gotoDesignModel(page);
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const firstNode = rfNode(page, 'T_TABLE_1');
      await expect(firstNode).toBeVisible({ timeout: 15_000 });
      await expect(firstNode).toContainText('e2e_pk');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
