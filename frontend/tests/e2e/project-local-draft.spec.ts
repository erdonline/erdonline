import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 诚实持久化（ADR-0022 切片 7）：落库失败写 localStorage 草稿，重进设计器可恢复。
 */

test.describe('本地草稿恢复', () => {
  test('保存失败后重进设计器提示恢复草稿', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('draft');
    try {
      await login(page);
      await page.evaluate(() => {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('erd:project-draft:'))
          .forEach((k) => localStorage.removeItem(k));
      });
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'draft', 'local draft');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await page.route('**/ncnb/project/save', (route) => route.abort('failed'));
      const node = rfNode(page, 'T_TABLE_1');
      await node.getByTestId('canvas-add-field').click();
      const editRow = node.locator('.erd-field-editing');
      await editRow.locator('.erd-field-type-select').selectOption('String');
      const input = editRow.locator('.erd-field-input');
      await input.fill('DRAFT_FIELD');
      await input.press('Enter');

      await expectToast(page, '网络异常，请检查网络连接');
      await expect(page.getByTestId('save-status')).toHaveText('保存失败，点击重试', {
        timeout: 10_000,
      });

      // 草稿应已写入 localStorage
      const draftKey = `erd:project-draft:${projectId}`;
      await expect
        .poll(async () =>
          page.evaluate((key) => localStorage.getItem(key), draftKey),
        )
        .not.toBeNull();

      const designUrl = page.url();
      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });

      const restoreDialog = page.getByRole('dialog', { name: '发现未同步的本地草稿' });
      await expect(restoreDialog).toBeVisible({ timeout: 15_000 });
      await restoreDialog.getByRole('button', { name: '恢复草稿' }).click();
      await expect(page.getByText('已恢复本地草稿')).toBeVisible({ timeout: 5_000 });

      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 15_000 });
      const tableNode = rfNode(page, 'T_TABLE_1');
      const hiddenToggle = tableNode.getByTestId('field-hidden-toggle');
      if (await hiddenToggle.isVisible().catch(() => false)) {
        await hiddenToggle.click();
        const showDraft = tableNode.getByRole('button', { name: '在关系图中显示 DRAFT_FIELD' });
        if (await showDraft.isVisible().catch(() => false)) {
          await showDraft.click();
        }
      }
      await expect(tableNode.locator('[data-field="DRAFT_FIELD"]')).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('保存失败后重进设计器可丢弃草稿并使用服务器模型', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('draftdiscard');
    try {
      await login(page);
      await page.evaluate(() => {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('erd:project-draft:'))
          .forEach((k) => localStorage.removeItem(k));
      });
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'draft', 'discard draft');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await page.route('**/ncnb/project/save', (route) => route.abort('failed'));
      const node = rfNode(page, 'T_TABLE_1');
      await node.getByTestId('canvas-add-field').click();
      const editRow = node.locator('.erd-field-editing');
      await editRow.locator('.erd-field-type-select').selectOption('String');
      const input = editRow.locator('.erd-field-input');
      await input.fill('DISCARD_ME');
      await input.press('Enter');

      await expectToast(page, '网络异常，请检查网络连接');
      await expect(page.getByTestId('save-status')).toHaveText('保存失败，点击重试', {
        timeout: 10_000,
      });

      const draftKey = `erd:project-draft:${projectId}`;
      await expect
        .poll(async () => page.evaluate((key) => localStorage.getItem(key), draftKey))
        .not.toBeNull();

      const designUrl = page.url();
      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });

      await expect(page.getByTestId('project-draft-recovery-content')).toBeVisible({
        timeout: 15_000,
      });
      await page.getByTestId('project-draft-recovery-discard').click();
      await expect(page.getByText('已丢弃本地草稿')).toBeVisible({ timeout: 5_000 });

      await expect
        .poll(async () => page.evaluate((key) => localStorage.getItem(key), draftKey))
        .toBeNull();

      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 15_000 });
      const tableNode = rfNode(page, 'T_TABLE_1');
      await expect(tableNode.locator('[data-field="DISCARD_ME"]')).toHaveCount(0);

      // 再次进入不应再弹恢复框
      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('project-draft-recovery-content')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
