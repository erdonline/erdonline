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
 * ADR-0017 Phase 2b：图内 Frame — 新建 / 分配 / 缩放 / 拖框带表 / 适应成员
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
  await page.getByRole('button', { name: '命令' }).click();
  await expect(page.getByRole('dialog', { name: '命令面板' })).toBeVisible();
  await page.getByTestId('cmd-palette-input').fill('新建');
  await page.getByRole('option', { name: /新建表/ }).click();
  await expect(rfNode(page, 'T_TABLE_2')).toBeVisible({ timeout: 10_000 });
}

/** 表节点 z-index 更高，点框需 force；选中后框抬升，后续交互正常 */
async function selectFrame(page: import('@playwright/test').Page) {
  await page.locator('.react-flow__node-frame').click({ position: { x: 16, y: 12 }, force: true });
  await expect(page.getByRole('button', { name: '适应成员' })).toBeVisible({ timeout: 5_000 });
}

/** RF 节点 flow 坐标（不受 viewport 漂移影响） */
async function rfFlowPos(page: import('@playwright/test').Page, nodeId: string) {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-id="${id}"]`) as HTMLElement | null;
    if (!el?.style?.transform) return null;
    const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(el.style.transform);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
  }, nodeId);
}

test.describe('图内分组 Frame（ADR-0017 Phase 2b）', () => {
  test.describe.configure({ retries: 0 });

  test('选中表→新建分组→成员进 JSON→刷新仍在', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('frame');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fr', 'frame group');

      await ensureTwoTablesOnCanvas(page);

      await rfNode(page, 'T_TABLE_1').click();
      await rfNode(page, 'T_TABLE_2').click({ modifiers: ['Shift'] });

      await page.getByRole('button', { name: '新建分组' }).click();
      const frame = page.getByTestId('diagram-frame');
      await expect(frame).toBeVisible({ timeout: 10_000 });
      await expect(frame).toContainText('分组');
      await expect(frame).toContainText('2 张表');
      // ADR-0016：Frame 标题扫读（label 主标题 vs muted meta；chrome ≤22）
      const frameLook = await frame.locator('.erd-frame-chrome').evaluate((el) => {
        const label = el.querySelector('.erd-frame-label');
        const meta = el.querySelector('.erd-frame-meta');
        if (!label || !meta) return null;
        const cs = getComputedStyle(el);
        const ls = getComputedStyle(label);
        const ms = getComputedStyle(meta);
        return {
          chromeH: parseFloat(cs.height),
          padX: parseFloat(cs.paddingLeft),
          labelSize: parseFloat(ls.fontSize),
          labelWeight: parseInt(ls.fontWeight, 10),
          metaSize: parseFloat(ms.fontSize),
          metaWeight: parseInt(ms.fontWeight, 10),
          metaOpacity: parseFloat(ms.opacity),
        };
      });
      expect(frameLook).not.toBeNull();
      expect(frameLook!.chromeH).toBeLessThanOrEqual(22);
      expect(frameLook!.padX).toBeGreaterThanOrEqual(8);
      expect(frameLook!.labelSize).toBeGreaterThanOrEqual(12);
      expect(frameLook!.labelWeight).toBeGreaterThanOrEqual(700);
      expect(frameLook!.metaSize).toBeLessThan(frameLook!.labelSize);
      expect(frameLook!.metaWeight).toBeLessThan(frameLook!.labelWeight);
      expect(frameLook!.metaOpacity).toBeLessThan(1);
      await frame.screenshot({
        path: 'test-results/ux-walkthrough/diagram-frame-title-hierarchy.png',
      });

      // ADR-0016：Frame 选中光晕与表同环（--erd-selection-ring = brand a18）
      // 仅采 Frame（testid 即 .erd-frame-node）；表环由 relation.spec「品牌 token」覆盖
      await selectFrame(page);
      const frameRing = await frame.evaluate((el) => {
        const shadow = getComputedStyle(el).boxShadow;
        const m = shadow.match(/rgba?\([^)]+\)\s+0px\s+0px\s+0px\s+2px/);
        return m?.[0] ?? shadow;
      });
      expect(frameRing, `Frame 选中环应为 brand a18：${frameRing}`).toMatch(
        /rgba\(222,\s*41,\s*16,\s*0\.18\)/,
      );

      const groups = await getDiagramGroups(page);
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

  test('双击 Frame 标题重命名并持久化', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('frame-rn');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'frn', 'frame rename');

      await ensureTwoTablesOnCanvas(page);
      await rfNode(page, 'T_TABLE_1').click();
      await page.getByRole('button', { name: '新建分组' }).click();
      const frame = page.getByTestId('diagram-frame');
      await expect(frame).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('frame-rename-label').dblclick({ force: true });
      const input = page.getByTestId('frame-rename-input');
      await expect(input).toBeVisible({ timeout: 5_000 });
      await input.fill('鉴权域');
      await input.press('Enter');
      await expect(page.getByTestId('frame-rename-label')).toHaveText('鉴权域');
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      const designUrl = page.url();
      await page.goto(designUrl, { waitUntil: 'domcontentloaded' });
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('diagram-frame')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('frame-rename-label')).toHaveText('鉴权域');
      const groups = await getDiagramGroups(page);
      expect(groups[0]?.name).toBe('鉴权域');
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

      const groups = await getDiagramGroups(page);
      expect(groups[0]?.memberEntityIds).toContain('T_TABLE_1');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });

  test('选中分组→缩放手柄→w/h 写入 groups', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('frame-rz');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'frz', 'frame resize');

      await ensureTwoTablesOnCanvas(page);
      await rfNode(page, 'T_TABLE_1').click();
      await rfNode(page, 'T_TABLE_2').click({ modifiers: ['Shift'] });
      await page.getByRole('button', { name: '新建分组' }).click();
      await expect(page.getByTestId('diagram-frame')).toBeVisible({ timeout: 10_000 });

      const before = (await getDiagramGroups(page))[0];
      expect(before?.w).toBeGreaterThan(0);

      await selectFrame(page);

      // RF 将 position 拆成独立 class：bottom + right（不是 bottom-right）
      const handle = page.locator('.react-flow__resize-control.handle.bottom.right');
      await expect(handle).toBeVisible({ timeout: 5_000 });
      const hb = await handle.boundingBox();
      expect(hb).toBeTruthy();
      await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
      await page.mouse.down();
      await page.mouse.move(hb!.x + 90, hb!.y + 70, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(400);

      await expect
        .poll(async () => (await getDiagramGroups(page))[0]?.w ?? 0, { timeout: 8_000 })
        .toBeGreaterThan(before.w + 20);
      const after = (await getDiagramGroups(page))[0];
      expect(after.h).toBeGreaterThan(before.h + 10);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });

  test('拖框→成员表同向平移；适应成员', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('frame-mv');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'frm', 'frame move');

      await ensureTwoTablesOnCanvas(page);
      await rfNode(page, 'T_TABLE_1').click();
      await rfNode(page, 'T_TABLE_2').click({ modifiers: ['Shift'] });
      await page.getByRole('button', { name: '新建分组' }).click();
      await expect(page.getByTestId('diagram-frame')).toBeVisible({ timeout: 10_000 });

      const tableBefore = await rfFlowPos(page, 'T_TABLE_1');
      const frameBefore = (await getDiagramGroups(page))[0];
      expect(tableBefore).toBeTruthy();
      expect(frameBefore).toBeTruthy();

      await selectFrame(page);

      const chrome = page.locator('.react-flow__node-frame .erd-frame-chrome');
      await expect(chrome).toBeVisible();
      const start = await chrome.boundingBox();
      expect(start).toBeTruthy();
      // 用 mouse 绝对坐标拖；dragHandle 仅顶栏可启拖
      await page.mouse.move(start!.x + 20, start!.y + start!.height / 2);
      await page.mouse.down();
      await page.mouse.move(start!.x + 20 + 120, start!.y + start!.height / 2 + 80, { steps: 15 });
      await page.mouse.up();
      await page.waitForTimeout(700);

      await expect
        .poll(async () => (await getDiagramGroups(page))[0]?.x ?? 0, { timeout: 8_000 })
        .toBeGreaterThan(frameBefore.x + 40);

      const tableAfter = await rfFlowPos(page, 'T_TABLE_1');
      expect(tableAfter).toBeTruthy();
      expect(tableAfter!.x).toBeGreaterThan(tableBefore!.x + 40);
      expect(tableAfter!.y).toBeGreaterThan(tableBefore!.y + 40);

      await selectFrame(page);
      await page.getByRole('button', { name: '适应成员' }).click();
      await expect(page.getByText('已适应成员')).toBeVisible({ timeout: 5_000 });
      const groups = await getDiagramGroups(page);
      expect(groups[0]?.memberEntityIds.sort()).toEqual(['T_TABLE_1', 'T_TABLE_2']);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
