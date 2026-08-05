import React, {useRef, useState} from 'react';
import {EditOutlined} from '@ant-design/icons';
import {Button, Form, Input, Modal, Select, message} from 'antd';
import type {InputRef} from 'antd/es/input';
import type {TextAreaRef} from 'antd/es/input/TextArea';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import {compareStringVersion} from '@/utils/string';
import {joinVersionTags, splitVersionTags} from '@/utils/versionTags';
import {useIntl} from '@@/exports';
import {appFormat} from '@/utils/messageFormat';

export type RenameVersionProps = {};

type FormValues = {
  version?: string;
  versionDesc?: string;
  tags?: string[];
};

const RenameVersion: React.FC<RenameVersionProps> = () => {
  const intl = useIntl();
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
    const fmt = appFormat();
    const tag = joinVersionTags(values.tags);
    if (tag && tag.length > 255) {
      message.error(fmt('versionModal.validation.tagsMax255'));
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
      message.error(fmt('versionModal.renameVersion.duplicateVersion'));
      return;
    }
    if (tempVersions[0]) {
      const renameCmp = compareStringVersion(tempValue.version, tempVersions[0].version);
      if (renameCmp === null) {
        message.error(fmt('versionModal.renameVersion.formatNotComparable'));
        return;
      }
      if (renameCmp <= 0) {
        message.error(fmt('versionModal.renameVersion.notGreaterThanExisting'));
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
        aria-label={intl.formatMessage({ id: 'versionModal.renameVersion.aria' })}
        onClick={openModal}
      >
        {intl.formatMessage({ id: 'versionModal.renameVersion.button' })}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'versionModal.renameVersion.title' })}
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
                message: intl.formatMessage({ id: 'versionModal.validation.max100' }),
              },
            ]}
          >
            <Input
              ref={versionInputRef}
              placeholder={intl.formatMessage({
                id: 'versionModal.renameVersion.versionPlaceholder',
              })}
              readOnly={versionReadonly}
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
              ref={versionDescRef}
              placeholder={intl.formatMessage({
                id: 'versionModal.renameVersion.versionDescPlaceholder',
              })}
              rows={3}
            />
          </Form.Item>
          <Form.Item
            name="tags"
            label={intl.formatMessage({ id: 'versionModal.addVersion.tagsLabel' })}
            rules={[
              {
                validator: async (_: unknown, value: string[] | undefined) => {
                  const joined = joinVersionTags(value);
                  if (joined && joined.length > 255) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({ id: 'versionModal.validation.tagsMax255' }),
                      ),
                    );
                  }
                },
              },
            ]}
          >
            <Select
              mode="tags"
              tokenSeparators={[',']}
              placeholder={intl.formatMessage({ id: 'versionModal.addVersion.tagsPlaceholder' })}
              data-testid="version-tag-input"
              aria-label={intl.formatMessage({ id: 'versionModal.addVersion.tagsAria' })}
              notFoundContent={null}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(RenameVersion);
