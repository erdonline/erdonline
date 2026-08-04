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
 * ADR-0022 并发底座：离开设计器不得盲存。
 * 干净态离开 → 零保存请求；脏态离开 → 补一枪且改动落库。
 */
test.describe('离开设计器的保存行为', () => {
  test('干净态离开：不发保存请求', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('leaveclean');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'leaveclean', 'no blind save');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      // 防抖尾巴落地后再计数，避免把上一笔编辑的保存算进离开动作
      await page.waitForTimeout(1_500);

      const saveCalls: string[] = [];
      page.on('request', (req) => {
        if (/\/ncnb\/project(\/group)?\/save/.test(req.url())) {
          saveCalls.push(req.url());
        }
      });

      await page.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
      await page.waitForTimeout(1_500);
      expect(saveCalls).toHaveLength(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('落库失败后离开：补一枪重试，失败不静默', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('leavedirty');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'leavedirty', 'flush on leave');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
      await page.waitForTimeout(1_500);

      // 阻断落库 → 顶栏进入失败态（未落库标记保留）
      await page.route('**/ncnb/project/save', (route) => route.abort('failed'));
      await page.getByTestId('canvas-create-table').click();
      await expect(page.getByRole('button', { name: '自动保存失败，点击重试' })).toBeVisible({
        timeout: 15_000,
      });
      await page.unroute('**/ncnb/project/save');

      const saveCalls: string[] = [];
      page.on('request', (req) => {
        if (/\/ncnb\/project(\/group)?\/save/.test(req.url())) {
          saveCalls.push(req.url());
        }
      });

      await page.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
      await page.waitForTimeout(1_500);
      expect(saveCalls.length).toBeGreaterThan(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
