import React, {useState} from 'react';
import {Button, Modal} from 'antd';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import {DeleteOutlined} from '@ant-design/icons';

export type RemoveVersionProps = {};

const REMOVE_WRAP = 'version-remove-modal-wrap';

const RemoveVersion: React.FC<RemoveVersionProps> = () => {
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
    versionDispatch.updateVersionData(currentVersion, currentVersion, 'delete');
    setOpen(false);
  };

  return (
    <>
      <Button
        key="delete"
        size="small"
        type="link"
        icon={<DeleteOutlined />}
        data-testid="version-delete-btn"
        aria-label="删除版本"
        onClick={() => setOpen(true)}
      >
        删除
      </Button>
      <Modal
        title="删除版本"
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        okText="是"
        cancelText="否"
        okButtonProps={{danger: true}}
        destroyOnClose
        keyboard
        focusTriggerAfterClose
        wrapClassName={REMOVE_WRAP}
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => {
            document
              .querySelector<HTMLButtonElement>(
                `.${REMOVE_WRAP} .ant-modal-footer .ant-btn-primary`,
              )
              ?.focus();
          }, 0);
        }}
      >
        {`确定删除版本「${ver}」吗？此操作不可逆。`}
      </Modal>
    </>
  );
};

export default React.memo(RemoveVersion);
