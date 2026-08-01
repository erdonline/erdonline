import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

test.describe('协作 presence', () => {
  test('设计器顶栏可见在线名单', async ({ page }) => {
    test.setTimeout(90_000);
    const account = e2eAccount();
    const projectName = uniqueProjectName('presence');
    try {
      await login(page, account);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName);
      const presence = page.getByTestId('collab-presence');
      await expect(presence).toBeVisible({ timeout: 20_000 });
      await expect(presence).toContainText(account.name, { timeout: 20_000 });
      // 开源版不展示商业升级 CTA；顶栏仓库链指向 GitHub 而非旧 Gitee
      await expect(page.getByText('升级至尊版')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'GitHub 仓库' })).toHaveAttribute(
        'href',
        'https://github.com/erdonline/erdonline',
      );
      await expect(page.locator('a[href*="gitee.com/MARTIN-88"]')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});