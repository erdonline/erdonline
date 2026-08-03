import { expect, test, type APIRequestContext } from '@playwright/test';
import {
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
    data: { projectName: name, description: 'list keyboard e2e', tags: 'e2e' },
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

async function rowFor(
  page: import('@playwright/test').Page,
  pageTestId: string,
  projectName: string,
) {
  const pageEl = page.getByTestId(pageTestId);
  await expect(pageEl).toBeVisible({ timeout: 15_000 });
  const row = pageEl
    .getByTestId('project-list-row')
    .filter({ has: page.getByRole('link', { name: projectName, exact: true }) });
  await expect(row).toBeVisible({ timeout: 15_000 });
  return row;
}

async function assertRowBrandFocusRing(
  link: import('@playwright/test').Locator,
  row: import('@playwright/test').Locator,
) {
  await expect(link).toBeFocused();
  const state = await link.evaluate((el) => el.matches(':focus-visible'));
  expect(state).toBe(true);
  const shadow = await row.evaluate((el) => getComputedStyle(el).boxShadow);
  // inset 0 0 0 2px brand → rgb(222, 41, 16)
  expect(shadow).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);
  expect(shadow).not.toBe('none');
}

/**
 * 项目列表行键盘：个人/最近/团队 — Enter 打开；Tab 行内动作；focus-visible；无 trap/死卡
 */
test.describe('项目列表行键盘', () => {
  // ADR-0016：列表行 stretched link + 动作 Tab 序；HomeLayout brand focus-visible
  test('个人：Enter 打开；Tab 行/动作；focus-visible；无 trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('plist-kb');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await page.goto('/project/person');
      await createPersonProject(page, projectName, 'kb', 'person list keyboard');

      const row = await rowFor(page, 'project-person-page', projectName);
      const openLink = row.getByTestId('project-list-open-link');
      await expect(openLink).toHaveAttribute('href', /\/design\/table\/model\?projectId=/);

      // 死卡区：描述区 elementFromPoint 命中 stretched open-link
      await page.goto('/project/person');
      const row2 = await rowFor(page, 'project-person-page', projectName);
      const hitsOpenLink = await row2.locator('.project-list-page__time').evaluate((el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!top?.closest('[data-testid="project-list-open-link"]');
      });
      expect(hitsOpenLink).toBe(true);

      const link = row2.getByTestId('project-list-open-link');
      await link.focus();
      await page.keyboard.press('Tab');
      await expect(row2.getByRole('button', { name: '修改项目' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(row2.getByRole('button', { name: '删除项目' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(row2.getByRole('button', { name: '打开模型' })).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(row2.getByRole('button', { name: '删除项目' })).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(row2.getByRole('button', { name: '修改项目' })).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(link).toBeFocused();

      // focus-visible brand 环（行 :has → inset box-shadow；须经 Tab 触发）
      await row2.getByRole('button', { name: '修改项目' }).focus();
      await page.keyboard.press('Shift+Tab');
      await assertRowBrandFocusRing(link, row2);

      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('最近：标题 Enter 打开；Tab→打开模型；focus-visible', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('recent-kb');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await page.goto('/project/person');
      await createPersonProject(page, projectName, 'rkb', 'recent list keyboard');

      await page.goto('/project/recent');
      const row = await rowFor(page, 'project-recent-page', projectName);
      const link = row.getByTestId('project-list-open-link');
      await link.focus();
      await page.keyboard.press('Tab');
      await expect(row.getByRole('button', { name: '打开模型' })).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await assertRowBrandFocusRing(link, row);
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('团队：标题 Enter 打开；Tab 管理/打开；focus-visible', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    const account = e2eAccount();
    const projectName = uniqueProjectName('group-kb-list');
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(request, token, projectName);
    try {
      await login(page, account);
      await page.goto('/project/group');
      const row = await rowFor(page, 'project-group-page', projectName);
      const link = row.getByTestId('project-list-open-link');
      await link.focus();
      await page.keyboard.press('Tab');
      await expect(row.getByRole('button', { name: '管理项目' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(row.getByRole('button', { name: '打开模型' })).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(row.getByRole('button', { name: '管理项目' })).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await assertRowBrandFocusRing(link, row);
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });
});
