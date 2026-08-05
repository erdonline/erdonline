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

/** Vision #28 / ADR-0022：与 save-status-failure-routing 同源 aria */
const RETRY_FAILURE_ARIA = '自动保存失败，改动已存本地，点击重试';

/**
 * ADR-0022 并发底座：离开设计器不得盲存。
 * 干净态离开 → 零保存请求；脏态离开 → 补一枪且改动落库。
 * Vision #28：失败态离开补枪 → 回设计器顶栏重试 → 干净离开。
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
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
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
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await page.waitForTimeout(1_500);

      // 阻断落库 → 顶栏进入失败态（未落库标记保留）
      await page.route('**/ncnb/project/save', (route) => route.abort('failed'));
      await page.getByTestId('canvas-create-table').click();
      await expect(page.getByRole('button', { name: RETRY_FAILURE_ARIA })).toBeVisible({
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

  test('落库失败 → 离开补枪 → 顶栏重试成功 → 可正常离开', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('leaveretry');
    let saveAttempts = 0;
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'leaveretry', 'leave retry flow');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
      await page.waitForTimeout(1_500);

      const designUrl = page.url();
      expect(new URL(designUrl).searchParams.get('projectId')).toBeTruthy();

      await page.route('**/ncnb/project/save', async (route) => {
        saveAttempts += 1;
        if (saveAttempts <= 2) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟落库拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      await page.getByTestId('canvas-create-table').click();
      await expectToast(page, '模拟落库拒绝');
      await expect(page.getByRole('button', { name: RETRY_FAILURE_ARIA })).toBeVisible({
        timeout: 15_000,
      });

      // 离开 → closeSocket 补枪（第 2 次 save，仍失败）
      await page.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
      await page.waitForTimeout(1_000);
      expect(saveAttempts).toBeGreaterThanOrEqual(2);

      // 回设计器恢复草稿 → 顶栏重试成功
      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('project-draft-recovery-content')).toBeVisible({
        timeout: 15_000,
      });
      await page.getByTestId('project-draft-recovery-restore').click();
      await expect(page.getByText('已恢复本地草稿')).toBeVisible({ timeout: 5_000 });
      await expect(page).toHaveURL(/\/design\/table\//, { timeout: 15_000 });

      const retry = page.getByRole('button', { name: RETRY_FAILURE_ARIA });
      await expect(retry).toBeVisible({ timeout: 15_000 });
      await retry.click();
      await expect(page.getByTestId('save-status')).not.toHaveText('保存中…', { timeout: 3_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 20_000 });
      await expect(page.getByRole('button', { name: RETRY_FAILURE_ARIA })).toHaveCount(0);

      const saveCallsAfterRetry: string[] = [];
      page.on('request', (req) => {
        if (/\/ncnb\/project(\/group)?\/save/.test(req.url())) {
          saveCallsAfterRetry.push(req.url());
        }
      });
      await page.waitForTimeout(500);
      await page.getByRole('link', { name: 'ERD Online 首页' }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
      await page.waitForTimeout(1_500);
      expect(saveCallsAfterRetry).toHaveLength(0);
    } finally {
      await page.unroute('**/ncnb/project/save').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
