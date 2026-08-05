import React, {useEffect, useState} from 'react';
import {Button, message, Spin} from 'antd';
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
  const [status, setStatus] = useState('正在完成第三方登录…');
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
        setStatus('第三方登录未完成');
        message.error(error);
        return;
      }
      if (!ticket) {
        setStatus('缺少登录凭证');
        message.error('第三方登录失败：缺少 ticket');
        history.replace('/login');
        return;
      }
      try {
        const res = (await request.post(`/auth/federate/session?ticket=${encodeURIComponent(ticket)}`)) as TokenBody;
        if (cancelled) {
          return;
        }
        if (!res?.access_token) {
          message.error(res?.msg || '第三方登录失败');
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
          message.error('第三方登录失败');
          history.replace('/login');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthBrandShell title="第三方登录" skipLabel="跳到状态区" footer={null}>
      <div role="status" aria-live="polite" data-testid="federate-login-status" style={{textAlign: 'center'}}>
        {!failure && <Spin />}
        <p style={{marginTop: 16}}>{status}</p>
        {failure && (
          <div data-testid="federate-login-failure" style={{marginTop: 24, textAlign: 'left'}}>
            <p>你可以：</p>
            <ol style={{paddingLeft: 20}}>
              <li>若已有账号：先用用户名密码登录，再在「账号设置 → 安全」绑定 Google / GitHub</li>
              <li>若需新建账号：联系管理员开通，或（自托管）由管理员设置开放注册</li>
            </ol>
            <Link to="/login">
              <Button type="primary" block style={{marginTop: 16}}>
                返回登录
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AuthBrandShell>
  );
};
