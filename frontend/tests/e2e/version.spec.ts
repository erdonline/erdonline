import { expect, test } from '@playwright/test';
import { deleteAllPersonProjects, login } from './helpers';

/**
 * 版本快照零摩擦 + 版本 diff 可视化（北极星：有版本保存的活跃项目）。
 */

async function createPersonProject(
  page: import('@playwright/test').Page,
  projectName: string,
  desc: string,
) {
  await page.getByRole('button', { name: /新\s*建/ }).click();
  await page.getByPlaceholder('请输入项目名').fill(projectName);
  await page.locator('.ant-modal .ant-select').first().click();
  await page.locator('.ant-select-item-option', { hasText: '个人项目' }).click();
  await page.locator('.ant-modal .ant-select').nth(1).click();
  await page.keyboard.type('ver');
  await page.keyboard.press('Enter');
  await page.getByPlaceholder('请输入项目描述').fill(desc);
  await page.locator('.ant-modal').getByRole('button', { name: /确\s*定/ }).click();
  await expect(page.getByText(projectName).first()).toBeVisible();
  await page.getByRole('button', { name: '打开模型' }).first().click();
  await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });
}

async function openVersionPage(page: import('@playwright/test').Page) {
  // exact：避免「版本」子串命中「版本管理」
  await page.getByRole('menuitem', { name: '版本', exact: true }).click();
  await page.getByRole('link', { name: '版本管理' }).click();
  await expect(page).toHaveURL(/\/design\/table\/version\/all/, { timeout: 15_000 });
  await expect(page.getByText('Loading...')).toHaveCount(0);
  await expect(page.getByTestId('add-version-btn')).toBeVisible({ timeout: 15_000 });
}

async function saveVersion(page: import('@playwright/test').Page) {
  await page.getByTestId('add-version-btn').click();
  const modal = page.locator('.ant-modal:visible').last();
  await expect(modal.getByText('新增版本')).toBeVisible();
  await modal.getByRole('button', { name: /确\s*定/ }).click();
  await expect(page.locator('.ant-message')).toContainText(/保存成功/, { timeout: 15_000 });
}

test.describe('版本快照', () => {
  test('无数据源也可新增版本并在列表可见', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = `ver-${Date.now()}`;
    try {
      await login(page);
      await deleteAllPersonProjects(page);
      await createPersonProject(page, projectName, 'version snapshot');
      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByText('1.0.0').first()).toBeVisible({ timeout: 10_000 });
      // 仅一版时比对入口禁用，避免静默空窗
      await expect(page.getByTestId('version-compare-btn')).toBeDisabled();
    } finally {
      await deleteAllPersonProjects(page).catch(() => {});
    }
  });

  test('模型变更后详情展示可视化 diff（增删改着色）', async ({ page }) => {
    test.setTimeout(180_000);
    const projectName = `vdiff-${Date.now()}`;
    try {
      await login(page);
      await deleteAllPersonProjects(page);
      await createPersonProject(page, projectName, 'version diff');

      // 建模块 → 关系图 → 空态建表（与 relation.spec 同路径）
      await page.getByRole('button', { name: /新增模型/ }).click();
      const moduleModal = page.locator('.ant-modal:visible').last();
      await moduleModal.locator('input').first().fill('SHOP');
      await moduleModal.locator('input').nth(1).fill('商城');
      await moduleModal.getByRole('button', { name: /确\s*定/ }).click();
      await expect(page.locator('.ant-tree')).toContainText('商城');

      const expandNode = async (exactTitle: string) => {
        const node = page
          .locator('.ant-tree-treenode', {
            has: page.getByText(exactTitle, { exact: true }),
          })
          .first();
        await node.locator('.ant-tree-switcher').first().click();
        await page.waitForTimeout(400);
      };
      await expandNode('商城');
      await expandNode('关系');
      await page.locator('.ant-tree [class*=title]', { hasText: '关系图' }).last().click();
      await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10_000 });
      await page.locator('.erd-empty-button').click();
      await expect(page.locator('.react-flow__node', { hasText: 'T_TABLE_1' })).toBeVisible();
      await page.waitForTimeout(2_000); // 自动保存落库

      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByText('1.0.0').first()).toBeVisible({ timeout: 10_000 });
      // 列表行内变更摘要（首版相对空模型应有新增）
      await expect(page.getByTestId('version-change-summary').first()).toBeVisible({
        timeout: 5_000,
      });

      // 悬停行以 setCurrentVersion，再开详情
      const row = page.locator('.ant-list-item', { hasText: '1.0.0' }).first();
      await row.hover();
      await row.getByTestId('version-detail-btn').click();
      await expect(page.getByText('版本变更详情')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-diff-panel')).toBeVisible();
      await expect(page.getByTestId('version-diff-summary')).toBeVisible();
      await expect(page.getByTestId('version-diff-item-add').first()).toBeVisible();
      await expect(page.getByTestId('version-diff-panel')).toContainText('T_TABLE_1');
      // ModalForm 自定义 footer 无取消键，点右上角关闭
      await page.locator('.ant-modal-close').click();
      await expect(page.getByText('版本变更详情')).toHaveCount(0);

      // 回模型树再改字段，存第二版 →「版本比对」
      await page.getByRole('menuitem', { name: '模型', exact: true }).click();
      await expect(page.locator('.ant-tree')).toBeVisible({ timeout: 10_000 });
      await expandNode('商城');
      await expandNode('关系');
      await page.locator('.ant-tree [class*=title]', { hasText: '关系图' }).last().click();
      await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10_000 });
      const node = page.locator('.react-flow__node', { hasText: 'T_TABLE_1' });
      await node.locator('.erd-field-add').click();
      const editRow = node.locator('.erd-field-editing');
      await editRow.locator('.erd-field-type-select').selectOption('String');
      await editRow.locator('.erd-field-input').fill('REMARK');
      await editRow.locator('.erd-field-input').press('Enter');
      await expect(node.locator('.erd-field-name', { hasText: 'REMARK' })).toBeVisible();
      await page.waitForTimeout(2_000);

      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByText('1.0.1').first()).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-compare-btn')).toBeEnabled();
      await page.getByTestId('version-compare-btn').click();
      await expect(page.getByText('任意版本比较')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-diff-panel')).toBeVisible();
      await expect(page.getByTestId('version-diff-item-add').first()).toBeVisible();
      await expect(page.getByTestId('version-diff-panel')).toContainText(/REMARK|T_TABLE_1/);
    } finally {
      await deleteAllPersonProjects(page).catch(() => {});
    }
  });
});
