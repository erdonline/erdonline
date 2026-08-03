import React, {useState} from 'react';
import {QuestionCircleOutlined} from '@ant-design/icons';
import {Button, Form, Input, message} from 'antd';
import {POST} from "@/services/crud";
import {login} from "@/pages/login";
import AuthBrandShell from '@/components/AuthBrandShell';

function loginQuery(): string {
  const r = new URLSearchParams(window.location.search).get('redirect');
  return r && r.startsWith('/') ? `?redirect=${encodeURIComponent(r)}` : '';
}

/** 悬停提示保留；tabIndex=-1 避免 5 个问号进 Tab 序（约束已由 rules 校验文案承担） */
const formTip = (title: string) => ({
  title,
  icon: <QuestionCircleOutlined tabIndex={-1} aria-hidden />,
});

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
    <AuthBrandShell
      title="注册 ERD Online"
      skipLabel="跳到注册表单"
      footer={
        <>
          <a href={`/login${loginQuery()}`} aria-label="去登录">
            已有账号？去登录
          </a>
          {' · '}
          <a href="/demo" aria-label="先看演示">
            先看演示（免登录）
          </a>
        </>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="username"
          label="用户名"
          htmlFor="register-username"
          tooltip={formTip('最长为 18 位')}
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
          tooltip={formTip('密码至少包含 数字和英文，长度6-20')}
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
          tooltip={formTip('密码至少包含 数字和英文，长度6-20')}
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
          tooltip={formTip('标准邮箱地址')}
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
          tooltip={formTip('标准手机号码')}
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
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            data-testid="register-submit"
          >
            注册
          </Button>
        </Form.Item>
      </Form>
    </AuthBrandShell>
  );
};
