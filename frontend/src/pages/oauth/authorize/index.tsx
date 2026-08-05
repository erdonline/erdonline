import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Space, Spin, Typography, message } from 'antd';
import { history, useIntl, useLocation } from '@@/exports';
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
  /** OIDC optional; echoed into id_token on code exchange */
  nonce?: string;
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
  const nonce = q.get('nonce') || undefined;
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
  const params: OAuthParams = {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
  };
  if (nonce) {
    params.nonce = nonce;
  }
  return params;
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
  const intl = useIntl();
  const t = (id: string, values?: Record<string, string>) =>
    intl.formatMessage({ id }, values);
  const location = useLocation();
  const params = useMemo(() => parseParams(location.search), [location.search]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'allow' | 'deny' | null>(null);
  const [consent, setConsent] = useState<OAuthConsentView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!params) {
      setError(t('oauth.error.missingParams'));
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
        setError(t('oauth.error.loadFailed'));
        setConsent(null);
        return;
      }
      setConsent(data);
    } catch {
      setConsent(null);
      setError(t('oauth.error.loadFailedDetail'));
    } finally {
      setLoading(false);
    }
  }, [params, location.search, intl]);

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
      message.error(
        decision === 'allow' ? t('oauth.decision.allowFailed') : t('oauth.decision.denyFailed'),
      );
      setSubmitting(null);
    }
  };

  return (
    <AuthBrandShell
      title={t('oauth.title')}
      subtitle={t('oauth.subtitle')}
      skipLabel={t('oauth.skipLabel')}
      skipTargetId="oauth-consent-actions"
    >
      <div className={styles.consent} data-testid="oauth-consent-page">
        {loading ? (
          <div className={styles.loading} role="status" aria-live="polite">
            <Spin />
            <span>{t('oauth.loading')}</span>
          </div>
        ) : null}

        {!loading && error ? (
          <Alert
            type="error"
            showIcon
            message={t('oauth.error.bannerTitle')}
            description={error}
            action={
              <Button size="small" href="/account/settings?selectKey=oauthClients">
                {t('oauth.error.manageClients')}
              </Button>
            }
          />
        ) : null}

        {!loading && consent ? (
          <>
            <Typography.Paragraph className={styles.lead}>
              {t('oauth.consent.lead', { clientName: consent.clientName })}
            </Typography.Paragraph>

            <dl className={styles.meta} data-testid="oauth-consent-meta">
              <div>
                <dt>{t('oauth.consent.meta.application')}</dt>
                <dd>
                  <span data-testid="oauth-consent-client-name">{consent.clientName}</span>
                  <Typography.Text type="secondary" className={styles.hint}>
                    {' '}
                    ({consent.clientType})
                  </Typography.Text>
                </dd>
              </div>
              <div>
                <dt>{t('oauth.consent.meta.scopes')}</dt>
                <dd>
                  <ul
                    className={styles.scopes}
                    aria-label={t('oauth.consent.meta.scopesAria')}
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
                <dt>{t('oauth.consent.meta.redirect')}</dt>
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
                aria-label={t('oauth.consent.denyAria')}
              >
                {t('oauth.consent.deny')}
              </Button>
              <Button
                type="primary"
                disabled={!!submitting}
                loading={submitting === 'allow'}
                onClick={() => void onDecide('allow')}
                data-testid="oauth-consent-allow"
                aria-label={t('oauth.consent.allowAria')}
                autoFocus
              >
                {t('oauth.consent.allow')}
              </Button>
            </Space>
            <Typography.Paragraph type="secondary" className={styles.footnote}>
              {t('oauth.consent.footnote')}
            </Typography.Paragraph>
          </>
        ) : null}
      </div>
    </AuthBrandShell>
  );
};
