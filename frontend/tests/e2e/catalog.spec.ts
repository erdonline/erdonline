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
  test('列表 SEO 独立于首页 title', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByTestId('catalog-list-page')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveTitle(/ER 图模板/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /ER 图模板/,
    );
    await expect(page).not.toHaveTitle(/Draw ER Diagram Online/);
  });

  test('匿名可浏览列表与详情', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByTestId('catalog-chrome')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('catalog-list-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('home-layout')).toHaveCount(0);
    await expect(page.getByTestId('landing-nav-catalog')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('catalog-tile-first')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('catalog-tile-first').click();
    await expect(page.getByTestId('catalog-detail-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('catalog-detail-action-bar')).toBeVisible();
    await expect(page.getByTestId('catalog-install-btn')).toBeVisible();
  });

  test('已登录仍走公开壳，非 HomeLayout', async ({ page }) => {
    await login(page);
    await page.goto('/catalog');
    await expect(page.getByTestId('catalog-chrome')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('home-layout')).toHaveCount(0);
    await expect(page.getByTestId('catalog-list-page')).toBeVisible({ timeout: 15_000 });
  });

  test('深色 landing 视觉：无主内容白卡片', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByTestId('catalog-tile-first')).toBeVisible({ timeout: 15_000 });

    const mainBg = await page.getByTestId('catalog-main-content').evaluate((el) => {
      const { backgroundColor } = getComputedStyle(el);
      return backgroundColor;
    });
    expect(mainBg).toMatch(/rgba?\(0,\s*0,\s*0,\s*0\)|transparent/i);

    const cardBg = await page.getByTestId('catalog-tile-first').evaluate((el) => {
      return getComputedStyle(el).backgroundColor;
    });
    expect(cardBg).not.toBe('rgb(255, 255, 255)');

    await page.screenshot({
      path: 'test-results/ux-walkthrough/catalog-dark-surface.png',
      fullPage: true,
    });
  });

  test('详情页展示只读关系图预览（ReactFlow）', async ({ page }) => {
    await page.goto('/catalog/demo-authz');
    await expect(page.getByTestId('catalog-detail-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('catalog-preview-panel')).toBeVisible();
    await expect(page.getByTestId('catalog-preview-readonly-tag')).toHaveText('只读预览');
    await expect(page.getByTestId('share-relation-canvas')).toBeVisible({ timeout: 15_000 });
  });

  test('安装与评分后指标来自 API 并刷新', async ({ page }) => {
    test.setTimeout(90_000);
    const templateId = 'demo-authz';
    try {
      await login(page);
      await deleteOwnPersonProjects(page);

      const fetchDetail = () =>
        page.evaluate(async (id) => {
          const res = await fetch(`/ncnb/catalog/v1/templates/${encodeURIComponent(id)}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('Authorization') || ''}`,
            },
          });
          const json = await res.json();
          return json?.data ?? json;
        }, templateId);

      const before = await fetchDetail();
      const installBefore = Number(before?.installCount ?? 0);
      const ratingCountBefore = Number(before?.ratingCount ?? 0);

      await page.goto(`/catalog/${templateId}`);
      await expect(page.getByTestId('catalog-install-btn')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('catalog-install-btn').click();
      await expect(page).toHaveURL(/\/design\/table\/model\?projectId=/, { timeout: 30_000 });

      const afterInstall = await fetchDetail();
      expect(Number(afterInstall?.installCount ?? 0)).toBeGreaterThanOrEqual(installBefore + 1);
      expect(afterInstall?.installed).toBe(true);

      await page.goto(`/catalog/${templateId}`);
      await expect(page.getByTestId('catalog-rate')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('catalog-rate').locator('.ant-rate-star').nth(4).click();
      await expect(page.getByTestId('catalog-rating-count')).toContainText(
        String(ratingCountBefore + 1),
        { timeout: 15_000 },
      );

      const afterRate = await fetchDetail();
      expect(Number(afterRate?.ratingCount ?? 0)).toBeGreaterThanOrEqual(ratingCountBefore + 1);
      expect(Number(afterRate?.userRating ?? 0)).toBe(5);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
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

  test('热门排序 tab 可切换', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByTestId('catalog-list-page')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('catalog-sort-hot').click();
    await expect(page.getByTestId('catalog-sort-hot')).toHaveClass(/ant-btn-primary/);
    await expect(page.getByTestId('catalog-tile-first')).toBeVisible({ timeout: 15_000 });
  });

  test('同一模板可多次安装，每次新建项目', async ({ page }) => {
    test.setTimeout(90_000);
    const templateId = 'blank';
    try {
      await login(page);
      await deleteOwnPersonProjects(page);

      const installViaApi = () =>
        page.evaluate(async (id) => {
          const token = localStorage.getItem('Authorization');
          const res = await fetch(`/ncnb/catalog/v1/templates/${encodeURIComponent(id)}/install`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const json = await res.json();
          return json?.data ?? json;
        }, templateId);

      const first = await installViaApi();
      const second = await installViaApi();

      expect(first?.projectId).toBeTruthy();
      expect(second?.projectId).toBeTruthy();
      expect(second.projectId).not.toBe(first.projectId);

      await page.goto(`/catalog/${templateId}`);
      await expect(page.getByTestId('catalog-install-btn')).toHaveText('再次安装（创建新副本）', {
        timeout: 15_000,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('安装后评论限频（API）', async ({ page }) => {
    test.setTimeout(60_000);
    try {
      await login(page);
      await page.goto('/catalog/blank');
      await expect(page.getByTestId('catalog-detail-page')).toBeVisible({ timeout: 15_000 });

      const postComment = (body: string) =>
        page.evaluate(async (text) => {
          const token = localStorage.getItem('Authorization');
          const res = await fetch('/ncnb/catalog/v1/templates/blank/comments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ body: text }),
          });
          return res.status;
        }, body);

      const first = await postComment(`E2E限频探针A-${Date.now()}`);
      const second = await postComment(`E2E限频探针B-${Date.now()}`);
      if (first === 200) {
        expect(second).toBe(429);
      } else {
        expect(first).toBe(429);
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
