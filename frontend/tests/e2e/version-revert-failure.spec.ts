import { expect, test } from '@playwright/test';
import {
  addFieldInline,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
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
 * 版本回滚：禁止本地 setModules 即关窗/成功 toast；
 * 仅 project/save code===200 写 store；失败 toast + 窗仍开，模型不变，可重试
 */

test.describe('版本回滚落盘失败可重试', () => {
  test('回滚业务码失败：可读 toast + 窗仍开 + 模型未回退 → 重试成功', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const projectName = uniqueProjectName('vrevert-fail');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vrf', 'version revert fail');

      await openRelationFromEmpty(page, { name: 'SHOP', chnname: '商城' });
      await page.getByTestId('canvas-empty-create').click();
      await expect(page.getByText('T_TABLE_1').first()).toBeVisible({ timeout: 15_000 });

      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });

      await gotoDesignModel(page);
      await openRelationCanvas(page, '商城');
      await addFieldInline(page, 'T_TABLE_1', 'REMARK');
      await page.waitForTimeout(2_000);

      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible({ timeout: 10_000 });

      let revertSaveHits = 0;
      await page.route('**/ncnb/project/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        let hasRemark = true;
        try {
          const raw = route.request().postData();
          const body = raw ? JSON.parse(raw) : {};
          const modules =
            body?.projectJSON?.modules ?? body?.data?.projectJSON?.modules;
          hasRemark = JSON.stringify(modules ?? []).includes('REMARK');
        } catch {
          hasRemark = true;
        }
        // 回滚 payload 不含 REMARK；勿误伤含 REMARK 的 autosave
        if (hasRemark) {
          await route.continue();
          return;
        }
        revertSaveHits += 1;
        if (revertSaveHits === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, msg: '模拟回滚保存拒绝' }),
          });
          return;
        }
        await route.continue();
      });

      try {
        const v100 = page.getByTestId('version-row-1.0.0');
        await v100.hover();
        await v100.getByRole('button', { name: '回滚版本' }).click();
        const dialog = page.getByRole('dialog', { name: '回滚版本' });
        await expect(dialog).toBeVisible({ timeout: 10_000 });

        await dialog.getByRole('button', { name: '是' }).click();
        await expectToast(page, '模拟回滚保存拒绝');
        await expect(dialog).toBeVisible();
        await expect(page.getByText(/成功回滚/)).toHaveCount(0);

        // 关窗后核对：失败不得改画布（仍有 REMARK）
        await dialog.getByRole('button', { name: '否' }).click();
        await expect(dialog).toHaveCount(0);
        await gotoDesignModel(page);
        await openRelationCanvas(page, '商城');
        await expect(
          rfNode(page, 'T_TABLE_1').locator('.erd-field-name', { hasText: 'REMARK' }),
        ).toBeVisible({ timeout: 15_000 });

        await openVersionPage(page);
        await page.getByTestId('version-row-1.0.0').hover();
        await page
          .getByTestId('version-row-1.0.0')
          .getByRole('button', { name: '回滚版本' })
          .click();
        const retryDlg = page.getByRole('dialog', { name: '回滚版本' });
        await expect(retryDlg).toBeVisible({ timeout: 10_000 });
        await retryDlg.getByRole('button', { name: '是' }).click();
        await expectToast(page, /成功回滚/);
        await expect(retryDlg).toHaveCount(0);
        expect(revertSaveHits).toBeGreaterThanOrEqual(2);

        await gotoDesignModel(page);
        await openRelationCanvas(page, '商城');
        await expect(
          rfNode(page, 'T_TABLE_1').locator('.erd-field-name', { hasText: 'REMARK' }),
        ).toHaveCount(0, { timeout: 15_000 });
      } finally {
        await page.unroute('**/ncnb/project/save').catch(() => {});
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
