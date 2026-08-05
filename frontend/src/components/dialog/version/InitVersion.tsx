import React, {useRef, useState} from 'react';
import {AimOutlined} from '@ant-design/icons';
import {Button, Form, Input, Modal, message} from 'antd';
import type {InputRef} from 'antd';
import moment from 'moment';
import useVersionStore from '@/store/version/useVersionStore';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import * as Save from '@/utils/save';
import {
  handleVersionSaveResponse,
  isVersionSaveDuplicate,
} from '@/utils/versionSaveConflict';
import {useIntl} from '@@/exports';
import {appFormat} from '@/utils/messageFormat';

export type InitVersionProps = {};

type FormValues = {
  version?: string;
  versionDesc?: string;
};

const InitVersion: React.FC<InitVersionProps> = () => {
  const intl = useIntl();
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
    const fmt = appFormat();
    // 基线文件只需要存储 modules 信息
    const currentDBData = versionDispatch.getCurrentDBData();
    if (!currentDBData) {
      message.warning(fmt('versionModal.initVersion.noDatasource'));
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
      if (handleVersionSaveResponse(res)) {
        message.success(fmt('versionModal.initVersion.success'));
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
      if (!isVersionSaveDuplicate(res)) {
        // 其余业务失败：request 已 toast
      }
      // 失败不关窗（勿伪装成功）
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
        aria-label={intl.formatMessage({ id: 'versionModal.initVersion.aria' })}
        onClick={openModal}
      >
        <AimOutlined />
        {intl.formatMessage({ id: 'versionModal.initVersion.button' })}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'versionModal.initVersion.title' })}
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
              placeholder={intl.formatMessage({ id: 'versionModal.initVersion.versionPlaceholder' })}
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
                id: 'versionModal.initVersion.versionDescPlaceholder',
              })}
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(InitVersion);
