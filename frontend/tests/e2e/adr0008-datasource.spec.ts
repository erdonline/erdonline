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

      // 产品侧 SubMenu 为 click 展开（非 hover）
      await page.getByRole('button', { name: '项目菜单' }).click();
      await page.getByTestId('project-menu-panel').getByRole('menuitem', { name: '设置' }).click();
      await page.getByRole('menuitem', { name: '数据源设置' }).click();
      await expect(page.getByRole('dialog').getByText('数据源连接配置')).toBeVisible();

      const postWait = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/dataSources') &&
          r.request().method() === 'POST' &&
          !r.url().includes('ping'),
        { timeout: 20_000 },
      );
      await page.getByRole('button', { name: '新增数据源' }).click();

      const postRes = await postWait;
      expect(postRes.status()).toBe(200);
      const postJson = await postRes.json();
      expect(postJson.code).toBe(200);
      const dsId = postRes.request().postDataJSON()?.id as string;
      expect(dsId).toBeTruthy();

      // 忽略打开项目时的无关 autosave；只认带上本条 defaultDataSourceId 的落盘
      const saveReq = await page.waitForRequest(
        (r) => {
          if (
            !(
              r.url().includes('/ncnb/project/save') ||
              r.url().includes('/ncnb/project/group/save')
            ) ||
            r.method() !== 'POST'
          ) {
            return false;
          }
          const profile = r.postDataJSON()?.projectJSON?.profile || {};
          return profile.defaultDataSourceId === dsId;
        },
        { timeout: 25_000 },
      );
      const savedProfile = saveReq.postDataJSON()?.projectJSON?.profile || {};
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

  test('/databaseConfig：同步状态钮有可见反馈', async ({ page, request }) => {
    test.setTimeout(120_000);
    const stem = `e2e-w${test.info().parallelIndex}-sync-${Date.now().toString(36)}`;
    const name = `${stem}-ds`;
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

      await page.goto('/databaseConfig');
      await expect(page.getByText('数据库连接列表')).toBeVisible({ timeout: 20_000 });

      // HomeLayout GitHub badge iframe 偶发盖住按钮
      await page.getByRole('button', { name: '新建连接' }).click({ force: true });
      await expect(page.getByPlaceholder('例如：生产环境主数据库')).toBeVisible({
        timeout: 15_000,
      });
      await page.getByPlaceholder('例如：生产环境主数据库').fill(name);
      await page.getByPlaceholder('例如：localhost 或 192.168.1.1').fill('127.0.0.1');
      await page.getByPlaceholder('例如：3306').fill('59999');
      await page.getByPlaceholder('例如：mydatabase').fill('e2e_fake');
      await page.getByPlaceholder('例如：com.mysql.cj.jdbc.Driver').fill('com.mysql.cj.jdbc.Driver');
      await page.getByPlaceholder('用户名').fill('e2e');
      await page.getByPlaceholder('密码').fill('e2e');

      const postWait = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/dataSources') &&
          r.request().method() === 'POST' &&
          !r.url().includes('ping'),
        { timeout: 20_000 },
      );
      await page.getByRole('button', { name: '保存连接' }).click();
      const postRes = await postWait;
      expect(postRes.status()).toBe(200);
      await expect(page.getByText('添加成功').first()).toBeVisible({ timeout: 15_000 });

      const row = page.getByRole('row', { name: new RegExp(name) });
      await expect(row).toBeVisible({ timeout: 45_000 });

      const pingWait = page.waitForResponse(
        (r) => r.url().includes('/ncnb/connector/ping') && r.request().method() === 'POST',
        { timeout: 30_000 },
      );
      await row.getByRole('button', { name: '同步状态' }).click();
      const pingRes = await pingWait;
      const pingBody = pingRes.request().postDataJSON() as Record<string, unknown>;
      expect(pingBody.dataSourceId).toBeTruthy();
      expect(pingBody.password).toBeUndefined();
      expect(pingBody.url).toBeUndefined();
      await expect(
        page
          .getByText(/连接在线，状态已更新|连接不可达，状态已更新为错误|同步状态出错/)
          .first(),
      ).toBeVisible({ timeout: 15_000 });
      await expect(row.getByText(/在线|错误|离线/)).toBeVisible({ timeout: 5_000 });
    } finally {
      const token = await page.evaluate(() => localStorage.getItem('Authorization')).catch(() => null);
      if (token) {
        const list = await request.get(`${API}/ncnb/dataSources?size=100&current=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const listJson = await list.json();
        for (const row of listJson?.data?.records || []) {
          if (String(row.name || '').includes(stem)) {
            await request.delete(`${API}/ncnb/dataSources/${row.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }
    }
  });

  test('/databaseConfig：编辑保存 + 删除确认闭环', async ({ page, request }) => {
    test.setTimeout(120_000);
    const stem = `e2e-w${test.info().parallelIndex}-ds-${Date.now().toString(36)}`;
    const nameA = `${stem}-a`;
    const nameB = `${stem}-b`;
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

      await page.goto('/databaseConfig');
      await expect(page.getByText('数据库连接列表')).toBeVisible({ timeout: 20_000 });

      await page.getByRole('button', { name: '新建连接' }).click();
      await expect(page.getByPlaceholder('例如：生产环境主数据库')).toBeVisible({
        timeout: 15_000,
      });
      await page.getByPlaceholder('例如：生产环境主数据库').fill(nameA);
      await page.getByPlaceholder('例如：localhost 或 192.168.1.1').fill('127.0.0.1');
      await page.getByPlaceholder('例如：3306').fill('59999');
      await page.getByPlaceholder('例如：mydatabase').fill('e2e_fake');
      await page.getByPlaceholder('例如：com.mysql.cj.jdbc.Driver').fill('com.mysql.cj.jdbc.Driver');
      await page.getByPlaceholder('用户名').fill('e2e');
      await page.getByPlaceholder('密码').fill('e2e');

      const postWait = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/dataSources') &&
          r.request().method() === 'POST' &&
          !r.url().includes('ping'),
        { timeout: 20_000 },
      );
      await page.getByRole('button', { name: '保存连接' }).click();
      const postRes = await postWait;
      expect(postRes.status()).toBe(200);
      await expect(page.getByText('添加成功').first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('row', { name: new RegExp(nameA) })).toBeVisible({
        timeout: 30_000,
      });

      const rowA = page.getByRole('row', { name: new RegExp(nameA) });
      await rowA.getByRole('button', { name: '编辑' }).click();
      await expect(page.getByText('编辑数据库连接')).toBeVisible({ timeout: 10_000 });
      await page.getByPlaceholder('例如：生产环境主数据库').fill(nameB);

      const putWait = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/dataSources/') &&
          r.request().method() === 'PUT' &&
          !r.url().includes('ping'),
        { timeout: 20_000 },
      );
      await page.getByRole('button', { name: '更新连接' }).click();
      const putRes = await putWait;
      expect(putRes.status()).toBe(200);
      await expect(page.getByText('更新成功').first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('row', { name: new RegExp(nameB) })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole('row', { name: new RegExp(nameA) })).toHaveCount(0);

      const rowB = page.getByRole('row', { name: new RegExp(nameB) });
      await rowB.getByRole('button', { name: `删除连接 ${nameB}` }).click();
      // Modal.confirm 会复制一份隐藏 title；以正文 + 删除钮为准
      const dialog = page.getByRole('dialog').filter({ hasText: /不可逆/ });
      await expect(dialog.getByText(/不可逆/)).toBeVisible();
      await dialog.getByRole('button', { name: /删\s*除/ }).click();
      await expect(page.getByText('删除成功').first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('row', { name: new RegExp(nameB) })).toHaveCount(0, {
        timeout: 30_000,
      });
    } finally {
      const token = await page.evaluate(() => localStorage.getItem('Authorization')).catch(() => null);
      if (token) {
        const list = await request.get(`${API}/ncnb/dataSources?size=100&current=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const listJson = await list.json();
        for (const row of listJson?.data?.records || []) {
          if (String(row.name || '').includes(stem)) {
            await request.delete(`${API}/ncnb/dataSources/${row.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }
    }
  });
});
