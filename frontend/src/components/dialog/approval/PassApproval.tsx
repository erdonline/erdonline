import React from 'react';
import { Button } from 'antd';
import { useIntl } from '@umijs/max';
import { CheckCircleOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import { runApprovalAction } from './approvalAction';

export type PassApprovalProps = {
  id: string;
  actionRef: any;
};

const PassApproval: React.FC<PassApprovalProps> = (props) => {
  const intl = useIntl();
  const { separator } = useProjectStore(
    (state) => ({
      separator: state.project?.projectJSON?.profile?.sqlConfig || '/*SQL@Run*/',
    }),
    shallow,
  );

  const onPassClick = () => {
    confirmDestructive({
      title: intl.formatMessage({ id: 'approvalModal.passTitle' }),
      content: intl.formatMessage({ id: 'approvalModal.passContent' }),
      okText: intl.formatMessage({ id: 'approvalModal.passOk' }),
      cancelText: intl.formatMessage({ id: 'shareModal.cancel' }),
      onOk: () =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 1,
            approveResult: intl.formatMessage({ id: 'approvalModal.passResult' }),
            separator,
          }),
          props.actionRef,
          intl.formatMessage({ id: 'approvalModal.passSuccess' }),
        ),
    });
  };

  return (
    <Button
      key="pass"
      size="small"
      type="link"
      icon={<CheckCircleOutlined />}
      onClick={onPassClick}
    >
      {intl.formatMessage({ id: 'approvalModal.passButton' })}
    </Button>
  );
};

export default React.memo(PassApproval);
