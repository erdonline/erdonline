import { expect, test } from '@playwright/test';
import * as fs from 'fs';

/**
 * E2E 共享助手（多 worker + e2e-locators 纪律）
 *
 * 定位：getByRole / placeholder / getByTestId；禁止依赖 .ant-* 业务选择。
 * 隔离：每 worker 独立账号 e2e{n}（e2e0..e2e15，见 db/init/05_e2e_users.sql）+ 项目名 `e2e-w{n}-`。
 */

export const E2E_PASS = '123456';
/** 兼容旧断言（勿用于并发登录） */
export const ADMIN = { name: 'admin', pass: E2E_PASS };
/** chromium-serial：空态/清库类用例（独立账号，不与 worker 0..15 冲突） */
export const E2E_SERIAL = { name: 'e2e-serial', pass: E2E_PASS };

export type E2eAccount = { name: string; pass: string };

/** 当前 worker 专用账号（parallelIndex → e2e0..e2e7） */
export function e2eAccount(): E2eAccount {
  return { name: `e2e${test.info().parallelIndex}`, pass: E2E_PASS };
}

export function e2ePrefix(): string {
  return `e2e-w${test.info().parallelIndex}-`;
}

export function uniqueProjectName(stem: string): string {
  return `${e2ePrefix()}${stem}-${Date.now().toString(36)}`;
}

export async function login(
  page: import('@playwright/test').Page,
  account: E2eAccount = e2eAccount(),
) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: '用户名' }).fill(account.name);
  await page.getByRole('textbox', { name: '密码' }).fill(account.pass);
  await page.getByRole('button', { name: /登\s*录/ }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

/** 断言 antd message 文案（用户可见文本，不用 .ant-message） */
export async function expectToast(
  page: import('@playwright/test').Page,
  pattern: string | RegExp,
  timeout = 15_000,
) {
  await expect(page.getByText(pattern).first()).toBeVisible({ timeout });
}

/** 点击后期望 URL 匹配 */
export async function clickAndExpectUrl(
  page: import('@playwright/test').Page,
  locator: import('@playwright/test').Locator,
  url: string | RegExp,
  timeout = 15_000,
) {
  await locator.click();
  await expect(page).toHaveURL(url, { timeout });
}

/** 点击后期望对话框可见 */
export async function clickAndExpectDialog(
  page: import('@playwright/test').Page,
  locator: import('@playwright/test').Locator,
  timeout = 10_000,
) {
  await locator.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout });
  return dialog;
}

/** 打开顶栏用户菜单（Home/Design/Group 共用 trigger） */
export async function openUserMenu(page: import('@playwright/test').Page) {
  await page.getByTestId('user-menu-trigger').click();
  await expect(page.getByRole('menuitem', { name: '退出登录' })).toBeVisible({
    timeout: 5_000,
  });
}

/** 个人项目：新建（默认类型已是个人；标签用 testid） */
export async function createPersonProject(
  page: import('@playwright/test').Page,
  projectName: string,
  tag = 'e2e',
  desc?: string,
) {
  await page.getByRole('button', { name: /新\s*建/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('请输入项目名').fill(projectName);
  // 默认已有「新建」；仅追加不同标签，避免 tags Select 同名输入卡住
  if (tag && tag !== '新建') {
    const tagSelect = dialog.getByTestId('project-tags');
    const tagInput = tagSelect.locator('input');
    await tagInput.click();
    await tagInput.fill('');
    // 逗号走 tokenSeparators，比 Enter 更稳
    await page.keyboard.type(`${tag},`);
    await expect(
      tagSelect.locator('.ant-select-selection-item').filter({ hasText: tag }),
    ).toBeVisible();
  }
  // 填描述顺带失焦 tags，避免下拉遮罩挡「确定」
  await dialog.getByPlaceholder('请输入项目描述').fill(desc ?? tag);
  await dialog.getByRole('button', { name: /确\s*定/ }).click();
  await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 15_000 });
}

export async function createAndOpenPersonProject(
  page: import('@playwright/test').Page,
  projectName: string,
  tag = 'e2e',
  desc?: string,
) {
  await createPersonProject(page, projectName, tag, desc);
  // 个人项目是 List 非 Table；按项目名定位「打开模型」，勿用裸 .first()
  await page
    .getByRole('listitem')
    .filter({ has: page.getByRole('link', { name: projectName, exact: true }) })
    .getByTestId('open-project')
    .click();
  await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });
}

