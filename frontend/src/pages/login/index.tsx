import React, {useEffect, useState} from 'react';
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {Button, Divider, Form, Input, Space, message} from 'antd';
import * as cache from '@/utils/cache';
import {history} from '@@/exports';
import request from '@/utils/request';
import AuthBrandShell from '@/components/AuthBrandShell';

/** @param redirectOverride 注册成功后调用时传入，避免仍停在 /register 读不到 query */
export async function login(username: string, password: string, redirectOverride?: string | null) {
  const res = await request.post('/auth/login', { data: { username, password } });
  if (res?.access_token) {
    cache.setItem('Authorization', res.access_token);
    cache.setItem('username', username);
    if (res.licensedStartTime && res.licensedEndTime) {
      cache.setItem('licence', {
        licensedTo: res.licensedTo,
        licensedStartTime: res.licensedStartTime,
        licensedEndTime: res.licensedEndTime,
      });
    }
    const fromQuery = new URLSearchParams(window.location.search).get('redirect');
    const redirect = redirectOverride || fromQuery;
    // 支持带回 query 的深链（如 /oauth/authorize?...）；对象 pathname 会丢掉 ? 后参数
    if (redirect && redirect.startsWith('/')) {
      history.push(redirect);
    } else {
      history.push('/home');
    }
    return;
  }
  message.error(res?.msg || '登录失败，请检查用户名和密码');
}

function redirectQuery(): string {
  const r = new URLSearchParams(window.location.search).get('redirect');
  return r && r.startsWith('/') ? `?redirect=${encodeURIComponent(r)}` : '';
}

function federateStartHref(provider: 'google' | 'wechat'): string {
  const r = new URLSearchParams(window.location.search).get('redirect');
  const q =
    r && r.startsWith('/')
      ? `?redirect=${encodeURIComponent(r)}`
      : '';
  return `/auth/federate/${provider}${q}`;
}

type LoginValues = {
  username: string;
  password: string;
};

type Providers = {google?: boolean; wechat?: boolean};

export default () => {
  const [form] = Form.useForm<LoginValues>();
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState<Providers>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await request.get('/auth/federate/providers');
        if (!cancelled && res?.code === 200 && res.data) {
          setProviders(res.data as Providers);
        }
      } catch {
        // 未配置联邦时静默：仅账密登录
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onFinish = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await login(values.username, values.password);
    } finally {
      setSubmitting(false);
    }
  };

  const showFederate = Boolean(providers.google || providers.wechat);

  return (
    <AuthBrandShell
      title="登录 ERD Online"
      skipLabel="跳到登录表单"
      footer={
        <>
          <a href={`/register${redirectQuery()}`} aria-label="去注册">
            没有账号？去注册
          </a>
          {' · '}
          <a href="/demo" aria-label="先看演示">
            先看演示（免登录）
          </a>
          {' · '}
          <a href="/" aria-label="了解产品">
            了解产品
          </a>
        </>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="auth-shell-form"
        data-testid="auth-shell-form"
      >
        <Form.Item
          name="username"
          label="用户名"
          htmlFor="login-username"
          rules={[{required: true, message: '请输入用户名!'}]}
        >
          <Input
            id="login-username"
            prefix={<UserOutlined />}
            placeholder="用户名"
            aria-label="用户名"
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          htmlFor="login-password"
          rules={[{required: true, message: '请输入密码！'}]}
        >
          <Input.Password
            id="login-password"
            prefix={<LockOutlined />}
            placeholder="密码"
            aria-label="密码"
            autoComplete="current-password"
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={submitting}
            data-testid="login-submit"
          >
            登录
          </Button>
        </Form.Item>
      </Form>
      {showFederate ? (
        <>
          <Divider plain>或使用第三方登录</Divider>
          <Space direction="vertical" style={{width: '100%'}} size="middle">
            {providers.google ? (
              <Button
                block
                href={federateStartHref('google')}
                aria-label="使用 Google 登录"
                data-testid="login-google"
              >
                使用 Google 登录
              </Button>
            ) : null}
            {providers.wechat ? (
              <Button
                block
                href={federateStartHref('wechat')}
                aria-label="使用微信扫码登录"
                data-testid="login-wechat"
              >
                使用微信扫码登录
              </Button>
            ) : null}
          </Space>
        </>
      ) : null}
    </AuthBrandShell>
  );
};
