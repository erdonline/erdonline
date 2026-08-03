import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 切换默认数据源：禁止仅本地 mutate defaultDataSourceId；
 * 仅 project/save code===200；失败 toast + Radio/文案回滚，可重试
 */

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

test.describe('默认数据源落盘失败可重试', () => {
  test('切默认业务码失败：可读 toast + 列表回滚 → 重试成功', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('defdb-fail');
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      await clearDataSources(request, token!);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'defdb', 'default db fail');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '设置' })
        .click();
      await page.getByRole('menuitem', { name: '数据源设置' }).click();

      const dialog = page.getByRole('dialog', { name: '数据源连接配置' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText(/当前未创建数据源/)).toBeVisible({
        timeout: 10_000,
      });

      const postWait1 = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/dataSources') &&
          r.request().method() === 'POST' &&
          !r.url().includes('ping'),
        { timeout: 20_000 },
      );
      await dialog.getByRole('button', { name: '新增数据源' }).click();
      const post1 = await postWait1;
      const ds1Body = post1.request().postDataJSON() as {
        id?: string;
        name?: string;
      };
      const ds1Id = ds1Body?.id as string;
      const name1 = ds1Body?.name as string;
      expect(ds1Id).toBeTruthy();
      expect(name1).toBeTruthy();

      await expect(
        dialog.getByText(`当前使用的数据源为「${name1}」`),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        dialog.getByRole('radio', { name: `设为默认数据源 ${name1}` }),
      ).toBeChecked({ timeout: 10_000 });

      const postWait2 = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/dataSources') &&
          r.request().method() === 'POST' &&
          !r.url().includes('ping'),
        { timeout: 20_000 },
      );
      await dialog.getByRole('button', { name: '新增数据源' }).click();
      const post2 = await postWait2;
      const ds2Body = post2.request().postDataJSON() as {
        id?: string;
        name?: string;
      };
      const ds2Id = ds2Body?.id as string;
      const name2 = ds2Body?.name as string;
      expect(ds2Id).toBeTruthy();
      expect(name2).toBeTruthy();
      expect(ds2Id).not.toBe(ds1Id);
      expect(name2).not.toBe(name1);

      const radio2 = dialog.getByRole('radio', {
        name: `设为默认数据源 ${name2}`,
      });
      await expect(radio2).toBeVisible({ timeout: 10_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let defaultId: string | undefined;
        try {
          const body = JSON.parse(route.request().postData() || '{}');
          defaultId =
            body?.projectJSON?.profile?.defaultDataSourceId ??
            body?.data?.projectJSON?.profile?.defaultDataSourceId;
        } catch {
          defaultId = undefined;
        }
        if (defaultId !== ds2Id) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟默认数据源保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await radio2.click();
        await expectToast(page, '模拟默认数据源保存拒绝');
        await expect(dialog.getByText(`当前使用的数据源为「${name1}」`)).toBeVisible({
          timeout: 10_000,
        });
        await expect(
          dialog.getByText(`当前使用的数据源为「${name2}」`),
        ).toHaveCount(0);

        await radio2.click();
        await expect(
          dialog.getByText(`当前使用的数据源为「${name2}」`),
        ).toBeVisible({ timeout: 15_000 });
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
