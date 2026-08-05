import React, {useState} from 'react';
import {Button, Modal} from 'antd';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import {DeleteOutlined} from '@ant-design/icons';
import {useIntl} from '@@/exports';

export type RemoveVersionProps = {};

const REMOVE_WRAP = 'version-remove-modal-wrap';

const RemoveVersion: React.FC<RemoveVersionProps> = () => {
  const intl = useIntl();
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
        aria-label={intl.formatMessage({ id: 'versionModal.removeVersion.aria' })}
        onClick={() => setOpen(true)}
      >
        {intl.formatMessage({ id: 'versionModal.removeVersion.button' })}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'versionModal.removeVersion.title' })}
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        okText={intl.formatMessage({ id: 'versionModal.confirm.yes' })}
        cancelText={intl.formatMessage({ id: 'versionModal.confirm.no' })}
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
        {intl.formatMessage({ id: 'versionModal.removeVersion.body' }, { version: ver })}
      </Modal>
    </>
  );
};

export default React.memo(RemoveVersion);
