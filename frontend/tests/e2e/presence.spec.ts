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
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});