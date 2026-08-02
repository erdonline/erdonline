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
 * 只读分享（ADR-0007 / W2）：创建→复制→匿名可读；吊销→链接失效
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

      const dialog = page.getByRole('dialog', { name: '只读分享' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel('分享链接')).toHaveValue(new RegExp(`/s/${token}$`));
      await dialog.getByRole('button', { name: '复制链接' }).click();
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
        expect(decodeURIComponent(anonPage.url())).toContain('autofork=1');
        await expect(anonPage.getByRole('link', { name: '去注册' })).toBeVisible();
      } finally {
        await anon.close();
      }

      // 已登录 + autofork → 自动 fork 进设计器
      const forkRespPromise = page.waitForResponse(
        (r) => r.url().includes(`/share/${token}/fork`) && r.request().method() === 'POST',
      );
      await page.goto(`/s/${token}?autofork=1`);
      const forkResp = await forkRespPromise;
      expect(forkResp.ok()).toBeTruthy();
      const forked = await forkResp.json();
      expect(forked.code).toBe(200);
      expect(forked.data?.projectId).toBeTruthy();
      await expect(page).toHaveURL(new RegExp(`projectId=${forked.data.projectId}`), { timeout: 15_000 });
    } finally {
      // 失败路径也清：含 fork 副本；连跑两轮防残留
      await deleteOwnPersonProjects(page).catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
      await page.goto('/project/person');
      const escaped = projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await expect(page.getByRole('link', { name: new RegExp(escaped) })).toHaveCount(0);
    }
  });

  test('创建→吊销后匿名链接失效', async ({ page, browser }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('sharerevoke');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'share', 'revoke e2e');

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

      const dialog = page.getByRole('dialog', { name: '只读分享' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel('分享链接')).toHaveValue(new RegExp(`/s/${token}$`));
      await expect(dialog.getByRole('button', { name: '吊销分享' })).toBeEnabled();

      const revokeRespPromise = page.waitForResponse(
        (r) => r.url().includes('/share/revoke') && r.request().method() === 'POST',
      );
      await dialog.getByRole('button', { name: '吊销分享' }).click();
      const confirm = page.getByRole('dialog', { name: '确认吊销分享？' });
      await expect(confirm).toBeVisible();
      // antd 两字按钮 accessible name 常带空格（「吊 销」）
      await confirm.getByRole('button', { name: /吊\s*销/ }).click();
      const revokeResp = await revokeRespPromise;
      expect(revokeResp.ok()).toBeTruthy();
      const revoked = await revokeResp.json();
      expect(revoked.code).toBe(200);
      await expectToast(page, /分享已吊销/);

      const anon = await browser.newContext();
      const anonPage = await anon.newPage();
      try {
        await anonPage.goto(`/s/${token}`);
        await expect(anonPage.getByText(/分享不存在或已失效|分享已过期|分享链接无效/)).toBeVisible({
          timeout: 15_000,
        });
        await expect(anonPage.getByTestId('share-relation-canvas')).toHaveCount(0);
      } finally {
        await anon.close();
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
