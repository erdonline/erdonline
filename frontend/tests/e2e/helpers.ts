import { expect, test } from '@playwright/test';
import * as fs from 'fs';

/**
 * E2E 共享助手（支持多 worker 并发）
 *
 * 隔离约定：项目名必须以 `e2e-w{parallelIndex}-` 开头，清理只删本 worker 前缀，
 * 避免并行用例互相 deleteAll 踩踏。
 */

export const ADMIN = { name: 'admin', pass: '123456' };

/** 当前 worker 的项目名前缀，如 e2e-w0- */
export function e2ePrefix(): string {
  return `e2e-w${test.info().parallelIndex}-`;
}

/** 生成本 worker 唯一项目名 */
export function uniqueProjectName(stem: string): string {
  return `${e2ePrefix()}${stem}-${Date.now().toString(36)}`;
}

export async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: '用户名' }).fill(ADMIN.name);
  await page.getByRole('textbox', { name: '密码' }).fill(ADMIN.pass);
  await page.getByRole('button', { name: /登\s*录/ }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

/** 个人项目：新建并打开设计器（role/placeholder/testid；类型默认个人故不点 Select） */
export async function createAndOpenPersonProject(
  page: import('@playwright/test').Page,
  projectName: string,
  tag = 'e2e',
) {
  await page.getByRole('button', { name: /新\s*建/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('请输入项目名').fill(projectName);
  // 标签：ProForm tags Select——点容器后键盘确认（无稳定 option role）
  await dialog.locator('.ant-select').nth(1).click();
  await page.keyboard.type(tag);
  await page.keyboard.press('Enter');
  await dialog.getByPlaceholder('请输入项目描述').fill(tag);
  await dialog.getByRole('button', { name: /确\s*定/ }).click();
  await expect(page.getByText(projectName).first()).toBeVisible();
  await page.getByTestId('open-project').first().click();
  await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });
}

/** 空态新增模型 → 展开 → 打开关系图 → 可见画布 */
export async function openRelationFromEmpty(
  page: import('@playwright/test').Page,
  opts: { name?: string; chnname?: string } = {},
) {
  const name = opts.name || 'SHOP';
  const chnname = opts.chnname || '商城';
  await page.getByTestId('add-module-empty').click();
  await page.getByTestId('entity-modal-name').fill(name);
  await page.getByTestId('entity-modal-chnname').fill(chnname);
  await page.getByTestId('entity-modal-ok').click();
  await expect(page.getByText(chnname, { exact: true })).toBeVisible();
  // 展开模块 /「关系」文件夹（点 switcher，避免选中文件夹打开空页）
  const expandByTitle = async (title: string) => {
    const node = page.locator('.ant-tree-treenode').filter({ has: page.getByText(title, { exact: true }) }).first();
    await node.locator('.ant-tree-switcher').click();
    await page.waitForTimeout(300);
  };
  await expandByTitle(chnname);
  await expandByTitle('关系');
  await page.getByTestId('tree-open-relation').click();
  await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
}

/**
 * 只删除名称匹配的个人项目（用于并发隔离）。
 * match 为前缀字符串或正则；默认清本 worker 前缀。
 */
export async function deleteOwnPersonProjects(
  page: import('@playwright/test').Page,
  match: string | RegExp = e2ePrefix(),
) {
  await page.goto('/project/person');
  await page.waitForTimeout(1_200);
  const matches = (name: string) =>
    typeof match === 'string' ? name.startsWith(match) : match.test(name);

  for (let i = 0; i < 15; i += 1) {
    const links = page.locator('a[href*="projectId="]');
    const count = await links.count();
    let name = '';
    for (let j = 0; j < count; j += 1) {
      const text = (await links.nth(j).innerText()).trim();
      if (text && matches(text)) {
        name = text;
        break;
      }
    }
    if (!name) {
      break;
    }
    const row = page
      .locator('.ant-list-item, .ant-pro-list-row')
      .filter({ has: page.getByRole('link', { name, exact: true }) })
      .first();
    const delBtn = row.getByRole('button', { name: /删\s*除/ }).first();
    if ((await delBtn.count()) === 0 || !(await delBtn.isVisible().catch(() => false))) {
      break;
    }
    await delBtn.click();
    await page.getByRole('button', { name: '是' }).click();
    await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0, {
      timeout: 8_000,
    }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

/**
 * 账号级互斥（空态/示例用例）：同一时刻只允许一个测试占用 admin 全量清档。
 * 配合 playwright project dependencies，在并行项目结束后再跑串行文件。
 */
export async function withExclusiveAccount<T>(fn: () => Promise<T>): Promise<T> {
  const lock = '/tmp/erd-e2e-account.lock';
  const started = Date.now();
  while (Date.now() - started < 180_000) {
    try {
      fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
      try {
        return await fn();
      } finally {
        try {
          fs.unlinkSync(lock);
        } catch {
          /* ignore */
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error('E2E account lock timeout');
}

/**
 * 仅串行用例（需全局空态）使用；并发用例请用 deleteOwnPersonProjects
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
    await expect(delBtn).toHaveCount(0, { timeout: 8_000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  await expect(page.getByRole('button', { name: /删\s*除/ })).toHaveCount(0, { timeout: 5_000 });
}
