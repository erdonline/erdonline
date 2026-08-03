import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  E2E_SERIAL,
  e2eAccount,
  expectToast,
  gotoVersionSub,
  login,
  openVersionPage,
  saveVersion,
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
): Promise<string> {
  const add = await request.post(`${API}/ncnb/project/group/add`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { projectName: name, description: 'approval data path', tags: 'e2e' },
  });
  const addJson = await add.json();
  const projectId = addJson.data as string;
  if (addJson.code !== 200 || !projectId) {
    throw new Error(`group add failed: ${JSON.stringify(addJson)}`);
  }
  return projectId;
}

async function seedApproval(
  request: APIRequestContext,
  token: string,
  projectId: string,
  approverId: string,
  remark: string,
  dbInfo: Record<string, string> = { url: 'jdbc:mysql://127.0.0.1:3306/erd' },
): Promise<string> {
  const create = await request.post(`${API}/ncnb/approval`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      projectId,
      approver: approverId,
      approveRemark: remark,
      approveSql: 'SELECT 1',
      dbInfo: JSON.stringify(dbInfo),
    },
  });
  const createJson = await create.json();
  if (createJson.code !== 200) {
    throw new Error(`approval create failed: ${JSON.stringify(createJson)}`);
  }
  const list = await request.get(`${API}/ncnb/approval/approve?current=1&size=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listJson = await list.json();
  const row = ((listJson.data?.records as { id: string; approveRemark?: string }[]) || []).find(
    (r) => r.approveRemark === remark,
  );
  if (!row?.id) throw new Error(`seeded approval not listed: ${JSON.stringify(listJson)}`);
  return row.id;
}

async function deleteApproval(request: APIRequestContext, token: string, id: string) {
  await request.delete(`${API}/ncnb/approval/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function deleteGroup(request: APIRequestContext, token: string, projectId: string) {
  await request.post(`${API}/ncnb/project/group/delete`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { id: projectId },
  });
}

