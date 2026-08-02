import { expect, test, type APIRequestContext } from '@playwright/test';
import { e2eAccount, login, uniqueProjectName } from './helpers';

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
    data: { projectName: name, description: 'group layout e2e', tags: 'e2e' },
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
 * W6 GroupLayout：权限组可见成员/配置；返回列表 → /dataModels；打开模型 → 设计器。
 */
test.describe('GroupLayout 导航与权限组', () => {
  test('权限组：角色与用户组成员/权限配置可见', async ({ page, request }) => {
    test.setTimeout(60_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('group-perm'),
    );

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/permission?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '用户组' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole('tab', { name: '团队所有者' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '团队管理员' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '团队普通成员' })).toBeVisible();

      // access 就绪后嵌套页签出现（竞态修复回归）
      await expect(page.getByRole('tab', { name: '用户组成员' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole('tab', { name: '权限配置' })).toBeVisible();

      await page.getByRole('tab', { name: '团队普通成员' }).click();
      await page.getByRole('tab', { name: '权限配置' }).click();
      await expect(page.getByText('全选')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('团队基础设置')).toBeVisible();
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });

  test('返回项目列表 → /dataModels；打开模型 → 设计器', async ({ page, request }) => {
    test.setTimeout(60_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('group-nav'),
    );

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });

      await page.getByRole('link', { name: '返回项目列表' }).click();
      await expect(page).toHaveURL(/\/dataModels/, { timeout: 15_000 });
      await expect(page).not.toHaveURL(/projectId=/);

      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('link', { name: '打开模型' }).click();
      await expect(page).toHaveURL(
        new RegExp(`/design/table/model\\?projectId=${projectId}`),
        { timeout: 15_000 },
      );
      // 设计器空态或已有模型树均证明已进入
      await expect(
        page
          .getByRole('button', { name: '新增模型' })
          .or(page.getByText('欢迎使用数据建模工具'))
          .or(page.getByTestId('tree-open-relation'))
          .first(),
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });
});
