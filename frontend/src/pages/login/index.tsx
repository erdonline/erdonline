import React, {useState} from 'react';
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {Button, Form, Input, Typography, message} from 'antd';
import * as cache from '@/utils/cache';
import {history} from '@@/exports';
import request from '@/utils/request';

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
    <div
      style={{
        minHeight: 'calc(100vh - 48px)',
        margin: 24,
        display: 'flex',
        background: `url(../bg2.png) center/cover no-repeat`,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 48,
          color: '#fff',
          background: 'linear-gradient(135deg, rgba(241,104,36,0.92), rgba(22,119,255,0.75))',
        }}
      >
        <Typography.Title level={3} style={{color: '#fff', marginTop: 0}}>
          先看一眼演示
        </Typography.Title>
        <Typography.Paragraph style={{color: 'rgba(255,255,255,0.92)', maxWidth: 360}}>
          免登录打开示例模型，再决定是否注册
        </Typography.Paragraph>
        <Button
          size="large"
          style={{
            borderRadius: 20,
            background: '#fff',
            color: '#1677FF',
            width: 120,
          }}
          onClick={() => {
            window.location.href = '/demo';
          }}
        >
          打开演示
        </Button>
      </div>
      <div
        style={{
          width: 420,
          maxWidth: '100%',
          background: '#fff',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{textAlign: 'center', marginBottom: 24}}>
          <img src="../logo.svg" alt="ERD Online" width={48} height={48} />
          <Typography.Title level={3} style={{marginTop: 12, marginBottom: 4}}>
            ERD Online
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{marginBottom: 0}}>
            开源数据库建模：版本与协作，像 Git + Figma
          </Typography.Paragraph>
        </div>
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{required: true, message: '请输入用户名!'}]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{required: true, message: '请输入密码！'}]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{marginTop: 8, textAlign: 'center'}}>
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
        </div>
      </div>
    </div>
  );
};
