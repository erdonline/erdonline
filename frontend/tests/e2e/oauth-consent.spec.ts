import { expect, test } from '@playwright/test';
import { createHash, randomBytes } from 'crypto';
import { e2eAccount, login } from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';
/** 同源回调：避免外部端口 ERR_CONNECTION_REFUSED 打断 waitForURL */
const REDIRECT_URI = 'http://127.0.0.1:8000/oauth/e2e-cb';

function pkcePair() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

/**
 * OAuth 同意页（ADR-0013）：
 * `/oauth/authorize` AuthBrandShell — client/scopes/host + Allow/Deny。
 * Deny → redirect error=access_denied；Allow → erd_ac_。
 */
test.describe('OAuth 同意页', () => {
  test.describe.configure({ retries: 1 });

  test('展示元数据 → 拒绝 → access_denied；允许 → erd_ac_', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const account = e2eAccount();
    await login(page, account);

    const token = await page.evaluate(() =>
      window.localStorage.getItem('Authorization'),
    );
    expect(token, '会话 JWT').toBeTruthy();

    const name = `e2e-consent-${Date.now().toString(36)}`;
    const created = await request.post(`${API}/auth/oauth-clients`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        name,
        clientType: 'public',
        scopes: ['projects:read', 'versions:read'],
        redirectUris: [REDIRECT_URI],
      },
    });
    expect(created.ok(), await created.text()).toBeTruthy();
    const createdJson = await created.json();
    const clientId = createdJson?.data?.clientId as string;
    expect(clientId).toMatch(/^erd_cli_/);

    const { challenge } = pkcePair();
    const state = `st-${Date.now().toString(36)}`;
    const qs = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      scope: 'projects:read',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    await page.goto(`/oauth/authorize?${qs.toString()}`);
    const panel = page.getByTestId('oauth-consent-page');
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '授权应用', level: 3 }),
    ).toBeVisible();
    await expect(page.getByTestId('oauth-consent-client-name')).toHaveText(
      name,
    );
    await expect(page.getByTestId('oauth-consent-scopes')).toContainText(
      'projects:read',
    );
    await expect(page.getByTestId('oauth-consent-redirect-host')).toHaveText(
      '127.0.0.1:8000',
    );

    await page.screenshot({
      path: 'test-results/ux-walkthrough/oauth-authorize-consent.png',
      fullPage: false,
    });

    // Deny
    await Promise.all([
      page.waitForURL(
        (url) =>
          url.href.startsWith(REDIRECT_URI) &&
          url.searchParams.get('error') === 'access_denied' &&
          url.searchParams.get('state') === state,
        { timeout: 15_000, waitUntil: 'commit' },
      ),
      page.getByRole('button', { name: '拒绝授权' }).click(),
    ]);

    // Allow（新 PKCE / state）
    const allow = pkcePair();
    const allowState = `ok-${Date.now().toString(36)}`;
    const allowQs = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      scope: 'projects:read versions:read',
      state: allowState,
      code_challenge: allow.challenge,
      code_challenge_method: 'S256',
    });
    await page.goto(`/oauth/authorize?${allowQs.toString()}`);
    await expect(page.getByTestId('oauth-consent-allow')).toBeVisible({
      timeout: 15_000,
    });
    await Promise.all([
      page.waitForURL(
        (url) =>
          url.href.startsWith(REDIRECT_URI) &&
          (url.searchParams.get('code') || '').startsWith('erd_ac_') &&
          url.searchParams.get('state') === allowState,
        { timeout: 15_000, waitUntil: 'commit' },
      ),
      page.getByRole('button', { name: '允许授权' }).click(),
    ]);

    // 清理
    const id = createdJson?.data?.id as string;
    if (id) {
      await request.delete(`${API}/auth/oauth-clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test('未登录深链 → 登录后回到同意页', async ({ page, request }) => {
    test.setTimeout(90_000);
    const account = e2eAccount();
    // 先登录注册 client，再清会话测深链
    await login(page, account);
    const token = await page.evaluate(() =>
      window.localStorage.getItem('Authorization'),
    );
    const name = `e2e-consent-login-${Date.now().toString(36)}`;
    const created = await request.post(`${API}/auth/oauth-clients`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        name,
        clientType: 'public',
        scopes: ['projects:read'],
        redirectUris: [REDIRECT_URI],
      },
    });
    expect(created.ok()).toBeTruthy();
    const createdJson = await created.json();
    const clientId = createdJson?.data?.clientId as string;
    const id = createdJson?.data?.id as string;
    const { challenge } = pkcePair();
    const qs = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      scope: 'projects:read',
      state: 'login-roundtrip',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    await page.evaluate(() => window.localStorage.clear());
    await page.goto(`/oauth/authorize?${qs.toString()}`);
    await expect(page).toHaveURL(/\/login\?redirect=/, { timeout: 10_000 });
    await page.getByRole('textbox', { name: '用户名' }).fill(account.name);
    await page.getByRole('textbox', { name: '密码' }).fill(account.pass);
    await page.getByRole('button', { name: /登\s*录/ }).click();
    await expect(page).toHaveURL(new RegExp(`/oauth/authorize\\?`), {
      timeout: 15_000,
    });
    await expect(page.getByTestId('oauth-consent-client-name')).toHaveText(
      name,
      { timeout: 15_000 },
    );

    const tokenAfter = await page.evaluate(() =>
      window.localStorage.getItem('Authorization'),
    );
    if (id && tokenAfter) {
      await request.delete(`${API}/auth/oauth-clients/${id}`, {
        headers: { Authorization: `Bearer ${tokenAfter}` },
      });
    }
  });
});
