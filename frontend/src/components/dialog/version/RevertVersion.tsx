import React, {useState} from 'react';
import {Button, Modal} from 'antd';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import {RollbackOutlined} from '@ant-design/icons';

export type RevertVersionProps = {
  synced: boolean;
};

const REVERT_WRAP = 'version-revert-modal-wrap';

const RevertVersion: React.FC<RevertVersionProps> = () => {
  const {currentVersion, versionDispatch} = useVersionStore(
    (state) => ({
      currentVersion: state.currentVersion,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const [open, setOpen] = useState(false);
  const ver = currentVersion?.version || '?';

  const handleOk = () => {
    versionDispatch.revertVersionData();
    setOpen(false);
  };

  return (
    <>
      <Button
        key="revert"
        size="small"
        type="link"
        icon={<RollbackOutlined />}
        data-testid="version-revert-btn"
        aria-label="回滚版本"
        onClick={() => setOpen(true)}
      >
        回滚
      </Button>
      <Modal
        title="回滚版本"
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        okText="是"
        cancelText="否"
        destroyOnClose
        keyboard
        focusTriggerAfterClose
        wrapClassName={REVERT_WRAP}
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => {
            document
              .querySelector<HTMLButtonElement>(
                `.${REVERT_WRAP} .ant-modal-footer .ant-btn-primary`,
              )
              ?.focus();
          }, 0);
        }}
      >
        {`回滚至版本『${ver}』(仅恢复当前模型，数据源元数据不变)`}
      </Modal>
    </>
  );
};

export default React.memo(RevertVersion);