/** 树节点：点 switcher 展开（幂等——默认展开后已开的节点不再点，否则会折叠） */
export async function expandTreeTitle(
  page: import('@playwright/test').Page,
  title: string,
) {
  const node = page
    .locator('.ant-tree-treenode')
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
  const switcher = node.locator('.ant-tree-switcher');
  const expanded = await node.evaluate((el) =>
    el.classList.contains('ant-tree-treenode-switcher-open'),
  );
  if (!expanded) {
    await switcher.click();
    await page.waitForTimeout(300);
  }
}

/** 空态新增模型 → 展开 → 打开关系图 */
export async function openRelationFromEmpty(
  page: import('@playwright/test').Page,
  opts: { name?: string; chnname?: string } = {},
) {
  const name = opts.name || 'SHOP';
  const chnname = opts.chnname || '商城';
  // 左树唯一来源 = DesignLayout sider（W2 chrome 收尾后主区不再嵌套 DataTable）
  await expect(page.getByTestId('add-module-empty')).toHaveCount(1);
  await page.getByTestId('add-module-empty').click();
  await page.getByTestId('entity-modal-name').fill(name);
  await page.getByTestId('entity-modal-chnname').fill(chnname);
  await page.getByTestId('entity-modal-ok').click();
  await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 25_000 });
  await expect(page.getByText(chnname, { exact: true }).first()).toBeVisible();
  await expandTreeTitle(page, chnname);
  await expandTreeTitle(page, '关系');
  await expect(page.getByTestId('tree-open-relation')).toHaveCount(1);
  await page.getByTestId('tree-open-relation').click();
  await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
}

/** 已有模块时打开关系图（需先能看到模块中文名） */
export async function openRelationCanvas(
  page: import('@playwright/test').Page,
  moduleChnname: string,
) {
  await expandTreeTitle(page, moduleChnname);
  await expandTreeTitle(page, '关系');
  await page.getByTestId('tree-open-relation').click();
  await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 10_000 });
}

/** ReactFlow 表节点（库结构类名，非 antd） */
export function rfNode(page: import('@playwright/test').Page, tableName: string) {
  return page.locator('.react-flow__node', { hasText: tableName });
}

/** 画布内联加字段 */
export async function addFieldInline(
  page: import('@playwright/test').Page,
  tableName: string,
  fieldName: string,
  type = 'String',
) {
  const node = rfNode(page, tableName);
  await node.getByTestId('canvas-add-field').click();
  const editRow = node.locator('.erd-field-editing');
  await editRow.locator('.erd-field-type-select').selectOption(type);
  await editRow.locator('.erd-field-input').fill(fieldName);
  await editRow.locator('.erd-field-input').press('Enter');
  await expect(node.locator('.erd-field-name', { hasText: fieldName })).toBeVisible();
}

/** 字段拖连线：默认右源→左靶（建关联）；渲染侧由几何择柄重绑 */
export async function connectFields(
  page: import('@playwright/test').Page,
  fromTable: string,
  fromField: string,
  toTable: string,
  toField: string,
) {
  await page.getByRole('button', { name: '适应画布' }).click();
  await page.waitForTimeout(500);
  const fromNode = rfNode(page, fromTable);
  const toNode = rfNode(page, toTable);
  await fromNode.hover();
  const fromRow = fromNode.locator(`[data-field="${fromField}"]`);
  const toRow = toNode.locator(`[data-field="${toField}"]`);
  const src = fromRow.locator(`[data-handleid="${fromField}-src-r"]`);
  const tgt = toRow.locator(`[data-handleid="${toField}-tgt-l"]`);
  await expect(src).toBeVisible();
  await toNode.hover();
  await expect(tgt).toBeVisible();
  const before = await page.locator('.react-flow__edge').count();
  await src.dragTo(tgt, { force: true, steps: 12 });
  await expect(page.locator('.react-flow__edge')).toHaveCount(before + 1, {
    timeout: 8_000,
  });
}

/**
 * 聚焦关系边基数 chip（Delete/Backspace → 二次确认删边）。
 * 边层在表节点之下，路径点击难稳定选中；chip 可访问且为稳定入口。
 */
export async function selectRelationEdge(page: import('@playwright/test').Page) {
  const label = page.getByTestId('erd-edge-label').first();
  await expect(label).toBeVisible();
  await label.focus();
  await expect(label).toBeFocused();
}

