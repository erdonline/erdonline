import React, { useState } from 'react';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import { Button, Form, Modal, Radio, message } from 'antd';
import { ControlOutlined } from '@ant-design/icons';
import { useIntl } from '@@/exports';
import '@/components/dialog/io-modal.scss';

export type SyncConfigProps = {};

type FormValues = {
  upgradeType?: string;
};

const SyncConfig: React.FC<SyncConfigProps> = () => {
  const intl = useIntl();
  const { upgradeType, projectDispatch } = useProjectStore(
    (state) => ({
      upgradeType: state.project?.configJSON?.synchronous?.upgradeType,
      projectDispatch: state.dispatch,
    }),
    shallow,
  );

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const openModal = () => {
    form.setFieldsValue({
      upgradeType: upgradeType || 'increment',
    });
    setOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const ok = await projectDispatch.setUpgradeType(values);
      if (ok) {
        message.success(intl.formatMessage({ id: 'versionModal.syncConfig.success' }));
        setOpen(false);
      }
      // 失败：request 已 toast；失败不关窗可重试
    } finally {
      setSubmitting(false);
    }
  };

  const focusFirstControl = () => {
    // Radio.Group：首焦当前选中项（默认「字段增量」）
    document
      .querySelector<HTMLElement>(
        '[data-testid="sync-config-upgrade-type"] input[type="radio"]:checked',
      )
      ?.focus();
  };

  const buttonLabel = intl.formatMessage({ id: 'versionModal.syncConfig.button' });

  return (
    <>
      <Button
        key="refresh"
        type="default"
        data-testid="version-sync-config-btn"
        aria-label={intl.formatMessage({ id: 'versionModal.syncConfig.aria' })}
        onClick={openModal}
      >
        <ControlOutlined />
        {buttonLabel}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'versionModal.syncConfig.title' })}
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        confirmLoading={submitting}
        destroyOnClose
        width={480}
        className="erd-io-modal"
        rootClassName="erd-io-modal-root"
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => focusFirstControl(), 0);
        }}
      >
        <p className="erd-io-modal__field erd-io-modal__hint">
          {intl.formatMessage({ id: 'versionModal.syncConfig.hint' })}
        </p>
        <Form form={form} layout="vertical" size="small" preserve={false}>
          <Form.Item
            name="upgradeType"
            label={intl.formatMessage({ id: 'versionModal.syncConfig.upgradeTypeLabel' })}
            rules={[{ required: true }]}
          >
            <Radio.Group
              data-testid="sync-config-upgrade-type"
              options={[
                {
                  label: intl.formatMessage({ id: 'versionModal.syncConfig.upgradeIncrement' }),
                  value: 'increment',
                },
                {
                  label: intl.formatMessage({ id: 'versionModal.syncConfig.upgradeRebuild' }),
                  value: 'rebuild',
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(SyncConfig);
