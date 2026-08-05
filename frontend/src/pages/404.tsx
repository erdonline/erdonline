import AuthBrandShell from '@/components/AuthBrandShell';
import { Button } from 'antd';
import React from 'react';
import { history, useIntl } from 'umi';

/**
 * 未知路径：AuthBrandShell 同语言（ADR-0016）；激活漏斗主 CTA = 打开示例
 */
const NoFoundPage: React.FC = () => {
  const intl = useIntl();
  return (
    <AuthBrandShell
      title="页面不存在"
      subtitle="抱歉，你访问的页面不存在"
      skipLabel={intl.formatMessage({ id: 'common.skipMainAction' })}
      skipTargetId="exception-main-cta"
    >
      <div
        className="auth-shell__gate-actions"
        id="exception-main-cta"
        tabIndex={-1}
        data-testid="exception-404-gate"
      >
        <Button type="primary" block onClick={() => history.push('/demo')}>
          打开示例 demo
        </Button>
        <Button block onClick={() => history.push('/')}>
          返回首页
        </Button>
      </div>
    </AuthBrandShell>
  );
};

export default NoFoundPage;
