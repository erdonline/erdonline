import React from 'react';
import { Button, Popconfirm } from 'antd';
import { RotateLeftOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import { runApprovalAction } from './approvalAction';

export type CancelApprovalProps = {
  id: string;
  actionRef: any;
};

const CancelApproval: React.FC<CancelApprovalProps> = (props) => {
  return (
    <Popconfirm
      placement="right"
      title="是否撤销？"
      onConfirm={() =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 2,
            approveResult: '已撤销',
          }),
          props.actionRef,
          '已撤销',
        )
      }
      okText="是"
      cancelText="否"
    >
      <Button key="cancel" size="small" type="link" icon={<RotateLeftOutlined />}>
        撤销
      </Button>
    </Popconfirm>
  );
};

export default React.memo(CancelApproval);
