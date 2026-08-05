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
    data: { projectName: name, description: 'i18n group aria', tags: 'e2e' },
  });
  const addJson = await add.json();
  expect(addJson.code).toBe(200);
  return addJson.data as string;
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
 * i18n MVP（ADR-0023）：umi locale 插件 + 手动 LocaleSwitcher。
 * 验证：默认 zh-CN；UI 切换 en-US 后 formatMessage 生效并持久化；切回 zh-CN。
 * 不断言中文可见文案为唯一定位锚（e2e-locators.mdc）：先 data-testid，再分离断言文案。
 */

test.describe('i18n：手动语言切换', () => {
  test('LocaleSwitcher 切换 en-US 持久化并切回 zh-CN', async ({ page }) => {
    await page.goto('/login');
    const switcher = page.getByTestId('locale-switcher');
    await expect(switcher).toBeVisible();

    const skipNav = page.getByTestId('auth-skip-nav');
    await expect(skipNav).toHaveAttribute('aria-label', '跳过导航');

    const loginSubmit = page.getByTestId('login-submit');
    await expect(loginSubmit).toHaveText(/登\s*录/);

    await switcher.click();
    await page.getByRole('option', { name: 'English' }).click();
    await expect(skipNav).toHaveAttribute('aria-label', 'Skip navigation');
    await expect(loginSubmit).toHaveText('Sign in');

    const storedEn = await page.evaluate(() => localStorage.getItem('umi_locale'));
    expect(storedEn).toBe('en-US');

    await page.reload();
    await expect(skipNav).toHaveAttribute('aria-label', 'Skip navigation');
    await expect(loginSubmit).toHaveText('Sign in');

    await switcher.click();
    await page.getByRole('option', { name: '中文' }).click();
    await expect(skipNav).toHaveAttribute('aria-label', '跳过导航');
    await expect(loginSubmit).toHaveText(/登\s*录/);

    const storedZh = await page.evaluate(() => localStorage.getItem('umi_locale'));
    expect(storedZh).toBe('zh-CN');
  });

  test('register-submit 随 LocaleSwitcher 切换文案', async ({ page }) => {
    await page.goto('/register');
    const registerSubmit = page.getByTestId('register-submit');
    await expect(registerSubmit).toHaveText(/注\s*册/);

    await page.getByTestId('locale-switcher').click();
    await page.getByRole('option', { name: 'English' }).click();
    await expect(registerSubmit).toHaveText('Register');
  });

  test('设计器 save-status 随 locale 切换文案', async ({ page }) => {
    await login(page, e2eAccount());
    await page.goto('/project/person');
    await expect(page.getByTestId('project-person-page')).toBeVisible({ timeout: 15_000 });
    if ((await page.getByTestId('project-list-open-link').count()) === 0) {
      await page.getByTestId('project-create-trigger').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const projectName = uniqueProjectName('i18n-chrome');
      await dialog.getByPlaceholder('请输入项目名').fill(projectName);
      await dialog.getByPlaceholder('请输入项目描述').fill('i18n chrome locale');
      await dialog.getByRole('button', { name: /确\s*定/ }).click();
      await expect(
        page.getByTestId('project-list-open-link').filter({ hasText: projectName }),
      ).toBeVisible({ timeout: 15_000 });
    }
    await page.getByTestId('project-list-open-link').first().click();
    await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });
    const saveStatus = page.getByTestId('save-status');
    await expect(saveStatus).toHaveText('已落盘', { timeout: 25_000 });

    // DesignLayout 的 LocaleSwitcher 在 ⋯ overflow 内；此处用 umi_locale 持久化机制验证 chrome 文案
    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(saveStatus).toHaveText('Saved to server', { timeout: 25_000 });

    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(saveStatus).toHaveText('已落盘', { timeout: 25_000 });
  });

  test('DesignLayout 工作流与 skip-nav 随 locale 切换', async ({ page }) => {
    await login(page, e2eAccount());
    await page.goto('/project/person');
    await expect(page.getByTestId('project-person-page')).toBeVisible({ timeout: 15_000 });
    if ((await page.getByTestId('project-list-open-link').count()) === 0) {
      await page.getByTestId('project-create-trigger').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const projectName = uniqueProjectName('i18n-layout');
      await dialog.getByPlaceholder('请输入项目名').fill(projectName);
      await dialog.getByPlaceholder('请输入项目描述').fill('i18n design layout locale');
      await dialog.getByRole('button', { name: /确\s*定/ }).click();
      await expect(
        page.getByTestId('project-list-open-link').filter({ hasText: projectName }),
      ).toBeVisible({ timeout: 15_000 });
    }
    await page.getByTestId('project-list-open-link').first().click();
    await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });

    const skipTree = page.getByTestId('erd-skip-tree');
    const skipWorkspace = page.getByTestId('erd-skip-workspace');
    const myOrders = page.getByTestId('design-workflow-my-orders');
    const pendingApproval = page.getByTestId('design-workflow-pending-approval');
    const notifications = page.getByTestId('design-workflow-notifications');
    const projectMenu = page.getByTestId('project-menu-trigger');
    const overflow = page.getByTestId('design-chrome-overflow');
    const userMenu = page.getByTestId('user-menu-trigger');
    const brand = page.getByTestId('erd-chrome-brand');
    const workspace = page.getByTestId('erd-design-workspace');

    await expect(skipTree).toHaveText('跳到模型树');
    await expect(skipWorkspace).toHaveText('跳到主工作区');
    await expect(myOrders).toHaveText('我的工单');
    await expect(pendingApproval).toHaveText('待审批');
    await expect(notifications).toHaveText('通知');
    await expect(projectMenu).toHaveAttribute('aria-label', '项目菜单');
    await expect(overflow).toHaveAttribute('aria-label', '更多');
    await expect(userMenu).toHaveAttribute('aria-label', '用户菜单');
    await expect(brand).toHaveAttribute('aria-label', 'ERD Online 首页');
    await expect(workspace).toHaveAttribute('aria-label', '主工作区');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(skipTree).toHaveText('Skip to model tree');
    await expect(skipWorkspace).toHaveText('Skip to main workspace');
    await expect(myOrders).toHaveText('My orders');
    await expect(pendingApproval).toHaveText('Pending');
    await expect(notifications).toHaveText('Notifications');
    await expect(projectMenu).toHaveAttribute('aria-label', 'Project menu');
    await expect(overflow).toHaveAttribute('aria-label', 'More');
    await expect(userMenu).toHaveAttribute('aria-label', 'User menu');
    await expect(brand).toHaveAttribute('aria-label', 'ERD Online home');
    await expect(workspace).toHaveAttribute('aria-label', 'Main workspace');

    const projectId = new URL(page.url()).searchParams.get('projectId') ?? '';
    await page.goto(`/design/table/version/all?projectId=${projectId}`);
    await expect(page).toHaveURL(/\/design\/table\/version\/all/, { timeout: 15_000 });
    const siderMenu = page.getByTestId('design-layout-sider-menu');
    await expect(siderMenu.getByRole('link', { name: 'Version management' })).toBeVisible();
    await expect(siderMenu).toHaveAttribute('aria-label', 'Designer sidebar navigation');
    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(siderMenu).toHaveAttribute('aria-label', '设计器侧栏导航');
    await expect(siderMenu.getByRole('link', { name: '版本管理' })).toBeVisible();
  });

  test('HomeLayout 与 GroupLayout 顶栏 aria 随 locale 切换', async ({ page, request }) => {
    test.setTimeout(60_000);
    const account = e2eAccount();
    await login(page, account);
    await page.goto('/home');
    await expect(page.getByTestId('home-layout')).toBeVisible({ timeout: 15_000 });

    const homeMenu = page.getByTestId('home-layout-menu');
    const brand = page.getByTestId('erd-chrome-brand');
    const userMenu = page.getByTestId('user-menu-trigger');
    const homeSkipMain = page.getByTestId('home-skip-main');

    await expect(homeMenu).toHaveAttribute('aria-label', '主导航');
    await expect(brand).toHaveAttribute('aria-label', 'ERD Online 首页');
    await expect(userMenu).toHaveAttribute('aria-label', '用户菜单');
    await expect(homeSkipMain).toHaveText('跳到主内容');
    await expect(homeMenu.getByRole('link', { name: '首页' })).toBeVisible();

    await userMenu.click();
    const userDropdown = page.getByTestId('user-menu-dropdown');
    await expect(userDropdown.getByText('个人中心')).toBeVisible();
    await expect(userDropdown.getByText('授权信息')).toBeVisible();
    await expect(userDropdown.getByText('退出登录')).toBeVisible();
    await page.keyboard.press('Escape');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(homeMenu).toHaveAttribute('aria-label', 'Main navigation');
    await expect(brand).toHaveAttribute('aria-label', 'ERD Online home');
    await expect(userMenu).toHaveAttribute('aria-label', 'User menu');
    await expect(homeSkipMain).toHaveText('Skip to main content');
    await expect(homeMenu.getByRole('link', { name: 'Home' })).toBeVisible();

    await userMenu.click();
    await expect(userDropdown.getByText('Account settings')).toBeVisible();
    await expect(userDropdown.getByText('License info')).toBeVisible();
    await expect(userDropdown.getByText('Sign out')).toBeVisible();
    await page.keyboard.press('Escape');

    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('i18n-group-aria'),
    );

    try {
      await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByTestId('group-layout')).toBeVisible({ timeout: 15_000 });

      const siderMenu = page.getByTestId('group-layout-sider-menu');
      const groupSkipMain = page.getByTestId('group-skip-main');
      await expect(siderMenu).toHaveAttribute('aria-label', 'Team settings navigation');
      await expect(brand).toHaveAttribute('aria-label', 'ERD Online home');
      await expect(userMenu).toHaveAttribute('aria-label', 'User menu');
      await expect(groupSkipMain).toHaveText('Skip to main content');

      await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
      await page.reload();
      await expect(siderMenu).toHaveAttribute('aria-label', '团队设置导航');
      await expect(brand).toHaveAttribute('aria-label', 'ERD Online 首页');
      await expect(userMenu).toHaveAttribute('aria-label', '用户菜单');
      await expect(groupSkipMain).toHaveText('跳到主内容');
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });

  test('Landing / 404 skip 与 Home 路由名随 locale 切换', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-page')).toBeVisible({ timeout: 15_000 });
    const landingSkip = page.getByTestId('landing-skip-cta');
    await expect(landingSkip).toHaveText('跳到主操作');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(landingSkip).toHaveText('Skip to main action');

    await page.goto('/404-test-path-i18n');
    const exceptionSkip = page.getByTestId('auth-skip-form');
    await expect(exceptionSkip).toHaveText('Skip to main action');
    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(exceptionSkip).toHaveText('跳到主操作');
  });
});
