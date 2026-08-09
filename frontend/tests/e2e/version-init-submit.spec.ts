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
 * 初始化基线（InitVersion）真实提交闭环
 *
 * 回归背景：InitVersion 成功回调曾把后端字面量提示 `res.data`（如「保存成功」字符串）
 * 当版本列表塞进 store（`versions: res.data`），导致 `versions` 从数组变成字符串，
 * 后续 `.filter()` 等数组方法炸掉整页。此前唯一覆盖 InitVersion 的键盘用例只开弹层按 Esc，
 * 从未真正点「确定」提交，因此该 bug 未被发现。
 */
test.describe('初始化基线真实提交', () => {
  test('有 JDBC 数据源时初始化基线成功后列表可见、页面不炸、可继续新增版本', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vinit-submit');
    let dsId = '';
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      const headers = { Authorization: `Bearer ${token}` };

      // 清空账号数据源，避免脏 DB 导致 init/hasDB 不稳定
      const list = await request.get(`${API}/ncnb/dataSources?size=100&current=1`, { headers });
      const listJson = await list.json();
      for (const row of listJson?.data?.records || []) {
        await request.delete(`${API}/ncnb/dataSources/${row.id}`, { headers });
      }

      dsId = crypto.randomUUID();
      const createDs = await request.post(`${API}/ncnb/dataSources`, {
        headers,
        data: {
          id: dsId,
          name: `e2e-initsubmit-${Date.now().toString(36)}`,
          type: 'MYSQL',
          url: 'jdbc:mysql://127.0.0.1:3306/e2e',
          username: 'e2e',
          password: 'e2e',
          driverClassName: 'com.mysql.cj.jdbc.Driver',
        },
      });
      expect(createDs.status()).toBe(200);

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vinit-submit', 'init submit');
      await openVersionPage(page);

      const trigger = page.getByTestId('version-init-btn');
      await expect(trigger).toBeEnabled({ timeout: 20_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /初始化基线/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByRole('textbox', { name: '版本号' }).fill('1.0.0');
      await dialog.getByRole('textbox', { name: '版本描述' }).fill('E2E 初始化基线');
      await dialog.getByRole('button', { name: /确\s*定/ }).click();

      await expectToast(page, /初始化基线成功|保存成功/);
      await expect(dialog).toHaveCount(0, { timeout: 10_000 });

      // 核心断言：versions 必须仍是数组渲染出的真实版本行，而非被字符串污染后白屏/报错
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-list')).toBeVisible();
      await expect(page.getByTestId('version-empty')).toHaveCount(0);

      // 列表未被污染：后续仍可正常新增版本（验证 store.versions 仍是可 filter/map 的数组）
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible({ timeout: 10_000 });
    } finally {
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
