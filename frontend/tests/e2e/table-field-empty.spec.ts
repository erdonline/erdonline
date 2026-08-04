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
 * 空表字段引导：表设计字段签 + 画布空表 CTA（对称索引签空态）
 * — 清字段后见「还没有字段」+「添加第一个字段」；禁白屏死表 / 灰虚线埋 CTA
 */

type ErdE2E = {
  clearEntityFields?: (entityTitle: string) => boolean;
};

async function clearEntityFields(page: import('@playwright/test').Page, title: string) {
  const ok = await page.evaluate((entityTitle) => {
    const api = (window as Window & { __ERD_E2E__?: ErdE2E }).__ERD_E2E__;
    return api?.clearEntityFields?.(entityTitle) ?? false;
  }, title);
  expect(ok, `__ERD_E2E__.clearEntityFields(${title})`).toBe(true);
}

test.describe('空表字段引导', () => {
  test.describe.configure({ retries: 1 });

  test('表设计字段签空态 CTA：清字段→添加第一个字段', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('fldempty');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fldempty', 'field empty cta');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await clearEntityFields(page, 'T_TABLE_1');
      await expect(page.getByTestId('canvas-fields-empty')).toBeVisible({ timeout: 10_000 });

      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());
      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });
      await expect(fieldEdit.getByText('还没有字段')).toBeVisible();
      await expect(fieldEdit.getByRole('button', { name: '添加第一个字段' })).toBeVisible();

      await fieldEdit.getByRole('button', { name: '添加第一个字段' }).click();
      await expect(fieldEdit.getByTestId('field-empty-add')).toHaveCount(0);
      await expect(fieldEdit.getByTestId('field-unique-hint')).toBeVisible();
      await expect(fieldEdit.getByText('英文名*')).toBeVisible();
      // 默认种子为首个 defaultField（通常 id）；表设计签打开时关系图画布可能卸载，断言网格
      await expect(fieldEdit.getByRole('cell', { name: 'id', exact: true })).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('画布空表 CTA：清字段→添加第一个字段开内联新建', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('cvempty');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'cvempty', 'canvas field empty');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await clearEntityFields(page, 'T_TABLE_1');
      const empty = node.getByTestId('canvas-fields-empty');
      await expect(empty).toBeVisible({ timeout: 10_000 });
      await expect(empty.getByText('还没有字段')).toBeVisible();
      const cta = node.getByRole('button', { name: '添加第一个字段' });
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute('data-testid', 'canvas-add-field');

      // ADR-0016：空表虚线井碎距（measure：旧 pad10/margin6×8 → 6/4×6）；CTA minH ≥26（避 RF 缩放 getBoundingClientRect）
      const emptyDense = await empty.evaluate((el) => {
        const s = getComputedStyle(el);
        const btn = el.querySelector('[data-testid="canvas-add-field"]') as HTMLElement | null;
        const bs = btn ? getComputedStyle(btn) : null;
        return {
          gap: parseFloat(s.gap || '0'),
          padT: parseFloat(s.paddingTop),
          padX: parseFloat(s.paddingLeft),
          marginT: parseFloat(s.marginTop),
          marginX: parseFloat(s.marginLeft),
          ctaMinH: bs ? parseFloat(bs.minHeight) : -1,
        };
      });
      expect(emptyDense.padT, `空表井 padT 应 ≤6，得 ${emptyDense.padT}`).toBeLessThanOrEqual(6);
      expect(emptyDense.padX).toBeLessThanOrEqual(6);
      expect(emptyDense.gap).toBeLessThanOrEqual(4);
      expect(emptyDense.marginT).toBeLessThanOrEqual(4);
      expect(emptyDense.marginX).toBeLessThanOrEqual(6);
      expect(emptyDense.ctaMinH, `空表 CTA minH 应 ≥26，得 ${emptyDense.ctaMinH}`).toBeGreaterThanOrEqual(26);
      await page.screenshot({
        path: 'test-results/ux-walkthrough/diagram-table-fields-empty-dense.png',
        fullPage: false,
      });

      await cta.click();
      const editRow = node.locator('.erd-field-editing');
      await expect(editRow).toBeVisible({ timeout: 10_000 });
      await editRow.locator('.erd-field-input').fill('NAME');
      await editRow.locator('.erd-field-input').press('Enter');
      await expect(node.locator('[data-field="NAME"]')).toBeVisible({ timeout: 10_000 });
      await expect(node.getByTestId('canvas-fields-empty')).toHaveCount(0);
      await expect(node.getByRole('button', { name: '添加字段' })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
