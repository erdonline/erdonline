import React, {useState} from 'react';
import {Button, Modal} from 'antd';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import {RollbackOutlined} from '@ant-design/icons';
import {useIntl} from '@@/exports';

const REVERT_WRAP = 'version-revert-modal-wrap';

const RevertVersion: React.FC = () => {
  const intl = useIntl();
  const {currentVersion, versionDispatch} = useVersionStore(
    (state) => ({
      currentVersion: state.currentVersion,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const ver = currentVersion?.version || '?';

  const handleOk = async () => {
    setSubmitting(true);
    try {
      const ok = await versionDispatch.revertVersionData();
      if (ok) {
        setOpen(false);
      }
      // 失败：request/persist 已 toast；失败不关窗可重试
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        key="revert"
        size="small"
        type="link"
        icon={<RollbackOutlined />}
        data-testid="version-revert-btn"
        aria-label={intl.formatMessage({ id: 'versionModal.revertVersion.aria' })}
        onClick={() => setOpen(true)}
      >
        {intl.formatMessage({ id: 'versionModal.revertVersion.button' })}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'versionModal.revertVersion.title' })}
        open={open}
        onOk={() => void handleOk()}
        onCancel={() => setOpen(false)}
        confirmLoading={submitting}
        okText={intl.formatMessage({ id: 'versionModal.confirm.yes' })}
        cancelText={intl.formatMessage({ id: 'versionModal.confirm.no' })}
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
        {intl.formatMessage({ id: 'versionModal.revertVersion.body' }, { version: ver })}
      </Modal>
    </>
  );
};

export default React.memo(RevertVersion);
