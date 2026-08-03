import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  uniqueProjectName,
} from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 逆向解析失败：禁止 toast `[object Object]`；页内可读失败 + 重新解析 CTA（mock API）
 */
test.describe('逆向解析失败可重试', () => {
  test('业务码失败：可读 toast + 失败页重试成功', async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('revfail');
    const dsName = `e2e-revfail-${Date.now().toString(36)}`;
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

      dsId = `e2e-revfail-ds-${Date.now().toString(36)}`;
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

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'revfail', 'reverse fail retry');
      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await page.route('**/connector/dbReverseMeta', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: { dialectId: 'mysql', supportsSchema: false, schemas: [] },
          }),
        });
      });

      let parseHits = 0;
      await page.route('**/connector/dbReverseParse', async (route) => {
        parseHits += 1;
        const body = route.request().postDataJSON() as Record<string, unknown>;
        expect(body.dataSourceId).toBe(dsId);
        expect(body.password).toBeUndefined();
        expect(body.url).toBeUndefined();

        if (parseHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟逆向解析拒绝' }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: {
              dbType: 'MYSQL',
              module: {
                name: '逆向解析_MYSQL',
                entities: [{ title: 't_mock_retry', chnname: '重试成功表', fields: [] }],
              },
              dataTypeMap: {},
            },
          }),
        });
      });

      await page.goto(`/design/table/import/reverse?projectId=${projectId}`);
      await expect(page.getByTestId('import-reverse-page')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(dsName).first()).toBeVisible({ timeout: 15_000 });

      // DataSourceSelect 可能未默认选中：点选数据源
      const dsCombo = page.getByRole('combobox', { name: /数据源/ }).or(
        page.locator('[aria-label="数据源"]').first(),
      );
      if (await dsCombo.count()) {
        await dsCombo.first().click();
        await page.getByRole('option', { name: dsName }).click();
      }

      await page.getByRole('button', { name: '下一步' }).click();

      await expectToast(page, '模拟逆向解析拒绝');
      await expect(page.getByText('[object Object]')).toHaveCount(0);

      const failed = page.getByTestId('reverse-parse-failed');
      await expect(failed).toBeVisible({ timeout: 10_000 });
      await expect(failed.getByText('数据库解析失败')).toBeVisible();
      await expect(failed.getByText('模拟逆向解析拒绝')).toBeVisible();

      const retry = page.getByRole('button', { name: '重新解析' });
      await expect(retry).toBeVisible();
      await retry.click();

      await expect(page.getByTestId('reverse-entity-list')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('t_mock_retry', { exact: true })).toBeVisible();
      await expect(page.getByTestId('reverse-parse-failed')).toHaveCount(0);
      expect(parseHits).toBeGreaterThanOrEqual(2);
    } finally {
      await page.unroute('**/connector/dbReverseMeta').catch(() => {});
      await page.unroute('**/connector/dbReverseParse').catch(() => {});
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
