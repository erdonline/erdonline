import { expect, test } from '@playwright/test';
import {
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  openVersionPage,
  saveVersion,
  uniqueProjectName,
} from './helpers';

/**
 * 推广链路：存版请求携带首触 UTM 归因 → 后端 version_attribution 表。
 * 本 spec 断言请求体 wiring；表命中由 curl + mysql 验收（见 CHANGELOG）。
 */
test.describe('归因 sink wiring', () => {
  test('存版 POST 携带 localStorage 首触 utm', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('attr');

    await login(page, e2eAccount());
    await page.goto('/home');
    await deleteOwnPersonProjects(page);

    await page.evaluate(() => {
      localStorage.setItem(
        'erd:attribution',
        JSON.stringify({
          utm_source: 'hn',
          utm_medium: 'show',
          utm_campaign: 'loop-test',
          landing: '/',
          ts: Date.now(),
        }),
      );
    });

    let attributionSeen = false;
    await page.route('**/ncnb/hisProject/save', async (route) => {
      const body = route.request().postDataJSON() as {
        attribution?: { utm_source?: string; utm_medium?: string };
      };
      if (body?.attribution?.utm_source === 'hn' && body?.attribution?.utm_medium === 'show') {
        attributionSeen = true;
      }
      await route.continue();
    });

    await page.getByTestId('project-create-trigger').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder('请输入项目名').fill(projectName);
    await dialog.getByPlaceholder('请输入项目描述').fill('attribution sink');
    await dialog.getByRole('button', { name: /确\s*定/ }).click();
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 15_000 });

    await page
      .getByRole('listitem')
      .filter({ has: page.getByRole('link', { name: projectName, exact: true }) })
      .getByTestId('open-project')
      .click();
    await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });

    await openVersionPage(page);
    await saveVersion(page);

    expect(attributionSeen).toBe(true);
  });
});
