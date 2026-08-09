import { expect, test, type Page } from '@playwright/test';
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
 * ADR-0022：project 乐观锁 — 409 不得静默成功，须可行动 UI。
 */

async function setupConflictScenario(page: Page, projectName: string) {
  await login(page);
  await deleteOwnPersonProjects(page);
  await createAndOpenPersonProject(page, projectName, 'conflict', '409 actionable');
  await openRelationFromEmpty(page);
  await page.getByTestId('canvas-empty-create').click();
  await expect(rfNode(page, 'T_TABLE_1')).toBeVisible({ timeout: 25_000 });
  await expect(page.getByTestId('save-status')).toHaveText('已同步', { timeout: 25_000 });
  await page.waitForTimeout(1_500);

  const projectId = new URL(page.url()).searchParams.get('projectId');
  expect(projectId).toBeTruthy();

  await page.route('**/ncnb/project/save', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 409,
        msg: '项目已被其他窗口或协作者更新，请刷新后再保存',
        data: null,
      }),
    });
  });

  // persist:true 建表在 409 时不会写入 store，但会弹出可行动冲突 Modal
  await page.getByTestId('canvas-create-table').click();
  await expect(page.getByRole('dialog', { name: '保存冲突' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('project-save-conflict-modal')).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('project-save-conflict-preview')).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('save-status')).toHaveText('冲突');

  return projectId as string;
}

test.describe('project/save 乐观锁冲突', () => {
  test('409 → 冲突 Modal + 顶栏冲突态', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('saveconflict');
    try {
      await setupConflictScenario(page, projectName);
      await expect(page.getByTestId('version-diff-panel')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId('save-status')).not.toHaveText('已同步');
    } finally {
      await page.unroute('**/ncnb/project/save').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('409 → 刷新服务器：回退冲突态并清草稿', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('saveconflict-refresh');
    try {
      const projectId = await setupConflictScenario(page, projectName);
      const draftKey = `erd:project-draft:${projectId}`;

      await page.evaluate(
        ({ key, pid }) => {
          localStorage.setItem(
            key,
            JSON.stringify({
              projectId: pid,
              projectJSON: { modules: [] },
              savedAt: new Date().toISOString(),
            }),
          );
        },
        { key: draftKey, pid: projectId },
      );

      await page.getByTestId('project-save-conflict-refresh').click();
      await expectToast(page, '已加载服务器上的最新项目');
      await expect(page.getByTestId('project-save-conflict-modal')).toHaveCount(0, {
        timeout: 15_000,
      });
      await expect(page.getByTestId('save-status')).toHaveText('已同步', { timeout: 15_000 });
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible({ timeout: 15_000 });
      await expect(rfNode(page, 'T_TABLE_2')).toHaveCount(0);

      await expect
        .poll(async () => page.evaluate((key) => localStorage.getItem(key), draftKey))
        .toBeNull();
    } finally {
      await page.unroute('**/ncnb/project/save').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('409 → 另存为新项目：跳转副本项目', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('saveconflict-fork');
    try {
      const originalProjectId = await setupConflictScenario(page, projectName);

      await page.unroute('**/ncnb/project/save');
      await page.getByTestId('project-save-conflict-fork').click();
      await expectToast(page, '已另存为新项目');
      await expect(page).toHaveURL(/\/design\/table\/model\?projectId=/, {
        timeout: 25_000,
      });

      const forkProjectId = new URL(page.url()).searchParams.get('projectId');
      expect(forkProjectId).toBeTruthy();
      expect(forkProjectId).not.toBe(originalProjectId);

      await expect(page.getByRole('dialog', { name: '保存冲突' })).toHaveCount(0);
      await expect(page.getByTestId('save-status')).toHaveText('已同步', { timeout: 25_000 });
    } finally {
      await page.unroute('**/ncnb/project/save').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});