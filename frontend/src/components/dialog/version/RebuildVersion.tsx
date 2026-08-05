import React, {useRef, useState} from 'react';
import {AlertOutlined} from '@ant-design/icons';
import {Button, Form, Input, Modal} from 'antd';
import type {InputRef} from 'antd';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import {useIntl} from '@@/exports';

export type RebuildVersionProps = {};

type FormValues = {
  version?: string;
  versionDesc?: string;
};

const RebuildVersion: React.FC<RebuildVersionProps> = () => {
  const intl = useIntl();
  const {init, versionDispatch} = useVersionStore(
    (state) => ({
      init: state.init,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const versionInputRef = useRef<InputRef>(null);

  const openModal = () => {
    form.resetFields();
    setOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    versionDispatch.rebuild({
      version: values.version,
      versionDesc: values.versionDesc,
    });
    setOpen(false);
  };

  return (
    <>
      <Button
        key="undo"
        type="primary"
        danger
        disabled={init}
        data-testid="version-rebuild-btn"
        aria-label={intl.formatMessage({ id: 'versionModal.rebuildVersion.aria' })}
        onClick={openModal}
      >
        <AlertOutlined />
        {intl.formatMessage({ id: 'versionModal.rebuildVersion.button' })}
      </Button>
      <Modal
        title={
          <span>
            {intl.formatMessage({ id: 'versionModal.rebuildVersion.title' })}
            <span style={{ color: 'var(--erd-brand)', fontSize: 12, fontWeight: 400 }}>
              {intl.formatMessage({ id: 'versionModal.rebuildVersion.subtitle' })}
            </span>
          </span>
        }
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        destroyOnClose
        width={520}
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => versionInputRef.current?.focus(), 0);
        }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="version"
            label={intl.formatMessage({ id: 'versionModal.addVersion.versionLabel' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'versionModal.validation.required' }),
              },
              {
                pattern: /^([1-9]\d|[1-9])(\.([1-9]\d|\d)){2}$/,
                message: intl.formatMessage({ id: 'versionModal.validation.versionFormat' }),
              },
              {
                max: 100,
                message: intl.formatMessage({ id: 'versionModal.validation.max200' }),
              },
            ]}
          >
            <Input
              ref={versionInputRef}
              aria-label={intl.formatMessage({ id: 'versionModal.addVersion.versionLabel' })}
              placeholder={intl.formatMessage({
                id: 'versionModal.rebuildVersion.versionPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="versionDesc"
            label={intl.formatMessage({ id: 'versionModal.addVersion.versionDescLabel' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'versionModal.validation.required' }),
              },
              {
                max: 100,
                message: intl.formatMessage({ id: 'versionModal.validation.max100' }),
              },
            ]}
          >
            <Input.TextArea
              aria-label={intl.formatMessage({ id: 'versionModal.addVersion.versionDescLabel' })}
              placeholder={intl.formatMessage({
                id: 'versionModal.rebuildVersion.versionDescPlaceholder',
              })}
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(RebuildVersion);
