import AuthBrandShell from '@/components/AuthBrandShell';
import { Button } from 'antd';
import React from 'react';
import { history, useIntl } from 'umi';

/**
 * 无权访问：AuthBrandShell 同语言（ADR-0016）；与 404 / 分享失效门同构
 */
const NoAccessPage: React.FC = () => {
  const intl = useIntl();
  return (
    <AuthBrandShell
      title={intl.formatMessage({ id: 'exception.403.title' })}
      subtitle={intl.formatMessage({ id: 'exception.403.subtitle' })}
      skipLabel={intl.formatMessage({ id: 'common.skipMainAction' })}
      skipTargetId="exception-main-cta"
    >
      <div
        className="auth-shell__gate-actions"
        id="exception-main-cta"
        tabIndex={-1}
        data-testid="exception-403-gate"
      >
        <Button type="primary" block onClick={() => history.push('/demo')}>
          {intl.formatMessage({ id: 'exception.cta.openDemo' })}
        </Button>
        <Button block onClick={() => history.push('/')}>
          {intl.formatMessage({ id: 'exception.cta.backHome' })}
        </Button>
      </div>
    </AuthBrandShell>
  );
};

export default NoAccessPage;
