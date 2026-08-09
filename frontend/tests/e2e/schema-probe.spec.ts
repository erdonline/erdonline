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

type MockProbePayload = {
  status: string;
  reason?: string;
  message?: string;
  fingerprint?: string;
  modelFingerprint?: string;
  tableCount?: number;
  apiCode?: number;
  delayMs?: number;
};

async function probeJdbcSetup(
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
  projectName: string,
) {
  const token = await page.evaluate(() => localStorage.getItem('Authorization'));
  expect(token).toBeTruthy();
  await clearDataSources(request, token!);
  const dsId = await seedMysqlDs(request, token!, `e2e-probe-${Date.now().toString(36)}`);
  await deleteOwnPersonProjects(page);
  await createAndOpenPersonProject(page, projectName, 'probe', 'schema probe');
  await openVersionPage(page);
  await expect(page.getByTestId('status-instrument')).toBeVisible({ timeout: 15_000 });
  const probeCapsule = page.getByTestId('instrument-db');
  await expect(probeCapsule).toBeVisible();
  await expect(probeCapsule).toHaveAttribute('data-probe-status', 'UNKNOWN');
  await expect(probeCapsule).toHaveAttribute('data-probe-reason', 'PROBE_NOT_PROBED');
  // 未探测不得伪装成已测：可见「DB ·」
  await expect(probeCapsule).toContainText('DB ·');
  return { dsId, probeCapsule };
}

async function cleanupProbeDs(
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
  dsId: string,
) {
  if (!dsId) return;
  const token = await page.evaluate(() => localStorage.getItem('Authorization')).catch(() => null);
  if (token) {
    await request
      .delete(`${API}/ncnb/dataSources/${dsId}`, { headers: { Authorization: `Bearer ${token}` } })
      .catch(() => {});
  }
}
/**
 * B 层实库探测五态 + 未知四路（ADR-0022 #10 / Vision #15）
 */
test.describe('实库探测', () => {
  test('模型页顶栏可见探测控件（唯一入口）', async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('probe-chrome');
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      await clearDataSources(request, token!);

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'probe', 'schema probe chrome');
      // 停在模型页，不 navigate 到版本页
      await expect(page).toHaveURL(/\/design\/table\/model/);

      await expect(page.getByTestId('status-instrument')).toBeVisible({ timeout: 15_000 });
      const probeCapsule = page.getByTestId('instrument-db');
      await expect(probeCapsule).toBeVisible();
      await expect(probeCapsule).toHaveAttribute('data-probe-status', 'UNKNOWN');
      await expect(probeCapsule).toHaveAttribute('data-probe-reason', 'PROBE_NO_DATASOURCE');
      await expect(page.getByTestId('schema-probe-unknown-hint')).toContainText(/未配置数据源/);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

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

      await expect(page.getByTestId('status-instrument')).toBeVisible({ timeout: 15_000 });
      const probeCapsule = page.getByTestId('instrument-db');
      await expect(probeCapsule).toHaveAttribute('data-probe-status', 'UNKNOWN');
      await expect(probeCapsule).toHaveAttribute('data-probe-reason', 'PROBE_NO_DATASOURCE');
      await expect(page.getByTestId('schema-probe-unknown-hint')).toContainText(/未配置数据源/);
      await expect(probeCapsule).toBeEnabled();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('有 JDBC：mock SYNCED/BEHIND/DIVERGED parity', async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('probe-parity');
    let dsId = '';
    try {
      await login(page, e2eAccount());
      const setup = await probeJdbcSetup(page, request, projectName);
      dsId = setup.dsId;
      const { probeCapsule } = setup;

      for (const data of [
        { status: 'SYNCED', fingerprint: 'fp-sync', tableCount: 3 },
        { status: 'BEHIND', reason: 'FINGERPRINT_MISMATCH', tableCount: 5 },
        { status: 'DIVERGED', reason: 'FINGERPRINT_MISMATCH', tableCount: 2 },
      ]) {
        await page.unroute('**/ncnb/connector/schema/probe').catch(() => {});
        await page.route('**/ncnb/connector/schema/probe', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 200, data }),
          });
        });
        await probeCapsule.click();
        await expect(probeCapsule).toHaveAttribute('data-probe-status', data.status, { timeout: 10_000 });
      }
    } finally {
      await page.unroute('**/ncnb/connector/schema/probe').catch(() => {});
      await cleanupProbeDs(page, request, dsId);
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('有 JDBC：尚未探测 + mock 五态不伪装一致', async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('probe-ds');
    let dsId = '';
    try {
      await login(page, e2eAccount());
      const setup = await probeJdbcSetup(page, request, projectName);
      dsId = setup.dsId;
      const { probeCapsule } = setup;

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

      await probeCapsule.click();

      await expect(probeCapsule).toHaveAttribute('data-probe-status', 'AHEAD', { timeout: 10_000 });

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

      await probeCapsule.click();
      await expect(probeCapsule).toHaveAttribute('data-probe-status', 'UNKNOWN');
      await expect(probeCapsule).toHaveAttribute('data-probe-reason', 'PROBE_NO_PERMISSION');
      await expect(page.getByTestId('schema-probe-unknown-hint')).toContainText(/无读取权限/);

      await page.unroute('**/ncnb/connector/schema/probe');
      await page.route('**/ncnb/connector/schema/probe', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: 'JDBC connection refused' }),
        });
      });
      await probeCapsule.click();
      await expect(probeCapsule).toHaveAttribute('data-probe-status', 'UNKNOWN', { timeout: 10_000 });
      await expect(probeCapsule).toHaveAttribute('data-probe-reason', 'PROBE_CONNECTION_FAILED');
      await expect(page.getByTestId('schema-probe-unknown-hint')).toContainText(/无法连接实库/);

      await expect(page.getByTestId('dual-layer-legend')).toBeVisible();
    } finally {
      await page.unroute('**/ncnb/connector/schema/probe').catch(() => {});
      await cleanupProbeDs(page, request, dsId);
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
