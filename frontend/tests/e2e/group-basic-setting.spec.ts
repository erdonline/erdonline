import { expect, test, type APIRequestContext } from '@playwright/test';
import { e2eAccount, expectToast, login, uniqueProjectName } from './helpers';

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
    data: { projectName: name, description: 'group basic e2e', tags: 'e2e' },
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
 * W6 `/project/group/setting/basic`：保存基本设置成功/失败均有 toast；页头+表单 densify。
 */
test.describe('团队项目基本设置', () => {
  test('保存基本设置成功有 toast', async ({ page, request }) => {
    test.setTimeout(60_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('group-basic'),
    );

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByLabel('项目名')).toBeVisible();

      // ADR-0016：页头 13/22·mt0·mb8；表单项 mb12 / 控件 28（对齐 .setting-common-form）
      const pageRoot = page.getByTestId('basic-setting-page');
      await expect(pageRoot).toBeVisible();
      const metrics = await pageRoot.evaluate((el) => {
        const title = el.querySelector(
          '.basic-setting-page__title',
        ) as HTMLElement | null;
        const form = el.querySelector(
          'form.basic-setting-form',
        ) as HTMLElement | null;
        const item = form?.querySelector(
          '.ant-form-item',
        ) as HTMLElement | null;
        const input = form?.querySelector(
          '.ant-input:not([disabled]):not(textarea)',
        ) as HTMLElement | null;
        const select = form?.querySelector(
          '.ant-select-selector',
        ) as HTMLElement | null;
        const btn = form?.querySelector(
          '.ant-btn-primary',
        ) as HTMLElement | null;
        const label = form?.querySelector(
          '.ant-form-item-label > label',
        ) as HTMLElement | null;
        const tcs = title ? getComputedStyle(title) : null;
        const mcs = item ? getComputedStyle(item) : null;
        const ics = input ? getComputedStyle(input) : null;
        const scs = select ? getComputedStyle(select) : null;
        const bcs = btn ? getComputedStyle(btn) : null;
        const lcs = label ? getComputedStyle(label) : null;
        let titleToForm = -1;
        if (title && form) {
          titleToForm = Math.round(
            form.getBoundingClientRect().top - title.getBoundingClientRect().bottom,
          );
        }
        return {
          titleFont: tcs ? parseFloat(tcs.fontSize) : -1,
          titleLh: tcs ? parseFloat(tcs.lineHeight) : -1,
          titleMb: tcs ? parseFloat(tcs.marginBottom) : -1,
          titleMt: tcs ? parseFloat(tcs.marginTop) : -1,
          titleToForm,
          itemMb: mcs ? parseFloat(mcs.marginBottom) : -1,
          inputH: ics ? parseFloat(ics.height) : -1,
          selectMinH: scs ? parseFloat(scs.minHeight || scs.height) : -1,
          btnH: bcs ? parseFloat(bcs.height) : -1,
          labelFont: lcs ? parseFloat(lcs.fontSize) : -1,
        };
      });
      expect(
        metrics.titleFont,
        `标题字号应 ≤14（目标 13），得 ${metrics.titleFont}`,
      ).toBeLessThanOrEqual(14);
      expect(metrics.titleFont).toBeGreaterThanOrEqual(12);
      expect(
        metrics.titleLh,
        `标题行高应 ≤24（目标 22），得 ${metrics.titleLh}`,
      ).toBeLessThanOrEqual(24);
      expect(
        metrics.titleMb,
        `标题 marginBottom 应 ≤8（禁 Title level4 松距），得 ${metrics.titleMb}`,
      ).toBeLessThanOrEqual(8);
      expect(
        metrics.titleMt,
        `标题 marginTop 应 ≤4（禁 antd Title 默认 mt），得 ${metrics.titleMt}`,
      ).toBeLessThanOrEqual(4);
      expect(
        metrics.titleToForm,
        `标题→表单间距应 ≤12，得 ${metrics.titleToForm}`,
      ).toBeLessThanOrEqual(12);
      expect(metrics.titleToForm).toBeGreaterThanOrEqual(0);
      expect(
        metrics.itemMb,
        `表单项 margin-bottom 应 ≤16（目标 12，禁 antd 默认 24），得 ${metrics.itemMb}`,
      ).toBeLessThanOrEqual(16);
      expect(metrics.itemMb).toBeGreaterThanOrEqual(8);
      expect(
        metrics.inputH,
        `输入框高度应 ≤32（目标 28），得 ${metrics.inputH}`,
      ).toBeLessThanOrEqual(32);
      expect(metrics.inputH).toBeGreaterThanOrEqual(24);
      expect(
        metrics.selectMinH,
        `标签 Select 高应 ≤32（目标 28），得 ${metrics.selectMinH}`,
      ).toBeLessThanOrEqual(32);
      expect(metrics.selectMinH).toBeGreaterThanOrEqual(24);
      expect(
        metrics.btnH,
        `提交钮高度应 ≤32（目标 28），得 ${metrics.btnH}`,
      ).toBeLessThanOrEqual(32);
      expect(metrics.btnH).toBeGreaterThanOrEqual(24);
      expect(
        metrics.labelFont,
        `表单项 label 字号应 ≤13（目标 12），得 ${metrics.labelFont}`,
      ).toBeLessThanOrEqual(13);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/group-basic-setting-dense.png',
      });

      const nextName = uniqueProjectName('group-basic-upd');
      await page.getByLabel('项目名').fill(nextName);
      await page.getByRole('button', { name: /提\s*交/ }).click();
      await expectToast(page, '修改成功');
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });

  test('保存基本设置失败有 toast', async ({ page, request }) => {
    test.setTimeout(60_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(
      request,
      token,
      uniqueProjectName('group-basic-fail'),
    );

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByLabel('项目名')).toBeVisible({ timeout: 15_000 });

      await page.route('**/ncnb/project/group/update', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '修改失败' }),
        });
      });

      await page.getByRole('button', { name: /提\s*交/ }).click();
      await expectToast(page, '修改失败');
      await page.unroute('**/ncnb/project/group/update');
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });
});