export async function deleteOwnPersonProjects(
  page: import('@playwright/test').Page,
  match: string | RegExp = e2ePrefix(),
) {
  await page.goto('/project/person');
  await page.waitForTimeout(1_200);
  const matches = (name: string) =>
    typeof match === 'string' ? name.startsWith(match) : match.test(name);

  for (let i = 0; i < 15; i += 1) {
    const links = page.getByRole('link', { name: /e2e-w/ });
    const count = await links.count();
    let name = '';
    for (let j = 0; j < count; j += 1) {
      const text = (await links.nth(j).innerText()).trim();
      if (text && matches(text)) {
        name = text;
        break;
      }
    }
    // 回退：任意带 projectId 的链接（兼容非 e2e-w 前缀的 match）
    if (!name) {
      const all = page.locator('a[href*="projectId="]');
      const n = await all.count();
      for (let j = 0; j < n; j += 1) {
        const text = (await all.nth(j).innerText()).trim();
        if (text && matches(text)) {
          name = text;
          break;
        }
      }
    }
    if (!name) {
      break;
    }
    const row = page
      .locator('div')
      .filter({ has: page.getByRole('link', { name, exact: true }) })
      .filter({ has: page.getByRole('button', { name: /删\s*除/ }) })
      .first();
    const delBtn = row.getByRole('button', { name: /删\s*除/ }).first();
    if ((await delBtn.count()) === 0 || !(await delBtn.isVisible().catch(() => false))) {
      break;
    }
    await delBtn.click();
    const confirm = page.getByRole('dialog', { name: '删除项目' });
    await expect(confirm).toBeVisible({ timeout: 5_000 });
    await confirm.getByRole('button', { name: '是' }).click();
    await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0, {
      timeout: 8_000,
    }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

export async function withExclusiveAccount<T>(fn: () => Promise<T>): Promise<T> {
  const lock = '/tmp/erd-e2e-account.lock';
  const started = Date.now();
  while (Date.now() - started < 180_000) {
    try {
      fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
    } catch (e: any) {
      // 仅重试锁冲突；勿吞掉 fn() 断言失败（否则会空转到 test timeout）
      if (e?.code !== 'EEXIST') throw e;
      try {
        const holder = Number(fs.readFileSync(lock, 'utf8'));
        if (holder && !Number.isNaN(holder)) {
          try {
            process.kill(holder, 0);
          } catch {
            fs.unlinkSync(lock);
            continue;
          }
        }
      } catch {
        /* ignore */
      }
      await new Promise((r) => setTimeout(r, 400));
      continue;
    }
    try {
      return await fn();
    } finally {
      try {
        fs.unlinkSync(lock);
      } catch {
        /* ignore */
      }
    }
  }
  throw new Error('E2E account lock timeout');
}

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

/** 模型页侧栏是树，ProLayout「版本」menuitem 不可见 → 直达 URL */
export async function gotoVersionSub(
  page: import('@playwright/test').Page,
  sub: 'all' | 'order' | 'approval',
) {
  const projectId = new URL(page.url()).searchParams.get('projectId');
  await page.goto(
    `/design/table/version/${sub}${projectId ? `?projectId=${projectId}` : ''}`,
  );
  await expect(page).toHaveURL(new RegExp(`/design/table/version/${sub}`), {
    timeout: 15_000,
  });
}

/** 版本管理页就绪（无 Loading…、可新增版本） */
export async function openVersionPage(page: import('@playwright/test').Page) {
  await gotoVersionSub(page, 'all');
  await expect(page.getByText('Loading...')).toHaveCount(0);
  await expect(page.getByTestId('add-version-btn')).toBeVisible({ timeout: 15_000 });
}

/** 版本页：打开「新增版本」并保存（默认标签可选） */
export async function saveVersion(
  page: import('@playwright/test').Page,
  opts?: { tags?: string[]; triggerTestId?: string },
) {
  const trigger = opts?.triggerTestId || 'add-version-btn';
  await page.getByTestId(trigger).click();
  const dialog = page.getByRole('dialog').filter({ hasText: '新增版本' });
  await expect(dialog).toBeVisible();
  if (opts?.tags?.length) {
    const tagSelect = dialog.getByTestId('version-tag-input');
    const tagInput = tagSelect.locator('input');
    for (const t of opts.tags) {
      await tagInput.click();
      await tagInput.fill('');
      await page.keyboard.type(`${t},`);
      await expect(
        tagSelect.locator('.ant-select-selection-item').filter({ hasText: t }),
      ).toBeVisible();
    }
    await dialog.getByRole('textbox', { name: '版本描述' }).click();
  }
  await dialog.getByRole('button', { name: /确\s*定/ }).click();
  await expectToast(page, /保存成功/);
  await expect(dialog).toHaveCount(0);
}

/** 从版本等子页回模型（侧栏「模型」menuitem 在部分页不可见） */
export async function gotoDesignModel(page: import('@playwright/test').Page) {
  const projectId = new URL(page.url()).searchParams.get('projectId');
  await page.goto(
    `/design/table/model${projectId ? `?projectId=${projectId}` : ''}`,
  );
  await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });
}
