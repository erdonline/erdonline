import React, {useRef, useState} from 'react';
import {EditOutlined} from '@ant-design/icons';
import {Button, Form, Input, Modal, Select, message} from 'antd';
import type {InputRef} from 'antd/es/input';
import type {TextAreaRef} from 'antd/es/input/TextArea';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import {compareStringVersion} from '@/utils/string';
import {joinVersionTags, splitVersionTags} from '@/utils/versionTags';

export type RenameVersionProps = {};

type FormValues = {
  version?: string;
  versionDesc?: string;
  tags?: string[];
};

const RenameVersion: React.FC<RenameVersionProps> = () => {
  const {currentVersionIndex, currentVersion, versions, versionDispatch} = useVersionStore(
    (state) => ({
      currentVersionIndex: state.currentVersionIndex,
      currentVersion: state.currentVersion,
      versions: state.versions,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const versionInputRef = useRef<InputRef>(null);
  const versionDescRef = useRef<TextAreaRef>(null);
  const versionReadonly = currentVersionIndex !== 0;

  const closeModal = () => {
    setOpen(false);
  };

  const openModal = () => {
    form.setFieldsValue({
      ...currentVersion,
      tags: splitVersionTags(currentVersion?.tag),
    });
    setOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const tag = joinVersionTags(values.tags);
    if (tag && tag.length > 255) {
      message.error('标签总长度不能大于 255 个字符');
      // 受控 open：不 setOpen(false) 即保持弹窗；勿 reject（webpack overlay 会挡后续操作）
      return;
    }
    const tempValue = {
      ...currentVersion,
      version: values.version,
      versionDesc: values.versionDesc,
      tag: tag || undefined,
    };

    const tempVersions = versions.slice(1);
    if (currentVersionIndex !== 0) {
      versionDispatch.updateVersionData(tempValue, currentVersion, 'update');
      setOpen(false);
      return;
    }
    if (tempVersions.map((v: {version?: string}) => v.version).includes(tempValue.version)) {
      message.error('该版本号已经存在了');
      return;
    }
    if (tempVersions[0]) {
      const renameCmp = compareStringVersion(tempValue.version, tempVersions[0].version);
      if (renameCmp === null) {
        message.error('版本号格式无法比较，请使用如 1.0.0 的数字段格式');
        return;
      }
      if (renameCmp <= 0) {
        message.error('新版本不能小于或等于已经存在的版本');
        return;
      }
    }
    versionDispatch.updateVersionData(tempValue, currentVersion, 'update');
    setOpen(false);
  };

  return (
    <>
      <Button
        key="editor"
        size="small"
        type="link"
        icon={<EditOutlined />}
        data-testid="version-rename-btn"
        aria-label="编辑版本"
        onClick={openModal}
      >
        编辑
      </Button>
      <Modal
        title="编辑版本"
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        destroyOnClose
        width={520}
        forceRender
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => {
            // 非最新版版本号只读：首焦描述，避免落只读框
            if (versionReadonly) {
              versionDescRef.current?.focus();
              return;
            }
            versionInputRef.current?.focus();
          }, 0);
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
              {max: 100, message: '不能大于 100 个字符'},
            ]}
          >
            <Input
              ref={versionInputRef}
              placeholder="请输入版本号"
              readOnly={versionReadonly}
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
              ref={versionDescRef}
              placeholder="请输入版本描述"
              rows={3}
            />
          </Form.Item>
          <Form.Item
            name="tags"
            label="版本标签"
            rules={[
              {
                validator: async (_: unknown, value: string[] | undefined) => {
                  const joined = joinVersionTags(value);
                  if (joined && joined.length > 255) {
                    return Promise.reject(new Error('标签总长度不能大于 255 个字符'));
                  }
                },
              },
            ]}
          >
            <Select
              mode="tags"
              tokenSeparators={[',']}
              placeholder="可选，回车添加多个标签"
              data-testid="version-tag-input"
              aria-label="版本标签"
              notFoundContent={null}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(RenameVersion);
