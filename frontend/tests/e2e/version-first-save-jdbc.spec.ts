import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  openVersionPage,
  saveVersion,
  uniqueProjectName,
} from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 首次「保存版本」JDBC 闭环（Git 心智：首次 commit 即建仓，无「初始化基线」按钮）
 *
 * 覆盖两件事：
 * 1. 原「初始化基线」按钮已下线；有 JDBC 数据源且尚无版本时，普通「保存版本」
 *    同样能成功首存（不再需要单独的初始化弹层）。
 * 2. 回归历史 bug：保存成功回调曾把后端字面量提示（如「保存成功」字符串）误塞进
 *    `versions` 状态，导致后续 `.filter()`/`.map()` 炸页。这里验证首存后列表仍是
 *    真实版本行、可继续新增第二个版本。
 */
test.describe('首次保存版本（JDBC 数据源）', () => {
  test('有 JDBC 数据源、无历史版本时，「保存版本」直接首存成功，列表不被污染', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vfirst-save');
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
          name: `e2e-firstsave-${Date.now().toString(36)}`,
          type: 'MYSQL',
          url: 'jdbc:mysql://127.0.0.1:3306/e2e',
          username: 'e2e',
          password: 'e2e',
          driverClassName: 'com.mysql.cj.jdbc.Driver',
        },
      });
      expect(createDs.status()).toBe(200);

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vfirst', 'first save jdbc');
      await openVersionPage(page);

      // 已下线：「初始化基线」不再是 IA 的一部分
      await expect(page.getByTestId('version-init-btn')).toHaveCount(0);

      // 普通「保存版本」即可首存（无需单独初始化弹层）
      await saveVersion(page);

      // 核心断言：versions 仍是数组渲染出的真实版本行，而非被字符串污染后白屏/报错
      await expect(page.getByTestId('version-list')).toBeVisible();
      await expect(page.getByTestId('version-empty')).toHaveCount(0);
      const firstRow = page.locator('[data-testid^="version-row-"]').first();
      await expect(firstRow).toBeVisible({ timeout: 10_000 });
      // 首版应有「变更摘要」（相对空模型的全量新增，不应因 baseVersion 被清空）
      await expect(firstRow.getByTestId('version-change-summary')).toBeVisible();

      // 列表未被污染：可继续新增第二个版本
      await saveVersion(page);
      await expect(page.locator('[data-testid^="version-row-"]')).toHaveCount(2, {
        timeout: 10_000,
      });
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
