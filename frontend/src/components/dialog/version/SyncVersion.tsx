import React from 'react';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import {Button} from 'antd';
import {CloudServerOutlined, CloudUploadOutlined} from '@ant-design/icons';
import {useIntl} from '@@/exports';

export type SyncVersionProps = {
  synced: boolean;
  /** 行数据必须传入：勿依赖 List onMouseEnter 写 currentVersion（键盘/无悬停会炸） */
  version: {
    version?: string;
    changes?: unknown[];
    projectJSON?: { modules?: unknown[] };
    [key: string]: unknown;
  };
};

const SyncVersion: React.FC<SyncVersionProps> = (props) => {
  const intl = useIntl();
  const {versions, versionDispatch} = useVersionStore(
    (state) => ({
      versions: state.versions,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const row = props.version;
  const versionIndex = versions.findIndex(
    (v: {version?: string}) => v.version === row.version,
  );
  const lastVersion = versionIndex >= 0 ? versions[versionIndex + 1] || row : row;
  const initVersion = versionIndex >= 0 ? versionIndex === versions.length - 1 : true;

  const syncLabel = intl.formatMessage({ id: 'versionModal.syncVersion.button' });
  const ariaLabel = props.synced
    ? intl.formatMessage({ id: 'versionModal.syncVersion.ariaSynced' })
    : intl.formatMessage({ id: 'versionModal.syncVersion.ariaNotSynced' });

  return (
    <Button
      key="sync"
      icon={props.synced ? <CloudServerOutlined /> : <CloudUploadOutlined />}
      type="link"
      size="small"
      disabled={props.synced}
      aria-label={ariaLabel}
      data-testid="version-sync-btn"
      onClick={() => {
        // 同步钉当前行进 store（详情/编辑等同构）
        versionDispatch.setCurrentVersion(row, versionIndex >= 0 ? versionIndex : 0);
        versionDispatch.readDb(
          props.synced,
          row,
          lastVersion,
          row.changes,
          initVersion,
          true,
        );
      }}
    >
      {syncLabel}
    </Button>
  );
};

export default React.memo(SyncVersion);
