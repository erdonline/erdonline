import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Space, Spin, Typography, message } from 'antd';
import { history, useLocation } from '@@/exports';
import AuthBrandShell from '@/components/AuthBrandShell';
import * as cache from '@/utils/cache';
import request from '@/utils/request';
import styles from './index.less';

export type OAuthConsentView = {
  clientId: string;
  clientName: string;
  clientType: string;
  scopes: string[];
  redirectUri: string;
  redirectHost: string;
};

type OAuthParams = {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
};

function parseParams(search: string): OAuthParams | null {
  const q = new URLSearchParams(search);
  const response_type = q.get('response_type') || '';
  const client_id = q.get('client_id') || '';
  const redirect_uri = q.get('redirect_uri') || '';
  const scope = q.get('scope') || '';
  const state = q.get('state') || '';
  const code_challenge = q.get('code_challenge') || '';
  const code_challenge_method = q.get('code_challenge_method') || '';
  if (
    !response_type ||
    !client_id ||
    !redirect_uri ||
    !state ||
    !code_challenge ||
    !code_challenge_method
  ) {
    return null;
  }
  return {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
  };
}

function loginRedirectPath(search: string): string {
  return `/login?redirect=${encodeURIComponent(`/oauth/authorize${search}`)}`;
}

async function postDecision(
  params: OAuthParams,
  decision: 'allow' | 'deny',
): Promise<string> {
  const res = await request('/auth/oauth/authorize', {
    method: 'POST',
    requestType: 'form',
    headers: {
      Accept: 'application/json',
    },
    data: {
      ...params,
      decision,
    },
    getResponse: false,
  });
  const redirectTo =
    res && typeof res === 'object' ? (res as { redirect_to?: string }).redirect_to : undefined;
  if (!redirectTo || typeof redirectTo !== 'string') {
    throw new Error('missing redirect_to');
  }
  return redirectTo;
}

/**
 * OAuth 同意页（ADR-0013）：展示 client / scopes / redirect host；
 * 仅 Allow 签发 erd_ac_；Deny → access_denied。
 */
export default () => {
  const location = useLocation();
  const params = useMemo(() => parseParams(location.search), [location.search]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'allow' | 'deny' | null>(null);
  const [consent, setConsent] = useState<OAuthConsentView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!params) {
      setError('缺少 OAuth 参数（response_type、client_id、redirect_uri、state、PKCE）');
      setLoading(false);
      return;
    }
    if (!cache.getItem('Authorization')) {
      history.replace(loginRedirectPath(location.search));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await request<OAuthConsentView>('/auth/oauth/authorize', {
        method: 'GET',
        params,
        getResponse: false,
      });
      if (!data?.clientId || !data?.clientName) {
        setError('无法加载授权信息');
        setConsent(null);
        return;
      }
      setConsent(data);
    } catch {
      setConsent(null);
      setError('无法加载授权信息，请确认客户端与 redirect_uri 已注册');
    } finally {
      setLoading(false);
    }
  }, [params, location.search]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const onDecide = async (decision: 'allow' | 'deny') => {
    if (!params || submitting) return;
    setSubmitting(decision);
    try {
      const redirectTo = await postDecision(params, decision);
      window.location.assign(redirectTo);
    } catch {
      message.error(decision === 'allow' ? '授权失败' : '拒绝失败');
      setSubmitting(null);
    }
  };

  return (
    <AuthBrandShell
      title="授权应用"
      subtitle="第三方应用请求访问你的 ERD Online 数据"
      skipLabel="跳到授权操作"
      skipTargetId="oauth-consent-actions"
    >
      <div className={styles.consent} data-testid="oauth-consent-page">
        {loading ? (
          <div className={styles.loading} role="status" aria-live="polite">
            <Spin />
            <span>加载授权请求…</span>
          </div>
        ) : null}

        {!loading && error ? (
          <Alert
            type="error"
            showIcon
            message="无法完成授权"
            description={error}
            action={
              <Button size="small" href="/account/settings?selectKey=oauthClients">
                管理 OAuth 客户端
              </Button>
            }
          />
        ) : null}

        {!loading && consent ? (
          <>
            <Typography.Paragraph className={styles.lead}>
              <strong>{consent.clientName}</strong>
              {' 请求访问你的账户'}
            </Typography.Paragraph>

            <dl className={styles.meta} data-testid="oauth-consent-meta">
              <div>
                <dt>应用</dt>
                <dd>
                  <span data-testid="oauth-consent-client-name">{consent.clientName}</span>
                  <Typography.Text type="secondary" className={styles.hint}>
                    {' '}
                    ({consent.clientType})
                  </Typography.Text>
                </dd>
              </div>
              <div>
                <dt>权限</dt>
                <dd>
                  <ul
                    className={styles.scopes}
                    aria-label="请求的权限"
                    data-testid="oauth-consent-scopes"
                  >
                    {(consent.scopes || []).map((s) => (
                      <li key={s}>
                        <code>{s}</code>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt>回调</dt>
                <dd>
                  <code data-testid="oauth-consent-redirect-host">
                    {consent.redirectHost || '—'}
                  </code>
                </dd>
              </div>
            </dl>

            <Space
              id="oauth-consent-actions"
              tabIndex={-1}
              className={styles.actions}
              size="middle"
              data-testid="oauth-consent-actions"
            >
              <Button
                danger
                disabled={!!submitting}
                loading={submitting === 'deny'}
                onClick={() => void onDecide('deny')}
                data-testid="oauth-consent-deny"
                aria-label="拒绝授权"
              >
                拒绝
              </Button>
              <Button
                type="primary"
                disabled={!!submitting}
                loading={submitting === 'allow'}
                onClick={() => void onDecide('allow')}
                data-testid="oauth-consent-allow"
                aria-label="允许授权"
                autoFocus
              >
                允许
              </Button>
            </Space>
            <Typography.Paragraph type="secondary" className={styles.footnote}>
              允许后将跳回第三方站点并签发一次性授权码。拒绝则按 OAuth 返回
              access_denied。
            </Typography.Paragraph>
          </>
        ) : null}
      </div>
    </AuthBrandShell>
  );
};
