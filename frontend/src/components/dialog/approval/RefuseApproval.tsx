import React from 'react';
import { Button } from 'antd';
import { useIntl } from '@umijs/max';
import { CloseCircleOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import { runApprovalAction } from './approvalAction';

export type RefuseApprovalProps = {
  id: string;
  actionRef: any;
};

const RefuseApproval: React.FC<RefuseApprovalProps> = (props) => {
  const intl = useIntl();

  const onRefuseClick = () => {
    confirmDestructive({
      title: intl.formatMessage({ id: 'approvalModal.refuseTitle' }),
      content: intl.formatMessage({ id: 'approvalModal.refuseContent' }),
      okText: intl.formatMessage({ id: 'approvalModal.refuseOk' }),
      okType: 'danger',
      cancelText: intl.formatMessage({ id: 'shareModal.cancel' }),
      onOk: () =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 3,
            approveResult: intl.formatMessage({ id: 'approvalModal.refuseResult' }),
          }),
          props.actionRef,
          intl.formatMessage({ id: 'approvalModal.refuseSuccess' }),
        ),
    });
  };

  return (
    <Button
      danger
      key="refuse"
      size="small"
      type="link"
      icon={<CloseCircleOutlined />}
      onClick={onRefuseClick}
    >
      {intl.formatMessage({ id: 'approvalModal.refuseButton' })}
    </Button>
  );
};

export default React.memo(RefuseApproval);
