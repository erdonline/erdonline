import { expect, test } from '@playwright/test';
import {
  addFieldInline,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  gotoDesignModel,
  login,
  openRelationCanvas,
  openRelationFromEmpty,
  openVersionPage,
  rfNode,
  saveVersion,
  uniqueProjectName,
} from './helpers';

/**
 * 版本快照零摩擦 + 版本 diff 可视化
 * 定位：e2e-locators
 */

async function closeVersionDialog(
  page: import('@playwright/test').Page,
  title: string | RegExp,
) {
  const dialog = page.getByRole('dialog').filter({ hasText: title });
  await dialog.getByRole('button', { name: /Close|关闭/ }).click();
  await expect(dialog).toHaveCount(0);
}

test.describe('版本快照', () => {
  test('模型变更后详情展示可视化 diff（增删改着色）', async ({ page }) => {
    test.setTimeout(180_000);
    const projectName = uniqueProjectName('vdiff');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vdiff', 'version diff');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await page.waitForTimeout(2_000);

      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-change-summary').first()).toBeVisible({
        timeout: 5_000,
      });

      const row100 = page.getByTestId('version-row-1.0.0');
      await row100.hover();
      await row100.getByTestId('version-detail-btn').click();
      await expect(page.getByText('版本变更详情')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-diff-panel')).toBeVisible();
      await expect(page.getByTestId('version-diff-summary')).toBeVisible();
      await expect(page.getByTestId('version-diff-item-add').first()).toBeVisible();
      await expect(page.getByTestId('version-diff-panel')).toContainText('T_TABLE_1');

      // W3：跨版本/详情 diff 导出变更清单（Markdown，含模型变更 + SQL）
      const exportBtn = page.getByTestId('version-diff-export-btn');
      await expect(exportBtn).toBeVisible();
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15_000 }),
        exportBtn.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/version-diff-.*\.md$/i);
      expect(await download.path()).toBeTruthy();
      await expectToast(page, /已导出变更清单/);
      await closeVersionDialog(page, '版本变更详情');

      await gotoDesignModel(page);
      await openRelationCanvas(page, '商城');
      await addFieldInline(page, 'T_TABLE_1', 'REMARK');
      await page.waitForTimeout(2_000);

      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-compare-btn')).toBeEnabled();
      await page.getByTestId('version-compare-btn').click();
      await expect(page.getByText('任意版本比较')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-diff-panel')).toBeVisible();
      await expect(page.getByTestId('version-diff-item-add').first()).toBeVisible();
      await expect(page.getByTestId('version-diff-panel')).toContainText(/REMARK|T_TABLE_1/);
      await closeVersionDialog(page, '任意版本比较');

      const v100 = page.getByTestId('version-row-1.0.0');
      await v100.hover();
      await v100.getByTestId('version-revert-btn').click();
      const revertDlg = page.getByRole('dialog', { name: '回滚版本' });
      await expect(revertDlg).toBeVisible();
      await revertDlg.getByRole('button', { name: '是' }).click();
      await expectToast(page, /成功回滚/);

      await gotoDesignModel(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await openRelationCanvas(page, '商城');
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(
        rfNode(page, 'T_TABLE_1').locator('.erd-field-name', { hasText: 'REMARK' }),
      ).toHaveCount(0, { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('无数据源也可新增版本并在列表可见', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('ver');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ver', 'version snapshot');
      await openVersionPage(page);
      // W3 切片 2：antd List 空态 CTA（与工具栏「新增版本」同一保存动作）
      await expect(page.getByTestId('version-list')).toBeVisible();
      const empty = page.getByTestId('version-empty');
      await expect(empty).toBeVisible();
      await expect(
        page.getByRole('button', { name: '保存第一个版本' }),
      ).toBeVisible();

      // ADR-0016：空态井对齐工作台列表 12×8；禁 16×12
      const emptyPad = await empty.evaluate((el) => {
        const well =
          (el.closest('.ant-list-empty-text') as HTMLElement | null) ||
          (el.parentElement as HTMLElement | null);
        if (!well) return { padY: -1, padX: -1 };
        const cs = getComputedStyle(well);
        return {
          padY: parseFloat(cs.paddingTop),
          padX: parseFloat(cs.paddingLeft),
        };
      });
      expect(
        emptyPad.padY,
        `版本空态 padY 应 ≤12（目标 12），得 ${emptyPad.padY}`,
      ).toBeLessThanOrEqual(12);
      expect(emptyPad.padY).toBeGreaterThanOrEqual(8);
      expect(
        emptyPad.padX,
        `版本空态 padX 应 ≤8（目标 8），得 ${emptyPad.padX}`,
      ).toBeLessThanOrEqual(8);
      expect(emptyPad.padX).toBeGreaterThanOrEqual(4);
      await page.screenshot({
        path: 'test-results/ux-walkthrough/version-empty-dense.png',
        fullPage: false,
      });

      await saveVersion(page);
      await expect(page.getByTestId('version-empty')).toHaveCount(0);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-compare-btn')).toBeDisabled();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('同步配置弹窗可保存升级方式', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('syncfg');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'syncfg', 'sync config');
      await openVersionPage(page);
      await page.getByRole('button', { name: '同步配置' }).click();
      const dlg = page.getByRole('dialog').filter({ hasText: '同步配置' });
      await expect(dlg).toBeVisible({ timeout: 10_000 });
      await dlg.getByRole('radio', { name: '重建数据表' }).check();
      // antd Modal okText 无障碍名为「确 定」（中间空格）
      await dlg.getByRole('button', { name: /确\s*定/ }).click();
      await expectToast(page, '设置成功');
      await expect(dlg).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('重建版本弹窗可打开（antd Modal+Form）', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('rebuild');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'rebuild', 'rebuild dialog');
      await openVersionPage(page);
      // 有版本后 init=false，「重建版本」才可点
      await saveVersion(page);
      const rebuildBtn = page.getByTestId('version-rebuild-btn');
      await expect(rebuildBtn).toBeEnabled({ timeout: 10_000 });
      await rebuildBtn.click();
      const dlg = page.getByRole('dialog').filter({ hasText: '重建版本' });
      await expect(dlg).toBeVisible({ timeout: 10_000 });
      await expect(dlg.getByRole('textbox', { name: '版本号' })).toBeVisible();
      await expect(dlg.getByRole('textbox', { name: '版本描述' })).toBeVisible();
      await dlg.getByRole('button', { name: /取\s*消/ }).click();
      await expect(dlg).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('版本页不再显示顶栏返回/工单/审批入口', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('verback');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'verback', 'back to model');

      await openVersionPage(page);
      await expect(page.getByTestId('version-back-to-model')).toHaveCount(0);
      await expect(page.getByTestId('version-nav-orders')).toHaveCount(0);
      await expect(page.getByTestId('version-nav-approvals')).toHaveCount(0);
      await expect(page.getByTestId('version-toolbar')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('保存多标签版本展示 chips 可筛选且标签可跨版本复用', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vertag');
    const tags = ['里程碑', 'release'];
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vertag', 'version tag');

      // 造一条模型变更，使列表同时出现「标签」chips 与「变更」摘要
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await page.waitForTimeout(2_000);

      await openVersionPage(page);
      await saveVersion(page, { tags });
      const row100 = page.getByTestId('version-row-1.0.0');
      await expect(row100).toBeVisible({ timeout: 10_000 });

      const tagsBox = row100.getByTestId('version-tags');
      const changeBox = row100.getByTestId('version-change-summary');
      await expect(tagsBox).toBeVisible();
      await expect(changeBox).toBeVisible();
      await expect(tagsBox).toContainText('标签');
      await expect(changeBox).toContainText('变更');
      await expect(tagsBox.getByTestId('version-tag-里程碑')).toBeVisible();
      await expect(tagsBox.getByTestId('version-tag-release')).toBeVisible();
      // 变更摘要是散文计数，不是 Tag chip 容器
      await expect(changeBox.getByTestId('version-tag-里程碑')).toHaveCount(0);
      await expect(changeBox).toContainText(/\+|−|~/);

      await page.getByTestId('version-tag-filter').fill('release');
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible();
      await page.getByTestId('version-tag-filter').fill('__no_such_tag__');
      await expect(page.getByTestId('version-row-1.0.0')).toHaveCount(0);
      await page.getByTestId('version-tag-filter').fill('');

      // 跨版本复用同一标签，不再拦截
      await saveVersion(page, { tags: ['release'] });
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible({ timeout: 10_000 });
      await page.getByTestId('version-tag-filter').fill('release');
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible();
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('重命名描述与删除版本有 toast 且行消失', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('verdel');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'verdel', 'rename delete');
      await openVersionPage(page);

      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });

      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible({ timeout: 10_000 });

      const row101 = page.getByTestId('version-row-1.0.1');
      await row101.hover();
      await row101.getByTestId('version-rename-btn').click();
      const renameDlg = page.getByRole('dialog').filter({ hasText: '编辑版本' });
      await expect(renameDlg).toBeVisible();
      await renameDlg.getByRole('textbox', { name: '版本号' }).fill('1.0.2');
      await renameDlg.getByRole('textbox', { name: '版本描述' }).fill('E2E 重命名描述');
      await renameDlg.getByRole('button', { name: /确\s*定/ }).click();
      await expectToast(page, /版本信息更新成功/);
      await expect(renameDlg).toHaveCount(0, { timeout: 10_000 });
      await expect(page.getByTestId('version-row-1.0.1')).toHaveCount(0, { timeout: 10_000 });
      const row102 = page.getByTestId('version-row-1.0.2');
      await expect(row102).toBeVisible({ timeout: 10_000 });
      await expect(row102.getByText('E2E 重命名描述')).toBeVisible({ timeout: 10_000 });

      await row102.hover();
      await row102.getByTestId('version-rename-btn').click();
      await expect(renameDlg).toBeVisible();
      await renameDlg.getByRole('textbox', { name: '版本号' }).fill('1.0.0');
      await renameDlg.getByRole('button', { name: /确\s*定/ }).click();
      await expectToast(page, /该版本号已经存在了/);
      await expect(renameDlg).toBeVisible();
      // X 关闭偶发被顶栏 GitHub stars iframe 挡点击；Escape 关 Modal
      await page.keyboard.press('Escape');
      await expect(renameDlg).toHaveCount(0, { timeout: 10_000 });
      await expect(page.getByTestId('version-row-1.0.2')).toBeVisible();

      const row100 = page.getByTestId('version-row-1.0.0');
      await row100.hover();
      await row100.getByTestId('version-delete-btn').click();
      const deleteDlg = page.getByRole('dialog', { name: '删除版本' });
      await expect(deleteDlg).toBeVisible();
      await deleteDlg.getByRole('button', { name: '是' }).click();
      await expectToast(page, /版本信息删除成功/);
      await expect(page.getByTestId('version-row-1.0.0')).toHaveCount(0, { timeout: 10_000 });
      await expect(page.getByTestId('version-row-1.0.2')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('版本行复刻弹窗可创建个人项目', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vercopy');
    const copyName = `${projectName}-fork`;
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vercopy', 'version copy');
      await openVersionPage(page);
      await saveVersion(page);

      const row = page.getByTestId('version-row-1.0.0');
      await expect(row).toBeVisible({ timeout: 10_000 });
      await row.hover();
      await row.getByTestId('project-copy-trigger').click();

      const dialog = page.getByRole('dialog', {
        name: '复刻为新项目(从当前版本创建新项目)',
      });
      await expect(dialog).toBeVisible();
      await dialog.getByPlaceholder('请输入项目名').fill(copyName);
      const tagSelect = dialog.getByTestId('project-copy-tags');
      const tagInput = tagSelect.locator('input');
      await tagInput.click();
      await tagInput.fill('');
      await page.keyboard.type('fork,');
      await expect(
        tagSelect.locator('.ant-select-selection-item').filter({ hasText: 'fork' }),
      ).toBeVisible();
      await dialog.getByPlaceholder('请输入项目描述').fill('fork from version');
      await dialog.getByRole('button', { name: /确\s*定/ }).click();

      await expectToast(page, /复刻成功/);
      await expect(dialog).toBeHidden({ timeout: 10_000 });

      await page.goto('/project/person');
      await expect(
        page.getByRole('link', { name: copyName, exact: true }).first(),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('版本列表行密度（22–28 chrome）', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('verdens');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'verdens', 'version density');
      await openVersionPage(page);
      await saveVersion(page);

      const row = page.getByTestId('version-row-1.0.0');
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-list')).toBeVisible();
      await expect(page.getByTestId('version-toolbar')).toBeVisible();

      // ADR-0016：版本行 pad/标题与 22–28 chrome 同阶；禁 8×12 + 16 标题松行
      const metrics = await row.evaluate((el) => {
        const cs = getComputedStyle(el);
        const title = el.querySelector('.version-row-title');
        const titleCs = title ? getComputedStyle(title) : null;
        return {
          padBlock: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
          padInline: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
          titleFont: titleCs ? parseFloat(titleCs.fontSize) : -1,
          titleLh: titleCs ? parseFloat(titleCs.lineHeight) : -1,
        };
      });
      expect(
        metrics.padBlock,
        `版本行 padding-block 合计应 ≤10（目标 4+4），得 ${metrics.padBlock}`,
      ).toBeLessThanOrEqual(10);
      expect(metrics.padBlock).toBeGreaterThanOrEqual(4);
      expect(
        metrics.padInline,
        `版本行 padding-inline 合计应 ≤20（目标 8+8），得 ${metrics.padInline}`,
      ).toBeLessThanOrEqual(20);
      expect(
        metrics.titleFont,
        `版本号字号应 ≤14（目标 13），得 ${metrics.titleFont}`,
      ).toBeLessThanOrEqual(14);
      expect(metrics.titleFont).toBeGreaterThanOrEqual(12);
      expect(
        metrics.titleLh,
        `版本号行高应 ≤24（目标 22），得 ${metrics.titleLh}`,
      ).toBeLessThanOrEqual(24);

      // 二次密度：工具条控件 ~24；禁 clip 图标；命中 ∈24–28；token 色
      const toolbarMetrics = await page.getByTestId('version-toolbar').evaluate((toolbar) => {
        const addBtn = toolbar.querySelector(
          '[data-testid="add-version-btn"]',
        ) as HTMLElement | null;
        const compareBtn = toolbar.querySelector(
          '[data-testid="version-compare-btn"]',
        ) as HTMLElement | null;
        const filter =
          (toolbar.querySelector(
            'input[aria-label="按标签筛选"]',
          ) as HTMLElement | null) ||
          (toolbar.querySelector('input') as HTMLElement | null);
        const select = toolbar.querySelector(
          '.ant-select-selector',
        ) as HTMLElement | null;
        if (!addBtn || !filter) {
          return {
            addH: -1,
            compareH: -1,
            filterH: -1,
            selectH: -1,
            addIconClipped: true,
            compareIconClipped: true,
            addColor: '',
            delColor: '',
            inkMuted: '',
          };
        }
        const eps = 1;
        const fullyIn = (inner: DOMRect, outer: DOMRect) =>
          inner.top >= outer.top - eps &&
          inner.bottom <= outer.bottom + eps &&
          inner.left >= outer.left - eps &&
          inner.right <= outer.right + eps;
        const iconIn = (host: HTMLElement | null) => {
          if (!host) return true;
          const icon = host.querySelector('.anticon, svg') as HTMLElement | null;
          if (!icon) return true;
          return fullyIn(icon.getBoundingClientRect(), host.getBoundingClientRect());
        };
        const probe = document.createElement('span');
        probe.className = 'version-row-changes__add';
        toolbar.appendChild(probe);
        const addColor = getComputedStyle(probe).color;
        probe.className = 'version-row-changes__del';
        const delColor = getComputedStyle(probe).color;
        probe.className = 'version-page__hint';
        const inkMuted = getComputedStyle(probe).color;
        probe.remove();
        return {
          addH: addBtn.getBoundingClientRect().height,
          compareH: compareBtn ? compareBtn.getBoundingClientRect().height : -1,
          filterH: filter.getBoundingClientRect().height,
          selectH: select ? select.getBoundingClientRect().height : -1,
          addIconClipped: !iconIn(addBtn),
          compareIconClipped: !iconIn(compareBtn),
          addColor,
          delColor,
          inkMuted,
        };
      });
      expect(
        toolbarMetrics.addH,
        `新增版本钮高应 ∈24–28，得 ${toolbarMetrics.addH}`,
      ).toBeGreaterThanOrEqual(24);
      expect(toolbarMetrics.addH).toBeLessThanOrEqual(28);
      expect(
        toolbarMetrics.compareH,
        `比对钮高应 ∈24–28，得 ${toolbarMetrics.compareH}`,
      ).toBeGreaterThanOrEqual(24);
      expect(toolbarMetrics.compareH).toBeLessThanOrEqual(28);
      expect(
        toolbarMetrics.filterH,
        `标签筛选高应 ∈22–28，得 ${toolbarMetrics.filterH}`,
      ).toBeGreaterThanOrEqual(22);
      expect(toolbarMetrics.filterH).toBeLessThanOrEqual(28);
      expect(
        toolbarMetrics.selectH,
        `数据源 Select 高应 ∈22–28，得 ${toolbarMetrics.selectH}`,
      ).toBeGreaterThanOrEqual(22);
      expect(toolbarMetrics.selectH).toBeLessThanOrEqual(28);
      expect(toolbarMetrics.addIconClipped, '新增版本图标不得裁切').toBe(false);
      expect(toolbarMetrics.compareIconClipped, '比对图标不得裁切').toBe(false);

      // chrome 碎色收口：增删摘要 / hint 走 --erd-*（非 antd 默认绿/红 / 裸 rgba）
      const tokenColors = await page.evaluate(() => {
        const cs = getComputedStyle(document.documentElement);
        return {
          success: cs.getPropertyValue('--erd-success').trim(),
          brand: cs.getPropertyValue('--erd-brand').trim(),
          ink600: cs.getPropertyValue('--erd-ink-600').trim(),
        };
      });
      const resolveRgb = async (token: string) =>
        page.evaluate((c) => {
          const el = document.createElement('span');
          el.style.color = c;
          document.body.appendChild(el);
          const rgb = getComputedStyle(el).color;
          el.remove();
          return rgb;
        }, token);
      const successRgb = await resolveRgb(tokenColors.success || '#2f8f7b');
      const brandRgb = await resolveRgb(tokenColors.brand || '#de2910');
      const ink600Rgb = await resolveRgb(tokenColors.ink600 || '#44525f');
      expect(toolbarMetrics.addColor).toBe(successRgb);
      expect(toolbarMetrics.delColor).toBe(brandRgb);
      expect(toolbarMetrics.inkMuted).toBe(ink600Rgb);

      // focus-visible：标签筛选 → Tab 进动作钮
      const tagFilter = page.getByLabel('按标签筛选');
      const addVersion = page.getByRole('button', { name: '新增版本' });
      await tagFilter.focus();
      await page.keyboard.press('Tab');
      await expect(addVersion).toBeFocused();
      const focusRing = await addVersion.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
        };
      });
      expect(focusRing.outlineStyle).not.toBe('none');
      expect(parseFloat(focusRing.outlineWidth)).toBeGreaterThanOrEqual(1);

      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-version-list-dense.png',
        fullPage: false,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
