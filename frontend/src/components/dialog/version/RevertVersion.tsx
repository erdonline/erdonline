import React from 'react';
import { Button, Popconfirm } from 'antd';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import { RollbackOutlined } from '@ant-design/icons';

export type RevertVersionProps = {
  synced: boolean;
};

const RevertVersion: React.FC<RevertVersionProps> = () => {
  const { currentVersion, versionDispatch } = useVersionStore(
    (state) => ({
      currentVersion: state.currentVersion,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const ver = currentVersion?.version || '?';
  return (
    <Popconfirm
      placement="right"
      title={`回滚至版本『${ver}』(仅恢复当前模型，数据源元数据不变)`}
      onConfirm={() => versionDispatch.revertVersionData()}
      okText="是"
      cancelText="否"
    >
      <Button
        key="revert"
        size="small"
        type="link"
        icon={<RollbackOutlined />}
        data-testid="version-revert-btn"
      >
        回滚
      </Button>
    </Popconfirm>
  );
};

export default React.memo(RevertVersion);
