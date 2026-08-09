import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  openVersionPage,
  saveVersion,
  uniqueProjectName,
} from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 版本保存/重建基线失败：禁止伪装成功；可读 toast；可重试
 * — 保存版本（含首存）：业务码失败不关窗 → 重试成功关窗
 * — 重建基线：hisProjectSave 失败不弹「重建基线成功」、不 rebaseline
 */

test.describe('版本保存失败可读可重试', () => {
  test('保存版本：业务码失败不关窗 → 重试成功（首存，含 JDBC 自动补种同步书签场景）', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vsave-init-fail');
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

      dsId = crypto.randomUUID();
      const createDs = await request.post(`${API}/ncnb/dataSources`, {
        headers,
        data: {
          id: dsId,
          name: `e2e-vsave-${Date.now().toString(36)}`,
          type: 'MYSQL',
          url: 'jdbc:mysql://127.0.0.1:3306/e2e',
          username: 'e2e',
          password: 'e2e',
          driverClassName: 'com.mysql.cj.jdbc.Driver',
        },
      });
      expect(createDs.status()).toBe(200);

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vsf', 'version save fail');
      await openVersionPage(page);

      let saveHits = 0;
      await page.route('**/ncnb/hisProject/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟保存版本拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      const trigger = page.getByTestId('add-version-btn');
      await expect(trigger).toBeEnabled({ timeout: 20_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog').filter({ hasText: '新增版本' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByRole('button', { name: /确\s*定/ }).click();

      await expectToast(page, '模拟保存版本拒绝');
      await expect(dialog).toBeVisible();
      await expect(page.getByText('保存成功')).toHaveCount(0);

      await dialog.getByRole('button', { name: /确\s*定/ }).click();
      await expectToast(page, '保存成功');
      await expect(dialog).toHaveCount(0);
      expect(saveHits).toBe(2);
    } finally {
      await page.unroute('**/ncnb/hisProject/save').catch(() => {});
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

  test('重建基线：保存失败不伪装成功、不 rebaseline', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vsave-rebuild-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vsr', 'rebuild save fail');
      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });

      let rebaselineHits = 0;
      await page.route('**/ncnb/connector/rebaseline**', async (route) => {
        rebaselineHits += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: true }),
        });
      });

      let saveHits = 0;
      await page.route('**/ncnb/hisProject/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        saveHits += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '模拟重建保存拒绝' }),
        });
      });

      await page.getByTestId('version-toolbar-more-btn').click();
      const trigger = page.getByTestId('version-rebuild-btn');
      await expect(trigger).toBeEnabled({ timeout: 10_000 });
      await trigger.click();

      const formDialog = page.getByRole('dialog', { name: /重建版本/ });
      await expect(formDialog).toBeVisible({ timeout: 10_000 });
      await formDialog.getByRole('textbox', { name: '版本号' }).fill('2.0.0');
      await formDialog.getByRole('textbox', { name: '版本描述' }).fill('rebuild fail');
      await formDialog.getByRole('button', { name: /确\s*定/ }).click();

      const confirm = page.getByRole('dialog', { name: '重建基线' });
      await expect(confirm).toBeVisible({ timeout: 10_000 });
      await confirm.getByRole('button', { name: /重\s*建/ }).click();

      await expectToast(page, '模拟重建保存拒绝');
      await expect(page.getByText('重建基线成功')).toHaveCount(0);
      await expect(page.getByText('初始化数据表成功')).toHaveCount(0);
      expect(rebaselineHits).toBe(0);
      expect(saveHits).toBeGreaterThanOrEqual(1);
    } finally {
      await page.unroute('**/ncnb/hisProject/save').catch(() => {});
      await page.unroute('**/ncnb/connector/rebaseline**').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
