import React from 'react';
import {Button, Spin} from 'antd';
import shallow from 'zustand/shallow';
import useProjectStore from '@/store/project/useProjectStore';
import ReverseTable from '@/components/TableTransfer/ReverseTable';
import '@/pages/design/secondary-pane.scss';

/**
 * 逆向 Step2：loading / 成功实体表 / 失败可读文案 + 重新解析
 */
const ReverseParseStep: React.FC = () => {
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
          : '解析失败，请重试';
      body = (
        <div
          className="erd-secondary-pane__fail"
          data-testid="reverse-parse-failed"
          role="alert"
        >
          <p className="erd-secondary-pane__fail-title">数据库解析失败</p>
          <p className="erd-secondary-pane__fail-detail">{detail}</p>
          <Button
            type="primary"
            aria-label="重新解析"
            onClick={() => projectDispatch.retryDbReverseParse()}
          >
            重新解析
          </Button>
        </div>
      );
    }
  }

  return (
    <Spin tip="正在解析数据源，请稍后。。。(请勿关闭当前弹窗！)" spinning={!!loading}>
      {body}
    </Spin>
  );
};

export default React.memo(ReverseParseStep);
