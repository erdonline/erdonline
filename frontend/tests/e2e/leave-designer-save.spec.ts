import { expect, test, type APIRequestContext, type Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  E2E_PASS,
  E2E_SERIAL,
  expectToast,
  login,
  openRelationFromEmpty,
  openRelationCanvas,
  rfNode,
  uniqueProjectName,
} from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';
const PEER = { name: 'e2e15', pass: E2E_PASS, id: 'e2e-user-15' };
const defaultProjectJSON = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../src/utils/defaultData.json'), 'utf8'),
);

async function apiToken(request: APIRequestContext, username: string, password: string) {
  const r = await request.post(`${API}/auth/login`, {
    data: { username, password },
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`login failed: ${username}`);
  return j.access_token as string;
}

async function createGroupWithPeer(request: APIRequestContext, ownerToken: string) {
  const name = `e2e-leave-dual-${Date.now().toString(36)}`;
  const add = await request.post(`${API}/ncnb/project/group/add`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: {
      projectName: name,
      description: 'leave dual context e2e',
      tags: 'e2e',
      projectJSON: defaultProjectJSON,
      configJSON: { synchronous: { upgradeType: 'increment' } },
    },
  });
  const addJson = await add.json();
  const projectId = addJson.data as string;
  if (addJson.code !== 200 || !projectId) {
    throw new Error(`group add failed: ${JSON.stringify(addJson)}`);
  }

  const roles = await request.get(`${API}/ncnb/project/group/roles?projectId=${projectId}`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const rolesJson = await roles.json();
  const member = (rolesJson.data || []).find(
    (r: { roleCode?: string; roleName?: string }) =>
      String(r.roleCode || '').endsWith('_2') || r.roleName === '团队普通成员',
  );
  if (!member?.roleId) throw new Error(`no member role: ${JSON.stringify(rolesJson)}`);

  const bind = await request.post(`${API}/ncnb/project/group/role/users`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: { projectId, roleId: member.roleId, userIds: [PEER.id] },
  });
  const bindJson = await bind.json();
  if (bindJson.code !== 200) {
    throw new Error(`bind peer failed: ${JSON.stringify(bindJson)}`);
  }
  return { projectId, name };
}

async function deleteGroup(request: APIRequestContext, token: string, projectId: string) {
  await request.post(`${API}/ncnb/project/group/delete`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { id: projectId },
  });
}

async function dualLoginToDesign(
  browser: Browser,
  projectId: string,
): Promise<{
  ownerCtx: Awaited<ReturnType<Browser['newContext']>>;
  peerCtx: Awaited<ReturnType<Browser['newContext']>>;
  ownerPage: import('@playwright/test').Page;
  peerPage: import('@playwright/test').Page;
}> {
  const designUrl = `/design/table/model?projectId=${projectId}`;
  const ownerCtx = await browser.newContext();
  const peerCtx = await browser.newContext();
  const ownerPage = await ownerCtx.newPage();
  const peerPage = await peerCtx.newPage();

  await login(ownerPage, E2E_SERIAL);
  await ownerPage.goto(designUrl);
  await expect(ownerPage).toHaveURL(/projectId=/, { timeout: 15_000 });
  await expect(ownerPage.getByTestId('collab-presence')).toBeVisible({ timeout: 20_000 });

  await login(peerPage, PEER);
  await peerPage.goto(designUrl);
  await expect(peerPage.getByTestId('collab-presence')).toBeVisible({ timeout: 20_000 });
  await expect(peerPage.getByTestId('collab-presence')).toContainText(E2E_SERIAL.name, {
    timeout: 20_000,
  });

  return { ownerCtx, peerCtx, ownerPage, peerPage };
}

/** Vision #28 / ADR-0022：与 save-status-failure-routing 同源 aria */
const RETRY_FAILURE_ARIA = '自动保存失败，改动已存本地，点击重试';
const BEFOREUNLOAD_FIELD = 'BU_FIELD';

function draftStorageKey(projectId: string): string {
  return `erd:project-draft:${projectId}`;
}

async function addFieldAndFailSave(
  page: import('@playwright/test').Page,
  fieldName: string,
): Promise<void> {
  await page.route('**/ncnb/project/save', (route) => route.abort('failed'));
  const node = rfNode(page, 'T_TABLE_1');
  await node.getByTestId('canvas-add-field').click();
  const editRow = node.locator('.erd-field-editing');
  await editRow.locator('.erd-field-type-select').selectOption('String');
  const input = editRow.locator('.erd-field-input');
  await input.fill(fieldName);
  await input.press('Enter');
  await expectToast(page, '网络异常，请检查网络连接');
  await expect(page.getByTestId('save-status')).toHaveText('保存失败，点击重试', {
    timeout: 10_000,
  });
}

