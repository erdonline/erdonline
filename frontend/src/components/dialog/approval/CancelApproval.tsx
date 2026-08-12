import React from 'react';
import { Button } from 'antd';
import { useIntl } from '@umijs/max';
import { RotateLeftOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import { runApprovalAction } from './approvalAction';

export type CancelApprovalProps = {
  id: string;
  actionRef: any;
};

const CancelApproval: React.FC<CancelApprovalProps> = (props) => {
  const intl = useIntl();

  const onCancelClick = () => {
    confirmDestructive({
      title: intl.formatMessage({ id: 'approvalModal.cancelTitle' }),
      content: intl.formatMessage({ id: 'approvalModal.cancelContent' }),
      okText: intl.formatMessage({ id: 'approvalModal.cancelOk' }),
      okType: 'danger',
      cancelText: intl.formatMessage({ id: 'shareModal.cancel' }),
      onOk: () =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 2,
            approveResult: intl.formatMessage({ id: 'approvalModal.cancelResult' }),
          }),
          props.actionRef,
          intl.formatMessage({ id: 'approvalModal.cancelSuccess' }),
        ),
    });
  };

  return (
    <Button
      key="cancel"
      size="small"
      type="link"
      icon={<RotateLeftOutlined />}
      onClick={onCancelClick}
    >
      {intl.formatMessage({ id: 'approvalModal.cancelButton' })}
    </Button>
  );
};

export default React.memo(CancelApproval);
