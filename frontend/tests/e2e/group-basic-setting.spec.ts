import { expect, test, type APIRequestContext } from '@playwright/test';
import { e2eAccount, expectToast, login, uniqueProjectName } from './helpers';

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
) {
  const add = await request.post(`${API}/ncnb/project/group/add`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { projectName: name, description: 'group basic e2e', tags: 'e2e' },
  });
  const addJson = await add.json();
  expect(addJson.code).toBe(200);
  const projectId = addJson.data as string;
  expect(projectId).toBeTruthy();
  return projectId;
}

async function deleteGroupProject(
  request: APIRequestContext,
  token: string,
  projectId: string,
) {
  await request
    .post(`${API}/ncnb/project/group/delete`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { id: projectId },
    })
    .catch(() => {});
}

/**
 * W6 `/project/group/setting/basic`：保存基本设置成功/失败均有 toast。
 */
test.describe('团队项目基本设置', () => {
  test('保存基本设置成功有 toast', async ({ page, request }) => {
    test.setTimeout(60_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('group-basic'),
    );

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByLabel('项目名')).toBeVisible();

      const nextName = uniqueProjectName('group-basic-upd');
      await page.getByLabel('项目名').fill(nextName);
      await page.getByRole('button', { name: /提\s*交/ }).click();
      await expectToast(page, '修改成功');
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });

  test('保存基本设置失败有 toast', async ({ page, request }) => {
    test.setTimeout(60_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('group-basic-fail'),
    );

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByLabel('项目名')).toBeVisible({ timeout: 15_000 });

      await page.route('**/ncnb/project/group/update', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '修改失败' }),
        });
      });

      await page.getByRole('button', { name: /提\s*交/ }).click();
      await expectToast(page, '修改失败');
      await page.unroute('**/ncnb/project/group/update');
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });
});
