import React, {useState} from 'react';
import {QuestionCircleOutlined} from '@ant-design/icons';
import {Button, Form, Input, message} from 'antd';
import {useIntl} from '@umijs/max';
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
  const intl = useIntl();
  const [form] = Form.useForm<RegisterValues>();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: RegisterValues) => {
    if (values.pwd !== values.pwdCK) {
      message.error(intl.formatMessage({ id: 'register.error.passwordMismatch' }));
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
        message.success(intl.formatMessage({ id: 'register.success' }));
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        await login(
          values.username,
          values.pwd,
          redirect,
          intl.formatMessage({ id: 'login.error' }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthBrandShell
      title={intl.formatMessage({ id: 'register.title' })}
      skipLabel={intl.formatMessage({ id: 'register.skipLabel' })}
      footer={
        <>
          <a
            href={`/login${loginQuery()}`}
            aria-label={intl.formatMessage({ id: 'register.footer.loginAria' })}
          >
            {intl.formatMessage({ id: 'register.footer.login' })}
          </a>
          {' · '}
          <a href="/demo" aria-label={intl.formatMessage({ id: 'login.footer.demoAria' })}>
            {intl.formatMessage({ id: 'login.footer.demo' })}
          </a>
          {' · '}
          <a
            href="/"
            data-testid="register-footer-home"
            aria-label={intl.formatMessage({ id: 'login.footer.landingAria' })}
          >
            {intl.formatMessage({ id: 'login.footer.landing' })}
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
          label={intl.formatMessage({ id: 'register.username.label' })}
          htmlFor="register-username"
          tooltip={formTip(intl.formatMessage({ id: 'register.username.tooltip' }))}
          rules={[
            { required: true, message: intl.formatMessage({ id: 'register.username.required' }) },
            { max: 18, message: intl.formatMessage({ id: 'register.username.max' }) },
          ]}
        >
          <Input
            id="register-username"
            placeholder={intl.formatMessage({ id: 'register.username.placeholder' })}
            aria-label={intl.formatMessage({ id: 'register.username.label' })}
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item
          name="pwd"
          label={intl.formatMessage({ id: 'register.password.label' })}
          htmlFor="register-pwd"
          tooltip={formTip(intl.formatMessage({ id: 'register.password.tooltip' }))}
          rules={[
            { required: true, message: intl.formatMessage({ id: 'register.password.required' }) },
            {
              pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,20}$/,
              message: intl.formatMessage({ id: 'register.password.pattern' }),
            },
          ]}
        >
          <Input.Password
            id="register-pwd"
            placeholder={intl.formatMessage({ id: 'register.password.placeholder' })}
            aria-label={intl.formatMessage({ id: 'register.password.label' })}
            autoComplete="new-password"
          />
        </Form.Item>
        <Form.Item
          name="pwdCK"
          label={intl.formatMessage({ id: 'register.passwordConfirm.label' })}
          htmlFor="register-pwdCK"
          tooltip={formTip(intl.formatMessage({ id: 'register.passwordConfirm.tooltip' }))}
          rules={[
            {
              required: true,
              message: intl.formatMessage({ id: 'register.passwordConfirm.required' }),
            },
            {
              pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,20}$/,
              message: intl.formatMessage({ id: 'register.passwordConfirm.pattern' }),
            },
          ]}
        >
          <Input.Password
            id="register-pwdCK"
            placeholder={intl.formatMessage({ id: 'register.passwordConfirm.placeholder' })}
            aria-label={intl.formatMessage({ id: 'register.passwordConfirm.label' })}
            autoComplete="new-password"
          />
        </Form.Item>
        <Form.Item
          name="email"
          label={intl.formatMessage({ id: 'register.email.label' })}
          htmlFor="register-email"
          tooltip={formTip(intl.formatMessage({ id: 'register.email.tooltip' }))}
          rules={[
            { required: true, message: intl.formatMessage({ id: 'register.email.required' }) },
            {
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
              message: intl.formatMessage({ id: 'register.email.pattern' }),
            },
          ]}
        >
          <Input
            id="register-email"
            placeholder={intl.formatMessage({ id: 'register.email.placeholder' })}
            aria-label={intl.formatMessage({ id: 'register.email.label' })}
            autoComplete="email"
          />
        </Form.Item>
        <Form.Item
          name="phone"
          label={intl.formatMessage({ id: 'register.phone.label' })}
          htmlFor="register-phone"
          tooltip={formTip(intl.formatMessage({ id: 'register.phone.tooltip' }))}
          rules={[
            { required: true, message: intl.formatMessage({ id: 'register.phone.required' }) },
            {
              pattern: /^1(3[0-9]|4[01456879]|5[0-3,5-9]|6[2567]|7[0-8]|8[0-9]|9[0-3,5-9])\d{8}$/,
              message: intl.formatMessage({ id: 'register.phone.pattern' }),
            },
          ]}
        >
          <Input
            id="register-phone"
            placeholder={intl.formatMessage({ id: 'register.phone.placeholder' })}
            aria-label={intl.formatMessage({ id: 'register.phone.label' })}
            autoComplete="tel"
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={submitting}
            data-testid="register-submit"
          >
            {intl.formatMessage({ id: 'register.submit' })}
          </Button>
        </Form.Item>
      </Form>
    </AuthBrandShell>
  );
};
