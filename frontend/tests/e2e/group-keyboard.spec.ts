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
    data: { projectName: name, description: 'group keyboard e2e', tags: 'e2e' },
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
 * GroupLayout 壳键盘：Skip 进主区；表单 Tab 序；focus-visible；无 trap
 */
test.describe('GroupLayout 壳键盘', () => {
  // ADR-0016：GroupLayout Skip 绕开顶栏+侧栏；主区表单 Tab 序；brand focus-visible
  test('Group 键盘：Skip→主内容；表单 Tab 序；focus-visible；无 trap', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('group-kb'),
    );

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByTestId('group-layout')).toBeVisible();
      await expect(page.getByTestId('group-skip-main')).toHaveText('跳到主内容');
      await expect(page.getByTestId('group-main-content')).toHaveAttribute('tabindex', '-1');
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByLabel('项目名')).toBeEnabled({ timeout: 15_000 });

      await page.mouse.click(2, 2);
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('group-skip-main')).toBeFocused({ timeout: 5_000 });
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('group-main-content')).toBeFocused();

      // Skip 绕开顶栏与侧栏；下一 Tab 进主区首字段
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('项目名')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('combobox', { name: '标签' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('项目描述')).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      await expect(page.getByRole('combobox', { name: '标签' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('项目描述')).toBeFocused();

      // focus-visible brand 环（须经 Tab 触发 :focus-visible）
      await page.getByRole('link', { name: '返回项目列表' }).focus();
      await page.keyboard.press('Tab');
      const basicLink = page.getByRole('link', { name: '基本设置' });
      await expect(basicLink).toBeFocused();
      const ring = await basicLink.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          outlineColor: cs.outlineColor,
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
        };
      });
      expect(ring.outlineStyle).not.toBe('none');
      expect(parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(1);
      expect(ring.outlineColor).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);

      // 不按 Skip：DOM 序首焦后为品牌链（Skip 非唯一入口）
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });
      await page.mouse.click(2, 2);
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('group-skip-main')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'ERD Online 首页' })).toBeFocused();
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });
});
