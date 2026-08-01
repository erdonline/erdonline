import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  createPersonProject,
  deleteOwnPersonProjects,
  E2E_PASS,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * UX 走查（playwright-ux-audit）
 */

const SHOTS_DIR = path.join(__dirname, '..', '..', 'test-results', 'ux-walkthrough');

async function shot(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: false });
}

test.describe('UX 走查：核心旅程与不变量', () => {
  test('全旅程走查 + 死 affordance/账密泄露回归', async ({ page }) => {
    const consoleTexts: string[] = [];
    page.on('console', msg => consoleTexts.push(msg.text()));

    await login(page);
    await shot(page, '01-home');

    await page.goto('/project/person');
    const projectName = uniqueProjectName('ux');
    await createPersonProject(page, projectName, 'ux', 'ux audit');
    await shot(page, '02-project-person');

    await expect(page.getByRole('link', { name: projectName }).first()).toBeVisible();

    await page.goto('/project/recent');
    await expect(page.getByRole('link', { name: projectName }).first()).toBeVisible();
    await shot(page, '03-project-recent');

    await page.goto('/project/group');
    await shot(page, '04-project-group');
    // 同账号多 worker 时「最近项目」可能被其他用例挤出列表，只断言页可达
    await page.goto('/dataModels');
    await expect(page.getByText('最近项目')).toBeVisible({ timeout: 10_000 });
    await shot(page, '05-dataModels');

    await page.goto('/project/person');
    await page.getByRole('link', { name: projectName }).first().click();
    await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });
    await shot(page, '06-designer');

    await deleteOwnPersonProjects(page, projectName);
    await expect(page.getByRole('link', { name: projectName, exact: true })).toHaveCount(0);

    const leaked = consoleTexts.filter(
      (t) => t.includes(E2E_PASS) || t.includes(e2eAccount().name),
    );
    expect(leaked.length, `console 泄露明文账密: ${leaked.join(';')}`).toBe(0);
  });
});
