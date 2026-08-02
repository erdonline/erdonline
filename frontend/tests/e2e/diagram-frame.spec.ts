import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * ADR-0017 Phase 2b：图内 Frame — 新建分组 / 分配成员 / 持久化
 */

test.describe('图内分组 Frame（ADR-0017 Phase 2b）', () => {
  test.describe.configure({ retries: 0 });

  test('选中表→新建分组→成员进 JSON→刷新仍在', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('frame');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fr', 'frame group');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      // 第二张表（命令面板）
      await page.getByRole('button', { name: '命令' }).click();
      await expect(page.getByRole('dialog', { name: '命令面板' })).toBeVisible();
      await page.getByTestId('cmd-palette-input').fill('新建');
      await page.getByRole('option', { name: /新建表/ }).click();
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible({ timeout: 10_000 });

      await rfNode(page, 'T_TABLE_1').click();
      await rfNode(page, 'T_TABLE_2').click({ modifiers: ['Shift'] });

      await page.getByRole('button', { name: '新建分组' }).click();
      const frame = page.getByTestId('diagram-frame');
      await expect(frame).toBeVisible({ timeout: 10_000 });
      await expect(frame).toContainText('分组');
      await expect(frame).toContainText('2 张表');

      const groups = await page.evaluate(() => {
        const api = (
          window as unknown as {
            __ERD_E2E__?: { getDiagramGroups?: () => Array<{ memberEntityIds: string[]; name: string }> };
          }
        ).__ERD_E2E__;
        return api?.getDiagramGroups?.() || [];
      });
      expect(groups.length).toBeGreaterThanOrEqual(1);
      expect(groups[0].memberEntityIds.sort()).toEqual(['T_TABLE_1', 'T_TABLE_2']);

      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      const designUrl = page.url();
      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('diagram-frame')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('diagram-frame')).toContainText('2 张表');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });

  test('空选新建分组后选表加入', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('frame2');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fr2', 'frame assign');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      // 点空白取消选中后新建空分组
      await page.getByTestId('reactflow-canvas').click({ position: { x: 20, y: 20 } });
      await page.getByRole('button', { name: '新建分组' }).click();
      await expect(page.getByTestId('diagram-frame')).toBeVisible();

      await rfNode(page, 'T_TABLE_1').click();
      await page.getByRole('button', { name: '加入分组' }).click();
      await expect(page.getByTestId('diagram-frame')).toContainText('1 张表', { timeout: 10_000 });

      const groups = await page.evaluate(() => {
        const api = (
          window as unknown as {
            __ERD_E2E__?: { getDiagramGroups?: () => Array<{ memberEntityIds: string[] }> };
          }
        ).__ERD_E2E__;
        return api?.getDiagramGroups?.() || [];
      });
      expect(groups[0]?.memberEntityIds).toContain('T_TABLE_1');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
