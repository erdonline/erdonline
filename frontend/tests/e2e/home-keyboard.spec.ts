import { expect, test } from '@playwright/test';
import {
  createPersonProject,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * Home 工作台键盘：Skip 进主区；CTA / 项目卡 Tab 序；focus-visible；无 trap
 */
test.describe('Home 工作台键盘', () => {
  // ADR-0016：HomeLayout Skip 绕开顶栏；主区 CTA 与项目卡 Tab 序；brand focus-visible
  test('Home 键盘：Skip→主内容；CTA/项目卡 Tab 序；focus-visible；无 trap', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await login(page, e2eAccount());

    // 保证有最近项目：「继续上次建模」进序 + 至少一张项目卡
    await page.goto('/project/person');
    const projectName = uniqueProjectName('home-kb');
    await createPersonProject(page, projectName, 'kb', 'home keyboard');

    await page.goto('/home');
    await expect(page.getByTestId('home-layout')).toBeVisible();
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('home-skip-main')).toHaveText('跳到主内容');
    await expect(page.getByTestId('home-main-content')).toHaveAttribute('tabindex', '-1');
    await expect(page.getByTestId('home-continue-modeling')).toBeEnabled({ timeout: 15_000 });
    await expect(page.getByTestId('home-project-card').first()).toBeVisible();

    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-skip-main')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('home-main-content')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-continue-modeling')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /新建模型/ })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '从示例开始' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '个人项目' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '最近项目' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '团队项目' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-link-import')).toBeFocused();

    // Tab 至首张项目卡（自然 DOM 序；可能中间还有其它可焦）
    let reachedCard = false;
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      if (await page.getByTestId('home-project-card').first().evaluate((el) => el === document.activeElement)) {
        reachedCard = true;
        break;
      }
    }
    expect(reachedCard).toBe(true);
    await expect(page.getByTestId('home-project-card').first()).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByTestId('home-project-card').first()).not.toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-project-card').first()).toBeFocused();

    // focus-visible brand 环（须经 Tab 触发 :focus-visible）
    await page.getByRole('button', { name: '从示例开始' }).focus();
    await page.keyboard.press('Shift+Tab');
    const newModel = page.getByRole('link', { name: /新建模型/ });
    await expect(newModel).toBeFocused();
    const ring = await newModel.evaluate((el) => {
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
    await page.goto('/home');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('home-skip-main')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'ERD Online 首页' })).toBeFocused();
  });
});
