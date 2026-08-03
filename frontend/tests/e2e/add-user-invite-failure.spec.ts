import { expect, test, type APIRequestContext } from '@playwright/test';
import { e2eAccount, expectToast, login, uniqueProjectName } from './helpers';

/**
 * 团队邀请失败：禁止静默关窗伪装成功；业务码 toast 后窗仍开，可重试
 */

const API = process.env.API_URL || 'http://localhost:9502';

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
    data: { projectName: name, description: 'add user invite fail', tags: 'e2e' },
  });
  const addJson = await add.json();
  const projectId = addJson.data as string;
  if (addJson.code !== 200 || !projectId) {
    throw new Error(`group add failed: ${JSON.stringify(addJson)}`);
  }
  return projectId;
}

async function deleteGroup(request: APIRequestContext, token: string, projectId: string) {
  await request.post(`${API}/ncnb/project/group/delete`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { id: projectId },
  });
}

test.describe('添加成员邀请失败不关窗', () => {
  test('业务码失败：可读 toast + 窗仍开 → 重试成功', async ({ page, request }) => {
    test.setTimeout(90_000);
    const account = e2eAccount();
    const projectName = uniqueProjectName('add-user-fail');
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(request, token, projectName);

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/permission?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '用户组' })).toBeVisible({
        timeout: 15_000,
      });

      await expect(page.getByRole('tab', { name: '团队普通成员' })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('tab', { name: '团队普通成员' }).click();
      await expect(page.getByRole('tab', { name: '用户组成员' })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('tab', { name: '用户组成员' }).click();

      await page.route('**/ncnb/project/group/users**', async (route) => {
        if (route.request().method() !== 'GET') {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: {
              records: [
                {
                  id: 'e2e-invite-user-1',
                  username: 'e2e_invitee',
                  email: 'e2e_invitee@example.com',
                },
              ],
            },
          }),
        });
      });

      let inviteHits = 0;
      await page.route('**/ncnb/project/group/role/users', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        inviteHits += 1;
        if (inviteHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟邀请拒绝' }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: true }),
        });
      });

      const trigger = page.getByRole('button', { name: '添加成员' });
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /添加成员/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      const userSelect = dialog.getByRole('combobox', { name: '选择用户' });
      await userSelect.click();
      // antd Select 虚拟列表偶发 option 不可见；键盘选中更稳
      await userSelect.press('ArrowDown');
      await page.keyboard.press('Enter');

      await dialog.getByRole('button', { name: '确定' }).click();
      await expectToast(page, '模拟邀请拒绝');
      await expect(dialog).toBeVisible();
      await expect(page.getByText('保存成功')).toHaveCount(0);

      await dialog.getByRole('button', { name: '确定' }).click();
      await expectToast(page, '保存成功');
      await expect(dialog).toHaveCount(0);
      expect(inviteHits).toBe(2);
    } finally {
      await page.unroute('**/ncnb/project/group/users**').catch(() => {});
      await page.unroute('**/ncnb/project/group/role/users').catch(() => {});
      await deleteGroup(request, token, projectId).catch(() => {});
    }
  });
});
