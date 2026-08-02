import { expect, test, type APIRequestContext } from '@playwright/test';
import { E2E_PASS, e2eAccount, login } from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

async function apiToken(request: APIRequestContext, username: string, password: string) {
  const r = await request.post(`${API}/auth/login`, {
    data: { username, password },
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`login failed: ${username}`);
  return j.access_token as string;
}

/**
 * Wave 0：HomeLayout / GroupLayout 必须渲染子路由主内容（非仅水印/slogan）。
 * Theme 内 Outlet + layout 显式 children 对齐 DesignLayout。
 */
test.describe('布局壳子路由出口', () => {
  test('HomeLayout：/home 与 /project/person 主内容可见', async ({ page }) => {
    await login(page);

    await page.goto('/home');
    const homeCta = page.getByTestId('home-link-new-project');
    await expect(homeCta).toBeVisible({ timeout: 15_000 });
    await expect(homeCta).toHaveCount(1);
    await expect(page.getByRole('link', { name: '新建模型' })).toBeVisible();
    // Home 不得挂载设计器顶栏动作（曾误复用 DesignLayout.headRightContent）
    await expect(page.getByTestId('save-status')).toHaveCount(0);
    await expect(page.getByTestId('collab-presence')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '只读分享' })).toHaveCount(0);

    await page.goto('/project/person');
    await expect(page.getByText('个人项目').first()).toBeVisible({ timeout: 15_000 });
    // 列表工具栏「新建」或空态「立即创建」——任一可见即证明子路由已挂载
    const createBtn = page.getByRole('button', { name: /新\s*建|立即创建/ }).first();
    await expect(createBtn).toBeVisible({ timeout: 15_000 });
  });

  test('GroupLayout：/project/group/setting/basic 主内容可见', async ({ page, request }) => {
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const name = `e2e-w${test.info().parallelIndex}-layout-${Date.now().toString(36)}`;
    const add = await request.post(`${API}/ncnb/project/group/add`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { projectName: name, description: 'layout outlet', tags: 'e2e' },
    });
    const addJson = await add.json();
    const projectId = addJson.data as string;
    expect(addJson.code).toBe(200);
    expect(projectId).toBeTruthy();

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByLabel('项目名')).toBeVisible();
      await expect(page.getByRole('heading', { name: '基本设置' })).toHaveCount(1);
    } finally {
      await request
        .post(`${API}/ncnb/project/group/delete`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { id: projectId },
        })
        .catch(() => {});
    }
  });
});
