import { expect, test, type APIRequestContext, type Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  addFieldInline,
  E2E_PASS,
  E2E_SERIAL,
  expectToast,
  login,
  openRelationCanvas,
  openRelationFromEmpty,
  saveVersion,
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
  const name = `e2e-serial-sync-${Date.now().toString(36)}`;
  const add = await request.post(`${API}/ncnb/project/group/add`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: {
      projectName: name,
      description: 'sync toast e2e',
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

test.describe('协作 sync 提示', () => {
  test('双人同项目：A 改表后 B 见 info toast → CTA 保存版本落库', async ({
    browser,
    request,
  }) => {
    test.setTimeout(150_000);
    const ownerToken = await apiToken(request, E2E_SERIAL.name, E2E_SERIAL.pass);
    const { projectId } = await createGroupWithPeer(request, ownerToken);

    let ownerCtx: Awaited<ReturnType<Browser['newContext']>> | undefined;
    let peerCtx: Awaited<ReturnType<Browser['newContext']>> | undefined;
    try {
      const dual = await dualLoginToDesign(browser, projectId);
      ownerCtx = dual.ownerCtx;
      peerCtx = dual.peerCtx;
      const { ownerPage, peerPage } = dual;

      // 等待首屏 projectJSON 写入 lastSynced，再建表触发 delta
      await ownerPage.waitForTimeout(1_500);
      await openRelationFromEmpty(ownerPage, { name: 'SYNC_M', chnname: '同步模块' });
      await ownerPage.getByTestId('canvas-empty-create').click();
      await expect(ownerPage.getByText('T_TABLE_1').first()).toBeVisible({ timeout: 10_000 });

      await expectToast(peerPage, `${E2E_SERIAL.name} 同步了模型变更`, 20_000);
      // 顶栏亦有「保存版本」→ 用 toast CTA testid（与 header 同名）
      await peerPage.getByTestId('sync-save-version-cta').click();
      await expect(peerPage).toHaveURL(
        new RegExp(`/design/table/version/all\\?projectId=${projectId}`),
        { timeout: 15_000 },
      );

      await expect(peerPage.getByText('Loading...')).toHaveCount(0);
      await expect(peerPage.getByTestId('add-version-btn')).toBeVisible({ timeout: 15_000 });
      const saveRespPromise = peerPage.waitForResponse(
        (r) =>
          r.request().method() === 'POST' &&
          r.url().includes('/ncnb/hisProject/save') &&
          r.status() === 200,
        { timeout: 30_000 },
      );
      await saveVersion(peerPage);
      await saveRespPromise;
      await expect(peerPage.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
    } finally {
      await peerCtx?.close().catch(() => {});
      await ownerCtx?.close().catch(() => {});
      await deleteGroup(request, ownerToken, projectId).catch(() => {});
    }
  });

  test('双人同项目：B 未保存时见 warning toast', async ({ browser, request }) => {
    test.setTimeout(120_000);
    const ownerToken = await apiToken(request, E2E_SERIAL.name, E2E_SERIAL.pass);
    const { projectId } = await createGroupWithPeer(request, ownerToken);

    let ownerCtx: Awaited<ReturnType<Browser['newContext']>> | undefined;
    let peerCtx: Awaited<ReturnType<Browser['newContext']>> | undefined;
    try {
      const dual = await dualLoginToDesign(browser, projectId);
      ownerCtx = dual.ownerCtx;
      peerCtx = dual.peerCtx;
      const { ownerPage, peerPage } = dual;

      // 阻断 B 自动保存，保持 localDirty
      await peerPage.route(/\/ncnb\/project\/(group\/)?save/, (route) => route.abort());

      await peerPage.waitForTimeout(1_500);
      await openRelationFromEmpty(peerPage, { name: 'PEER_M', chnname: 'Peer模块' });
      await expect(ownerPage.getByText('Peer模块', { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      await openRelationCanvas(ownerPage, 'Peer模块');
      await ownerPage.getByTestId('canvas-empty-create').click();
      await expect(ownerPage.getByText('T_TABLE_1').first()).toBeVisible({ timeout: 10_000 });

      await expectToast(
        peerPage,
        `${E2E_SERIAL.name} 更新了模型；你有未保存改动，请核对后保存`,
        20_000,
      );
      await peerPage.getByTestId('sync-save-version-cta').click();
      await expect(peerPage).toHaveURL(
        new RegExp(`/design/table/version/all\\?projectId=${projectId}`),
        { timeout: 15_000 },
      );
    } finally {
      await peerCtx?.close().catch(() => {});
      await ownerCtx?.close().catch(() => {});
      await deleteGroup(request, ownerToken, projectId).catch(() => {});
    }
  });

  test('双人同项目：60s 内二次模型变更 peer toast 仍为 1', async ({ browser, request }) => {
    test.setTimeout(150_000);
    const ownerToken = await apiToken(request, E2E_SERIAL.name, E2E_SERIAL.pass);
    const { projectId } = await createGroupWithPeer(request, ownerToken);
    const toastText = `${E2E_SERIAL.name} 同步了模型变更`;

    let ownerCtx: Awaited<ReturnType<Browser['newContext']>> | undefined;
    let peerCtx: Awaited<ReturnType<Browser['newContext']>> | undefined;
    try {
      const dual = await dualLoginToDesign(browser, projectId);
      ownerCtx = dual.ownerCtx;
      peerCtx = dual.peerCtx;
      const { ownerPage, peerPage } = dual;

      await ownerPage.waitForTimeout(1_500);
      await openRelationFromEmpty(ownerPage, { name: 'THROTTLE_M', chnname: '节流模块' });
      await ownerPage.getByTestId('canvas-empty-create').click();
      await expect(ownerPage.getByText('T_TABLE_1').first()).toBeVisible({ timeout: 10_000 });

      await expectToast(peerPage, toastText, 20_000);
      await expect(peerPage.getByText('节流模块', { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await openRelationCanvas(peerPage, '节流模块');
      await expect(peerPage.getByText('T_TABLE_1').first()).toBeVisible({ timeout: 10_000 });

      // notification duration=8：等首条消失后，60s 内再改一次应不再弹
      await expect(peerPage.getByText(toastText)).toHaveCount(0, { timeout: 15_000 });

      await addFieldInline(ownerPage, 'T_TABLE_1', 'F_THROTTLE');
      // peer 已收到增量（证明第二次 sync 发生），但 toast 不应再出现
      await expect(peerPage.getByText('F_THROTTLE').first()).toBeVisible({ timeout: 15_000 });
      await peerPage.waitForTimeout(5_000);
      await expect(peerPage.getByText(toastText)).toHaveCount(0);
      await expect(peerPage.getByTestId('sync-save-version-cta')).toHaveCount(0);
    } finally {
      await peerCtx?.close().catch(() => {});
      await ownerCtx?.close().catch(() => {});
      await deleteGroup(request, ownerToken, projectId).catch(() => {});
    }
  });
});
