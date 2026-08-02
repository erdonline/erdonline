import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {LoginFormPage, ProFormText} from '@ant-design/pro-components';
import {Button, message} from 'antd';
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

export default () => {
  return (
    <div style={{backgroundColor: 'white', height: 'calc(100vh - 48px)', margin: '24px'}}>
      <LoginFormPage
        backgroundImageUrl="../bg2.png"
        logo="../logo.svg"
        title="ERD Online"
        subTitle="开源数据库建模：版本与协作，像 Git + Figma"
        onFinish={async (values: any) => {
          await login(values.username, values.password);
        }}
        activityConfig={{
          style: {
            boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.2)',
            color: '#fff',
            borderRadius: 8,
            backgroundColor: '#f16824',
          },
          title: '先看一眼演示',
          subTitle: '免登录打开示例模型，再决定是否注册',
          action: (
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
          ),
        }}
      >
        <ProFormText
          name="username"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined className={'prefixIcon'}/>,
          }}
          placeholder={'用户名'}
          rules={[{required: true, message: '请输入用户名!'}]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className={'prefixIcon'}/>,
          }}
          placeholder={'密码'}
          rules={[{required: true, message: '请输入密码！'}]}
        />
        <div style={{marginTop: 16, textAlign: 'center'}}>
          <a href={`/register${redirectQuery()}`} aria-label="去注册">
            没有账号？去注册
          </a>
          {' · '}
          <a href="/demo" aria-label="先看演示">
            先看演示（免登录）
          </a>
        </div>
      </LoginFormPage>
    </div>
  );
};
