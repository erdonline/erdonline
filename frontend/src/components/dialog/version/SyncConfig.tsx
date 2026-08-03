import React, { useState } from 'react';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import { Button, Form, Modal, Radio, message } from 'antd';
import { ControlOutlined } from '@ant-design/icons';
import '@/components/dialog/io-modal.scss';

export type SyncConfigProps = {};

type FormValues = {
  upgradeType?: string;
};

const SyncConfig: React.FC<SyncConfigProps> = () => {
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
        message.success('设置成功');
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

  return (
    <>
      <Button key="refresh" type="default" aria-label="同步配置" onClick={openModal}>
        <ControlOutlined />
        同步配置
      </Button>
      <Modal
        title="同步配置"
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
          配置成功后，后续同步都使用该配置；仅建议项目初始化后设置一次，以后勿动以免版本混乱
        </p>
        <Form form={form} layout="vertical" size="small" preserve={false}>
          <Form.Item name="upgradeType" label="数据表升级方式" rules={[{ required: true }]}>
            <Radio.Group
              data-testid="sync-config-upgrade-type"
              options={[
                { label: '字段增量', value: 'increment' },
                { label: '重建数据表', value: 'rebuild' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(SyncConfig);