async function expectDraftContains(
  page: import('@playwright/test').Page,
  projectId: string,
  needle: string,
): Promise<void> {
  await expect
    .poll(async () =>
      page.evaluate(
        ({ key, text }) => localStorage.getItem(key)?.includes(text) ?? false,
        { key: draftStorageKey(projectId), text: needle },
      ),
    )
    .toBe(true);
}

/**
 * ADR-0022 并发底座：离开设计器不得盲存。
 * 干净态离开 → 零保存请求；脏态离开 → 补一枪且改动落库。
 * Vision #28：失败态离开补枪 → 回设计器顶栏重试 → 干净离开。
 * Vision #29：防抖 600ms 窗口内离开 → closeSocket 补枪（成功落库 / 失败可见）。
 * Vision #30：浏览器级离开（reload / 关页）→ beforeunload 草稿守卫；Playwright 不对 native dialog 做硬断言，以 localStorage 为准。
 * Vision #31：双人协作 — A 落库失败离开补枪不得静默覆写 B 已落库改动（复用 sync-toast 双 context）。
 */
test.describe('离开设计器的保存行为', () => {
  test('干净态离开：不发保存请求', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('leaveclean');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'leaveclean', 'no blind save');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      // 防抖尾巴落地后再计数，避免把上一笔编辑的保存算进离开动作
      await page.waitForTimeout(1_500);

      const saveCalls: string[] = [];
      page.on('request', (req) => {
        if (/\/ncnb\/project(\/group)?\/save/.test(req.url())) {
          saveCalls.push(req.url());
        }
      });

      await page.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
      await page.waitForTimeout(1_500);
      expect(saveCalls).toHaveLength(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('落库失败后离开：补一枪重试，失败不静默', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('leavedirty');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'leavedirty', 'flush on leave');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await page.waitForTimeout(1_500);

      // 阻断落库 → 顶栏进入失败态（未落库标记保留）
      await page.route('**/ncnb/project/save', (route) => route.abort('failed'));
      await page.getByTestId('canvas-create-table').click();
      await expect(page.getByRole('button', { name: RETRY_FAILURE_ARIA })).toBeVisible({
        timeout: 15_000,
      });
      await page.unroute('**/ncnb/project/save');

      const saveCalls: string[] = [];
      page.on('request', (req) => {
        if (/\/ncnb\/project(\/group)?\/save/.test(req.url())) {
          saveCalls.push(req.url());
        }
      });

      await page.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
      await page.waitForTimeout(1_500);
      expect(saveCalls.length).toBeGreaterThan(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('落库失败 → 离开补枪 → 顶栏重试成功 → 可正常离开', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('leaveretry');
    let saveAttempts = 0;
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'leaveretry', 'leave retry flow');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await page.waitForTimeout(1_500);

      const designUrl = page.url();
      expect(new URL(designUrl).searchParams.get('projectId')).toBeTruthy();

      await page.route('**/ncnb/project/save', async (route) => {
        saveAttempts += 1;
        if (saveAttempts <= 2) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟落库拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      await page.getByTestId('canvas-create-table').click();
      await expectToast(page, '模拟落库拒绝');
      await expect(page.getByRole('button', { name: RETRY_FAILURE_ARIA })).toBeVisible({
        timeout: 15_000,
      });

      // 离开 → closeSocket 补枪（第 2 次 save，仍失败）
      await page.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
      await page.waitForTimeout(1_000);
      expect(saveAttempts).toBeGreaterThanOrEqual(2);

      // 回设计器恢复草稿 → 顶栏重试成功
      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('project-draft-recovery-content')).toBeVisible({
        timeout: 15_000,
      });
      await page.getByTestId('project-draft-recovery-restore').click();
      await expect(page.getByText('已恢复本地草稿')).toBeVisible({ timeout: 5_000 });
      await expect(page).toHaveURL(/\/design\/table\//, { timeout: 15_000 });

      const retry = page.getByRole('button', { name: RETRY_FAILURE_ARIA });
      await expect(retry).toBeVisible({ timeout: 15_000 });
      await retry.click();
      await expect(page.getByTestId('save-status')).not.toHaveText('保存中…', { timeout: 3_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 20_000 });
      await expect(page.getByRole('button', { name: RETRY_FAILURE_ARIA })).toHaveCount(0);

      const saveCallsAfterRetry: string[] = [];
      page.on('request', (req) => {
        if (/\/ncnb\/project(\/group)?\/save/.test(req.url())) {
          saveCallsAfterRetry.push(req.url());
        }
      });
      await page.waitForTimeout(500);
      await page.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
      await page.waitForTimeout(1_500);
      expect(saveCallsAfterRetry).toHaveLength(0);
    } finally {
      await page.unroute('**/ncnb/project/save').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('防抖窗口内离开：补枪成功落库，重进无草稿弹窗', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('leavedebounce');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'leavedebounce', 'debounce flush');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await page.waitForTimeout(1_500);

      const designUrl = page.url();

      const saveCalls: string[] = [];
      page.on('request', (req) => {
        if (/\/ncnb\/project(\/group)?\/save/.test(req.url())) {
          saveCalls.push(req.url());
        }
      });
      const saveDone = page.waitForResponse(
        (r) => /\/ncnb\/project(\/group)?\/save/.test(r.url()),
        { timeout: 20_000 },
      );

      // 见「保存中…」即离开（<600ms 防抖窗 / 在途落库由 closeSocket 补完）
      await page.getByTestId('canvas-create-table').click();
      await expect(page.getByTestId('save-status')).toHaveText('保存中…', { timeout: 3_000 });
      await page.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
      const saveResp = await saveDone;
      expect(saveResp.ok()).toBeTruthy();
      expect(saveCalls.length).toBeGreaterThan(0);

      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('project-draft-recovery-content')).toHaveCount(0);
      await openRelationCanvas(page, '商城');
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('防抖窗口内离开：补枪失败仍写草稿，重进可恢复', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('leavedebouncefail');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'leavedebouncefail', 'debounce fail flush');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await page.waitForTimeout(1_500);

      const designUrl = page.url();

      await page.route('**/ncnb/project/save', (route) => route.abort('failed'));

      const saveCalls: string[] = [];
      page.on('request', (req) => {
        if (/\/ncnb\/project(\/group)?\/save/.test(req.url())) {
          saveCalls.push(req.url());
        }
      });

      await page.getByTestId('canvas-create-table').click();
      // 阻断落库时可能跳过「保存中…」直进失败态；仍须在未落盘时离开
      await expect(page.getByTestId('save-status')).not.toHaveText('已落盘', { timeout: 3_000 });
      await page.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
      await expect.poll(() => saveCalls.length, { timeout: 10_000 }).toBeGreaterThan(0);

      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('project-draft-recovery-content')).toBeVisible({
        timeout: 15_000,
      });
      await page.getByTestId('project-draft-recovery-restore').click();
      await expect(page.getByText('已恢复本地草稿')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByRole('button', { name: RETRY_FAILURE_ARIA })).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await page.unroute('**/ncnb/project/save').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('落库失败后 reload：beforeunload 不覆写 localStorage 草稿', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('beforeunload');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'beforeunload', 'reload guard');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await page.waitForTimeout(1_500);

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await addFieldAndFailSave(page, BEFOREUNLOAD_FIELD);
      await expectDraftContains(page, projectId!, BEFOREUNLOAD_FIELD);

      // 浏览器级离开：reload 触发 beforeunload；失败态 draft 已比 store 新 → 守卫跳过覆写
      page.once('dialog', (dialog) => dialog.dismiss().catch(() => {}));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expectDraftContains(page, projectId!, BEFOREUNLOAD_FIELD);

      // reload 后设计器应检测到草稿（证明 beforeunload 未用 stale store 抹掉 BU_FIELD）
      await expect(page.getByTestId('project-draft-recovery-content')).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await page.unroute('**/ncnb/project/save').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('落库失败后关页：草稿仍在 localStorage，重开可恢复', async ({ page, context }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('beforeunloadclose');
    let designUrl = '';
    let projectId = '';
    let reopen: import('@playwright/test').Page | undefined;
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'beforeunloadclose', 'close guard');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await page.waitForTimeout(1_500);

      designUrl = page.url();
      projectId = new URL(designUrl).searchParams.get('projectId') || '';
      expect(projectId).toBeTruthy();

      await addFieldAndFailSave(page, BEFOREUNLOAD_FIELD);
      await expectDraftContains(page, projectId, BEFOREUNLOAD_FIELD);

      page.once('dialog', (dialog) => dialog.dismiss().catch(() => {}));
      await page.close();

      reopen = await context.newPage();
      await login(reopen);
      await reopen.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await expect(reopen.getByTestId('project-draft-recovery-content')).toBeVisible({
        timeout: 15_000,
      });
      await reopen.getByTestId('project-draft-recovery-restore').click();
      await expect(reopen.getByText('已恢复本地草稿')).toBeVisible({ timeout: 5_000 });
      await expect(reopen.getByRole('button', { name: RETRY_FAILURE_ARIA })).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      const cleanupPage = reopen && !reopen.isClosed() ? reopen : page.isClosed() ? undefined : page;
      if (cleanupPage) {
        await deleteOwnPersonProjects(cleanupPage).catch(() => {});
      }
      await reopen?.close().catch(() => {});
    }
  });
});

