import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  login,
  openRelationCanvas,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 表设计「触发器」签：列表 + 编辑 + 查看 DDL + 添加/删除（persist-on-200）
 * — locators：role / aria / testid；禁止 .ant-*
 */

async function openTriggerPane(page: import('@playwright/test').Page) {
  await openRelationFromEmpty(page);
  await page.getByTestId('canvas-empty-create').click();
  const node = rfNode(page, 'T_TABLE_1');
  await expect(node).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
  await node.getByTestId('canvas-open-trigger').evaluate((el: HTMLElement) => el.click());
  const designer = page.getByTestId('table-design');
  await expect(designer).toBeVisible({ timeout: 10_000 });
  await expect(designer.getByRole('tab', { name: '触发器' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  return page.getByTestId('table-trigger-edit');
}

test.describe('表设计触发器签', () => {
  test('打开触发器签：添加 → 查看 DDL → 删除', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('trg-ui');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'trg', 'table triggers ui');

      const triggerEdit = await openTriggerPane(page);
      await expect(triggerEdit.getByTestId('trigger-empty-hint')).toBeVisible();

      await triggerEdit.getByRole('button', { name: '添加第一个触发器' }).click();
      const addDialog = page.getByRole('dialog', { name: '添加触发器' });
      await expect(addDialog).toBeVisible();
      await expect(addDialog.getByLabel('触发器名称')).toBeFocused({ timeout: 5_000 });
      await addDialog.getByLabel('触发器名称').fill('trg_user_bu');
      await addDialog.getByLabel('触发器语句体').fill('SET NEW.updated_at = NOW()');
      await addDialog.getByRole('button', { name: '确认添加触发器' }).click();

      await expectToast(page, '触发器更新成功');
      await expect(triggerEdit.getByRole('option', { name: '查看触发器 trg_user_bu' })).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await triggerEdit.getByRole('option', { name: '查看触发器 trg_user_bu' }).click();
      const ddl = triggerEdit.getByTestId('trigger-ddl-panel');
      await expect(ddl).toBeVisible();
      await expect(triggerEdit.getByTestId('trigger-ddl-body')).toContainText('CREATE TRIGGER');
      await expect(triggerEdit.getByTestId('trigger-ddl-body')).toContainText('trg_user_bu');
      await expect(triggerEdit.getByTestId('trigger-statement')).toContainText(
        'SET NEW.updated_at = NOW()',
      );

      await triggerEdit.getByRole('button', { name: '删除触发器 trg_user_bu' }).click();
      const delDialog = page.getByRole('dialog').filter({ hasText: /确定删除触发器/ });
      await expect(delDialog).toBeVisible();
      await delDialog.getByRole('button', { name: /删\s*除/ }).click();
      await expectToast(page, '触发器更新成功');
      await expect(triggerEdit.getByTestId('trigger-empty-add')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('编辑已有触发器：改语句体落盘 + DDL 重建', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('trg-edit');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'trge', 'table triggers edit');

      const triggerEdit = await openTriggerPane(page);

      await triggerEdit.getByRole('button', { name: '添加第一个触发器' }).click();
      const addDialog = page.getByRole('dialog', { name: '添加触发器' });
      await addDialog.getByLabel('触发器名称').fill('trg_edit_me');
      await addDialog.getByLabel('触发器语句体').fill('SET NEW.v = 1');
      await addDialog.getByRole('button', { name: '确认添加触发器' }).click();
      await expectToast(page, '触发器更新成功');

      await triggerEdit.getByRole('button', { name: '编辑触发器 trg_edit_me' }).click();
      const editDialog = page.getByRole('dialog', { name: '编辑触发器' });
      await expect(editDialog).toBeVisible();
      await expect(editDialog.getByLabel('触发器名称')).toBeFocused({ timeout: 5_000 });
      await expect(editDialog.getByLabel('触发器名称')).toHaveValue('trg_edit_me');

      await editDialog.getByLabel('触发器语句体').fill('SET NEW.v = 2');
      // 清空 DDL，迫使按字段重建（模拟改结构后旧 ddl 贴死）
      await editDialog.getByLabel('触发器 DDL').fill('');
      await editDialog.getByRole('button', { name: '确认保存触发器' }).click();

      await expectToast(page, '触发器更新成功');
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await expect(triggerEdit.getByTestId('trigger-statement')).toContainText('SET NEW.v = 2');
      await expect(triggerEdit.getByTestId('trigger-ddl-body')).toContainText('SET NEW.v = 2');
      await expect(triggerEdit.getByTestId('trigger-ddl-body')).not.toContainText('SET NEW.v = 1');

      // 刷新后重开关系图，编辑结果仍在
      await page.reload({ waitUntil: 'domcontentloaded' });
      await openRelationCanvas(page, '商城');
      const nodeAfter = rfNode(page, 'T_TABLE_1');
      await expect(nodeAfter).toBeVisible({ timeout: 15_000 });
      await nodeAfter.getByTestId('canvas-open-trigger').evaluate((el: HTMLElement) => el.click());
      const after = page.getByTestId('table-trigger-edit');
      await expect(after).toBeVisible({ timeout: 10_000 });
      await after.getByRole('option', { name: '查看触发器 trg_edit_me' }).click();
      await expect(after.getByTestId('trigger-statement')).toContainText('SET NEW.v = 2');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('编辑落盘失败：窗不关可重试', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('trg-edit-fail');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'trgf', 'trigger edit fail');

      const triggerEdit = await openTriggerPane(page);

      await triggerEdit.getByRole('button', { name: '添加第一个触发器' }).click();
      const addDialog = page.getByRole('dialog', { name: '添加触发器' });
      await addDialog.getByLabel('触发器名称').fill('trg_fail');
      await addDialog.getByLabel('触发器语句体').fill('SET NEW.a = 1');
      await addDialog.getByRole('button', { name: '确认添加触发器' }).click();
      await expectToast(page, '触发器更新成功');

      let saveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let body: { projectJSON?: { modules?: Array<{ entities?: Array<{ triggers?: Array<{ statement?: string }> }> }> } } = {};
        try {
          body = JSON.parse(route.request().postData() || '{}');
        } catch {
          body = {};
        }
        const modules = body?.projectJSON?.modules ?? [];
        const stmts = modules.flatMap((m) =>
          (m.entities || []).flatMap((e) =>
            (e.triggers || []).map((t) => (t.statement || '').trim()),
          ),
        );
        if (stmts.some((s) => s.includes('SET NEW.a = 2'))) {
          saveHits += 1;
          if (saveHits === 1) {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ code: 500, msg: '模拟触发器编辑保存拒绝' }),
            });
            return;
          }
        }
        await route.continue();
      });

      try {
        await triggerEdit.getByRole('button', { name: '编辑触发器 trg_fail' }).click();
        const editDialog = page.getByRole('dialog', { name: '编辑触发器' });
        await editDialog.getByLabel('触发器语句体').fill('SET NEW.a = 2');
        await editDialog.getByLabel('触发器 DDL').fill('');
        await editDialog.getByRole('button', { name: '确认保存触发器' }).click();

        await expectToast(page, /触发器保存失败|模拟触发器编辑保存拒绝/);
        await expect(editDialog).toBeVisible();
        await expect(editDialog.getByLabel('触发器语句体')).toHaveValue('SET NEW.a = 2');

        await editDialog.getByRole('button', { name: '确认保存触发器' }).click();
        await expectToast(page, '触发器更新成功');
        await expect(editDialog).toHaveCount(0);
        await expect(triggerEdit.getByTestId('trigger-statement')).toContainText('SET NEW.a = 2');
      } finally {
        await page.unroute('**/ncnb/project/save');
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
