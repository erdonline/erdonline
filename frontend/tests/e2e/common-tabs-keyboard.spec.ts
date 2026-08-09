import { expect, test } from '@playwright/test';
import {
  addEntityViaTreeFolder,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * CommonTabs（已打开实体签）键盘闭环
 * — ←/→ roving 切签；关闭钮「关闭 {表名}」；关签后焦点归还；focus-visible
 * — 定位：role=tab / role=button「关闭 …」/ testid=common-tabs（勿扫 `.ant-*`）
 */

test.describe('CommonTabs 签头键盘', () => {
  test('方向键切签；关闭可及名；关签焦点归还；focus-visible', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('ctabs-kb');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);

      await page.getByTestId('add-module-empty').click();
      await page.getByTestId('entity-modal-name').fill('SHOP');
      await page.getByTestId('entity-modal-chnname').fill('商城');
      await page.getByTestId('entity-modal-ok').click();
      await expect(page.getByTestId('tree-open-relation')).toHaveCount(1);

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(page.getByRole('tree').getByText('T_ORDER', { exact: true })).toBeVisible({
        timeout: 10_000,
      });

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_USER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(page.getByRole('tree').getByText('T_USER', { exact: true })).toBeVisible({
        timeout: 10_000,
      });

      // 建表会直开关系图；用树节点「表操作」开两张表设计签（多表时勿裸 getByLabel）
      await page
        .getByRole('treeitem', { name: /T_ORDER/ })
        .getByTestId('tree-node-menu')
        .click();
      await page.getByRole('menu').last().getByRole('menuitem', { name: '编辑表' }).click();
      await expect(page.getByTestId('table-design')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('table-design-header')).toContainText('T_ORDER');

      await page
        .getByRole('treeitem', { name: /T_USER/ })
        .getByTestId('tree-node-menu')
        .click();
      await page.getByRole('menu').last().getByRole('menuitem', { name: '编辑表' }).click();
      await expect(page.getByTestId('table-design-header')).toContainText('T_USER');

      const strip = page.getByTestId('common-tabs');
      await expect(strip).toBeVisible();
      await expect(page.getByRole('navigation', { name: '已打开的签页' })).toBeVisible();

      // rc-tabs 聚焦时 accessible name 会变成「Tab N of M {表名}」；关闭钮也是 role=tab「关闭 …」
      const entityTab = (entity: string) =>
        strip.getByRole('tab', {
          name: new RegExp(`^(?:Tab \\d+ of \\d+ )?${entity}$`),
        });
      const tabOrder = entityTab('T_ORDER');
      const tabUser = entityTab('T_USER');
      await expect(tabOrder).toBeVisible();
      await expect(tabUser).toBeVisible();
      await expect(tabUser).toHaveAttribute('aria-selected', 'true');

      // roving：←/→ 只移焦点；Enter 才激活（rc-tabs 手动激活）
      await tabUser.focus();
      await expect(tabUser).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await expect(tabOrder).toBeFocused();
      await expect(tabUser).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('Enter');
      await expect(tabOrder).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByTestId('table-design-header')).toContainText('T_ORDER');

      await page.keyboard.press('ArrowRight');
      await expect(tabUser).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(tabUser).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByTestId('table-design-header')).toContainText('T_USER');

      // 关闭钮「关闭 T_USER」（testid；rc-tabs 关闭 role=tab 非 button）
      const closeUser = page.getByTestId('common-tab-close-T_USER');
      await expect(closeUser).toBeVisible();
      await expect(closeUser).toHaveAttribute('aria-label', '关闭 T_USER');
      await tabUser.focus();
      await page.keyboard.press('Tab');
      await expect(closeUser).toBeFocused();
      const ring = await closeUser.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
        };
      });
      expect(ring.outlineStyle).not.toBe('none');
      expect(Number.parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(1);

      // Enter 关签 → 剩余 T_ORDER 选中且焦点归还签/工作区（不落 body）
      await page.keyboard.press('Enter');
      await expect(entityTab('T_USER')).toHaveCount(0);
      await expect(page.getByTestId('common-tab-close-T_USER')).toHaveCount(0);
      await expect(tabOrder).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByTestId('table-design-header')).toContainText('T_ORDER');
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const ae = document.activeElement as HTMLElement | null;
            if (!ae || ae === document.body) return 'BODY';
            if (ae.closest('[data-testid="common-tabs"]')) return 'TABS';
            if (ae.id === 'erd-design-workspace') return 'WORKSPACE';
            return ae.getAttribute('data-testid') || ae.tagName;
          }),
        )
        .toMatch(/^(TABS|WORKSPACE)$/);

      // 内签方向键：←/→ 移焦 + Enter 激活（与外签同构）
      const designer = page.getByTestId('table-design');
      const innerTab = (name: string) =>
        designer.getByRole('tab', {
          name: new RegExp(`^(?:Tab \\d+ of \\d+ )?${name}$`),
        });
      const fieldTab = innerTab('字段');
      const indexTab = innerTab('索引');
      await fieldTab.focus();
      await page.keyboard.press('ArrowRight');
      await expect(indexTab).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(indexTab).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('ArrowLeft');
      await expect(fieldTab).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(fieldTab).toHaveAttribute('aria-selected', 'true');
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
