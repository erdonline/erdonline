import React, {useRef, useState} from 'react';
import {AlertOutlined} from '@ant-design/icons';
import {Button, Form, Input, Modal} from 'antd';
import type {InputRef} from 'antd';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';

export type RebuildVersionProps = {};

type FormValues = {
  version?: string;
  versionDesc?: string;
};

const RebuildVersion: React.FC<RebuildVersionProps> = () => {
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
        aria-label="重建版本"
        onClick={openModal}
      >
        <AlertOutlined />
        重建版本
      </Button>
      <Modal
        title={
          <span>
            重建版本
            <span style={{color: 'red'}}>
              （重建版本将会清除当前项目的所有版本信息，该操作不可逆）
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
            label="版本号"
            rules={[
              {required: true, message: '不能为空'},
              {
                pattern: /^([1-9]\d|[1-9])(\.([1-9]\d|\d)){2}$/,
                message:
                  '版本号格式不对,版本需满足正则：/^([1-9]\\d|[1-9])(\\.([1-9]\\d|\\d)){2}$/，正确示例：1.0.1',
              },
              {max: 100, message: '不能大于 200 个字符'},
            ]}
          >
            <Input
              ref={versionInputRef}
              aria-label="版本号"
              placeholder="例如：1.0.0「请勿低于系统默认的数据源版本0.0.0」"
            />
          </Form.Item>
          <Form.Item
            name="versionDesc"
            label="版本描述"
            rules={[
              {required: true, message: '不能为空'},
              {max: 100, message: '不能大于 100 个字符'},
            ]}
          >
            <Input.TextArea
              aria-label="版本描述"
              placeholder="'例如：初始化当前项目版本"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(RebuildVersion);
