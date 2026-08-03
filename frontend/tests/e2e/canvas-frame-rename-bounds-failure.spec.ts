import { expect, test } from '@playwright/test';
import {
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
 * Frame 重命名 / 适应成员：禁止本地 mutate 即落盘；仅 project/save code===200
 */

type DiagramGroupE2E = {
  memberEntityIds: string[];
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

async function getDiagramGroups(page: import('@playwright/test').Page): Promise<DiagramGroupE2E[]> {
  return page.evaluate(() => {
    const api = (
      window as unknown as {
        __ERD_E2E__?: { getDiagramGroups?: () => DiagramGroupE2E[] };
      }
    ).__ERD_E2E__;
    return api?.getDiagramGroups?.() || [];
  });
}

async function ensureTwoTablesOnCanvas(page: import('@playwright/test').Page) {
  await openRelationFromEmpty(page);
  await page.getByTestId('canvas-empty-create').click();
  await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
  await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
  await page.getByTestId('canvas-create-table').click();
  await expect(rfNode(page, 'T_TABLE_2')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
}

async function selectFrame(page: import('@playwright/test').Page) {
  await page.getByTestId('diagram-frame').click({ position: { x: 16, y: 12 }, force: true });
  await expect(page.getByRole('button', { name: '适应成员' })).toBeVisible({ timeout: 5_000 });
}

async function frameDomSize(page: import('@playwright/test').Page) {
  return page.getByTestId('diagram-frame').evaluate((el) => ({
    w: (el as HTMLElement).offsetWidth,
    h: (el as HTMLElement).offsetHeight,
  }));
}

test.describe('Frame 改名/适应成员落盘失败可回滚', () => {
  test('重命名业务码失败：可读 toast + 草稿保留 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('frn-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'frnf', 'frame rename fail');

      await ensureTwoTablesOnCanvas(page);
      await rfNode(page, 'T_TABLE_1').click();
      await rfNode(page, 'T_TABLE_2').click({ modifiers: ['Shift'] });
      await page.getByRole('button', { name: '新建分组' }).click();
      await expect(page.getByTestId('diagram-frame')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const beforeName = (await getDiagramGroups(page))[0]?.name;
      expect(beforeName).toBeTruthy();

      let saveHits = 0;
      let armed = false;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST' || !armed) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟分组保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await page.getByTestId('frame-rename-label').dblclick({ force: true });
        const input = page.getByTestId('frame-rename-input');
        await expect(input).toBeVisible({ timeout: 5_000 });
        armed = true;
        await input.fill('鉴权域');
        await input.press('Enter');

        await expectToast(page, '模拟分组保存拒绝');
        // 失败：仍停留编辑态，store 名未改
        await expect(page.getByTestId('frame-rename-input')).toBeVisible();
        await expect(page.getByTestId('frame-rename-input')).toHaveValue('鉴权域');
        expect((await getDiagramGroups(page))[0]?.name).toBe(beforeName);

        await page.getByTestId('frame-rename-input').press('Enter');
        await expect(page.getByTestId('frame-rename-label')).toHaveText('鉴权域', {
          timeout: 10_000,
        });
        await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
        expect((await getDiagramGroups(page))[0]?.name).toBe('鉴权域');
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        armed = false;
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('适应成员业务码失败：可读 toast + RF 回滚 → 重试成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('ffit-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ffitf', 'frame fit fail');

      await ensureTwoTablesOnCanvas(page);
      await rfNode(page, 'T_TABLE_1').click();
      await rfNode(page, 'T_TABLE_2').click({ modifiers: ['Shift'] });
      await page.getByRole('button', { name: '新建分组' }).click();
      await expect(page.getByTestId('diagram-frame')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      // 先放大框，使「适应成员」会产生可见缩边
      await selectFrame(page);
      const handle = page.locator('.react-flow__resize-control.handle.bottom.right');
      await expect(handle).toBeVisible({ timeout: 5_000 });
      const hb = await handle.boundingBox();
      expect(hb).toBeTruthy();
      await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
      await page.mouse.down();
      await page.mouse.move(hb!.x + 120, hb!.y + 100, { steps: 8 });
      await page.mouse.up();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const inflated = (await getDiagramGroups(page))[0];
      expect(inflated?.w).toBeGreaterThan(0);
      const rfBefore = await frameDomSize(page);

      let saveHits = 0;
      let armed = false;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST' || !armed) {
          await route.continue();
          return;
        }
        saveHits += 1;
        if (saveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟分组保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        await selectFrame(page);
        armed = true;
        await page.getByRole('button', { name: '适应成员' }).click();

        await expectToast(page, '模拟分组保存拒绝');
        await expect(page.getByText('已适应成员')).toHaveCount(0);
        // store 未写；RF 回滚到放大后尺寸
        await expect
          .poll(async () => (await getDiagramGroups(page))[0]?.w ?? 0, { timeout: 8_000 })
          .toBe(inflated.w);
        await expect
          .poll(async () => {
            const s = await frameDomSize(page);
            return Math.abs(s.w - rfBefore.w) + Math.abs(s.h - rfBefore.h);
          }, { timeout: 8_000 })
          .toBeLessThan(4);

        await page.getByRole('button', { name: '适应成员' }).click();
        await expect(page.getByText('已适应成员')).toBeVisible({ timeout: 8_000 });
        await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
        await expect
          .poll(async () => (await getDiagramGroups(page))[0]?.w ?? inflated.w, {
            timeout: 8_000,
          })
          .toBeLessThan(inflated.w - 20);
        expect(saveHits).toBeGreaterThanOrEqual(2);
      } finally {
        armed = false;
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
