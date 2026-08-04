import { expect, test } from '@playwright/test';
import { e2eAccount, expectToast, login } from './helpers';

/**
 * OAuth client 管理 UI（ADR-0013）：
 * /account/settings?selectKey=oauthClients → 列表/注册/复制 ID/secret 一次揭示/吊销。
 * 定位：getByRole / getByLabel / getByTestId；禁止 .ant-* 业务选择。
 */
test.describe('OAuth 客户端设置', () => {
  test.describe.configure({ retries: 1 });

  test('注册 confidential → 揭示 secret → 复制 ID → 吊销', async ({ page }) => {
    test.setTimeout(90_000);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=oauthClients');

    const panel = page.getByTestId('account-settings-oauth-clients');
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: 'OAuth 客户端', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '注册 OAuth 客户端' }),
    ).toBeVisible();

    // ADR-0016 密度：工具栏主钮 ≤32
    const createBtn = page.getByRole('button', { name: '注册 OAuth 客户端' });
    const btnH = await createBtn.evaluate((el) =>
      parseFloat(getComputedStyle(el).height),
    );
    expect(btnH, `注册钮高度应 ≤32（目标 28），得 ${btnH}`).toBeLessThanOrEqual(
      32,
    );
    expect(btnH).toBeGreaterThanOrEqual(24);

    const name = `e2e-oauth-${Date.now().toString(36)}`;
    await createBtn.click();
    const createDlg = page.getByRole('dialog', { name: '注册 OAuth 客户端' });
    await expect(createDlg).toBeVisible({ timeout: 10_000 });
    await createDlg.getByLabel('OAuth 客户端名称').fill(name);
    await expect(
      createDlg.getByRole('combobox', { name: '类型' }),
    ).toBeVisible();
    await createDlg.getByRole('button', { name: '确认注册 OAuth 客户端' }).click();

    await expectToast(page, 'OAuth 客户端已注册');
    const reveal = page.getByTestId('oauth-client-secret-reveal');
    await expect(reveal).toBeVisible({ timeout: 15_000 });
    await expect(reveal.getByRole('alert')).toContainText(
      /仅此一次|无法再查看/,
    );
    await expect(reveal.locator('code').first()).toHaveText(/^erd_cli_/);
    await expect(reveal.locator('code').nth(1)).toHaveText(/^erd_cs_/);

    await page.getByRole('button', { name: '复制新建 client_id' }).click();
    await expectToast(page, 'client_id 已复制');
    await page.getByRole('button', { name: '确认已保存 OAuth 凭证' }).click();
    await expect(reveal).toBeHidden({ timeout: 10_000 });

    const list = page.getByRole('list', { name: 'OAuth 客户端列表' });
    await expect(list.getByRole('heading', { name })).toBeVisible({
      timeout: 10_000,
    });
    const row = list.locator('li').filter({ hasText: name });
    await expect(row.getByText(/^erd_cli_/)).toBeVisible();
    await row.getByRole('button', { name: /复制 client_id/ }).click();
    await expectToast(page, 'client_id 已复制');

    await row.getByRole('button', { name: `吊销 OAuth 客户端 ${name}` }).click();
    const confirm = page
      .getByRole('dialog')
      .filter({ hasText: '吊销 OAuth 客户端？' });
    await expect(confirm).toBeVisible({ timeout: 10_000 });
    await confirm.getByRole('button', { name: /吊\s*销/ }).click();
    await expectToast(page, '已吊销');
    await expect(row.getByText('已吊销')).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: 'test-results/ux-walkthrough/account-settings-oauth-clients.png',
      fullPage: false,
    });
  });

  test('页签可达 + 空态文案', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=base');
    await expect(page.getByLabel('邮箱')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('menuitem', { name: 'OAuth 客户端' }).click();
    await expect(page).toHaveURL(/selectKey=oauthClients/);
    await expect(
      page.getByTestId('account-settings-oauth-clients'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/client_secret 明文仅创建时可见一次/),
    ).toBeVisible();
  });
});
