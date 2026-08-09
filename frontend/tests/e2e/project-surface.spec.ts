import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  clickAndExpectUrl,
  createPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

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
    data: { projectName: name, description: 'group list dens e2e', tags: 'e2e' },
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
 * W2：项目面闭环（home 快捷、recent、/project/new redirect）
 */

test.describe('项目面闭环', () => {
  test('/project/new 重定向到模板广场', async ({ page }) => {
    await login(page);
    await page.goto('/project/new');
    await expect(page).toHaveURL(/\/catalog/, { timeout: 15_000 });
    await expect(page.getByTestId('catalog-list-page')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Home hero：继续上次建模直达设计器', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('home-continue');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createPersonProject(page, projectName, 'home-continue', 'continue CTA');

      await page.goto('/home');
      const continueBtn = page.getByRole('button', { name: '继续上次建模' });
      await expect(continueBtn).toBeVisible({ timeout: 15_000 });
      await expect(continueBtn).toBeEnabled({ timeout: 15_000 });
      await continueBtn.click();
      await expect(page).toHaveURL(/\/design\/table\/model\?projectId=/, { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('首页快捷链：个人/最近/团队可达', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    await expect(page.getByTestId('home-link-new-project')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: '继续上次建模' })).toBeVisible();

    await clickAndExpectUrl(
      page,
      page.getByTestId('home-link-person'),
      /\/project\/person/,
    );
    await expect(page.getByText('个人项目').first()).toBeVisible();

    await page.goto('/home');
    await clickAndExpectUrl(
      page,
      page.getByTestId('home-link-recent'),
      /\/project\/recent/,
    );

    await page.goto('/home');
    await clickAndExpectUrl(
      page,
      page.getByTestId('home-link-group'),
      /\/project\/group/,
    );
  });

  test('最近项目：列表可见并可打开设计器', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('recent');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createPersonProject(page, projectName, 'recent', 'recent surface');

      await page.goto('/project/recent');
      await expect(page.getByRole('link', { name: projectName }).first()).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('link', { name: projectName }).first().click();
      await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('个人/最近项目列表行密度：与 22–28 chrome 同阶', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('listdens');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createPersonProject(page, projectName, 'ld', 'list density');

      const assertDense = async (pageTestId: string, shotName: string) => {
        const pageEl = page.getByTestId(pageTestId);
        await expect(pageEl).toBeVisible({ timeout: 15_000 });
        const row = pageEl
          .getByRole('listitem')
          .filter({ has: page.getByRole('link', { name: projectName, exact: true }) });
        await expect(row).toBeVisible({ timeout: 15_000 });
        await expect(row.getByRole('button', { name: '打开模型' })).toBeVisible();

        // ADR-0016：列表行 pad/标题/工具条与 22–28 chrome 同阶；禁 Title level4 + List large
        const metrics = await row.evaluate((el) => {
          const cs = getComputedStyle(el);
          const title = el.querySelector('.ant-list-item-meta-title');
          const titleCs = title ? getComputedStyle(title) : null;
          const pageRoot = el.closest('.project-list-page') as HTMLElement | null;
          const pageTitle = pageRoot?.querySelector(
            '.project-list-page__title',
          ) as HTMLElement | null;
          const toolbar = pageRoot?.querySelector(
            '[data-testid="project-list-toolbar"]',
          ) as HTMLElement | null;
          const openBtn = el.querySelector(
            '[data-testid="open-project"]',
          ) as HTMLElement | null;
          const search = toolbar?.querySelector(
            '[aria-label="搜索项目名"]',
          ) as HTMLElement | null;
          const space = toolbar?.querySelector('.ant-space') as HTMLElement | null;
          const spaceItems = space
            ? Array.from(space.querySelectorAll(':scope > .ant-space-item'))
            : [];
          let spaceItemGap = -1;
          if (spaceItems.length >= 2) {
            const a = spaceItems[0].getBoundingClientRect();
            const b = spaceItems[1].getBoundingClientRect();
            spaceItemGap = Math.round(b.left - a.right);
          }
          const tcs = pageTitle ? getComputedStyle(pageTitle) : null;
          const scs = space ? getComputedStyle(space) : null;
          return {
            padBlock: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
            padInline: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
            titleFont: titleCs ? parseFloat(titleCs.fontSize) : -1,
            titleLh: titleCs ? parseFloat(titleCs.lineHeight) : -1,
            pageTitleFont: tcs ? parseFloat(tcs.fontSize) : -1,
            pageTitleLh: tcs ? parseFloat(tcs.lineHeight) : -1,
            toolbarH: toolbar ? toolbar.getBoundingClientRect().height : -1,
            openBtnH: openBtn ? openBtn.getBoundingClientRect().height : -1,
            searchH: search
              ? search.closest('.ant-input-affix-wrapper')?.getBoundingClientRect()
                  .height ?? search.getBoundingClientRect().height
              : -1,
            spaceColGap: scs ? parseFloat(scs.columnGap) : -1,
            spaceItemGap,
          };
        });
        expect(
          metrics.padBlock,
          `列表行 padding-block 合计应 ≤10（目标 4+4），得 ${metrics.padBlock}`,
        ).toBeLessThanOrEqual(10);
        expect(metrics.padBlock).toBeGreaterThanOrEqual(4);
        expect(
          metrics.padInline,
          `列表行 padding-inline 合计应 ≤20（目标 8+8），得 ${metrics.padInline}`,
        ).toBeLessThanOrEqual(20);
        expect(
          metrics.titleFont,
          `项目名字号应 ≤14（目标 13），得 ${metrics.titleFont}`,
        ).toBeLessThanOrEqual(14);
        expect(metrics.titleFont).toBeGreaterThanOrEqual(12);
        expect(
          metrics.titleLh,
          `项目名行高应 ≤24（目标 22），得 ${metrics.titleLh}`,
        ).toBeLessThanOrEqual(24);
        expect(
          metrics.pageTitleFont,
          `页标题字号应 ≤14（目标 13），得 ${metrics.pageTitleFont}`,
        ).toBeLessThanOrEqual(14);
        expect(
          metrics.pageTitleLh,
          `页标题行高应 ≤24（目标 22），得 ${metrics.pageTitleLh}`,
        ).toBeLessThanOrEqual(24);
        expect(
          metrics.toolbarH,
          `工具条高应 ≤32（目标 ~28），得 ${metrics.toolbarH}`,
        ).toBeLessThanOrEqual(32);
        expect(metrics.toolbarH).toBeGreaterThanOrEqual(22);
        expect(
          metrics.openBtnH,
          `打开模型钮高度应 ≤32（目标 28），得 ${metrics.openBtnH}`,
        ).toBeLessThanOrEqual(32);
        expect(
          metrics.searchH,
          `搜索框高应 ≤28（禁 antd 默认 32），得 ${metrics.searchH}`,
        ).toBeLessThanOrEqual(28);
        expect(metrics.searchH).toBeGreaterThanOrEqual(22);
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
          path: `test-results/ux-walkthrough/${shotName}`,
          fullPage: false,
        });
      };

      await page.goto('/project/person');
      await assertDense('project-person-page', 'project-person-list-dense.png');

      await page.goto('/project/recent');
      await assertDense('project-recent-page', 'project-recent-list-dense.png');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('团队项目列表行密度：与 22–28 chrome 同阶', async ({ page, request }) => {
    test.setTimeout(90_000);
    const account = e2eAccount();
    const projectName = uniqueProjectName('groupdens');
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(request, token, projectName);
    try {
      await login(page, account);
      await page.goto('/project/group');
      const pageEl = page.getByTestId('project-group-page');
      await expect(pageEl).toBeVisible({ timeout: 15_000 });
      const row = pageEl
        .getByRole('listitem')
        .filter({ has: page.getByRole('link', { name: projectName, exact: true }) });
      await expect(row).toBeVisible({ timeout: 15_000 });
      await expect(row.getByRole('button', { name: '打开模型' })).toBeVisible();

      const metrics = await row.evaluate((el) => {
        const cs = getComputedStyle(el);
        const title = el.querySelector('.ant-list-item-meta-title');
        const titleCs = title ? getComputedStyle(title) : null;
        const pageRoot = el.closest('.project-list-page') as HTMLElement | null;
        const pageTitle = pageRoot?.querySelector(
          '.project-list-page__title',
        ) as HTMLElement | null;
        const toolbar = pageRoot?.querySelector(
          '[data-testid="project-list-toolbar"]',
        ) as HTMLElement | null;
        const openBtn = el.querySelector(
          '[data-testid="open-project"]',
        ) as HTMLElement | null;
        const search = toolbar?.querySelector(
          '[aria-label="搜索项目名"]',
        ) as HTMLElement | null;
        const space = toolbar?.querySelector('.ant-space') as HTMLElement | null;
        const spaceItems = space
          ? Array.from(space.querySelectorAll(':scope > .ant-space-item'))
          : [];
        let spaceItemGap = -1;
        if (spaceItems.length >= 2) {
          const a = spaceItems[0].getBoundingClientRect();
          const b = spaceItems[1].getBoundingClientRect();
          spaceItemGap = Math.round(b.left - a.right);
        }
        const tcs = pageTitle ? getComputedStyle(pageTitle) : null;
        const scs = space ? getComputedStyle(space) : null;
        return {
          padBlock: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
          padInline: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
          titleFont: titleCs ? parseFloat(titleCs.fontSize) : -1,
          titleLh: titleCs ? parseFloat(titleCs.lineHeight) : -1,
          pageTitleFont: tcs ? parseFloat(tcs.fontSize) : -1,
          pageTitleLh: tcs ? parseFloat(tcs.lineHeight) : -1,
          toolbarH: toolbar ? toolbar.getBoundingClientRect().height : -1,
          openBtnH: openBtn ? openBtn.getBoundingClientRect().height : -1,
          searchH: search
            ? search.closest('.ant-input-affix-wrapper')?.getBoundingClientRect()
                .height ?? search.getBoundingClientRect().height
            : -1,
          spaceColGap: scs ? parseFloat(scs.columnGap) : -1,
          spaceItemGap,
        };
      });
      expect(metrics.padBlock).toBeLessThanOrEqual(10);
      expect(metrics.padBlock).toBeGreaterThanOrEqual(4);
      expect(metrics.padInline).toBeLessThanOrEqual(20);
      expect(metrics.titleFont).toBeLessThanOrEqual(14);
      expect(metrics.titleFont).toBeGreaterThanOrEqual(12);
      expect(metrics.titleLh).toBeLessThanOrEqual(24);
      expect(metrics.pageTitleFont).toBeLessThanOrEqual(14);
      expect(metrics.pageTitleLh).toBeLessThanOrEqual(24);
      expect(metrics.toolbarH).toBeLessThanOrEqual(32);
      expect(metrics.toolbarH).toBeGreaterThanOrEqual(22);
      expect(metrics.openBtnH).toBeLessThanOrEqual(32);
      expect(metrics.searchH).toBeLessThanOrEqual(28);
      expect(metrics.searchH).toBeGreaterThanOrEqual(22);
      expect(metrics.spaceColGap).toBeGreaterThanOrEqual(8);
      expect(metrics.spaceColGap).toBeLessThanOrEqual(12);
      expect(metrics.spaceItemGap).toBeGreaterThanOrEqual(8);
      expect(metrics.spaceItemGap).toBeLessThanOrEqual(12);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/project-group-list-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });

  test('HomeLayout 主导航：数据模型 / 数据源', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    await page.getByRole('link', { name: '数据模型' }).click();
    await expect(page).toHaveURL(/\/dataModels/, { timeout: 15_000 });
    await expect(page.getByText('最近项目').first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole('link', { name: '数据源' }).click();
    await expect(page).toHaveURL(/\/databaseConfig/, { timeout: 15_000 });
  });

  test('个人项目：修改弹窗可改名并回列表', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('rename');
    const renamed = `${projectName}-renamed`;
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createPersonProject(page, projectName, 'rn', 'rename surface');

      const row = page
        .getByRole('listitem')
        .filter({ has: page.getByRole('link', { name: projectName, exact: true }) });
      await expect(row).toBeVisible({ timeout: 15_000 });
      await row.getByTestId('project-rename-trigger').click();

      const dialog = page.getByRole('dialog', { name: '修改项目' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByPlaceholder('请输入项目名')).toHaveValue(projectName);
      await dialog.getByPlaceholder('请输入项目名').fill(renamed);
      await dialog.getByPlaceholder('请输入项目描述').fill('renamed desc');
      await dialog.getByRole('button', { name: /确\s*定/ }).click();

      await expect(page.getByText('修改成功').first()).toBeVisible({ timeout: 10_000 });
      await expect(dialog).toBeHidden({ timeout: 10_000 });
      await expect(
        page.getByRole('link', { name: renamed, exact: true }).first(),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('link', { name: projectName, exact: true })).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
