import React, {useState} from 'react';
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {Button, Form, Input, message} from 'antd';
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
    history.push({ pathname: redirect && redirect.startsWith('/') ? redirect : '/home' });
    return;
  }
  message.error(res?.msg || '登录失败，请检查用户名和密码');
}

function redirectQuery(): string {
  const r = new URLSearchParams(window.location.search).get('redirect');
  return r && r.startsWith('/') ? `?redirect=${encodeURIComponent(r)}` : '';
}

type LoginValues = {
  username: string;
  password: string;
};

export default () => {
  const [form] = Form.useForm<LoginValues>();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await login(values.username, values.password);
    } finally {
      setSubmitting(false);
    }
  };

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
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="username"
          label="用户名"
          htmlFor="login-username"
          rules={[{required: true, message: '请输入用户名!'}]}
        >
          <Input
            id="login-username"
            size="large"
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
            size="large"
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
            size="large"
            block
            loading={submitting}
            data-testid="login-submit"
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    </AuthBrandShell>
  );
};
