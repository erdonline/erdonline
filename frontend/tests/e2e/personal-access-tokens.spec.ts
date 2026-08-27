import { expect, test } from '@playwright/test';
import { e2eAccount, expectToast, login } from './helpers';

/**
 * PAT 管理 UI（ADR-0013）：
 * /account/settings?selectKey=personalAccessTokens → 列表/铸造/scopes/明文一次揭示/吊销。
 * 定位：getByRole / getByLabel / getByTestId；禁止 .ant-* 业务选择。
 */
test.describe('访问令牌设置', () => {
  test.describe.configure({ retries: 1 });

  test('铸造 → 揭示 token → 复制 → 吊销', async ({ page }) => {
    test.setTimeout(90_000);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=personalAccessTokens');

    const panel = page.getByTestId('account-settings-personal-access-tokens');
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: '访问令牌', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '铸造访问令牌' }),
    ).toBeVisible();

    // ADR-0016 密度：工具栏主钮 ≤32
    const createBtn = page.getByRole('button', { name: '铸造访问令牌' });
    const btnH = await createBtn.evaluate((el) =>
      parseFloat(getComputedStyle(el).height),
    );
    expect(btnH, `铸造钮高度应 ≤32（目标 28），得 ${btnH}`).toBeLessThanOrEqual(
      32,
    );
    expect(btnH).toBeGreaterThanOrEqual(24);

    const name = `e2e-pat-${Date.now().toString(36)}`;
    await createBtn.click();
    const createDlg = page.getByRole('dialog', { name: '铸造访问令牌' });
    await expect(createDlg).toBeVisible({ timeout: 10_000 });
    await createDlg.getByLabel('访问令牌名称').fill(name);
    await expect(createDlg.getByText('projects:read')).toBeVisible();
    await expect(
      createDlg.getByRole('combobox', { name: /有效期/ }),
    ).toBeVisible();
    await createDlg.getByRole('button', { name: '确认铸造访问令牌' }).click();

    await expectToast(page, '访问令牌已铸造');
    const reveal = page.getByTestId('pat-token-reveal');
    await expect(reveal).toBeVisible({ timeout: 15_000 });
    await expect(reveal.getByRole('alert')).toContainText(
      /仅此一次|无法再查看/,
    );
    await expect(reveal.locator('code').first()).toHaveText(/^erd_pat_/);

    const mcp = reveal.getByTestId('pat-mcp-json');
    await expect(mcp).toBeVisible();
    await expect(mcp).toContainText('"mcpServers"');
    await expect(mcp).toContainText('"command": "npx"');
    await expect(mcp).toContainText('--package');
    await expect(mcp).toContainText('erdonline-mcp-0.1.0.tgz');
    await expect(mcp).toContainText('erd-mcp');
    const tokenText = (await reveal.locator('code').first().innerText()).trim();
    await expect(mcp).toContainText(tokenText);
    await expect(mcp).toContainText('127.0.0.1:9502');
    await expect(page.getByTestId('pat-mcp-docs')).toHaveAttribute(
      'href',
      'https://doc.erdonline.com/docs/guide/api-and-mcp/',
    );

    await page.getByRole('button', { name: '复制新建访问令牌' }).click();
    await expectToast(page, '访问令牌已复制');
    await page.getByTestId('pat-copy-mcp-json').click();
    await expectToast(page, 'mcp.json 已复制');
    await page.getByRole('button', { name: '确认已保存访问令牌' }).click();
    await expect(reveal).toBeHidden({ timeout: 10_000 });

    const list = page.getByRole('list', { name: '访问令牌列表' });
    await expect(list.getByRole('heading', { name })).toBeVisible({
      timeout: 10_000,
    });
    const row = list.locator('li').filter({ hasText: name });
    await expect(row.getByText(/…/)).toBeVisible();

    await row.getByRole('button', { name: `吊销访问令牌 ${name}` }).click();
    const confirm = page
      .getByRole('dialog')
      .filter({ hasText: '吊销访问令牌？' });
    await expect(confirm).toBeVisible({ timeout: 10_000 });
    await confirm.getByRole('button', { name: /吊\s*销/ }).click();
    await expectToast(page, '已吊销');
    await expect(row.getByText('已吊销')).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: 'test-results/ux-walkthrough/account-settings-personal-access-tokens.png',
      fullPage: false,
    });
  });

  test('页签可达 + 空态文案', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, e2eAccount());
    await page.goto('/account/settings?selectKey=base');
    await expect(page.getByLabel('邮箱')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('menuitem', { name: '访问令牌' }).click();
    await expect(page).toHaveURL(/selectKey=personalAccessTokens/);
    await expect(
      page.getByTestId('account-settings-personal-access-tokens'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/明文仅铸造时可见一次/),
    ).toBeVisible();
  });
});

/**
 * 铸造揭示弹层内嵌 mcp.json（growth 切片 4）。
 * 不依赖本机 9502：假会话 + 拦截 PAT GET/POST（与 home-mcp.spec 同构）。
 */
test.describe('PAT 揭示 mcp.json（假会话）', () => {
  test('铸造后可见可复制 mcp.json', async ({ page }) => {
    const token = 'erd_pat_e2e_mcp_secret';
    const created = {
      id: 'pat-e2e-1',
      name: 'e2e-mcp',
      scopes: ['projects:read', 'versions:read'],
      token,
      tokenHint: 'cret',
      revoked: false,
    };
    let minted = false;
    const ok = (data: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data }),
    });

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      localStorage.setItem('Authorization', 'e2e-pat-mcp');
      localStorage.setItem('username', 'e2e');
    });
    await page.route('**/auth/personal-access-tokens**', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        minted = true;
        await route.fulfill(ok(created));
        return;
      }
      if (method === 'GET') {
        await route.fulfill(
          ok(minted ? [{id: created.id, name: created.name, scopes: created.scopes, tokenHint: created.tokenHint, revoked: false}] : []),
        );
        return;
      }
      await route.fulfill(ok(null));
    });
    await page.route('**/syst/**', async (route) => {
      await route.fulfill(ok({username: 'e2e', avatar: '', records: [], total: 0}));
    });

    await page.goto('/account/settings?selectKey=personalAccessTokens');
    const panel = page.getByTestId('account-settings-personal-access-tokens');
    await expect(panel).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('pat-create-trigger').click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByLabel(/访问令牌名称|Token name/)).toBeVisible({
      timeout: 10_000,
    });
    await dlg.getByLabel(/访问令牌名称|Token name/).fill('e2e-mcp');
    await dlg.getByRole('button', { name: /确认铸造|Confirm create/ }).click();

    const reveal = page.getByTestId('pat-token-reveal');
    await expect(reveal).toBeVisible({ timeout: 15_000 });
    const mcp = reveal.getByTestId('pat-mcp-json');
    await expect(mcp).toBeVisible();
    await expect(mcp).toContainText('"mcpServers"');
    await expect(mcp).toContainText('"command": "npx"');
    await expect(mcp).toContainText('--package');
    await expect(mcp).toContainText('erdonline-mcp-0.1.0.tgz');
    await expect(mcp).toContainText('erd-mcp');
    await expect(mcp).toContainText(token);
    await expect(mcp).toContainText('127.0.0.1:9502');
    await expect(page.getByTestId('pat-mcp-docs')).toHaveAttribute(
      'href',
      'https://doc.erdonline.com/docs/guide/api-and-mcp/',
    );
    await page.getByTestId('pat-copy-mcp-json').click();
    await expectToast(page, /mcp\.json/);
  });
});
