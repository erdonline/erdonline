import AuthBrandShell from '@/components/AuthBrandShell';
import { Button } from 'antd';
import React from 'react';
import { history } from 'umi';

/**
 * 无权访问：AuthBrandShell 同语言（ADR-0016）；与 404 / 分享失效门同构
 */
const NoAccessPage: React.FC = () => (
  <AuthBrandShell title="无权访问" subtitle="抱歉，你无权访问该页面">
    <div className="auth-shell__gate-actions" data-testid="exception-403-gate">
      <Button type="primary" block onClick={() => history.push('/demo')}>
        打开示例 demo
      </Button>
      <Button block onClick={() => history.push('/')}>
        返回首页
      </Button>
    </div>
  </AuthBrandShell>
);

export default NoAccessPage;
