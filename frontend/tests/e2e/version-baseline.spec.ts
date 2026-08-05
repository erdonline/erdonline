import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  gotoDesignModel,
  login,
  openRelationFromEmpty,
  openVersionPage,
  rfNode,
  saveVersion,
  uniqueProjectName,
} from './helpers';

/**
 * A 层基线（ADR-0022）：基线 = 独立查询到的最新版本，与版本列表分页解耦。
 * 定位：e2e-locators
 */

type DbChangeBody = {
  size?: number;
  current?: number;
  orders?: { column?: string; asc?: boolean }[];
};

test.describe('版本基线', () => {
  test('无版本时提示尚无基线，存版本后一致', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vbase');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vbase', 'version baseline');

      const baselineQueries: DbChangeBody[] = [];
      page.on('request', (req) => {
        if (!req.url().includes('/ncnb/dbChange') || req.method() !== 'POST') {
          return;
        }
        try {
          baselineQueries.push(JSON.parse(req.postData() || '{}') as DbChangeBody);
        } catch {
          // 非 JSON 请求体忽略
        }
      });

      await openVersionPage(page);

      // 尚无任何版本：不得伪装「已与最新版本一致」
      await expect(page.getByTestId('version-no-baseline')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('version-clean-tag')).toHaveCount(0);

      // 基线查询独立：size=1 且按 create_time 倒序（不吃列表分页参数）
      const latestQuery = baselineQueries.find((q) => q.size === 1);
      expect(latestQuery, '应发出独立的最新版本查询（size=1）').toBeTruthy();
      expect(latestQuery?.current).toBe(1);
      expect(latestQuery?.orders?.[0]?.column).toBe('createTime');
      expect(latestQuery?.orders?.[0]?.asc).toBe(false);

      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-no-baseline')).toHaveCount(0);
      await expect(page.getByTestId('version-clean-tag')).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('版本列表分页首条不是最新版本时基线不被污染', async ({ page }) => {
    test.setTimeout(180_000);
    const projectName = uniqueProjectName('vbasepage');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vbasepage', 'baseline pagination');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await page.waitForTimeout(2_000);

      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-clean-tag')).toBeVisible({ timeout: 15_000 });

      // 模拟用户翻页/换排序：列表首条变成一个空模型的旧版本。
      // 基线只能来自 size=1 的独立查询，列表被改也必须仍判「一致」。
      await page.route('**/ncnb/dbChange', async (route) => {
        const req = route.request();
        if (req.method() !== 'POST') {
          await route.continue();
          return;
        }
        let body: DbChangeBody = {};
        try {
          body = JSON.parse(req.postData() || '{}') as DbChangeBody;
        } catch {
          body = {};
        }
        if (body.size === 1) {
          // 基线查询：不动
          await route.continue();
          return;
        }
        const res = await route.fetch();
        const json = (await res.json()) as {
          data?: { records?: unknown[]; total?: number };
        };
        const records = json.data?.records || [];
        json.data = {
          ...json.data,
          records: [
            {
              id: 'stale-page-row',
              version: '9.9.9',
              versionDesc: '旧页首条（空模型、版本号更大）',
              versionDate: '2020/1/1 0:0:0',
              changes: [],
              projectJSON: { modules: [] },
            },
            ...records,
          ],
          total: records.length + 1,
        };
        await route.fulfill({
          status: res.status(),
          contentType: 'application/json',
          body: JSON.stringify(json),
        });
      });

      await page.reload({ waitUntil: 'domcontentloaded' });
      await openVersionPage(page);
      await expect(page.getByTestId('version-row-9.9.9')).toBeVisible({ timeout: 15_000 });
      // 旧实现取 versions[0] 会判「未保存变更」；基线独立后仍为一致
      await expect(page.getByTestId('version-clean-tag')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('version-dirty-tag')).toHaveCount(0);

      // 建议版本号与保存校验也走基线：列表里的 9.9.9 不得把下一版顶到 9.9.10 或拦住保存
      await page.getByTestId('add-version-btn').click();
      const dialog = page.getByRole('dialog').filter({ hasText: '新增版本' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('textbox', { name: '版本号' })).toHaveValue('1.0.1');
      await dialog.getByRole('button', { name: /确\s*定/ }).click();
      await expect(dialog).toHaveCount(0, { timeout: 15_000 });
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible({ timeout: 15_000 });
    } finally {
      await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('基线查询失败 → 未知态（顶栏 chip + 版本页 tag，可重试恢复）', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vbasefail');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vbasefail', 'baseline query fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-clean-tag')).toBeVisible({ timeout: 15_000 });

      await page.route('**/ncnb/dbChange', async (route) => {
        const req = route.request();
        if (req.method() !== 'POST') {
          await route.continue();
          return;
        }
        let body: DbChangeBody = {};
        try {
          body = JSON.parse(req.postData() || '{}') as DbChangeBody;
        } catch {
          body = {};
        }
        if (Number(body.size) === 1) {
          await route.abort('failed');
          return;
        }
        await route.continue();
      });

      await page.reload({ waitUntil: 'domcontentloaded' });
      await openVersionPage(page);
      await expect(page.getByTestId('version-baseline-unknown')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('version-clean-tag')).toHaveCount(0);
      await expect(page.getByTestId('version-no-baseline')).toHaveCount(0);
      await expect(page.getByTestId('version-dirty-chip-unknown')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('version-dirty-chip-clean')).toHaveCount(0);

      await gotoDesignModel(page);
      await expect(page.getByTestId('version-dirty-chip-unknown')).toBeVisible({ timeout: 15_000 });

      await page.unroute('**/ncnb/dbChange');
      await page.getByTestId('version-dirty-chip-unknown').click();
      await expect(page.getByTestId('version-dirty-chip-clean')).toBeVisible({ timeout: 15_000 });
    } finally {
      await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
