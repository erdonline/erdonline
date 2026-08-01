import { expect } from '@playwright/test';

/**
 * E2E 共享助手
 */

export const ADMIN = { name: 'admin', pass: '123456' };

export async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: '用户名' }).fill(ADMIN.name);
  await page.getByRole('textbox', { name: '密码' }).fill(ADMIN.pass);
  await page.getByRole('button', { name: /登\s*录/ }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

/**
 * 清空个人项目（免费版配额仅 1 个，任一泄漏会让全套件后续建项目 500 连锁失败）。
 * 每个建项目的用例：开头先清（自愈历史泄漏），finally 再清（不留新泄漏）。
 * UI 删除走正式链路（含 VIP 缓存清除），比直接改库更真实。
 */
export async function deleteAllPersonProjects(page: import('@playwright/test').Page) {
  await page.goto('/project/person');
  await page.waitForTimeout(1_500);
  for (let i = 0; i < 10; i += 1) {
    const delBtn = page.getByRole('button', { name: /删\s*除/ }).first();
    if ((await delBtn.count()) === 0 || !(await delBtn.isVisible().catch(() => false))) {
      break;
    }
    await delBtn.click();
    await page.getByRole('button', { name: '是' }).click();
    // 等到该删除按钮消失再继续，避免 VIP 缓存未清就立刻建项目
    await expect(delBtn).toHaveCount(0, { timeout: 8_000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  await expect(page.getByRole('button', { name: /删\s*除/ })).toHaveCount(0, { timeout: 5_000 });
}
