import { expect, test } from '@playwright/test';
import {
  addFieldInline,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 画布字段 meta（类型 / PK / 隐藏）：禁止本地 mutate 即成功；仅 project/save code===200
 */

const FIELD = 'NAME';

type ModulesBody = {
  entities?: Array<{
    title?: string;
    name?: string;
    fields?: Array<{
      name?: string;
      type?: string;
      pk?: boolean;
      relationNoShow?: boolean;
    }>;
  }>;
};

function modulesFromSave(postData: string | null): ModulesBody[] {
  try {
    const body = postData ? JSON.parse(postData) : {};
    const modules = body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules ?? [];
    return Array.isArray(modules) ? modules : [];
  } catch {
    return [];
  }
}

function tableFields(
  modules: ModulesBody[],
  table = 'T_TABLE_1',
): Array<{ name?: string; type?: string; pk?: boolean; relationNoShow?: boolean }> {
  for (const m of modules) {
    const ent = (m.entities || []).find((e) => e?.title === table || e?.name === table);
    if (ent && Array.isArray(ent.fields)) return ent.fields;
  }
  return [];
}

test.describe('画布字段 meta 落盘失败可重试', () => {
  test('编辑态勾 PK：业务码失败回滚勾选 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('field-meta-pk-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fmpk', 'field meta pk fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await addFieldInline(page, 'T_TABLE_1', FIELD);
      await expect(node.locator(`[data-field="${FIELD}"]`)).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const fields = tableFields(modulesFromSave(route.request().postData()));
        const namePk = fields.some((f) => f?.name === FIELD && !!f?.pk);
        if (!namePk) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟字段PK保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const nameRow = node.locator(`[data-field="${FIELD}"]`);
        await nameRow.hover();
        await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
        const pkBox = page.getByRole('checkbox', { name: '主键' });
        await expect(pkBox).not.toBeChecked();
        await pkBox.check();

        await expectToast(page, '模拟字段PK保存拒绝');
        // 仍在编辑；勾选回滚；浏览徽章仍非 PK
        await expect(page.getByRole('textbox', { name: '字段名' })).toBeVisible();
        await expect(pkBox).not.toBeChecked();
        await page.getByRole('textbox', { name: '字段名' }).press('Escape');
        await expect(nameRow.getByRole('button', { name: '设为主键' })).toBeVisible();

        await nameRow.hover();
        await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
        await page.getByRole('checkbox', { name: '主键' }).check();
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
        await page.getByRole('textbox', { name: '字段名' }).press('Escape');
        await expect(nameRow.getByRole('button', { name: '取消主键' })).toBeVisible();
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('编辑态改类型：业务码失败回滚 select → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('field-meta-type-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fmty', 'field meta type fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await addFieldInline(page, 'T_TABLE_1', FIELD);
      await expect(node.locator(`[data-field="${FIELD}"]`)).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const fields = tableFields(modulesFromSave(route.request().postData()));
        const nameInt = fields.some((f) => f?.name === FIELD && f?.type === 'Integer');
        if (!nameInt) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟字段类型保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const nameRow = node.locator(`[data-field="${FIELD}"]`);
        await nameRow.hover();
        await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
        const typeSelect = page.getByRole('combobox', { name: '字段类型' });
        await expect(typeSelect).toHaveValue('String');
        await typeSelect.selectOption('Integer');

        await expectToast(page, '模拟字段类型保存拒绝');
        await expect(page.getByRole('textbox', { name: '字段名' })).toBeVisible();
        await expect(typeSelect).toHaveValue('String');
        await page.getByRole('textbox', { name: '字段名' }).press('Escape');
        await expect(nameRow).toContainText('String');

        await nameRow.hover();
        await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
        await page.getByRole('combobox', { name: '字段类型' }).selectOption('Integer');
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
        await page.getByRole('textbox', { name: '字段名' }).press('Escape');
        await expect(nameRow).toContainText('Integer');
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('编辑态隐藏：业务码失败仍显示行 → 重试成功隐藏', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('field-meta-hide-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fmhd', 'field meta hide fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await addFieldInline(page, 'T_TABLE_1', FIELD);
      await expect(node.locator(`[data-field="${FIELD}"]`)).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const fields = tableFields(modulesFromSave(route.request().postData()));
        const hidden = fields.some((f) => f?.name === FIELD && !!f?.relationNoShow);
        if (!hidden) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟字段隐藏保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const nameRow = node.locator(`[data-field="${FIELD}"]`);
        await nameRow.hover();
        await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
        await page.getByRole('checkbox', { name: '在关系图中隐藏' }).evaluate((el: HTMLElement) => el.click());

        await expectToast(page, '模拟字段隐藏保存拒绝');
        // 行仍在编辑；未 toast「已隐藏」；浏览行仍可见
        await expect(page.getByText(/已在关系图中隐藏「NAME」/)).toHaveCount(0);
        await expect(page.getByRole('textbox', { name: '字段名' })).toBeVisible();
        await page.getByRole('textbox', { name: '字段名' }).press('Escape');
        await expect(node.locator(`[data-field="${FIELD}"]`)).toBeVisible();

        await nameRow.hover();
        await nameRow.getByRole('button', { name: '编辑字段' }).evaluate((el: HTMLElement) => el.click());
        await page.getByRole('checkbox', { name: '在关系图中隐藏' }).evaluate((el: HTMLElement) => el.click());
        await expectToast(page, /已在关系图中隐藏「NAME」/);
        await expect(node.locator(`[data-field="${FIELD}"]`)).toHaveCount(0);
        await expect(node.getByTestId('field-hidden-toggle')).toBeVisible();
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('浏览态点 PK：业务码失败徽章不变 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('field-meta-browse-pk-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fmbpk', 'field meta browse pk fail');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await addFieldInline(page, 'T_TABLE_1', FIELD);
      const nameRow = node.locator(`[data-field="${FIELD}"]`);
      await expect(nameRow).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await expect(nameRow.getByRole('button', { name: '设为主键' })).toBeVisible();

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const fields = tableFields(modulesFromSave(route.request().postData()));
        const namePk = fields.some((f) => f?.name === FIELD && !!f?.pk);
        if (!namePk) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟浏览PK保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await nameRow.hover();
        await nameRow.getByRole('button', { name: '设为主键' }).click();
        await expectToast(page, '模拟浏览PK保存拒绝');
        await expect(nameRow.getByRole('button', { name: '设为主键' })).toBeVisible();
        await expect(nameRow.getByRole('button', { name: '取消主键' })).toHaveCount(0);

        await nameRow.getByRole('button', { name: '设为主键' }).click();
        await expect(nameRow.getByRole('button', { name: '取消主键' })).toBeVisible({
          timeout: 15_000,
        });
        await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
