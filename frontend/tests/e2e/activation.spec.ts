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

  test('开源版可连续创建多个个人项目', async ({ page }) => {
    test.setTimeout(120_000);
    const a = `multi-a-${Date.now()}`;
    const b = `multi-b-${Date.now()}`;
    try {
      await login(page);
      await deleteAllPersonProjects(page);

      const create = async (name: string) => {
        await page.goto('/project/person');
        await page.getByRole('button', { name: /新\s*建/ }).click();
        await page.getByPlaceholder('请输入项目名').fill(name);
        await page.locator('.ant-modal .ant-select').first().click();
        await page.locator('.ant-select-item-option', { hasText: '个人项目' }).click();
        await page.locator('.ant-modal .ant-select').nth(1).click();
        await page.keyboard.type('m');
        await page.keyboard.press('Enter');
        await page.getByPlaceholder('请输入项目描述').fill('no quota');
        await page.locator('.ant-modal').getByRole('button', { name: /确\s*定/ }).click();
        await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
      };

      await create(a);
      await create(b);
      await expect(page.getByRole('button', { name: /删\s*除/ })).toHaveCount(2, { timeout: 10_000 });
    } finally {
      await deleteAllPersonProjects(page).catch(() => {});
    }
  });
});
