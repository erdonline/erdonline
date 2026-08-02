import React, {useState} from 'react';
import {Button, Form, Input, Typography, message} from 'antd';
import {POST} from "@/services/crud";
import {login} from "@/pages/login";

function loginQuery(): string {
  const r = new URLSearchParams(window.location.search).get('redirect');
  return r && r.startsWith('/') ? `?redirect=${encodeURIComponent(r)}` : '';
}

type RegisterValues = {
  username: string;
  pwd: string;
  pwdCK: string;
  email: string;
  phone: string;
};

export default () => {
  const [form] = Form.useForm<RegisterValues>();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: RegisterValues) => {
    if (values.pwd !== values.pwdCK) {
      message.error("两次输入的密码不一致");
      return;
    }
    setSubmitting(true);
    try {
      const r = await POST('/ncnb/project/group/user/register', {
        username: values.username,
        pwd: values.pwd,
        email: values.email,
        phone: values.phone,
      });
      if (r.code === 200) {
        message.success("注册成功！");
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        await login(values.username, values.pwd, redirect);
      }
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
          padding: '40px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflowY: 'auto',
        }}
      >
        <div style={{textAlign: 'center', marginBottom: 16}}>
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
            htmlFor="register-username"
            tooltip="最长为 18 位"
            rules={[
              {required: true, message: '不能为空'},
              {max: 18, message: '不能大于 18 个字符'},
            ]}
          >
            <Input
              id="register-username"
              placeholder="请输入用户名"
              aria-label="用户名"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            name="pwd"
            label="密码"
            htmlFor="register-pwd"
            tooltip="密码至少包含 数字和英文，长度6-20"
            rules={[
              {required: true, message: '密码不能为空'},
              {
                pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,20}$/,
                message: '密码至少包含 数字和英文，长度6-20',
              },
            ]}
          >
            <Input.Password
              id="register-pwd"
              placeholder="请输入密码"
              aria-label="密码"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="pwdCK"
            label="确认密码"
            htmlFor="register-pwdCK"
            tooltip="密码至少包含 数字和英文，长度6-20"
            rules={[
              {required: true, message: '密码不能为空'},
              {
                pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,20}$/,
                message: '密码至少包含 数字和英文，长度6-20',
              },
            ]}
          >
            <Input.Password
              id="register-pwdCK"
              placeholder="请输入密码"
              aria-label="确认密码"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            htmlFor="register-email"
            tooltip="标准邮箱地址"
            rules={[
              {required: true, message: '邮箱不能为空'},
              {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                message: '请输入正确的邮箱地址',
              },
            ]}
          >
            <Input
              id="register-email"
              placeholder="请输入邮箱"
              aria-label="邮箱"
              autoComplete="email"
            />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号码"
            htmlFor="register-phone"
            tooltip="标准手机号码"
            rules={[
              {required: true, message: '手机号码不能为空'},
              {
                pattern: /^1(3[0-9]|4[01456879]|5[0-3,5-9]|6[2567]|7[0-8]|8[0-9]|9[0-3,5-9])\d{8}$/,
                message: '请输入正确的手机号',
              },
            ]}
          >
            <Input
              id="register-phone"
              placeholder="请输入手机号码"
              aria-label="手机号码"
              autoComplete="tel"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
              注册
            </Button>
          </Form.Item>
        </Form>
        <div style={{marginTop: 8, textAlign: 'center'}}>
          <a href={`/login${loginQuery()}`} aria-label="去登录">
            已有账号？去登录
          </a>
          {' · '}
          <a href="/demo" aria-label="先看演示">
            先看演示（免登录）
          </a>
        </div>
      </div>
    </div>
  );
};
