import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { deleteAllPersonProjects } from './helpers';

/**
 * UX 走查（playwright-ux-audit 规则的可执行机制）
 *
 * 以真实用户旅程驱动浏览器，做两件事：
 * 1. UX 不变量断言：把历史上真实发现过的摩擦点固化为回归断言（死 affordance、账密泄露等）
 * 2. 全旅程截图存档：test-results/ux-walkthrough/，每轮走查人工翻一遍找新摩擦
 *
 * 新增摩擦点的流程：发现 → 登记 docs/regression-checklist.md → 修复 → 在此追加不变量断言
 */

const ADMIN = { name: 'admin', pass: '123456' };
const SHOTS_DIR = path.join(__dirname, '..', '..', 'test-results', 'ux-walkthrough');

async function shot(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: false });
}

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: '用户名' }).fill(ADMIN.name);
  await page.getByRole('textbox', { name: '密码' }).fill(ADMIN.pass);
  await page.getByRole('button', { name: /登\s*录/ }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

test.describe('UX 走查：核心旅程与不变量', () => {
  test('全旅程走查 + 死 affordance/账密泄露回归', async ({ page }) => {
    // 不变量：任何页面 console 不得输出明文账密（历史事故：登录页 console.log 打印账密）
    const consoleTexts: string[] = [];
    page.on('console', msg => consoleTexts.push(msg.text()));

    await login(page);
    await shot(page, '01-home');

    // 建项目（走查数据载体）
    await page.goto('/project/person');
    await page.getByRole('button', { name: /新\s*建/ }).click();
    const projectName = `ux-${Date.now()}`;
    await page.getByPlaceholder('请输入项目名').fill(projectName);
    await page.locator('.ant-modal .ant-select').first().click();
    await page.locator('.ant-select-item-option', { hasText: '个人项目' }).click();
    await page.locator('.ant-modal .ant-select').nth(1).click();
    await page.keyboard.type('ux');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('请输入项目描述').fill('ux audit');
    await page.locator('.ant-modal').getByRole('button', { name: /确\s*定/ }).click();
    await expect(page.getByText(projectName).first()).toBeVisible();
    await shot(page, '02-project-person');

    // 不变量：个人项目卡片标题必须是链接（死 affordance 回归，历史问题：标题纯文本点了没反应）
    await expect(page.getByRole('link', { name: projectName }).first()).toBeVisible();

    // 最近项目页：卡片同样可点
    await page.goto('/project/recent');
    await expect(page.getByRole('link', { name: projectName }).first()).toBeVisible();
    await shot(page, '03-project-recent');

    // 团队/数据模型页：走查截图（可能为空态）
    await page.goto('/project/group');
    await shot(page, '04-project-group');
    await page.goto('/dataModels');
    await expect(page.getByRole('link', { name: projectName }).first()).toBeVisible();
    await shot(page, '05-dataModels');

    // 通过卡片标题直达设计器（affordance 端到端有效，而非只是渲染了 <a>）
    await page.goto('/project/person');
    await page.getByRole('link', { name: projectName }).first().click();
    await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });
    await shot(page, '06-designer');

    // 清理
    await page.goto('/project/person');
    await page.getByRole('button', { name: /删\s*除/ }).first().click();
    await page.getByRole('button', { name: '是' }).click();
    await expect(page.getByText(projectName)).toHaveCount(0);

    // 账密泄露断言（登录密码绝不出现在任何 console 输出中）
    const leaked = consoleTexts.filter(t => t.includes(ADMIN.pass));
    expect(leaked.length, `console 泄露明文账密: ${leaked.join(';')}`).toBe(0);
  });
});
