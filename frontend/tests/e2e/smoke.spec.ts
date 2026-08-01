import { expect, test } from '@playwright/test';
import { deleteAllPersonProjects, login } from './helpers';

/**
 * 核心旅程冒烟（第 0 轮验证基建）
 *
 * 覆盖：登录 → 新建项目 → 进入设计器。
 * test.fixme 标记的用例是第 1 轮急救包的修复目标，随修复落地启用。
 *
 * 种子账号：admin / 123456（见 db/init/03_martin.sql）
 */

test.describe('冒烟：核心旅程', () => {
  test('登录页渲染；错误凭证停留在登录页', async ({ page }) => {
    await page.goto('/login');
    // ProForm 渲染的输入框不带 placeholder 属性，按可访问名定位
    await expect(page.getByRole('textbox', { name: '用户名' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '密码' })).toBeVisible();

    await page.getByRole('textbox', { name: '用户名' }).fill('nobody');
    await page.getByRole('textbox', { name: '密码' }).fill('wrong-pass');
    await page.getByRole('button', { name: /登\s*录/ }).click();

    // 当前行为基线：失败后停留在登录页（不跳转）
    await page.waitForTimeout(3_000);
    await expect(page).toHaveURL(/\/login/);
  });

  // 第 1 轮已修复：request 层 errorHandler 对登录 401 展示「用户名或密码错误」
  test('错误凭证登录出现明确错误提示', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: '用户名' }).fill('nobody');
    await page.getByRole('textbox', { name: '密码' }).fill('wrong-pass');
    await page.getByRole('button', { name: /登\s*录/ }).click();
    // 后端业务错误信息（查无此用户）必须透传展示，且同一条错误只提示一次
    await expect(page.locator('.ant-message')).toContainText('查无此用户');
    await expect(page.locator('.ant-message-notice')).toHaveCount(1);
  });

  test('登录 → 新建项目 → 进入设计器', async ({ page }) => {
    await login(page);

    // 开头先清空个人项目：自愈历史泄漏（免费版配额仅 1，泄漏会让建项目 500）
    await deleteAllPersonProjects(page);

    // 新建项目
    await page.getByRole('button', { name: /新\s*建/ }).click();
    const projectName = `smoke-${Date.now()}`;
    await page.getByPlaceholder('请输入项目名').fill(projectName);
    // antd Select 的 placeholder 不是 input 属性：点击选择器容器，按文本精确选「个人项目」
    await page.locator('.ant-modal .ant-select').first().click();
    await page.locator('.ant-select-item-option', { hasText: '个人项目' }).click();
    // 标签必填（第 2 个 select，tags 模式：键盘输入后回车确认）
    await page.locator('.ant-modal .ant-select').nth(1).click();
    await page.keyboard.type('smoke');
    await page.keyboard.press('Enter');
    // 描述必填
    await page.getByPlaceholder('请输入项目描述').fill('smoke test project');
    await page
      .locator('.ant-modal')
      .getByRole('button', { name: /确\s*定|提\s*交|保\s*存/ })
      .click();
    await expect(page.getByText(projectName).first()).toBeVisible();

    // 打开项目进入设计器（点项目名无效，需点卡片上的「打开模型」按钮）
    await page.getByRole('button', { name: '打开模型' }).first().click();
    await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });

    // 清理：全量清空（比按名找更可靠——中途失败时页面状态不可控）
    await deleteAllPersonProjects(page);
    await expect(page.getByText(projectName)).toHaveCount(0);
  });

  test('模型树删除表需二次确认（取消不删）', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = `del-${Date.now()}`;
    try {
      await login(page);
      await deleteAllPersonProjects(page);

      await page.getByRole('button', { name: /新\s*建/ }).click();
      await page.getByPlaceholder('请输入项目名').fill(projectName);
      await page.locator('.ant-modal .ant-select').first().click();
      await page.locator('.ant-select-item-option', { hasText: '个人项目' }).click();
      await page.locator('.ant-modal .ant-select').nth(1).click();
      await page.keyboard.type('del');
      await page.keyboard.press('Enter');
      await page.getByPlaceholder('请输入项目描述').fill('delete confirm');
      await page.locator('.ant-modal').getByRole('button', { name: /确\s*定/ }).click();
      await expect(page.getByText(projectName).first()).toBeVisible();
      await page.getByRole('button', { name: '打开模型' }).first().click();
      await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });

      await page.getByRole('button', { name: /新增模型/ }).click();
      const moduleModal = page.locator('.ant-modal:visible').last();
      await moduleModal.locator('input').first().fill('M1');
      await moduleModal.locator('input').nth(1).fill('模块一');
      await moduleModal.getByRole('button', { name: /确\s*定/ }).click();
      await expect(page.locator('.ant-tree')).toContainText('模块一');

      // 展开 → 关系图 → 空态建表
      const expand = async (title: string) => {
        const n = page
          .locator('.ant-tree-treenode', { has: page.getByText(title, { exact: true }) })
          .first();
        await n.locator('.ant-tree-switcher').first().click();
        await page.waitForTimeout(300);
      };
      await expand('模块一');
      await expand('关系');
      await page.locator('.ant-tree [class*=title]', { hasText: '关系图' }).last().click();
      await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10_000 });
      await page.locator('.erd-empty-button').click();
      await expect(page.locator('.react-flow__node', { hasText: 'T_TABLE_1' })).toBeVisible();

      // 展开「表」文件夹，实体节点才有「…」菜单
      await expand('表');
      const entityNode = page
        .locator('.ant-tree-treenode', { has: page.getByText('T_TABLE_1', { exact: true }) })
        .first();
      await expect(entityNode).toBeVisible({ timeout: 5_000 });
      await entityNode.locator('.anticon-ellipsis').click();
      await page.getByRole('menuitem', { name: '删除表' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText(/确定删除表/)).toBeVisible();
      // antd 按钮文案中间可能有空格：「取 消」
      await dialog.getByRole('button', { name: /取\s*消/ }).click();
      await expect(page.locator('.react-flow__node', { hasText: 'T_TABLE_1' })).toBeVisible();
    } finally {
      await deleteAllPersonProjects(page).catch(() => {});
    }
  });
});
