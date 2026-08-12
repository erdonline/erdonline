import React from 'react';
import { Button } from 'antd';
import { useIntl } from '@umijs/max';
import { CheckCircleOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import { runApprovalAction } from './approvalAction';

export type RepeatApprovalProps = {
  id: string;
  actionRef: any;
};

const RepeatApproval: React.FC<RepeatApprovalProps> = (props) => {
  const intl = useIntl();

  const onRepeatClick = () => {
    confirmDestructive({
      title: intl.formatMessage({ id: 'approvalModal.repeatTitle' }),
      content: intl.formatMessage({ id: 'approvalModal.repeatContent' }),
      okText: intl.formatMessage({ id: 'approvalModal.repeatOk' }),
      cancelText: intl.formatMessage({ id: 'shareModal.cancel' }),
      onOk: () =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 4,
            approveResult: intl.formatMessage({ id: 'approvalModal.repeatResult' }),
          }),
          props.actionRef,
          intl.formatMessage({ id: 'approvalModal.repeatSuccess' }),
        ),
    });
  };

  return (
    <Button
      key="repeat"
      size="small"
      type="link"
      icon={<CheckCircleOutlined />}
      onClick={onRepeatClick}
    >
      {intl.formatMessage({ id: 'approvalModal.repeatButton' })}
    </Button>
  );
};

export default React.memo(RepeatApproval);