test.describe('双人协作：离开补枪不覆写对方落库', () => {
  test('A 落库失败离开后 B 已落库改动仍可见且可续编', async ({ browser, request }) => {
    test.setTimeout(150_000);
    const ownerToken = await apiToken(request, E2E_SERIAL.name, E2E_SERIAL.pass);
    const { projectId } = await createGroupWithPeer(request, ownerToken);
    const peerModule = 'Peer模块';
    const peerField = 'F_PEER_KEEP';

    let ownerCtx: Awaited<ReturnType<Browser['newContext']>> | undefined;
    let peerCtx: Awaited<ReturnType<Browser['newContext']>> | undefined;
    try {
      const dual = await dualLoginToDesign(browser, projectId);
      ownerCtx = dual.ownerCtx;
      peerCtx = dual.peerCtx;
      const { ownerPage, peerPage } = dual;

      await peerPage.waitForTimeout(1_500);
      await openRelationFromEmpty(peerPage, { name: 'PEER_M', chnname: peerModule });
      await peerPage.getByTestId('canvas-empty-create').click();
      await expect(rfNode(peerPage, 'T_TABLE_1')).toBeVisible({ timeout: 10_000 });
      await expect(peerPage.getByTestId('save-status')).toHaveText('已落盘', { timeout: 20_000 });

      await expect(ownerPage.getByText(peerModule, { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await expect
        .poll(
          async () => {
            if ((await ownerPage.getByTestId('project-save-conflict-modal').count()) > 0) {
              return 'conflict';
            }
            const status = await ownerPage.getByTestId('save-status').textContent();
            return status === '已落盘' ? 'clean' : 'pending';
          },
          { timeout: 20_000 },
        )
        .toMatch(/conflict|clean/);
      if ((await ownerPage.getByTestId('project-save-conflict-modal').count()) > 0) {
        await ownerPage.getByTestId('project-save-conflict-refresh').click();
        await expect(ownerPage.getByTestId('project-save-conflict-modal')).toHaveCount(0, {
          timeout: 15_000,
        });
      } else if ((await ownerPage.getByTestId('save-status').textContent())?.includes('保存冲突')) {
        await ownerPage.getByTestId('save-status').click();
        await expect(ownerPage.getByTestId('project-save-conflict-modal')).toBeVisible({
          timeout: 10_000,
        });
        await ownerPage.getByTestId('project-save-conflict-refresh').click();
        await expect(ownerPage.getByTestId('project-save-conflict-modal')).toHaveCount(0, {
          timeout: 15_000,
        });
      }
      await expect(ownerPage.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      const ownerSaveCalls: string[] = [];
      await ownerPage.route('**/ncnb/project/group/save', (route) => {
        ownerSaveCalls.push(route.request().url());
        return route.abort('failed');
      });

      await openRelationCanvas(ownerPage, peerModule);
      await ownerPage.getByTestId('canvas-create-table').click();
      await expect(ownerPage.getByRole('button', { name: RETRY_FAILURE_ARIA })).toBeVisible({
        timeout: 15_000,
      });

      await ownerPage.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(ownerPage).toHaveURL(/\/home/, { timeout: 15_000 });
      await expect.poll(() => ownerSaveCalls.length, { timeout: 10_000 }).toBeGreaterThan(0);
      await ownerPage.unroute('**/ncnb/project/group/save');

      await expect(peerPage.getByText(peerModule, { exact: true })).toBeVisible({
        timeout: 10_000,
      });
      await openRelationCanvas(peerPage, peerModule);
      await expect(rfNode(peerPage, 'T_TABLE_1')).toBeVisible({ timeout: 10_000 });
      await expect(rfNode(peerPage, 'T_TABLE_2')).toHaveCount(0);
      await expect(peerPage.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await peerPage.reload({ waitUntil: 'domcontentloaded' });
      await expect(peerPage.getByTestId('collab-presence')).toBeVisible({ timeout: 20_000 });
      await openRelationCanvas(peerPage, peerModule);
      await expect(rfNode(peerPage, 'T_TABLE_1')).toBeVisible({ timeout: 15_000 });
      await expect(rfNode(peerPage, 'T_TABLE_2')).toHaveCount(0);
      await expect(peerPage.getByTestId('save-status')).toHaveText('已落盘', { timeout: 20_000 });

      const node = rfNode(peerPage, 'T_TABLE_1');
      await node.getByTestId('canvas-add-field').click();
      const editRow = node.locator('.erd-field-editing');
      await editRow.locator('.erd-field-type-select').selectOption('String');
      const input = editRow.locator('.erd-field-input');
      await input.fill(peerField);
      await input.press('Enter');
      await expect(peerPage.getByText(peerField).first()).toBeVisible({ timeout: 10_000 });
      await expect(peerPage.getByTestId('save-status')).toHaveText('已落盘', { timeout: 20_000 });
    } finally {
      await peerCtx?.close().catch(() => {});
      await ownerCtx?.close().catch(() => {});
      await deleteGroup(request, ownerToken, projectId).catch(() => {});
    }
  });
});
