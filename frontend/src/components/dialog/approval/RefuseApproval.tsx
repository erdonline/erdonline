import React from 'react';
import { Button } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import { runApprovalAction } from './approvalAction';

export type RefuseApprovalProps = {
  id: string;
  actionRef: any;
};

const RefuseApproval: React.FC<RefuseApprovalProps> = (props) => {
  const onRefuseClick = () => {
    confirmDestructive({
      title: '拒绝审批',
      content: '确认拒绝该审批？发起人可在工单页复批。',
      okText: '拒绝',
      okType: 'danger',
      cancelText: '取消',
      onOk: () =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 3,
            approveResult: '请检查后重新发起审批',
          }),
          props.actionRef,
          '已拒绝',
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
      拒绝
    </Button>
  );
};

export default React.memo(RefuseApproval);
