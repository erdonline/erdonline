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
  uniqueProjectName,
} from './helpers';

/**
 * 版本快照零摩擦 + 版本 diff 可视化
 * 定位：e2e-locators
 */

async function saveVersion(
  page: import('@playwright/test').Page,
  opts?: { tags?: string[] },
) {
  await page.getByTestId('add-version-btn').click();
  const dialog = page.getByRole('dialog').filter({ hasText: '新增版本' });
  await expect(dialog).toBeVisible();
  if (opts?.tags?.length) {
    const tagInput = dialog.getByTestId('version-tag-input');
    for (const t of opts.tags) {
      await tagInput.click();
      await page.keyboard.type(t);
      await page.keyboard.press('Enter');
    }
  }
  await dialog.getByRole('button', { name: /确\s*定/ }).click();
  await expectToast(page, /保存成功/);
}

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
      await page.getByRole('button', { name: '是' }).click();
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
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-compare-btn')).toBeDisabled();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('返回模型可从版本页回到模型列表', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('verback');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'verback', 'back to model');
      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();

      await openVersionPage(page);
      const back = page.getByRole('button', { name: '返回模型' });
      await expect(back).toBeVisible();
      await expect(back).toBeEnabled();
      await back.click();
      await expect(page).toHaveURL(
        new RegExp(`/design/table/model\\?projectId=${projectId}`),
        { timeout: 15_000 },
      );
      // 新建空项目：模型页空态（尚无模块树，无 tree-open-relation）
      await expect(page.getByTestId('add-module-empty')).toBeVisible({ timeout: 15_000 });
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
      await renameDlg.getByRole('button', { name: /Close|关闭/ }).click();
      await expect(renameDlg).toHaveCount(0, { timeout: 10_000 });
      await expect(page.getByTestId('version-row-1.0.2')).toBeVisible();

      const row100 = page.getByTestId('version-row-1.0.0');
      await row100.hover();
      await row100.getByTestId('version-delete-btn').click();
      await page.getByRole('button', { name: '是' }).click();
      await expectToast(page, /版本信息删除成功/);
      await expect(page.getByTestId('version-row-1.0.0')).toHaveCount(0, { timeout: 10_000 });
      await expect(page.getByTestId('version-row-1.0.2')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
