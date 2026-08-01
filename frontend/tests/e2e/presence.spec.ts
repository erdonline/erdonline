import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

test.describe('协作 presence', () => {
  test('设计器顶栏可见在线名单', async ({ page }) => {
    test.setTimeout(90_000);
    const account = e2eAccount();
    await login(page, account);
    await page.goto('/project/person');
    await createAndOpenPersonProject(page, uniqueProjectName('presence'));
    const presence = page.getByTestId('collab-presence');
    await expect(presence).toBeVisible({ timeout: 20_000 });
    await expect(presence).toContainText(account.name, { timeout: 20_000 });
  });
});
