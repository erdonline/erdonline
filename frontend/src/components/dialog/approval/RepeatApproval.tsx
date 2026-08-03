import React from 'react';
import { Button } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { EDIT } from '@/services/crud';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import { runApprovalAction } from './approvalAction';

export type RepeatApprovalProps = {
  id: string;
  actionRef: any;
};

const RepeatApproval: React.FC<RepeatApprovalProps> = (props) => {
  const onRepeatClick = () => {
    confirmDestructive({
      title: '复批',
      content: '确认重新提交该审批？',
      okText: '复批',
      cancelText: '取消',
      onOk: () =>
        runApprovalAction(
          EDIT(`/ncnb/approval/${props.id}`, {
            approveStatus: 4,
            approveResult: '正在复批',
          }),
          props.actionRef,
          '已重新提交审批',
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
      复批
    </Button>
  );
};

export default React.memo(RepeatApproval);
