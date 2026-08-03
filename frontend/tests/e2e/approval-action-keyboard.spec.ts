import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { e2eAccount, gotoVersionSub, login, uniqueProjectName } from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 审批动作确认 Modal（Pass/Refuse/Cancel/Repeat）键盘闭环
 * — Popconfirm→confirmDestructive：首焦主操作；Esc 关确认不落状态；Tab trap；焦点归还触发器
 * — 不踩 sql-approval-keyboard / approval.spec 提交/拒绝落盘旅程
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
    data: { projectName: name, description: 'approval action kb', tags: 'e2e' },
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
      approveSql: 'SELECT 1',
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
  expect(
    await dialog.evaluate((dlg) => dlg.contains(document.activeElement)),
  ).toBe(true);
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

async function assertConfirmKeyboard(
  page: Page,
  trigger: Locator,
  dialogName: string | RegExp,
  okName: RegExp,
) {
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();
  const confirm = page.getByRole('dialog', { name: dialogName });
  await expect(confirm).toBeVisible({ timeout: 10_000 });
  await expect(confirm.getByRole('button', { name: okName })).toBeFocused({
    timeout: 5_000,
  });
  await assertTabTrap(confirm, page);
  await page.keyboard.press('Escape');
  await expect(confirm).toHaveCount(0);
  await expect(trigger).toBeFocused({ timeout: 5_000 });
}

test.describe('审批动作确认键盘', () => {
  test('拒绝/撤销确认：首焦主操作；Esc 归还不落盘；Tab trap', async ({ page, request }) => {
    test.setTimeout(120_000);
    const account = e2eAccount();
    const approverId = `e2e-user-${test.info().parallelIndex}`;
    const projectName = uniqueProjectName('appr-act-kb');
    const remark = `e2e-appr-kb-${Date.now().toString(36)}`;
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
      await expect(approvalRow.getByText('待审批')).toBeVisible();

      await assertConfirmKeyboard(
        page,
        approvalRow.getByRole('button', { name: '拒绝' }),
        '拒绝审批',
        /拒\s*绝/,
      );
      await expect(approvalRow.getByText('待审批')).toBeVisible();

      await assertConfirmKeyboard(
        page,
        approvalRow.getByRole('button', { name: '通过' }),
        '通过审批',
        /通\s*过/,
      );
      await expect(approvalRow.getByText('待审批')).toBeVisible();

      await gotoVersionSub(page, 'order');
      await expect(page.getByTestId('page-title-orders')).toHaveText('我的工单');
      const orderRow = page.getByRole('row').filter({ hasText: remark });
      await expect(orderRow).toBeVisible({ timeout: 15_000 });

      await assertConfirmKeyboard(
        page,
        orderRow.getByRole('button', { name: '撤销' }),
        '撤销审批',
        /撤\s*销/,
      );
      await expect(orderRow.getByText('待审批')).toBeVisible();
    } finally {
      if (approvalId) {
        await deleteApproval(request, token, approvalId).catch(() => {});
      }
      await deleteGroup(request, token, projectId).catch(() => {});
    }
  });
});
