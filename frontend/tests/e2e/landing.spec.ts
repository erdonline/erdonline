import { expect, test } from '@playwright/test';

/**
 * P5 落地页：公开叙事 + CTA → demo / 登录
 */
test.describe('落地页', () => {
  test('加载可见品牌与主文案；CTA 可达 demo 与登录', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-page')).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: 'ERD Online' }).first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /数据库设计的 Git \+ Figma/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'ERD Online 设计器关系图画布' }),
    ).toBeVisible();

    await page.getByRole('link', { name: '在线试用 demo' }).click();
    await expect(page).toHaveURL(/\/(demo|s\/public-demo)/, { timeout: 15_000 });

    await page.goto('/');
    await page.getByRole('link', { name: '去登录' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('link', { name: '了解产品' })).toBeVisible();
    await page.getByRole('link', { name: '了解产品' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('landing-page')).toBeVisible();
  });
});
