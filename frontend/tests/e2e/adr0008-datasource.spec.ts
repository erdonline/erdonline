import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * ADR-0008：设计器「新增数据源」写 /ncnb/dataSources；项目 profile 不落 JDBC 机密
 */
test.describe('ADR-0008 数据源', () => {
  test('新增数据源 POST dataSources，项目 profile 无 password', async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('ds');
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      const list = await request.get(`${API}/ncnb/dataSources?size=100&current=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listJson = await list.json();
      for (const row of listJson?.data?.records || []) {
        await request.delete(`${API}/ncnb/dataSources/${row.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);
      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page.getByRole('menuitem', { name: '设置' }).hover();
      await page.getByRole('button', { name: '数据源设置' }).click();
      await expect(page.getByRole('dialog').getByText('数据源连接配置')).toBeVisible();

      const postWait = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/dataSources') &&
          r.request().method() === 'POST' &&
          !r.url().includes('ping'),
        { timeout: 20_000 },
      );
      const saveWait = page.waitForRequest(
        (r) =>
          (r.url().includes('/ncnb/project/save') ||
            r.url().includes('/ncnb/project/group/save')) &&
          r.method() === 'POST',
        { timeout: 25_000 },
      );
      await page.getByRole('button', { name: '新增数据源' }).click();

      const postRes = await postWait;
      expect(postRes.status()).toBe(200);
      const postJson = await postRes.json();
      expect(postJson.code).toBe(200);
      const dsId = postRes.request().postDataJSON()?.id as string;
      expect(dsId).toBeTruthy();

      const saveReq = await saveWait;
      const saveBody = saveReq.postDataJSON();
      const savedProfile = saveBody?.projectJSON?.profile || {};
      expect(savedProfile.defaultDataSourceId).toBe(dsId);
      expect(savedProfile.dbs === undefined || savedProfile.dbs?.length === 0).toBeTruthy();

      await expect
        .poll(
          async () => {
            const info = await request.get(`${API}/ncnb/project/info/${projectId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const body = await info.json();
            return body?.data?.projectJSON?.profile?.defaultDataSourceId;
          },
          { timeout: 15_000 },
        )
        .toBe(dsId);

      const info = await request.get(`${API}/ncnb/project/info/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await info.json();
      const profile = body.data?.projectJSON?.profile || {};
      expect(JSON.stringify(profile)).not.toMatch(/"password"\s*:\s*"[^"]+"/);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('测试连接：假 JDBC 有可见 toast（成功或失败）', async ({ page }) => {
    test.setTimeout(90_000);
    try {
      await login(page, e2eAccount());
      await page.goto('/databaseConfig');
      await expect(page.getByText('数据库连接列表')).toBeVisible({ timeout: 15_000 });

      await page.getByRole('button', { name: '新建连接' }).click();
      await expect(page.getByPlaceholder('例如：生产环境主数据库')).toBeVisible({
        timeout: 15_000,
      });

      await page.getByPlaceholder('例如：生产环境主数据库').fill(`e2e-ping-${Date.now().toString(36)}`);
      await page.getByPlaceholder('例如：localhost 或 192.168.1.1').fill('127.0.0.1');
      await page.getByPlaceholder('例如：3306').fill('59999');
      await page.getByPlaceholder('例如：mydatabase').fill('e2e_fake');
      await page.getByPlaceholder('例如：com.mysql.cj.jdbc.Driver').fill('com.mysql.cj.jdbc.Driver');
      await page.getByPlaceholder('用户名').fill('e2e');
      await page.getByPlaceholder('密码').fill('e2e');

      await page.getByRole('button', { name: '测试连接' }).click();
      await expect(
        page.getByText(/连接测试成功|连接测试失败|表单验证失败/).first(),
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      /* 未保存，无需清理 */
    }
  });
});
