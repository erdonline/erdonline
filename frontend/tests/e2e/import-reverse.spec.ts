import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  expandTreeTitle,
  login,
  uniqueProjectName,
} from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * W5 逆向解析：`/design/table/import/reverse` + MySQL reverse_demo → 选表 → 模型可见
 * 依赖：erd-mysql 已灌 db/reverse-fixtures/mysql/01_reverse_demo.sql
 */
test.describe('数据源逆向解析', () => {
  test('reverse_demo 导入后 t_user / t_order 可见', async ({ page, request }) => {
    test.setTimeout(180_000);
    const projectName = uniqueProjectName('rev');
    const dsName = `e2e-rev-${Date.now().toString(36)}`;
    let dsId = '';

    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      const headers = { Authorization: `Bearer ${token}` };

      const list = await request.get(`${API}/ncnb/dataSources?size=100&current=1`, {
        headers,
      });
      const listJson = await list.json();
      for (const row of listJson?.data?.records || []) {
        await request.delete(`${API}/ncnb/dataSources/${row.id}`, { headers });
      }

      dsId = `e2e-rev-ds-${Date.now().toString(36)}`;
      const createRes = await request.post(`${API}/ncnb/dataSources`, {
        headers,
        data: {
          id: dsId,
          name: dsName,
          type: 'MySQL',
          url: 'jdbc:mysql://127.0.0.1:3306/reverse_demo',
          username: 'root',
          password: 'root',
          driverClassName: 'com.mysql.cj.jdbc.Driver',
          host: '127.0.0.1',
          port: '3306',
          databaseName: 'reverse_demo',
          connectionType: 'host',
        },
      });
      expect(createRes.status()).toBe(200);
      expect((await createRes.json()).code).toBe(200);

      const ping = await request.post(`${API}/ncnb/connector/ping`, {
        headers,
        data: {
          url: 'jdbc:mysql://127.0.0.1:3306/reverse_demo',
          username: 'root',
          password: 'root',
          driverClassName: 'com.mysql.cj.jdbc.Driver',
        },
      });
      test.skip((await ping.json())?.code !== 200, 'reverse_demo MySQL 不可达，跳过逆向 E2E');

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'rev', 'reverse import');
      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      const metaWait = page.waitForResponse(
        (r) =>
          r.url().includes('/connector/dbReverseMeta') && r.request().method() === 'POST',
        { timeout: 60_000 },
      );
      await page.goto(`/design/table/import/reverse?projectId=${projectId}`);
      await expect(page.getByText(/解析已有数据源/)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(dsName).first()).toBeVisible({ timeout: 15_000 });

      const metaRes = await metaWait;
      const metaBody = metaRes.request().postDataJSON() as Record<string, unknown>;
      expect(metaBody.dataSourceId).toBe(dsId);
      expect(metaBody.password).toBeUndefined();
      expect(metaBody.url).toBeUndefined();

      const parseWait = page.waitForResponse(
        (r) =>
          r.url().includes('/connector/dbReverseParse') && r.request().method() === 'POST',
        { timeout: 60_000 },
      );
      await page.getByRole('button', { name: /下一步/ }).click();
      const parseRes = await parseWait;
      expect(parseRes.ok()).toBeTruthy();
      const parseBody = parseRes.request().postDataJSON() as Record<string, unknown>;
      expect(parseBody.dataSourceId).toBe(dsId);
      expect(parseBody.password).toBeUndefined();
      expect(parseBody.url).toBeUndefined();

      await expect(page.getByText('t_user', { exact: true })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText('t_order', { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      await page.getByRole('row').filter({ hasText: 't_user' }).getByRole('checkbox').click();
      await page.getByRole('row').filter({ hasText: 't_order' }).getByRole('checkbox').click();

      const saveWait = page.waitForResponse(
        (r) =>
          (r.url().includes('/ncnb/project/save') ||
            r.url().includes('/ncnb/project/group/save')) &&
          r.request().method() === 'POST',
        { timeout: 30_000 },
      );
      await page.getByRole('button', { name: /提\s*交/ }).click();
      await expectToast(page, /操作成功/);
      const saveRes = await saveWait;
      expect(saveRes.ok()).toBeTruthy();

      await page.goto(`/design/table/model?projectId=${projectId}`);
      await expect(page.getByText('逆向解析_MYSQL', { exact: true })).toBeVisible({
        timeout: 20_000,
      });
      await expandTreeTitle(page, '逆向解析_MYSQL');
      await expandTreeTitle(page, '表');
      await expect(page.getByText('t_user', { exact: true })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText('t_order', { exact: true })).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
      if (dsId) {
        const token = await page
          .evaluate(() => localStorage.getItem('Authorization'))
          .catch(() => null);
        if (token) {
          await request
            .delete(`${API}/ncnb/dataSources/${dsId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => {});
        }
      }
    }
  });
});
