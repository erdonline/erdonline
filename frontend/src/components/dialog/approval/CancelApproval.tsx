import React from 'react';
import { Button } from 'antd';
import { RotateLeftOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import { runApprovalAction } from './approvalAction';

export type CancelApprovalProps = {
  id: string;
  actionRef: any;
};

const CancelApproval: React.FC<CancelApprovalProps> = (props) => {
  const onCancelClick = () => {
    confirmDestructive({
      title: '撤销审批',
      content: '确认撤销该审批工单？撤销后可重新提交复批。',
      okText: '撤销',
      okType: 'danger',
      cancelText: '取消',
      onOk: () =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 2,
            approveResult: '已撤销',
          }),
          props.actionRef,
          '已撤销',
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
      撤销
    </Button>
  );
};

export default React.memo(CancelApproval);
