import { expect, test, type APIRequestContext } from '@playwright/test';
import { e2eAccount, login, uniqueProjectName } from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

async function apiToken(request: APIRequestContext, username: string, password: string) {
  const r = await request.post(`${API}/auth/login`, {
    data: { username, password },
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`login failed: ${username}`);
  return j.access_token as string;
}

async function createGroupProject(
  request: APIRequestContext,
  token: string,
  name: string,
) {
  const add = await request.post(`${API}/ncnb/project/group/add`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { projectName: name, description: 'group layout e2e', tags: 'e2e' },
  });
  const addJson = await add.json();
  expect(addJson.code).toBe(200);
  const projectId = addJson.data as string;
  expect(projectId).toBeTruthy();
  return projectId;
}

async function deleteGroupProject(
  request: APIRequestContext,
  token: string,
  projectId: string,
) {
  await request
    .post(`${API}/ncnb/project/group/delete`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { id: projectId },
    })
    .catch(() => {});
}

/**
 * W6 GroupLayout：权限组可见成员/配置；返回列表 → /dataModels；打开模型 → 设计器。
 */
test.describe('GroupLayout 导航与权限组', () => {
  test('权限组：角色与用户组成员/权限配置可见', async ({ page, request }) => {
    test.setTimeout(60_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('group-perm'),
    );

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/permission?projectId=${projectId}`);
      const pageRoot = page.getByTestId('group-setting-page');
      await expect(pageRoot).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('heading', { name: '用户组' })).toBeVisible({
        timeout: 15_000,
      });
      const roleTabs = page.getByTestId('group-setting-role-tabs');
      await expect(roleTabs).toBeVisible();
      await expect(page.getByRole('tab', { name: '团队所有者' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '团队管理员' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '团队普通成员' })).toBeVisible();

      // ADR-0016：用户组页头/左角色签碎距 — 标题 13/22·mb≤8；左签 padX∈[8,12]·高∈[28,32]
      // antd 把 role=tab 挂在 .ant-tabs-tab-btn；量外壳 .ant-tabs-tab（勿用 .ant-* 做定位，仅测距）
      const pageMetrics = await pageRoot.evaluate((root) => {
        const title = root.querySelector(
          '.group-setting-page__title',
        ) as HTMLElement | null;
        const roleTabsEl = root.querySelector(
          '[data-testid="group-setting-role-tabs"]',
        ) as HTMLElement | null;
        const roleTabBtn = (
          [...root.querySelectorAll('[role="tab"]')] as HTMLElement[]
        ).find((el) => (el.textContent || '').trim() === '团队所有者');
        // antd：role=tab 在 btn；外壳为 parent（勿用 class*=tabs-tab，会误命中 tab-btn）
        const roleTabShell = (roleTabBtn?.parentElement ||
          roleTabBtn) as HTMLElement | null;
        const tcs = title ? getComputedStyle(title) : null;
        const tabCs = roleTabShell ? getComputedStyle(roleTabShell) : null;
        let titleToTabs = -1;
        if (title && roleTabsEl) {
          titleToTabs = Math.round(
            roleTabsEl.getBoundingClientRect().top -
              title.getBoundingClientRect().bottom,
          );
        }
        return {
          titleFont: tcs ? parseFloat(tcs.fontSize) : -1,
          titleLh: tcs ? parseFloat(tcs.lineHeight) : -1,
          titleMb: tcs ? parseFloat(tcs.marginBottom) : -1,
          titleMt: tcs ? parseFloat(tcs.marginTop) : -1,
          titleToTabs,
          tabPadX: tabCs ? parseFloat(tabCs.paddingLeft) : -1,
          tabPadR: tabCs ? parseFloat(tabCs.paddingRight) : -1,
          tabH: roleTabShell
            ? roleTabShell.getBoundingClientRect().height
            : -1,
          tabFont: tabCs ? parseFloat(tabCs.fontSize) : -1,
        };
      });
      expect(
        pageMetrics.titleFont,
        `标题字号应 ≤14（目标 13），得 ${pageMetrics.titleFont}`,
      ).toBeLessThanOrEqual(14);
      expect(pageMetrics.titleFont).toBeGreaterThanOrEqual(12);
      expect(
        pageMetrics.titleLh,
        `标题行高应 ≤24（目标 22），得 ${pageMetrics.titleLh}`,
      ).toBeLessThanOrEqual(24);
      expect(
        pageMetrics.titleMb,
        `标题 marginBottom 应 ≤8（禁 Title level4 松距），得 ${pageMetrics.titleMb}`,
      ).toBeLessThanOrEqual(8);
      expect(
        pageMetrics.titleMt,
        `标题 marginTop 应 ≤4（禁 antd Title 默认 mt），得 ${pageMetrics.titleMt}`,
      ).toBeLessThanOrEqual(4);
      expect(
        pageMetrics.titleToTabs,
        `标题→左签间距应 ≤12（禁 Space large + br），得 ${pageMetrics.titleToTabs}`,
      ).toBeLessThanOrEqual(12);
      expect(pageMetrics.titleToTabs).toBeGreaterThanOrEqual(0);
      expect(
        pageMetrics.tabPadX,
        `左角色签 padX 应 ∈[8,12]（禁 24），得 ${pageMetrics.tabPadX}`,
      ).toBeGreaterThanOrEqual(8);
      expect(pageMetrics.tabPadX).toBeLessThanOrEqual(12);
      expect(pageMetrics.tabPadR).toBeGreaterThanOrEqual(8);
      expect(pageMetrics.tabPadR).toBeLessThanOrEqual(12);
      expect(
        pageMetrics.tabH,
        `左角色签高应 ∈[28,32]（禁 ~38），得 ${pageMetrics.tabH}`,
      ).toBeGreaterThanOrEqual(28);
      expect(pageMetrics.tabH).toBeLessThanOrEqual(32);
      expect(
        pageMetrics.tabFont,
        `左角色签字号应 ≤13（目标 12），得 ${pageMetrics.tabFont}`,
      ).toBeLessThanOrEqual(13);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/group-setting-page-dense.png',
      });

      // access 就绪后嵌套页签出现（竞态修复回归）
      await expect(page.getByRole('tab', { name: '用户组成员' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole('tab', { name: '权限配置' })).toBeVisible();

      await page.getByRole('tab', { name: '团队普通成员' }).click();
      await page.getByRole('tab', { name: '用户组成员' }).click();
      const membersPanel = page.getByRole('tabpanel', { name: '用户组成员' });
      const toolbar = membersPanel.getByTestId('group-user-toolbar');
      await expect(toolbar).toBeVisible({ timeout: 15_000 });
      await expect(membersPanel.getByRole('button', { name: '添加成员' })).toBeVisible();

      // ADR-0016：成员工具条碎距 — Search 28 / 工具条 ≤32 / Space gap 8 / 钮 padX 8
      const metrics = await toolbar.evaluate((el) => {
        const search = el.querySelector(
          '[aria-label="搜索用户名"]',
        ) as HTMLElement | null;
        const affix = search?.closest(
          '.ant-input-affix-wrapper',
        ) as HTMLElement | null;
        const addBtn = el.querySelector(
          '[aria-label="添加成员"]',
        ) as HTMLElement | null;
        const space = el.querySelector('.ant-space') as HTMLElement | null;
        const spaceItems = space
          ? Array.from(space.querySelectorAll(':scope > .ant-space-item'))
          : [];
        let spaceItemGap = -1;
        if (spaceItems.length >= 2) {
          const a = spaceItems[0].getBoundingClientRect();
          const b = spaceItems[1].getBoundingClientRect();
          spaceItemGap = Math.round(b.left - a.right);
        }
        const scs = space ? getComputedStyle(space) : null;
        const bcs = addBtn ? getComputedStyle(addBtn) : null;
        const tcs = getComputedStyle(el);
        return {
          toolbarH: el.getBoundingClientRect().height,
          toolbarMb: parseFloat(tcs.marginBottom),
          searchH: affix
            ? affix.getBoundingClientRect().height
            : search
              ? search.getBoundingClientRect().height
              : -1,
          addBtnH: addBtn ? addBtn.getBoundingClientRect().height : -1,
          addBtnPadX: bcs ? parseFloat(bcs.paddingLeft) : -1,
          spaceColGap: scs ? parseFloat(scs.columnGap) : -1,
          spaceItemGap,
        };
      });
      expect(
        metrics.toolbarH,
        `工具条高应 ≤32（目标 ~28），得 ${metrics.toolbarH}`,
      ).toBeLessThanOrEqual(32);
      expect(metrics.toolbarH).toBeGreaterThanOrEqual(22);
      expect(
        metrics.toolbarMb,
        `工具条 marginBottom 应 ≤8（禁 16），得 ${metrics.toolbarMb}`,
      ).toBeLessThanOrEqual(8);
      if (metrics.searchH >= 0) {
        expect(
          metrics.searchH,
          `搜索框高应 ≤28（禁 antd 默认 32），得 ${metrics.searchH}`,
        ).toBeLessThanOrEqual(28);
        expect(metrics.searchH).toBeGreaterThanOrEqual(22);
      }
      expect(
        metrics.addBtnH,
        `添加成员钮高应 ≤32（目标 28），得 ${metrics.addBtnH}`,
      ).toBeLessThanOrEqual(32);
      expect(metrics.addBtnH).toBeGreaterThanOrEqual(22);
      expect(
        metrics.addBtnPadX,
        `添加成员钮 padX 应 ∈[8,12]，得 ${metrics.addBtnPadX}`,
      ).toBeGreaterThanOrEqual(8);
      expect(metrics.addBtnPadX).toBeLessThanOrEqual(12);
      if (metrics.spaceColGap >= 0) {
        expect(
          metrics.spaceColGap,
          `工具条 Space column-gap 应 ∈[8,12]，得 ${metrics.spaceColGap}`,
        ).toBeGreaterThanOrEqual(8);
        expect(metrics.spaceColGap).toBeLessThanOrEqual(12);
      }
      if (metrics.spaceItemGap >= 0) {
        expect(
          metrics.spaceItemGap,
          `工具条 Space 项距应 ∈[8,12]，得 ${metrics.spaceItemGap}`,
        ).toBeGreaterThanOrEqual(8);
        expect(metrics.spaceItemGap).toBeLessThanOrEqual(12);
      }

      await page.screenshot({
        path: 'test-results/ux-walkthrough/group-user-toolbar-dense.png',
      });

      await page.getByRole('tab', { name: '权限配置' }).click();
      await expect(page.getByText('全选')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('团队基础设置')).toBeVisible();
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });

  test('返回项目列表 → /dataModels；打开模型 → 设计器', async ({ page, request }) => {
    test.setTimeout(60_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('group-nav'),
    );

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByTestId('basic-setting-page')).toBeVisible();
      // ADR-0016：基本设置页头 densify（与 group-basic-setting 同阶）
      const basicHead = await page.getByTestId('basic-setting-page').evaluate((el) => {
        const title = el.querySelector(
          '.basic-setting-page__title',
        ) as HTMLElement | null;
        const tcs = title ? getComputedStyle(title) : null;
        return {
          titleFont: tcs ? parseFloat(tcs.fontSize) : -1,
          titleMb: tcs ? parseFloat(tcs.marginBottom) : -1,
          titleMt: tcs ? parseFloat(tcs.marginTop) : -1,
        };
      });
      expect(basicHead.titleFont).toBeLessThanOrEqual(14);
      expect(basicHead.titleFont).toBeGreaterThanOrEqual(12);
      expect(basicHead.titleMb).toBeLessThanOrEqual(8);
      expect(basicHead.titleMt).toBeLessThanOrEqual(4);

      await page.getByRole('link', { name: '返回项目列表' }).click();
      await expect(page).toHaveURL(/\/dataModels/, { timeout: 15_000 });
      await expect(page).not.toHaveURL(/projectId=/);

      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('link', { name: '打开模型' }).click();
      await expect(page).toHaveURL(
        new RegExp(`/design/table/model\\?projectId=${projectId}`),
        { timeout: 15_000 },
      );
      // 设计器空态或已有模型树均证明已进入
      await expect(
        page
          .getByRole('button', { name: '新增模型' })
          .or(page.getByText('欢迎使用数据建模工具'))
          .or(page.getByTestId('tree-open-relation'))
          .first(),
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });
});
