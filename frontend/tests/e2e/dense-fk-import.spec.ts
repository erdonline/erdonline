import { expect, test } from '@playwright/test';
import path from 'path';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * ADR-0016：密 FK DBML 导入走查 — 截图 + route-mode 分布（找难看连线）
 */
test.describe('密 FK 导入走查', () => {
  test('dense-fk.dbml 导入后边路由模式可观测', async ({ page }) => {
    test.setTimeout(180_000);
    const projectName = uniqueProjectName('densefk');
    const fixture = path.join(__dirname, '../fixtures/dense-fk.dbml');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'densefk', 'dense fk walk');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('menuitem', { name: '导入DBML' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('导入 DBML')).toBeVisible({ timeout: 10_000 });
      await dlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /DBML 导入成功/);
      await expect(dlg).toBeHidden({ timeout: 10_000 });

      // ADR-0017：导入后 DataTable 自动展开 module/表/关系；勿再点标题（expandAction=click 会收起）
      const tree = page.getByRole('complementary');
      await expect(tree.getByText('密FK走查', { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      const openRelation = page.getByTestId('tree-open-relation');
      await expect(openRelation).toBeVisible({ timeout: 15_000 });
      await openRelation.click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({
        timeout: 10_000,
      });

      const total = Number(
        await page.getByTestId('reactflow-canvas').getAttribute('data-node-total'),
      );
      expect(total).toBeGreaterThanOrEqual(10);
      await expect(page.locator('.react-flow__edge')).toHaveCount(20, {
        timeout: 15_000,
      });

      await page.getByRole('button', { name: '适应画布' }).click();
      await page.waitForTimeout(600);

      const modes = page.getByTestId('erd-edge-route-mode');
      await expect(modes).toHaveCount(20);
      const modeList = await modes.evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-mode') || ''),
      );
      for (const m of modeList) {
        expect(m).toMatch(/^(default|centerX|bypass|twoBend|astar)$/);
      }
      // 密障竞短：不应全是绕底 bypass（修前 8 bypass / 0 astar）
      const deep = modeList.filter((m) => m === 'astar' || m === 'twoBend');
      expect(
        deep.length,
        `dense FK 应出现 twoBend/astar（got ${JSON.stringify(
          modeList.reduce<Record<string, number>>((acc, m) => {
            acc[m] = (acc[m] || 0) + 1;
            return acc;
          }, {}),
        )}）`,
      ).toBeGreaterThanOrEqual(1);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-dense-fk-import.png',
        fullPage: false,
      });
      await page.getByTestId('reactflow-canvas').screenshot({
        path: 'test-results/ux-walkthrough/diagram-dense-fk-canvas.png',
      });

      // 暴露 mode 直方图供人工 / 下一 tick
      // eslint-disable-next-line no-console
      console.log(
        'dense-fk modes',
        modeList.reduce<Record<string, number>>((acc, m) => {
          acc[m] = (acc[m] || 0) + 1;
          return acc;
        }, {}),
      );
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
