import React from 'react';
import { Button, Popconfirm } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import { runApprovalAction } from './approvalAction';

export type PassApprovalProps = {
  id: string;
  actionRef: any;
};

const PassApproval: React.FC<PassApprovalProps> = (props) => {
  const { separator } = useProjectStore(
    (state) => ({
      separator: state.project?.projectJSON?.profile?.sqlConfig || '/*SQL@Run*/',
    }),
    shallow,
  );
  return (
    <Popconfirm
      placement="right"
      title="是否通过？"
      onConfirm={() =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 1,
            approveResult: '通过',
            separator,
          }),
          props.actionRef,
          '已通过',
        )
      }
      okText="是"
      cancelText="否"
    >
      <Button key="pass" size="small" type="link" icon={<CheckCircleOutlined />}>
        通过
      </Button>
    </Popconfirm>
  );
};

export default React.memo(PassApproval);
