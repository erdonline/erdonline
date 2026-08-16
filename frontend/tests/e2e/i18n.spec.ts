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
    const notifications = page.getByTestId('chrome-notifications');
    const userMenu = page.getByTestId('user-menu-trigger');
    const homeSkipMain = page.getByTestId('home-skip-main');

    await expect(homeMenu).toHaveAttribute('aria-label', '主导航');
    await expect(brand).toHaveAttribute('aria-label', 'ERD Online 首页');
    await expect(notifications).toHaveText('通知');
    await expect(notifications).toHaveAttribute('aria-label', '通知');
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
    await expect(notifications).toHaveText('Notifications');
    await expect(notifications).toHaveAttribute('aria-label', 'Notifications');
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
    const landingHeroCta = page.getByTestId('landing-main-cta').getByRole('link').first();
    await expect(landingSkip).toHaveText('跳到主操作');
    await expect(landingHeroCta).toHaveText('在线试用');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(landingSkip).toHaveText('Skip to main action');
    await expect(landingHeroCta).toHaveText('Try online');

    await page.goto('/404-test-path-i18n');
    const exceptionSkip = page.getByTestId('auth-skip-form');
    const exceptionGate = page.getByTestId('exception-404-gate');
    await expect(exceptionSkip).toHaveText('Skip to main action');
    await expect(exceptionGate.getByRole('button').first()).toHaveText('Open demo');
    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(exceptionSkip).toHaveText('跳到主操作');
    await expect(exceptionGate.getByRole('button').first()).toHaveText('打开示例 demo');
  });

  test('账号设置侧栏与 OAuth skip 随 locale 切换', async ({ page }) => {
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=base');
    await expect(page.getByTestId('account-settings-page')).toBeVisible({ timeout: 15_000 });
    const settingsMenu = page.getByTestId('account-settings-menu');
    const settingsTitle = page.getByTestId('account-settings-title');
    const baseSubmit = page.getByTestId('account-settings-base-submit');
    await expect(settingsMenu.getByRole('menuitem', { name: '基本设置' })).toBeVisible();
    await expect(settingsTitle).toHaveText('基本设置');
    await expect(baseSubmit).toHaveText('更新基本信息');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(settingsMenu.getByRole('menuitem', { name: 'Basic settings' })).toBeVisible();
    await expect(settingsTitle).toHaveText('Basic settings');
    await expect(baseSubmit).toHaveText('Update profile');

    await page.goto('/oauth/authorize');
    const oauthSkip = page.getByTestId('auth-skip-form');
    const oauthTitle = page.getByTestId('auth-form-header').getByRole('heading', { level: 3 });
    await expect(oauthSkip).toHaveText('Skip to consent actions');
    await expect(oauthTitle).toHaveText('Authorize application');
    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(oauthSkip).toHaveText('跳到授权操作');
    await expect(oauthTitle).toHaveText('授权应用');
  });

  test('Landing SEO title/meta 随 locale 切换', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-page')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveTitle('ERD Online — 在线绘制 ER 图');
    const descZh = await page.locator('meta[name="description"]').getAttribute('content');
    expect(descZh).toContain('免费在线 ER 图');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'ERD Online — 在线绘制 ER 图',
    );

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(page).toHaveTitle('ERD Online — Draw ER Diagrams Online');
    const descEn = await page.locator('meta[name="description"]').getAttribute('content');
    expect(descEn).toContain('ERD diagram maker');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://www.erdonline.com/',
    );

    await page.goto('/compare');
    await expect(page.getByTestId('compare-page')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveTitle('ERD Online comparison — collaboration, versions, and open source');
  });

  test('账号设置 PAT/OAuth Modal 与 ResetPassword 随 locale 切换', async ({ page }) => {
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=security');
    await expect(page.getByTestId('account-settings-page')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(page.getByTestId('account-settings-page')).toBeVisible({ timeout: 15_000 });

    const resetTrigger = page.getByTestId('reset-password-trigger');
    await expect(resetTrigger).toHaveText('修改');
    await resetTrigger.click();
    const resetDialog = page.getByRole('dialog');
    await expect(resetDialog).toBeVisible();
    await expect(resetDialog).toContainText('修改密码');
    await resetDialog.getByRole('button', { name: 'Close' }).click();
    await expect(resetDialog).not.toBeVisible();

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(resetTrigger).toHaveText('Change');
    await resetTrigger.click();
    await expect(resetDialog).toContainText('Change password');
    await resetDialog.getByRole('button', { name: 'Close' }).click();
    await expect(resetDialog).not.toBeVisible();

    await page.goto('/account/settings?selectKey=personalAccessTokens');
    const patCreate = page.getByTestId('pat-create-trigger');
    await expect(patCreate).toHaveText('Create token');
    await patCreate.click();
    const patDialog = page.getByRole('dialog');
    await expect(patDialog).toContainText('Create personal access token');
    await patDialog.getByRole('button', { name: /Cancel/i }).click();
    await expect(patDialog).not.toBeVisible();

    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(patCreate).toHaveText('铸造令牌');
    await patCreate.click();
    await expect(patDialog).toContainText('铸造访问令牌');
    await patDialog.getByRole('button', { name: /取\s*消/ }).click();
    await expect(patDialog).not.toBeVisible();

    await page.goto('/account/settings?selectKey=oauthClients');
    const oauthCreate = page.getByTestId('oauth-create-trigger');
    await expect(oauthCreate).toHaveText('注册客户端');
    await oauthCreate.click();
    const oauthDialog = page.getByRole('dialog');
    await expect(oauthDialog).toContainText('注册 OAuth 客户端');
    await oauthDialog.getByRole('button', { name: /取\s*消/ }).click();
    await expect(oauthDialog).not.toBeVisible();
  });

  test('账号设置授权类型随 locale 切换', async ({ page }) => {
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=identification');
    const panel = page.getByTestId('account-settings-identification');
    await expect(panel).toBeVisible({ timeout: 15_000 });
    const title = panel.locator('h3');
    const sub = panel.locator('p');
    await expect(title).toHaveText('开源版');
    await expect(sub).toContainText('MIT 开源');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(title).toHaveText('Open source');
    await expect(sub).toContainText('MIT open source');
  });

  test('Home 仪表盘与项目列表正文随 locale 切换', async ({ page }) => {
    await login(page, e2eAccount());
    await page.goto('/home');
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 15_000 });

    const continueBtn = page.getByTestId('home-continue-modeling');
    const sectionTitle = page.getByTestId('home-project-section').locator('h2');
    await expect(continueBtn).toHaveText('继续上次建模');
    await expect(sectionTitle).toHaveText('进行中的项目');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 15_000 });
    await expect(continueBtn).toHaveText('Continue last session');
    await expect(sectionTitle).toHaveText('Projects in progress');

    await page.goto('/project/person');
    await expect(page.getByTestId('project-person-page')).toBeVisible({ timeout: 15_000 });
    const personTitle = page.getByTestId('project-list-toolbar').locator('h2');
    await expect(personTitle).toHaveText('Personal projects');

    await page.goto('/project/recent');
    await expect(page.getByTestId('project-recent-page')).toBeVisible({ timeout: 15_000 });
    const recentTitle = page.getByTestId('project-list-toolbar').locator('h2');
    await expect(recentTitle).toHaveText('Recent projects (personal + team)');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(recentTitle).toHaveText('最近项目 「个人 + 团队」');
  });

  test('团队项目列表与设计器表设计签随 locale 切换', async ({ page }) => {
    test.setTimeout(120_000);
    await login(page, e2eAccount());
    await page.goto('/project/group');
    await expect(page.getByTestId('project-group-page')).toBeVisible({ timeout: 15_000 });
    const groupTitle = page.getByTestId('project-list-toolbar').locator('h2');
    await expect(groupTitle).toHaveText('团队项目');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(page.getByTestId('project-group-page')).toBeVisible({ timeout: 15_000 });
    await expect(groupTitle).toHaveText('Team projects');

    await page.goto('/project/person');
    await expect(page.getByTestId('project-person-page')).toBeVisible({ timeout: 15_000 });
    if ((await page.getByTestId('project-list-open-link').count()) === 0) {
      await page.getByTestId('project-create-trigger').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const projectName = uniqueProjectName('i18n-design-table');
      await dialog.getByPlaceholder(/Project name|项目名/).fill(projectName);
      await dialog.getByPlaceholder(/description|项目描述/).fill('i18n design table locale');
      await dialog.getByRole('button', { name: /OK|确\s*定/ }).click();
      await expect(
        page.getByTestId('project-list-open-link').filter({ hasText: projectName }),
      ).toBeVisible({ timeout: 15_000 });
    }
    await page.getByTestId('project-list-open-link').first().click();
    await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });

    const welcomeEmpty = page.getByTestId('designer-welcome-empty-inner').locator('h2');
    await expect(welcomeEmpty).toHaveText(/Welcome to data modeling|No table open/);

    const ensureTableDesign = async () => {
      if (await page.getByTestId('table-design-tabs').isVisible()) {
        return;
      }
      if ((await page.getByTestId('add-module-empty').count()) > 0) {
        await page.getByTestId('add-module-empty').click();
        await page.getByTestId('entity-modal-name').fill('SHOP');
        await page.getByTestId('entity-modal-chnname').fill('商城');
        await page.getByTestId('entity-modal-ok').click();
        await expect(page.getByTestId('save-status')).toHaveText(/Saved to server|已落盘/, {
          timeout: 25_000,
        });
        await page.getByTestId('design-tree-add').click();
        await page.getByTestId('menu-add-entity').click();
        await page.getByTestId('entity-modal-name').fill('T_ORDER');
        await page.getByTestId('entity-modal-ok').click();
        await expect(page.getByTestId('save-status')).toHaveText(/Saved to server|已落盘/, {
          timeout: 25_000,
        });
      }
      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '编辑表' }).click();
      await expect(page.getByTestId('table-design-tabs')).toBeVisible({ timeout: 10_000 });
    };

    await ensureTableDesign();
    const tabs = page.getByTestId('table-design-tabs');
    await expect(tabs.getByRole('tab', { name: 'Fields' })).toBeVisible();

    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });
    await ensureTableDesign();
    await expect(page.getByTestId('table-design-tabs').getByRole('tab', { name: '字段' })).toBeVisible();
  });

  test('版本页正文随 locale 切换', async ({ page }) => {
    test.setTimeout(120_000);
    await login(page, e2eAccount());
    await page.goto('/project/person');
    await expect(page.getByTestId('project-person-page')).toBeVisible({ timeout: 15_000 });
    if ((await page.getByTestId('project-list-open-link').count()) === 0) {
      await page.getByTestId('project-create-trigger').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const projectName = uniqueProjectName('i18n-version-page');
      await dialog.getByPlaceholder(/Project name|项目名/).fill(projectName);
      await dialog.getByPlaceholder(/description|项目描述/).fill('i18n version page locale');
      await dialog.getByRole('button', { name: /OK|确\s*定/ }).click();
      await expect(
        page.getByTestId('project-list-open-link').filter({ hasText: projectName }),
      ).toBeVisible({ timeout: 15_000 });
    }
    await page.getByTestId('project-list-open-link').first().click();
    await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });

    const projectId = new URL(page.url()).searchParams.get('projectId') ?? '';
    await page.goto(`/design/table/version/all?projectId=${projectId}`);
    await expect(page.getByTestId('version-page')).toBeVisible({ timeout: 15_000 });

    const tagFilter = page.getByTestId('version-tag-filter');
    await expect(tagFilter).toHaveAttribute('placeholder', '按标签筛选');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(page.getByTestId('version-page')).toBeVisible({ timeout: 15_000 });
    await expect(tagFilter).toHaveAttribute('placeholder', 'Filter by tag');

    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(page.getByTestId('version-page')).toBeVisible({ timeout: 15_000 });
    await expect(tagFilter).toHaveAttribute('placeholder', '按标签筛选');
  });

  test('Design 版本页 Modal 文案随 locale 切换', async ({ page, request }) => {
    const account = e2eAccount();
    await login(page, account);
    await page.goto('/project/person');
    await expect(page.getByTestId('project-person-page')).toBeVisible({ timeout: 15_000 });
    if ((await page.getByTestId('project-list-open-link').count()) === 0) {
      await page.getByTestId('project-create-trigger').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const projectName = uniqueProjectName('i18n-version-modal');
      await dialog.getByPlaceholder(/Project name|项目名/).fill(projectName);
      await dialog.getByPlaceholder(/description|项目描述/).fill('i18n version modal locale');
      await dialog.getByRole('button', { name: /OK|确\s*定/ }).click();
      await expect(
        page.getByTestId('project-list-open-link').filter({ hasText: projectName }),
      ).toBeVisible({ timeout: 15_000 });
    }
    await page.getByTestId('project-list-open-link').first().click();
    await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });

    const projectId = new URL(page.url()).searchParams.get('projectId') ?? '';
    await page.goto(`/design/table/version/all?projectId=${projectId}`);
    await expect(page.getByTestId('version-page')).toBeVisible({ timeout: 15_000 });

    const addVersion = page.getByTestId('add-version-btn');
    const compareVersion = page.getByTestId('version-compare-btn');
    const rebuildVersion = page.getByTestId('version-rebuild-btn');
    await expect(addVersion).toHaveText('新增版本');
    await expect(compareVersion).toHaveText('版本比对');
    await expect(rebuildVersion).toHaveText('重建版本');

    const renameBtn = page.getByTestId('version-rename-btn').first();
    if ((await renameBtn.count()) > 0) {
      await expect(renameBtn).toHaveText('编辑');
      await expect(renameBtn).toHaveAttribute('aria-label', '编辑版本');
    }

    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(page.getByTestId('version-page')).toBeVisible({ timeout: 15_000 });
    await expect(addVersion).toHaveText('Add version');
    await expect(compareVersion).toHaveText('Compare versions');
    await expect(rebuildVersion).toHaveText('Rebuild versions');
    if ((await renameBtn.count()) > 0) {
      await expect(renameBtn).toHaveText('Edit');
      await expect(renameBtn).toHaveAttribute('aria-label', 'Edit version');
    }

    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(page.getByTestId('version-page')).toBeVisible({ timeout: 15_000 });
    await expect(addVersion).toHaveText('新增版本');
    await expect(rebuildVersion).toHaveText('重建版本');
  });

  test('Group 设置子页正文随 locale 切换', async ({ page, request }) => {
    const account = e2eAccount();
    await login(page, account);
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('i18n-group-setting'),
    );

    try {
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByTestId('basic-setting-page')).toBeVisible({ timeout: 15_000 });

      const basicTitle = page.getByTestId('basic-setting-title');
      const basicSubmit = page.getByTestId('basic-setting-submit');
      const deleteHint = page.getByTestId('basic-setting-delete-hint');
      await expect(basicTitle).toHaveText('基本设置');
      await expect(basicSubmit).toHaveText('提 交');
      await expect(deleteHint).toHaveText('删除项目全部模型，此操作无法恢复');

      await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
      await page.reload();
      await expect(page.getByTestId('basic-setting-page')).toBeVisible({ timeout: 15_000 });
      await expect(basicTitle).toHaveText('Basic settings');
      await expect(basicSubmit).toHaveText('Submit');
      await expect(deleteHint).toHaveText(
        'Deletes all models in this project. This cannot be undone.',
      );

      await page.goto(`/project/group/setting/permission?projectId=${projectId}`);
      await expect(page.getByTestId('group-setting-page')).toBeVisible({ timeout: 15_000 });
      const permissionTitle = page.getByTestId('group-setting-title');
      await expect(permissionTitle).toHaveText('User groups');

      await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
      await page.reload();
      await expect(page.getByTestId('group-setting-page')).toBeVisible({ timeout: 15_000 });
      await expect(permissionTitle).toHaveText('用户组');
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });
});
