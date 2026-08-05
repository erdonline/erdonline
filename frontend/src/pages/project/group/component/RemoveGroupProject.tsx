import React from 'react';
import {Button, message} from 'antd';
import {deleteGroupProject} from '@/services/group-project';
import {history, useIntl} from '@@/exports';
import {confirmDestructive} from '@/utils/destructiveConfirm';

export type RemoveGroupProjectProps = {
  projectId: string;
};

const RemoveGroupProject: React.FC<RemoveGroupProjectProps> = (props) => {
  const intl = useIntl();

  const onDeleteClick = () => {
    confirmDestructive({
      title: intl.formatMessage({id: 'groupSetting.delete.title'}),
      content: intl.formatMessage({id: 'groupSetting.delete.content'}),
      okText: intl.formatMessage({id: 'groupSetting.delete.ok'}),
      okType: 'danger',
      cancelText: intl.formatMessage({id: 'accountSettings.common.cancel'}),
      onOk: () =>
        deleteGroupProject({
          id: props.projectId,
        }).then((r) => {
          if (r.code === 200) {
            message.success(intl.formatMessage({id: 'groupSetting.delete.success'}));
            history.push({
              pathname: '/project/group',
            });
          } else {
            message.error(r.message || intl.formatMessage({id: 'groupSetting.delete.failed'}));
          }
        }),
    });
  };

  return (
    <Button
      danger
      aria-label={intl.formatMessage({id: 'groupSetting.delete.buttonAria'})}
      data-testid="basic-setting-delete-button"
      onClick={onDeleteClick}
    >
      {intl.formatMessage({id: 'groupSetting.delete.button'})}
    </Button>
  );
};

export default React.memo(RemoveGroupProject);
