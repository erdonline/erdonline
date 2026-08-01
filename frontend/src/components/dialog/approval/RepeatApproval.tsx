import React from 'react';
import { Button, Popconfirm } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import { runApprovalAction } from './approvalAction';

export type RepeatApprovalProps = {
  id: string;
  actionRef: any;
};

const RepeatApproval: React.FC<RepeatApprovalProps> = (props) => {
  return (
    <Popconfirm
      placement="right"
      title="是否复批？"
      onConfirm={() =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 4,
            approveResult: '正在复批',
          }),
          props.actionRef,
          '已重新提交审批',
        )
      }
      okText="是"
      cancelText="否"
    >
      <Button key="repeat" size="small" type="link" icon={<CheckCircleOutlined />}>
        复批
      </Button>
    </Popconfirm>
  );
};

export default React.memo(RepeatApproval);
