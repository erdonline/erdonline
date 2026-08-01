import React from 'react';
import { Button, Popconfirm } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import { runApprovalAction } from './approvalAction';

export type RefuseApprovalProps = {
  id: string;
  actionRef: any;
};

const RefuseApproval: React.FC<RefuseApprovalProps> = (props) => {
  return (
    <Popconfirm
      placement="right"
      title="是否拒绝？"
      onConfirm={() =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 3,
            approveResult: '请检查后重新发起审批',
          }),
          props.actionRef,
          '已拒绝',
        )
      }
      okText="是"
      cancelText="否"
    >
      <Button danger key="refuse" size="small" type="link" icon={<CloseCircleOutlined />}>
        拒绝
      </Button>
    </Popconfirm>
  );
};

export default React.memo(RefuseApproval);
