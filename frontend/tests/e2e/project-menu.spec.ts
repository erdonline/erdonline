import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

test.describe('设计器项目菜单', () => {
  test('项目 → 设置 → 数据源设置 可打开', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('menu');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page.getByRole('menuitem', { name: '设置' }).hover();
      await page.getByRole('button', { name: '数据源设置' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText('数据源连接配置')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('项目 → 导入 → 三项入口可开弹窗', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('import');

    const openImport = async (entry: string) => {
      await page.getByRole('button', { name: '项目菜单' }).click();
      await page.getByRole('menuitem', { name: '导入' }).hover();
      await page.getByRole('button', { name: entry }).click();
    };
    const closeDialog = async () => {
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /取\s*消|关\s*闭/ }).first().click().catch(async () => {
        await page.keyboard.press('Escape');
      });
      await expect(dialog).toBeHidden({ timeout: 10_000 });
    };

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await openImport('数据源逆向解析');
      await expect(page.getByRole('dialog').getByText(/解析已有数据源/)).toBeVisible({
        timeout: 10_000,
      });
      await closeDialog();

      await openImport('解析PdMan文件');
      const pdman = page.getByRole('dialog');
      await expect(pdman.getByText('解析已有PdMan文件')).toBeVisible();
      await expect(pdman.getByText(/点击或者拖拽PdMand导出的json文件/)).toBeVisible();
      await closeDialog();

      await openImport('解析ERD文件');
      const erd = page.getByRole('dialog');
      await expect(erd.getByText('解析已有ERD文件')).toBeVisible();
      await expect(erd.getByText(/点击或者拖拽ERD导出的json文件/)).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
