import React from 'react';
import { Button } from 'antd';
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
  const { separator } = useProjectStore(
    (state) => ({
      separator: state.project?.projectJSON?.profile?.sqlConfig || '/*SQL@Run*/',
    }),
    shallow,
  );

  const onPassClick = () => {
    confirmDestructive({
      title: '通过审批',
      content: '确认通过该审批？通过后将执行审批 SQL。',
      okText: '通过',
      cancelText: '取消',
      onOk: () =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 1,
            approveResult: '通过',
            separator,
          }),
          props.actionRef,
          '已通过',
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
      通过
    </Button>
  );
};

export default React.memo(PassApproval);
