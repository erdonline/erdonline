import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 只读分享（ADR-0007）：设计器创建链接 → 匿名上下文打开 /s/:token 见关系图
 */
test.describe('只读分享', () => {
  test('设计器分享后匿名打开可见只读关系图', async ({ page, browser }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('share');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'share', 'share e2e');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const createRespPromise = page.waitForResponse(
        (r) => r.url().includes('/share/create') && r.request().method() === 'POST',
      );
      await page.getByRole('button', { name: '只读分享' }).click();
      const createResp = await createRespPromise;
      expect(createResp.ok()).toBeTruthy();
      const created = await createResp.json();
      expect(created.code).toBe(200);
      const token = created.data?.token as string;
      expect(token).toBeTruthy();
      await expectToast(page, /只读链接已复制|分享链接：/);

      const anon = await browser.newContext();
      const anonPage = await anon.newPage();
      try {
        await anonPage.goto(`/s/${token}`);
        await expect(anonPage.getByText(projectName).first()).toBeVisible({ timeout: 15_000 });
        await expect(anonPage.getByTestId('share-relation-canvas')).toBeVisible();
        await expect(anonPage.getByText('T_TABLE_1').first()).toBeVisible();
        await expect(anonPage.getByRole('button', { name: '复制到我的项目' })).toBeVisible();
        // 未登录点复制 → 登录页带 redirect
        await expect(anonPage.getByRole('button', { name: '注册并带回' })).toBeVisible();
        await anonPage.getByRole('button', { name: '注册并带回' }).click();
        await expect(anonPage).toHaveURL(/\/register\?redirect=/);
        await anonPage.goto(`/s/${token}`);
        await anonPage.getByRole('button', { name: '复制到我的项目' }).click();
        await expect(anonPage).toHaveURL(/\/login\?redirect=/);
        await expect(anonPage.getByRole('link', { name: '去注册' })).toBeVisible();
      } finally {
        await anon.close();
      }

      // 已登录 fork → 进入设计器
      const forkRespPromise = page.waitForResponse(
        (r) => r.url().includes(`/share/${token}/fork`) && r.request().method() === 'POST',
      );
      await page.goto(`/s/${token}`);
      await page.getByRole('button', { name: '复制到我的项目' }).click();
      const forkResp = await forkRespPromise;
      expect(forkResp.ok()).toBeTruthy();
      const forked = await forkResp.json();
      expect(forked.code).toBe(200);
      expect(forked.data?.projectId).toBeTruthy();
      await expect(page).toHaveURL(new RegExp(`projectId=${forked.data.projectId}`), { timeout: 15_000 });
    } finally {
      await page.goto('/project/person');
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
