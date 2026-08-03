import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { e2eAccount, gotoVersionSub, login, uniqueProjectName } from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 审批 / 工单 SQL 明细 Modal.info 键盘闭环
 * — 首焦「知道了」；Esc / OK 关窗归还「查看SQL」；Tab trap
 * — 不踩 approval-action-keyboard / sql-approval-keyboard 落盘旅程
 */

async function apiToken(request: APIRequestContext, username: string, password: string) {
  const r = await request.post(`${API}/auth/login`, {
    data: { username, password },
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`login failed: ${username}`);
  return j.access_token as string;
}

async function createGroupProject(
  request: APIRequestContext,
  token: string,
  name: string,
): Promise<string> {
  const add = await request.post(`${API}/ncnb/project/group/add`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { projectName: name, description: 'sql detail kb', tags: 'e2e' },
  });
  const addJson = await add.json();
  const projectId = addJson.data as string;
  if (addJson.code !== 200 || !projectId) {
    throw new Error(`group add failed: ${JSON.stringify(addJson)}`);
  }
  return projectId;
}

async function seedApproval(
  request: APIRequestContext,
  token: string,
  projectId: string,
  approverId: string,
  remark: string,
): Promise<string> {
  const create = await request.post(`${API}/ncnb/approval`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      projectId,
      approver: approverId,
      approveRemark: remark,
      approveSql: 'SELECT 1 /* e2e sql detail */',
      dbInfo: JSON.stringify({ url: 'jdbc:mysql://127.0.0.1:3306/erd' }),
    },
  });
  const createJson = await create.json();
  if (createJson.code !== 200) {
    throw new Error(`approval create failed: ${JSON.stringify(createJson)}`);
  }
  const list = await request.get(`${API}/ncnb/approval/approve?current=1&size=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listJson = await list.json();
  const row = ((listJson.data?.records as { id: string; approveRemark?: string }[]) || []).find(
    (r) => r.approveRemark === remark,
  );
  if (!row?.id) throw new Error(`seeded approval not listed: ${JSON.stringify(listJson)}`);
  return row.id;
}

async function deleteApproval(request: APIRequestContext, token: string, id: string) {
  await request.delete(`${API}/ncnb/approval/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function deleteGroup(request: APIRequestContext, token: string, projectId: string) {
  await request.post(`${API}/ncnb/project/group/delete`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { id: projectId },
  });
}

async function assertFocusInside(dialog: Locator) {
  expect(await dialog.evaluate((dlg) => dlg.contains(document.activeElement))).toBe(true);
}

async function assertTabTrap(dialog: Locator, page: Page, presses = 8) {
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await assertFocusInside(dialog);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Shift+Tab');
    await assertFocusInside(dialog);
  }
}

async function assertSqlDetailKeyboard(page: Page, trigger: Locator) {
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'SQL明细' });
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await expect(dialog.getByRole('button', { name: '知道了' })).toBeFocused({
    timeout: 5_000,
  });
  await assertTabTrap(dialog, page);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused({ timeout: 5_000 });

  await trigger.click();
  const again = page.getByRole('dialog', { name: 'SQL明细' });
  await expect(again).toBeVisible({ timeout: 10_000 });
  await expect(again.getByRole('button', { name: '知道了' })).toBeFocused({
    timeout: 5_000,
  });
  await again.getByRole('button', { name: '知道了' }).click();
  await expect(again).toHaveCount(0);
  await expect(trigger).toBeFocused({ timeout: 5_000 });
}

test.describe('审批/工单 SQL 明细键盘', () => {
  test('查看SQL：首焦知道了；Esc/OK 归还；Tab trap', async ({ page, request }) => {
    test.setTimeout(120_000);
    const account = e2eAccount();
    const approverId = `e2e-user-${test.info().parallelIndex}`;
    const projectName = uniqueProjectName('sql-detail-kb');
    const remark = `e2e-sql-detail-${Date.now().toString(36)}`;
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(request, token, projectName);
    let approvalId = '';

    try {
      approvalId = await seedApproval(request, token, projectId, approverId, remark);

      await login(page, account);
      await page.goto(`/design/table/model?projectId=${projectId}`);
      await expect(page).toHaveURL(/projectId=/, { timeout: 15_000 });

      await gotoVersionSub(page, 'approval');
      await expect(page.getByTestId('page-title-approvals')).toHaveText('我的审批');
      const approvalRow = page.getByRole('row').filter({ hasText: remark });
      await expect(approvalRow).toBeVisible({ timeout: 15_000 });

      await assertSqlDetailKeyboard(
        page,
        approvalRow.getByRole('button', { name: '查看SQL' }),
      );

      await gotoVersionSub(page, 'order');
      await expect(page.getByTestId('page-title-orders')).toHaveText('我的工单');
      const orderRow = page.getByRole('row').filter({ hasText: remark });
      await expect(orderRow).toBeVisible({ timeout: 15_000 });

      await assertSqlDetailKeyboard(page, orderRow.getByRole('button', { name: '查看SQL' }));
    } finally {
      if (approvalId) {
        await deleteApproval(request, token, approvalId).catch(() => {});
      }
      await deleteGroup(request, token, projectId).catch(() => {});
    }
  });
});
