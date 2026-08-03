import { expect, test } from '@playwright/test';
import { e2eAccount, login } from './helpers';

/**
 * 账号设置壳键盘：Skip 进主表单；字段/保存 Tab 序；focus-visible；无 trap
 */
test.describe('账号设置壳键盘', () => {
  // ADR-0016：HomeLayout 在 /account/settings 首 Skip「跳到主表单」绕开顶栏+侧栏
  test('账号键盘：Skip→主表单；字段/保存 Tab 序；focus-visible；无 trap', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=base');

    await expect(page.getByTestId('home-layout')).toBeVisible();
    await expect(page.getByTestId('account-settings-page')).toBeVisible();
    await expect(page.getByTestId('account-skip-form')).toHaveText('跳到主表单');
    await expect(page.getByTestId('account-settings-form')).toHaveAttribute(
      'tabindex',
      '-1',
    );
    await expect(page.getByLabel('邮箱')).toBeEnabled({ timeout: 15_000 });
    await expect(
      page.getByRole('button', { name: '更新基本信息' }),
    ).toBeVisible();

    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('account-skip-form')).toBeFocused({
      timeout: 5_000,
    });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('account-settings-form')).toBeFocused();

    // Skip 绕开顶栏与左侧页签；下一 Tab 进可编辑首字段（用户名 disabled 出序）
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('邮箱')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('联系电话')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: '更新基本信息' }),
    ).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByLabel('联系电话')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: '更新基本信息' }),
    ).toBeFocused();

    // focus-visible brand 环（须经 Tab 触发 :focus-visible；主操作保存钮）
    await page.getByLabel('联系电话').focus();
    await page.keyboard.press('Tab');
    const saveBtn = page.getByRole('button', { name: '更新基本信息' });
    await expect(saveBtn).toBeFocused();
    const ring = await saveBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineColor: cs.outlineColor,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
      };
    });
    expect(ring.outlineStyle).not.toBe('none');
    expect(parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(1);
    expect(ring.outlineColor).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);

    // 不按 Skip：DOM 序首焦后为品牌链（Skip 非唯一入口）
    await page.goto('/account/settings?selectKey=base');
    await expect(page.getByLabel('邮箱')).toBeEnabled({ timeout: 15_000 });
    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('account-skip-form')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'ERD Online 首页' })).toBeFocused();
  });
});
