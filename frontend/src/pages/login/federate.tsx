import React, {useEffect, useState} from 'react';
import {Button, message, Spin} from 'antd';
import {useIntl} from '@umijs/max';
import * as cache from '@/utils/cache';
import {history, Link} from '@@/exports';
import request from '@/utils/request';
import AuthBrandShell from '@/components/AuthBrandShell';

type TokenBody = {
  access_token?: string;
  username?: string;
  licensedTo?: string;
  licensedStartTime?: string;
  licensedEndTime?: string;
  msg?: string;
};

/**
 * ADR-0021：IdP 回调后经短票落地 — `?ticket=` → POST `/auth/federate/session` → 会话 JWT。
 */
export default () => {
  const intl = useIntl();
  const [status, setStatus] = useState(() =>
    intl.formatMessage({ id: 'federate.status.processing' }),
  );
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const ticket = params.get('ticket');
      const redirect = params.get('redirect');
      const error = params.get('error');
      if (error && !ticket) {
        setFailure(error);
        setStatus(intl.formatMessage({ id: 'federate.status.failed' }));
        message.error(error);
        return;
      }
      if (!ticket) {
        setStatus(intl.formatMessage({ id: 'federate.status.missingTicket' }));
        message.error(intl.formatMessage({ id: 'federate.error.missingTicket' }));
        history.replace('/login');
        return;
      }
      try {
        const res = (await request.post(
          `/auth/federate/session?ticket=${encodeURIComponent(ticket)}`,
        )) as TokenBody;
        if (cancelled) {
          return;
        }
        if (!res?.access_token) {
          message.error(res?.msg || intl.formatMessage({ id: 'federate.error.failed' }));
          history.replace('/login');
          return;
        }
        cache.setItem('Authorization', res.access_token);
        if (res.username) {
          cache.setItem('username', res.username);
        }
        if (res.licensedStartTime && res.licensedEndTime) {
          cache.setItem('licence', {
            licensedTo: res.licensedTo,
            licensedStartTime: res.licensedStartTime,
            licensedEndTime: res.licensedEndTime,
          });
        }
        if (redirect && redirect.startsWith('/')) {
          history.replace(redirect);
        } else {
          history.replace('/home');
        }
      } catch {
        if (!cancelled) {
          message.error(intl.formatMessage({ id: 'federate.error.failed' }));
          history.replace('/login');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [intl]);

  return (
    <AuthBrandShell
      title={intl.formatMessage({ id: 'federate.title' })}
      skipLabel={intl.formatMessage({ id: 'federate.skipLabel' })}
      footer={null}
    >
      <div
        role="status"
        aria-live="polite"
        data-testid="federate-login-status"
        style={{ textAlign: 'center' }}
      >
        {!failure && <Spin />}
        <p style={{ marginTop: 16 }}>{status}</p>
        {failure && (
          <div data-testid="federate-login-failure" style={{ marginTop: 24, textAlign: 'left' }}>
            <p>{intl.formatMessage({ id: 'federate.failure.intro' })}</p>
            <ol style={{ paddingLeft: 20 }}>
              <li>{intl.formatMessage({ id: 'federate.failure.step1' })}</li>
              <li>{intl.formatMessage({ id: 'federate.failure.step2' })}</li>
            </ol>
            <Link to="/login">
              <Button
                type="primary"
                block
                style={{ marginTop: 16 }}
                data-testid="federate-back-to-login"
              >
                {intl.formatMessage({ id: 'federate.backToLogin' })}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AuthBrandShell>
  );
};
