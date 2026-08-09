import {useEffect, useMemo, useState} from 'react';
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {Button, Divider, Form, Input, Space, message} from 'antd';
import {useIntl} from '@umijs/max';
import * as cache from '@/utils/cache';
import {history} from '@@/exports';
import request from '@/utils/request';
import {buildApiHref} from '@/utils/apiHref';
import AuthBrandShell from '@/components/AuthBrandShell';

/** @param redirectOverride 注册成功后调用时传入，避免仍停在 /register 读不到 query */
export async function login(
  username: string,
  password: string,
  redirectOverride?: string | null,
  errorFallback = '登录失败，请检查用户名和密码',
) {
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
  message.error(res?.msg || errorFallback);
}

function redirectQuery(): string {
  const r = new URLSearchParams(window.location.search).get('redirect');
  return r && r.startsWith('/') ? `?redirect=${encodeURIComponent(r)}` : '';
}

type FederateProviderKey = 'github' | 'google' | 'wechat';

function federateStartHref(provider: FederateProviderKey): string {
  const r = new URLSearchParams(window.location.search).get('redirect');
  const q =
    r && r.startsWith('/')
      ? `?redirect=${encodeURIComponent(r)}`
      : '';
  return buildApiHref(`/auth/federate/${provider}${q}`);
}

type LoginValues = {
  username: string;
  password: string;
};

type Providers = Partial<Record<FederateProviderKey, boolean>>;

const PROVIDER_KEYS: { key: FederateProviderKey; labelId: string; testId: string }[] = [
  { key: 'github', labelId: 'login.federate.github', testId: 'login-github' },
  { key: 'google', labelId: 'login.federate.google', testId: 'login-google' },
  { key: 'wechat', labelId: 'login.federate.wechat', testId: 'login-wechat' },
];

export default () => {
  const intl = useIntl();
  const [form] = Form.useForm<LoginValues>();
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState<Providers>({});
  /** providers 接口成功返回后才渲染「未配置」提示，避免首屏闪烁 */
  const [providersKnown, setProvidersKnown] = useState(false);

  const providerButtons = useMemo(
    () =>
      PROVIDER_KEYS.map((b) => ({
        ...b,
        label: intl.formatMessage({ id: b.labelId }),
      })),
    [intl],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await request.get('/auth/federate/providers');
        if (!cancelled && res?.code === 200 && res.data) {
          setProviders(res.data as Providers);
          setProvidersKnown(true);
        }
      } catch {
        // 拉取失败：不假造按钮，也不刷「未配置」（可能是网络抖动）
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onFinish = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await login(
        values.username,
        values.password,
        undefined,
        intl.formatMessage({ id: 'login.error' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const enabledButtons = providerButtons.filter((b) => providers[b.key]);
  const showFederate = enabledButtons.length > 0;
  const showUnconfiguredHint = providersKnown && !showFederate;

  return (
    <AuthBrandShell
      title={intl.formatMessage({ id: 'login.title' })}
      skipLabel={intl.formatMessage({ id: 'login.skipLabel' })}
      footer={
        <>
          <a
            href={`/register${redirectQuery()}`}
            aria-label={intl.formatMessage({ id: 'login.footer.registerAria' })}
          >
            {intl.formatMessage({ id: 'login.footer.register' })}
          </a>
          {' · '}
          <a href="/demo" aria-label={intl.formatMessage({ id: 'login.footer.demoAria' })}>
            {intl.formatMessage({ id: 'login.footer.demo' })}
          </a>
          {' · '}
          <a
            href="/"
            data-testid="login-footer-home"
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
          label={intl.formatMessage({ id: 'login.username.label' })}
          htmlFor="login-username"
          rules={[
            { required: true, message: intl.formatMessage({ id: 'login.username.required' }) },
          ]}
        >
          <Input
            id="login-username"
            prefix={<UserOutlined />}
            placeholder={intl.formatMessage({ id: 'login.username.placeholder' })}
            aria-label={intl.formatMessage({ id: 'login.username.label' })}
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={intl.formatMessage({ id: 'login.password.label' })}
          htmlFor="login-password"
          rules={[
            { required: true, message: intl.formatMessage({ id: 'login.password.required' }) },
          ]}
        >
          <Input.Password
            id="login-password"
            prefix={<LockOutlined />}
            placeholder={intl.formatMessage({ id: 'login.password.placeholder' })}
            aria-label={intl.formatMessage({ id: 'login.password.label' })}
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
            {intl.formatMessage({ id: 'login.submit' })}
          </Button>
        </Form.Item>
      </Form>
      {showFederate ? (
        <>
          <Divider plain>{intl.formatMessage({ id: 'login.federate.divider' })}</Divider>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {enabledButtons.map((b) => (
              <Button
                key={b.key}
                block
                href={federateStartHref(b.key)}
                aria-label={b.label}
                data-testid={b.testId}
              >
                {b.label}
              </Button>
            ))}
          </Space>
        </>
      ) : showUnconfiguredHint ? (
        <p
          role="status"
          data-testid="login-federate-unconfigured"
          style={{
            margin: '8px 0 0',
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--erd-ink-400, rgba(0, 0, 0, 0.45))',
            lineHeight: 1.5,
          }}
        >
          {intl.formatMessage({ id: 'login.federate.unconfigured' })}
        </p>
      ) : null}
    </AuthBrandShell>
  );
};
