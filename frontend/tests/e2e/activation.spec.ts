import { expect, test } from '@playwright/test';
import { deleteAllPersonProjects, login } from './helpers';

/**
 * 新手 30s 激活：首页「示例项目」一键进设计器并见到表/关系。
 */
test.describe('新手激活', () => {
  test('首页示例项目一键进入设计器可见表与连线', async ({ page }) => {
    test.setTimeout(120_000);
    try {
      await login(page);
      await deleteAllPersonProjects(page);

      await page.goto('/home');
      await expect(page.getByTestId('home-link-example')).toBeVisible({ timeout: 15_000 });
      // 死链回归：新建模型应指向真实个人项目页
      await expect(page.getByTestId('home-link-new-project')).toHaveAttribute(
        'href',
        /\/project\/person/,
      );

      await page.getByTestId('home-link-example').click();
      await expect(page).toHaveURL(/\/design\/table/, { timeout: 20_000 });
      await expect(page.locator('.ant-message')).toContainText(/示例项目已就绪/, {
        timeout: 15_000,
      });

      // 展开关系图
      await expect(page.locator('.ant-tree')).toContainText('示例商城', { timeout: 15_000 });
      const expand = async (title: string) => {
        const n = page
          .locator('.ant-tree-treenode', { has: page.getByText(title, { exact: true }) })
          .first();
        await n.locator('.ant-tree-switcher').first().click();
        await page.waitForTimeout(300);
      };
      await expand('示例商城');
      await expand('关系');
      await page.locator('.ant-tree [class*=title]', { hasText: '关系图' }).last().click();
      await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('.react-flow__node', { hasText: 'T_USER' })).toBeVisible();
      await expect(page.locator('.react-flow__node', { hasText: 'T_ORDER' })).toBeVisible();
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);
    } finally {
      await deleteAllPersonProjects(page).catch(() => {});
    }
  });
});
