import { expect, test } from '@playwright/test';
import {
  deleteOwnPersonProjects,
  e2eAccount,
  login,
} from './helpers';

/**
 * ADR-0028：模板广场 MVP — 浏览 → 安装 → 设计器
 */
test.describe('模板广场', () => {
  test('匿名可浏览列表与详情', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByTestId('catalog-list-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('catalog-tile-first')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('catalog-tile-first').click();
    await expect(page.getByTestId('catalog-detail-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('catalog-install-btn')).toBeVisible();
  });

  test('登录安装 blank 模板进入设计器', async ({ page }) => {
    test.setTimeout(60_000);
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await page.goto('/catalog/blank');
      await expect(page.getByTestId('catalog-install-btn')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('catalog-install-btn').click();
      await expect(page).toHaveURL(/\/design\/table\/model\?projectId=/, { timeout: 30_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('/project/new 重定向到模板广场', async ({ page }) => {
    await login(page);
    await page.goto('/project/new');
    await expect(page).toHaveURL(/\/catalog/, { timeout: 15_000 });
    await expect(page.getByTestId('catalog-list-page')).toBeVisible();
  });
});
