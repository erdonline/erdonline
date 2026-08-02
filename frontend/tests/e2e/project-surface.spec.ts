import { expect, test } from '@playwright/test';
import {
  clickAndExpectUrl,
  createPersonProject,
  deleteOwnPersonProjects,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * W2：项目面闭环（home 快捷、recent、/project/new redirect）
 */

test.describe('项目面闭环', () => {
  test('/project/new 重定向到个人项目', async ({ page }) => {
    await login(page);
    await page.goto('/project/new');
    await expect(page).toHaveURL(/\/project\/person/, { timeout: 15_000 });
    await expect(page.getByRole('button', { name: /新\s*建|立即创建/ }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Home hero：继续上次建模直达设计器', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('home-continue');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createPersonProject(page, projectName, 'home-continue', 'continue CTA');

      await page.goto('/home');
      const continueBtn = page.getByRole('button', { name: '继续上次建模' });
      await expect(continueBtn).toBeVisible({ timeout: 15_000 });
      await expect(continueBtn).toBeEnabled({ timeout: 15_000 });
      await continueBtn.click();
      await expect(page).toHaveURL(/\/design\/table\/model\?projectId=/, { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('首页快捷链：个人/最近/团队可达', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    await expect(page.getByTestId('home-link-new-project')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: '继续上次建模' })).toBeVisible();

    await clickAndExpectUrl(
      page,
      page.getByTestId('home-link-person'),
      /\/project\/person/,
    );
    await expect(page.getByText('个人项目').first()).toBeVisible();

    await page.goto('/home');
    await clickAndExpectUrl(
      page,
      page.getByTestId('home-link-recent'),
      /\/project\/recent/,
    );

    await page.goto('/home');
    await clickAndExpectUrl(
      page,
      page.getByTestId('home-link-group'),
      /\/project\/group/,
    );
  });

  test('最近项目：列表可见并可打开设计器', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('recent');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createPersonProject(page, projectName, 'recent', 'recent surface');

      await page.goto('/project/recent');
      await expect(page.getByRole('link', { name: projectName }).first()).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('link', { name: projectName }).first().click();
      await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('HomeLayout 主导航：数据模型 / 数据源', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    await page.getByRole('link', { name: '数据模型' }).click();
    await expect(page).toHaveURL(/\/dataModels/, { timeout: 15_000 });
    await expect(page.getByText('最近项目').first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole('link', { name: '数据源' }).click();
    await expect(page).toHaveURL(/\/databaseConfig/, { timeout: 15_000 });
  });

  test('个人项目：修改弹窗可改名并回列表', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('rename');
    const renamed = `${projectName}-renamed`;
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createPersonProject(page, projectName, 'rn', 'rename surface');

      const row = page
        .getByRole('listitem')
        .filter({ has: page.getByRole('link', { name: projectName, exact: true }) });
      await expect(row).toBeVisible({ timeout: 15_000 });
      await row.getByTestId('project-rename-trigger').click();

      const dialog = page.getByRole('dialog', { name: '修改项目' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByPlaceholder('请输入项目名')).toHaveValue(projectName);
      await dialog.getByPlaceholder('请输入项目名').fill(renamed);
      await dialog.getByPlaceholder('请输入项目描述').fill('renamed desc');
      await dialog.getByRole('button', { name: /确\s*定/ }).click();

      await expect(page.getByText('修改成功').first()).toBeVisible({ timeout: 10_000 });
      await expect(dialog).toBeHidden({ timeout: 10_000 });
      await expect(
        page.getByRole('link', { name: renamed, exact: true }).first(),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('link', { name: projectName, exact: true })).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
