import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  openRelationFromEmpty,
  uniqueProjectName,
} from './helpers';

/**
 * 大图画布：节点≥阈值开启视口裁剪，放大后 DOM 节点数 < 逻辑表数。
 * 定位遵守 e2e-locators：role/testid，禁止 .ant-tree 类名拧巴。
 */
test.describe('画布大项目', () => {
  test('多表时 onlyRenderVisibleElements 裁剪离屏节点', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('scale');
    await login(page);
    await deleteOwnPersonProjects(page);
    await createAndOpenPersonProject(page, projectName, 'scale');
    await openRelationFromEmpty(page);

    await page.getByTestId('canvas-empty-create').click();
    await expect(page.getByTestId('reactflow-canvas')).toBeVisible();

    const total = await page.evaluate(() => {
      const hook = (window as unknown as {
        __ERD_E2E__?: { ensureTables: (n: number) => number };
      }).__ERD_E2E__;
      if (!hook) {
        throw new Error('__ERD_E2E__.ensureTables missing');
      }
      return hook.ensureTables(30);
    });
    expect(total).toBeGreaterThanOrEqual(30);

    await expect(page.getByTestId('reactflow-canvas')).toHaveAttribute('data-viewport-cull', '1', {
      timeout: 10_000,
    });

    await page.evaluate(() => {
      const hook = (window as unknown as {
        __ERD_E2E__?: { setViewport: (vp: { x: number; y: number; zoom: number }) => void };
      }).__ERD_E2E__;
      hook?.setViewport({ x: -80, y: -60, zoom: 1.6 });
    });
    await page.waitForTimeout(400);

    const domNodes = await page.locator('.react-flow__node').count();
    const logical = Number(await page.getByTestId('reactflow-canvas').getAttribute('data-node-total'));
    expect(logical).toBeGreaterThanOrEqual(30);
    expect(domNodes, `视口裁剪后 DOM 节点应少于逻辑表数（${logical}）`).toBeLessThan(logical);

    await deleteOwnPersonProjects(page);
  });
});
