import React from 'react';
import {Button, message} from 'antd';
import {deleteGroupProject} from '@/services/group-project';
import {history} from '@@/core/history';
import {confirmDestructive} from '@/utils/destructiveConfirm';

export type RemoveGroupProjectProps = {
  projectId: string;
};

const RemoveGroupProject: React.FC<RemoveGroupProjectProps> = (props) => {
  const onDeleteClick = () => {
    confirmDestructive({
      title: '删除项目',
      content: '确定删除该团队项目吗？将删除全部模型，此操作无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () =>
        deleteGroupProject({
          id: props.projectId,
        }).then((r) => {
          if (r.code === 200) {
            message.success('删除成功');
            history.push({
              pathname: '/project/group',
            });
          } else {
            message.error(r.message || '删除失败');
          }
        }),
    });
  };

  return (
    <Button danger aria-label="删除团队项目" onClick={onDeleteClick}>
      删除
    </Button>
  );
};

export default React.memo(RemoveGroupProject);
