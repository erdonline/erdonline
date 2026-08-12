import React from 'react';
import {Button, Spin} from 'antd';
import {useIntl} from '@umijs/max';
import shallow from 'zustand/shallow';
import useProjectStore from '@/store/project/useProjectStore';
import ReverseTable from '@/components/TableTransfer/ReverseTable';
import '@/pages/design/secondary-pane.scss';

/**
 * 逆向 Step2：loading / 成功实体表 / 失败可读文案 + 重新解析
 */
const ReverseParseStep: React.FC = () => {
  const intl = useIntl();
  const {projectDispatch, profileSliceState} = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      profileSliceState: state.profileSliceState || {},
    }),
    shallow,
  );
  const {flag, status, loading, errorMessage} = profileSliceState;

  let body: React.ReactNode = null;
  if (!flag) {
    if (status === 'SUCCESS') {
      body = <ReverseTable />;
    } else if (status === 'FAILED') {
      const detail =
        typeof errorMessage === 'string' && errorMessage.trim()
          ? errorMessage.trim()
          : intl.formatMessage({ id: 'reverseParse.parseFailedDefault' });
      body = (
        <div
          className="erd-secondary-pane__fail"
          data-testid="reverse-parse-failed"
          role="alert"
        >
          <p className="erd-secondary-pane__fail-title">
            {intl.formatMessage({ id: 'reverseParse.failTitle' })}
          </p>
          <p className="erd-secondary-pane__fail-detail">{detail}</p>
          <Button
            type="primary"
            aria-label={intl.formatMessage({ id: 'reverseParse.retryAria' })}
            onClick={() => projectDispatch.retryDbReverseParse()}
          >
            {intl.formatMessage({ id: 'reverseParse.retry' })}
          </Button>
        </div>
      );
    }
  }

  return (
    <Spin
      tip={intl.formatMessage({ id: 'reverseParse.spinTip' })}
      spinning={!!loading}
    >
      {body}
    </Spin>
  );
};

export default React.memo(ReverseParseStep);
