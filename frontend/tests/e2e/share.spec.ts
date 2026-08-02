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
 * 只读分享（ADR-0007 / W2 / W5 / ADR-0016）：创建→复制→匿名可读；
 * 吊销/无效 → AuthBrandShell 失效门；空模块 → ER 剪影空态
 */
test.describe('只读分享', () => {
  test('无效 token 见品牌壳失效态并可打开示例 demo', async ({ page }) => {
    await page.goto(`/s/not-a-real-share-token-${Date.now().toString(36)}`);
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('auth-brand-panel')).toBeVisible();
    await expect(page.getByTestId('share-invalid-gate')).toBeVisible();
    await expect(page.getByRole('heading', { name: '分享不可用' })).toBeVisible();
    await expect(page.getByText(/分享不存在或已失效|分享已过期|分享链接无效|加载失败/)).toBeVisible();
    await expect(page.getByTestId('share-relation-canvas')).toHaveCount(0);
    await expect(page.getByRole('link', { name: '打开演示' }).first()).toBeVisible();

    const brandMetrics = await page.getByTestId('auth-brand-panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      const root = getComputedStyle(document.documentElement);
      return {
        widthRatio: el.getBoundingClientRect().width / window.innerWidth,
        ink900: root.getPropertyValue('--erd-ink-900').trim(),
        bgImage: cs.backgroundImage,
      };
    });
    expect(brandMetrics.widthRatio).toBeGreaterThan(0.32);
    expect(brandMetrics.widthRatio).toBeLessThan(0.48);
    expect(brandMetrics.ink900).toBe('#0b1c2c');
    expect(brandMetrics.bgImage).toMatch(/linear-gradient/i);

    await page.screenshot({
      path: 'test-results/ux-walkthrough/share-invalid-brand-shell.png',
      fullPage: false,
    });

    await page.getByRole('button', { name: '打开示例 demo' }).click();
    await expect(page).toHaveURL(/\/(demo|s\/public-demo)/, { timeout: 15_000 });
  });

  test('空模块分享见 ER 剪影空态', async ({ page, browser }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('shareempty');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'share', 'empty share e2e');
      // 不建表：分享空模块

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

      const anon = await browser.newContext();
      const anonPage = await anon.newPage();
      try {
        await anonPage.goto(`/s/${token}`);
        await expect(anonPage.getByText(projectName).first()).toBeVisible({ timeout: 15_000 });
        await expect(anonPage.getByTestId('share-chrome-header')).toBeVisible();
        await expect(anonPage.getByTestId('share-empty-module')).toBeVisible();
        await expect(anonPage.getByTestId('erd-empty-diagram')).toBeVisible();
        await expect(anonPage.getByText(/该分享暂无模型|该模块暂无表/)).toBeVisible();
        await expect(anonPage.getByTestId('share-relation-canvas')).toHaveCount(0);
        await expect(anonPage.getByRole('button', { name: '打开示例 demo' })).toBeVisible();
        await anonPage.screenshot({
          path: 'test-results/ux-walkthrough/share-empty-module.png',
          fullPage: false,
        });
      } finally {
        await anon.close();
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

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
        // W5：分享顶栏对齐设计器壳（64px chrome + logo + Fork CTA + 登录/注册）
        const chrome = anonPage.getByTestId('share-chrome-header');
        await expect(chrome).toBeVisible();
        await expect(chrome.getByRole('link', { name: 'ERD Online 首页' })).toBeVisible();
        await expect(chrome.getByRole('button', { name: '复制到我的项目' })).toBeVisible();
        await expect(chrome.getByRole('link', { name: '登录' })).toBeVisible();
        await expect(chrome.getByRole('link', { name: '注册' })).toBeVisible();
        const headerH = await chrome.evaluate((el) => getComputedStyle(el).height);
        expect(headerH).toBe('64px');
        await expect(anonPage.getByTestId('share-relation-canvas')).toBeVisible();
        await expect(anonPage.getByText('T_TABLE_1').first()).toBeVisible();
        // ADR-0016：表清单默认折叠；展开后可见只读清单
        const tablesToggle = anonPage.getByRole('button', { name: /展开表清单/ });
        await expect(tablesToggle).toBeVisible();
        await expect(tablesToggle).toHaveAttribute('aria-expanded', 'false');
        await expect(anonPage.getByTestId('share-tables-panel')).toHaveCount(0);
        await tablesToggle.click();
        await expect(anonPage.getByTestId('share-tables-panel')).toBeVisible();
        await expect(
          anonPage.getByTestId('share-tables-panel').getByRole('cell', { name: 'T_TABLE_1' }),
        ).toBeVisible();
        const rowH = await anonPage
          .getByTestId('share-tables-panel')
          .locator('.ant-table-tbody tr')
          .first()
          .evaluate((el) => el.getBoundingClientRect().height);
        expect(rowH, `表清单行高应 ∈[22,28]，得 ${rowH}`).toBeGreaterThanOrEqual(22);
        expect(rowH, `表清单行高应 ∈[22,28]，得 ${rowH}`).toBeLessThanOrEqual(28);
        await anonPage.screenshot({
          path: 'test-results/ux-walkthrough/share-chrome-brand.png',
          fullPage: false,
        });
        await anonPage.getByRole('link', { name: '注册' }).click();
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
        await expect(anonPage.getByTestId('auth-brand-shell')).toBeVisible({ timeout: 15_000 });
        await expect(anonPage.getByTestId('share-invalid-gate')).toBeVisible();
        await expect(anonPage.getByRole('heading', { name: '分享不可用' })).toBeVisible();
        await expect(anonPage.getByText(/分享不存在或已失效|分享已过期|分享链接无效/)).toBeVisible();
        await expect(anonPage.getByTestId('share-relation-canvas')).toHaveCount(0);
        await expect(anonPage.getByRole('button', { name: '打开示例 demo' })).toBeVisible();
        await expect(anonPage.getByRole('button', { name: '返回首页' })).toBeVisible();
      } finally {
        await anon.close();
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