test.describe('版本工单/审批', () => {
  test('侧栏打开我的工单与我的审批，表头正确且有空态引导', async ({ page }) => {
    test.setTimeout(90_000);
    // 空态断言用独立账号，避免并行种子工单污染 worker 账号
    const account = E2E_SERIAL;
    const projectName = `e2e-serial-approval-${Date.now().toString(36)}`;
    try {
      await login(page, account);
      await deleteOwnPersonProjects(page, /^e2e-serial-/);
      await createAndOpenPersonProject(page, projectName, 'approval', 'approval pages');

      await gotoVersionSub(page, 'order');
      await expect(page.getByTestId('page-title-orders')).toHaveText('我的工单');
      await expect(page.getByText(/暂无工单/)).toBeVisible();

      await gotoVersionSub(page, 'approval');
      await expect(page.getByTestId('page-title-approvals')).toHaveText('我的审批');
      await expect(page.getByText(/暂无待审/)).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page, /^e2e-serial-/).catch(() => {});
    }
  });

  /**
   * W3 收口：信任链入口可发现 —— 版本页工具栏直达工单/审批；
   * 团队项目未同步版本行可见「提交工单」→ 详情弹层「SQL审批」。
   */
  test('版本页：提交工单入口可达且审批 tab 可见', async ({ page, request }) => {
    test.setTimeout(120_000);
    const account = e2eAccount();
    const projectName = uniqueProjectName('appr-entry');
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(request, token, projectName);

    try {
      await login(page, account);
      await page.goto(`/design/table/model?projectId=${projectId}`);
      await expect(page).toHaveURL(/projectId=/, { timeout: 15_000 });

      await openVersionPage(page);
      await expect(page.getByTestId('version-nav-orders')).toBeVisible();
      await expect(page.getByTestId('version-nav-approvals')).toBeVisible();
      await expect(
        page.getByRole('menuitem', { name: '我的审批' }),
      ).toBeVisible();

      await saveVersion(page);
      const submitBtn = page.getByTestId('version-submit-order-btn');
      await expect(submitBtn).toBeVisible({ timeout: 15_000 });
      await submitBtn.click();
      const detail = page.getByRole('dialog').filter({ hasText: '版本变更详情' });
      await expect(detail).toBeVisible();
      await expect(detail.getByTestId('sql-approval-btn')).toBeVisible();

      await gotoVersionSub(page, 'approval');
      await expect(page.getByTestId('page-title-approvals')).toHaveText('我的审批');
      await expect(
        page.getByRole('menuitem', { name: '我的审批' }),
      ).toBeVisible();
    } finally {
      await deleteGroup(request, token, projectId).catch(() => {});
    }
  });

  /**
   * 有数据全链路（最深可验证路径）：
   * API 种子工单（真实 POST /ncnb/approval，自审）→ 审批页见行 → UI 拒绝 + toast
   * → 工单页见「拒绝」→ UI 复批 + toast。
   * 「通过」会 JDBC 执行 SQL，过重且易脏环境，不在本用例覆盖。
   */
  test('API 种子工单：审批拒绝有 toast，工单可复批', async ({ page, request }) => {
    test.setTimeout(120_000);
    const account = e2eAccount();
    const approverId = `e2e-user-${test.info().parallelIndex}`;
    const projectName = uniqueProjectName('appr-data');
    const remark = `e2e-appr-${Date.now().toString(36)}-remark`;
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(request, token, projectName);
    let approvalId = '';

    try {
      approvalId = await seedApproval(request, token, projectId, approverId, remark);

      await login(page, account);
      await page.goto(`/design/table/model?projectId=${projectId}`);
      await expect(page).toHaveURL(/projectId=/, { timeout: 15_000 });

      await gotoVersionSub(page, 'approval');
      await expect(page.getByTestId('page-title-approvals')).toHaveText('我的审批');
      const approvalRow = page.getByRole('row').filter({ hasText: remark });
      await expect(approvalRow).toBeVisible({ timeout: 15_000 });
      await expect(approvalRow.getByText('待审批')).toBeVisible();

      await approvalRow.getByRole('button', { name: '拒绝' }).click();
      await page
        .getByRole('dialog', { name: '拒绝审批' })
        .getByRole('button', { name: /拒\s*绝/ })
        .click();
      await expectToast(page, '已拒绝');
      await expect(approvalRow.getByText('拒绝', { exact: true })).toBeVisible({ timeout: 10_000 });

      await gotoVersionSub(page, 'order');
      await expect(page.getByTestId('page-title-orders')).toHaveText('我的工单');
      const orderRow = page.getByRole('row').filter({ hasText: remark });
      await expect(orderRow).toBeVisible({ timeout: 15_000 });
      await expect(orderRow.getByText('拒绝', { exact: true })).toBeVisible();

      await orderRow.getByRole('button', { name: '复批' }).click();
      await page
        .getByRole('dialog', { name: '复批' })
        .getByRole('button', { name: /复\s*批/ })
        .click();
      await expectToast(page, '已重新提交审批');
      await expect(orderRow.getByText('复批', { exact: true })).toBeVisible({ timeout: 10_000 });
    } finally {
      if (approvalId) {
        await deleteApproval(request, token, approvalId).catch(() => {});
      }
      await deleteGroup(request, token, projectId).catch(() => {});
    }
  });

  /**
   * 审批通过路径：目标库不可达时必须失败可见，且状态仍为待审批（不落通过、不静默）。
   */
  test('审批通过 SQL 失败：toast 可见且状态仍待审批', async ({ page, request }) => {
    test.setTimeout(120_000);
    const account = e2eAccount();
    const approverId = `e2e-user-${test.info().parallelIndex}`;
    const projectName = uniqueProjectName('appr-fail');
    const remark = `e2e-appr-fail-${Date.now().toString(36)}`;
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(request, token, projectName);
    let approvalId = '';

    try {
      approvalId = await seedApproval(request, token, projectId, approverId, remark, {
        url: 'jdbc:mysql://127.0.0.1:1/nope',
        driverClassName: 'com.mysql.cj.jdbc.Driver',
        username: 'x',
        password: 'y',
      });

      await login(page, account);
      await page.goto(`/design/table/model?projectId=${projectId}`);
      await expect(page).toHaveURL(/projectId=/, { timeout: 15_000 });

      await gotoVersionSub(page, 'approval');
      const approvalRow = page.getByRole('row').filter({ hasText: remark });
      await expect(approvalRow).toBeVisible({ timeout: 15_000 });
      await expect(approvalRow.getByText('待审批')).toBeVisible();

      await approvalRow.getByRole('button', { name: '通过' }).click();
      await page
        .getByRole('dialog', { name: '通过审批' })
        .getByRole('button', { name: /通\s*过/ })
        .click();
      await expectToast(page, /连接失败|SQL执行失败|驱动加载失败|Communications link failure/);
      await expect(approvalRow.getByText('待审批')).toBeVisible({ timeout: 10_000 });

      const read = await request.get(`${API}/ncnb/approval/${approvalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const readJson = await read.json();
      expect(String(readJson.data?.approveStatus)).toBe('0');
    } finally {
      if (approvalId) {
        await deleteApproval(request, token, approvalId).catch(() => {});
      }
      await deleteGroup(request, token, projectId).catch(() => {});
    }
  });

  /**
   * ADR-0016：工单/审批列表密度 — 标题栏 ~24 + 行 pad 4×8；禁 clip 图标；保留动作钮 focus-visible
   */
  test('工单/审批列表行密度：与 22–28 chrome 同阶', async ({ page, request }) => {
    test.setTimeout(120_000);
    const account = e2eAccount();
    const approverId = `e2e-user-${test.info().parallelIndex}`;
    const projectName = uniqueProjectName('appr-dens');
    const remark = `e2e-appr-dens-${Date.now().toString(36)}`;
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(request, token, projectName);
    let approvalId = '';

    try {
      approvalId = await seedApproval(request, token, projectId, approverId, remark);

      await login(page, account);
      await page.goto(`/design/table/model?projectId=${projectId}`);
      await expect(page).toHaveURL(/projectId=/, { timeout: 15_000 });

      const assertDense = async (
        pageTestId: string,
        toolbarTestId: string,
        titleTestId: string,
        actionName: string,
        shotName: string,
      ) => {
        const pageEl = page.getByTestId(pageTestId);
        await expect(pageEl).toBeVisible({ timeout: 15_000 });
        await expect(page.getByTestId(titleTestId)).toBeVisible();
        const row = pageEl.getByRole('row').filter({ hasText: remark });
        await expect(row).toBeVisible({ timeout: 15_000 });
        const actionBtn = row.getByRole('button', { name: actionName });
        await expect(actionBtn).toBeVisible();

        const metrics = await pageEl.evaluate(
          (root, args) => {
            const { toolbarId, titleId, actionLabel } = args;
            const toolbar = root.querySelector(
              `[data-testid="${toolbarId}"]`,
            ) as HTMLElement | null;
            const title = root.querySelector(
              `[data-testid="${titleId}"]`,
            ) as HTMLElement | null;
            const rows = Array.from(
              root.querySelectorAll('.ant-table-tbody > tr'),
            ) as HTMLElement[];
            const bodyRow =
              rows.find((r) => (r.textContent || '').includes(args.remark)) || null;
            const cell = bodyRow?.querySelector('td') as HTMLElement | null;
            const buttons = bodyRow
              ? (Array.from(bodyRow.querySelectorAll('button')) as HTMLElement[])
              : [];
            const action = buttons.find((b) =>
              (b.textContent || '').includes(actionLabel),
            ) as HTMLElement | undefined;
            const eps = 1;
            const fullyIn = (inner: DOMRect, outer: DOMRect) =>
              inner.top >= outer.top - eps &&
              inner.bottom <= outer.bottom + eps &&
              inner.left >= outer.left - eps &&
              inner.right <= outer.right + eps;
            let iconClipped = false;
            if (action) {
              const icon = action.querySelector('.anticon, svg') as HTMLElement | null;
              if (icon) {
                iconClipped = !fullyIn(
                  icon.getBoundingClientRect(),
                  action.getBoundingClientRect(),
                );
              }
            }
            const tcs = title ? getComputedStyle(title) : null;
            const cellCs = cell ? getComputedStyle(cell) : null;
            return {
              titleFont: tcs ? parseFloat(tcs.fontSize) : -1,
              titleLh: tcs ? parseFloat(tcs.lineHeight) : -1,
              toolbarH: toolbar ? toolbar.getBoundingClientRect().height : -1,
              padBlock: cellCs
                ? parseFloat(cellCs.paddingTop) + parseFloat(cellCs.paddingBottom)
                : -1,
              padInline: cellCs
                ? parseFloat(cellCs.paddingLeft) + parseFloat(cellCs.paddingRight)
                : -1,
              actionH: action ? action.getBoundingClientRect().height : -1,
              iconClipped,
            };
          },
          {
            toolbarId: toolbarTestId,
            titleId: titleTestId,
            actionLabel: actionName,
            remark,
          },
        );

        expect(
          metrics.titleFont,
          `页标题字号应 ≤14（目标 13），得 ${metrics.titleFont}`,
        ).toBeLessThanOrEqual(14);
        expect(metrics.titleFont).toBeGreaterThanOrEqual(12);
        expect(
          metrics.titleLh,
          `页标题行高应 ≤24（目标 22），得 ${metrics.titleLh}`,
        ).toBeLessThanOrEqual(24);
        expect(
          metrics.toolbarH,
          `标题栏高应 ≤32（目标 ~24），得 ${metrics.toolbarH}`,
        ).toBeLessThanOrEqual(32);
        expect(metrics.toolbarH).toBeGreaterThanOrEqual(22);
        expect(
          metrics.padBlock,
          `表细胞 padding-block 合计应 ≤10（目标 4+4），得 ${metrics.padBlock}`,
        ).toBeLessThanOrEqual(10);
        expect(metrics.padBlock).toBeGreaterThanOrEqual(4);
        expect(
          metrics.padInline,
          `表细胞 padding-inline 合计应 ≤20（目标 8+8），得 ${metrics.padInline}`,
        ).toBeLessThanOrEqual(20);
        expect(
          metrics.actionH,
          `${actionName}钮高应 ∈22–28，得 ${metrics.actionH}`,
        ).toBeGreaterThanOrEqual(22);
        expect(metrics.actionH).toBeLessThanOrEqual(28);
        expect(metrics.iconClipped, `${actionName}图标不得裁切`).toBe(false);

        await row.getByRole('button', { name: '查看' }).focus();
        await page.keyboard.press('Shift+Tab');
        await expect(actionBtn).toBeFocused();
        const focusRing = await actionBtn.evaluate((el) => {
          const cs = getComputedStyle(el);
          return {
            outlineStyle: cs.outlineStyle,
            outlineWidth: cs.outlineWidth,
          };
        });
        expect(focusRing.outlineStyle).not.toBe('none');
        expect(parseFloat(focusRing.outlineWidth)).toBeGreaterThanOrEqual(1);

        await page.screenshot({
          path: `test-results/ux-walkthrough/${shotName}`,
          fullPage: false,
        });
      };

      await gotoVersionSub(page, 'approval');
      await assertDense(
        'approval-page',
        'approval-toolbar',
        'page-title-approvals',
        '拒绝',
        'approval-list-dense.png',
      );

      await gotoVersionSub(page, 'order');
      await assertDense(
        'order-page',
        'order-toolbar',
        'page-title-orders',
        '撤销',
        'order-list-dense.png',
      );
    } finally {
      if (approvalId) {
        await deleteApproval(request, token, approvalId).catch(() => {});
      }
      await deleteGroup(request, token, projectId).catch(() => {});
    }
  });
});
