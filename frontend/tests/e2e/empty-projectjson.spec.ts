import { expect, test, type APIRequestContext } from '@playwright/test';
import { E2E_PASS, E2E_SERIAL, expectToast, login } from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

async function apiToken(request: APIRequestContext, username: string, password: string) {
  const r = await request.post(`${API}/auth/login`, {
    data: { username, password },
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`login failed: ${username}`);
  return j.access_token as string;
}

/**
 * 回归：API 创建团队项目未带 projectJSON 时，打开设计器仍可「新增模型」
 * （ensureProjectJSON + addModule 防空）
 */
test.describe('空 projectJSON 打开', () => {
  test('无 JSON 团队项目可新增模型', async ({ page, request }) => {
    test.setTimeout(90_000);
    const token = await apiToken(request, E2E_SERIAL.name, E2E_SERIAL.pass);
    const name = `e2e-serial-emptyjson-${Date.now().toString(36)}`;
    const add = await request.post(`${API}/ncnb/project/group/add`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { projectName: name, description: 'empty json', tags: 'e2e' },
    });
    const addJson = await add.json();
    const projectId = addJson.data as string;
    expect(addJson.code).toBe(200);
    expect(projectId).toBeTruthy();

    try {
      await login(page, { name: E2E_SERIAL.name, pass: E2E_PASS });
      await page.goto(`/design/table/model?projectId=${projectId}`);
      await expect(page.getByTestId('add-module-empty')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('add-module-empty').click();
      await page.getByTestId('entity-modal-name').fill('EMPTY_M');
      await page.getByTestId('entity-modal-chnname').fill('空JSON模块');
      await page.getByTestId('entity-modal-ok').click();
      await expectToast(page, '模型添加成功');
      await expect(page.getByText('空JSON模块', { exact: true })).toBeVisible();
    } finally {
      await request
        .post(`${API}/ncnb/project/group/delete`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { id: projectId },
        })
        .catch(() => {});
    }
  });
});
