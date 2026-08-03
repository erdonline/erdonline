import React, {useRef, useState} from 'react';
import {AimOutlined} from '@ant-design/icons';
import {Button, Form, Input, Modal, message} from 'antd';
import type {InputRef} from 'antd';
import moment from 'moment';
import useVersionStore from '@/store/version/useVersionStore';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import * as Save from '@/utils/save';

export type InitVersionProps = {};

type FormValues = {
  version?: string;
  versionDesc?: string;
};

const InitVersion: React.FC<InitVersionProps> = () => {
  const {hasDB, init, versionDispatch} = useVersionStore(
    (state) => ({
      hasDB: state.hasDB,
      init: state.init,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const {projectJSON} = useProjectStore(
    (state) => ({
      projectJSON: state.project?.projectJSON,
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
    // 基线文件只需要存储 modules 信息
    const currentDBData = versionDispatch.getCurrentDBData();
    if (!currentDBData) {
      message.warning('未配置数据库源，请先配置数据源！');
      return;
    }
    const version = {
      projectJSON: {
        modules: projectJSON.modules || [],
      },
      dbKey: currentDBData.key || '',
      baseVersion: true,
      version: values.version,
      versionDesc: values.versionDesc,
      changes: [],
      versionDate: moment().format('YYYY/M/D H:m:s'),
    };
    try {
      const res = await Save.hisProjectSave(version);
      if (res?.code === 200) {
        message.success('初始化基线成功');
        versionDispatch.getVersionMessage(res.data, true);
        versionDispatch.setState({
          changes: [],
          init: false,
          versions: res.data,
        });
        versionDispatch.dropVersionTable();
        setOpen(false);
        return;
      }
      // 业务失败：request 已 toast；失败不关窗（勿伪装成功）
    } catch {
      // 网络/HTTP：errorHandler 已 toast；失败不关窗
    }
  };

  return (
    <>
      <Button
        type="primary"
        key="selection"
        disabled={!hasDB || !init}
        data-testid="version-init-btn"
        aria-label="初始化基线"
        onClick={openModal}
      >
        <AimOutlined />
        初始化基线
      </Button>
      <Modal
        title="初始化基线"
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

export default React.memo(InitVersion);
