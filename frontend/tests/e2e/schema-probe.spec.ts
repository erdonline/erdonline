import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  openVersionPage,
  uniqueProjectName,
} from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

async function clearDataSources(
  request: import('@playwright/test').APIRequestContext,
  token: string,
) {
  const list = await request.get(`${API}/ncnb/dataSources?size=100&current=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listJson = await list.json();
  for (const row of listJson?.data?.records || []) {
    await request.delete(`${API}/ncnb/dataSources/${row.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

async function seedMysqlDs(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  name: string,
): Promise<string> {
  const id = crypto.randomUUID();
  const createDs = await request.post(`${API}/ncnb/dataSources`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      id,
      name,
      type: 'MYSQL',
      url: 'jdbc:mysql://127.0.0.1:3306/e2e',
      username: 'e2e',
      password: 'e2e',
      driverClassName: 'com.mysql.cj.jdbc.Driver',
    },
  });
  expect(createDs.status()).toBe(200);
  return id;
}

/**
 * B 层实库探测五态 + 未知四路（ADR-0022 #10）
 */
test.describe('实库探测', () => {
  test('无 JDBC 时显示未配置数据源', async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('probe-no-ds');
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      await clearDataSources(request, token!);

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'probe', 'schema probe no ds');
      await openVersionPage(page);

      await expect(page.getByTestId('schema-probe-control')).toBeVisible({ timeout: 15_000 });
      const status = page.getByTestId('schema-probe-status');
      await expect(status).toHaveAttribute('data-probe-status', 'UNKNOWN');
      await expect(status).toHaveAttribute('data-probe-reason', 'PROBE_NO_DATASOURCE');
      await expect(page.getByTestId('schema-probe-unknown-hint')).toContainText(/未配置数据源/);
      await expect(page.getByTestId('schema-probe-btn')).toBeDisabled();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('有 JDBC：尚未探测 + mock 五态不伪装一致', async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('probe-ds');
    let dsId = '';
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      await clearDataSources(request, token!);
      dsId = await seedMysqlDs(request, token!, `e2e-probe-${Date.now().toString(36)}`);

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'probe', 'schema probe');
      await openVersionPage(page);

      const control = page.getByTestId('schema-probe-control');
      await expect(control).toBeVisible({ timeout: 15_000 });

      const status = page.getByTestId('schema-probe-status');
      await expect(status).toHaveAttribute('data-probe-status', 'UNKNOWN');
      await expect(status).toHaveAttribute('data-probe-reason', 'PROBE_NOT_PROBED');
      await expect(page.getByTestId('schema-probe-unknown-hint')).toContainText(/尚未探测/);

      await page.route('**/ncnb/connector/schema/probe', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: {
              status: 'AHEAD',
              reason: 'FINGERPRINT_MISMATCH',
              fingerprint: 'abc123',
              modelFingerprint: 'def456',
              tableCount: 1,
            },
          }),
        });
      });

      const probeBtn = page.getByTestId('schema-probe-btn');
      await expect(probeBtn).toBeEnabled();
      await probeBtn.click();

      await expect(status).toHaveAttribute('data-probe-status', 'AHEAD', { timeout: 10_000 });
      await expect(status).toContainText(/模型领先/);

      await page.unroute('**/ncnb/connector/schema/probe');
      await page.route('**/ncnb/connector/schema/probe', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: {
              status: 'UNKNOWN',
              reason: 'PROBE_NO_PERMISSION',
              message: 'Access denied for user',
            },
          }),
        });
      });

      await probeBtn.click();
      await expect(status).toHaveAttribute('data-probe-status', 'UNKNOWN');
      await expect(status).toHaveAttribute('data-probe-reason', 'PROBE_NO_PERMISSION');
      await expect(page.getByTestId('schema-probe-unknown-hint')).toContainText(/无读取权限/);
    } finally {
      await page.unroute('**/ncnb/connector/schema/probe').catch(() => {});
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
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
