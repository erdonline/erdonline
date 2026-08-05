import React, {useMemo, useRef, useState} from 'react';
import {PlusOutlined} from '@ant-design/icons';
import {Button, Form, Input, Modal, Select} from 'antd';
import type {InputRef} from 'antd/es/input';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import {suggestNextVersion} from '@/utils/versionConstants';
import {joinVersionTags} from '@/utils/versionTags';
import {useIntl} from '@@/exports';

export type AddVersionProps = {
  trigger: string;
  /** 触发按钮文案；空态 CTA 用「保存第一个版本」 */
  label?: string;
  /** 触发按钮 testid；默认 add-version-btn，空态用 version-empty-save-btn 避免重复 */
  testId?: string;
};

type FormValues = {
  version?: string;
  versionDesc?: string;
  tags?: string[];
};

const AddVersion: React.FC<AddVersionProps> = (props) => {
  const intl = useIntl();
  const {label, testId = 'add-version-btn'} = props;
  const buttonLabel =
    label ?? intl.formatMessage({ id: 'versionModal.addVersion.button' });
  const {versions, versionBaseline, versionDispatch} = useVersionStore(
    (state) => ({
      versions: state.versions,
      versionBaseline: state.versionBaseline,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const versionInputRef = useRef<InputRef>(null);
  // 建议版本号以独立查询的最新版本基线为准；列表可能只是某一页
  const initialVersion = useMemo(
    () => suggestNextVersion(versionBaseline ? [versionBaseline, ...versions] : versions),
    [versionBaseline, versions],
  );

  const closeModal = () => {
    setOpen(false);
  };

  const openModal = () => {
    form.setFieldsValue({
      version: initialVersion,
      versionDesc: intl.formatMessage({ id: 'versionModal.addVersion.defaultDesc' }),
      tags: [],
    });
    setOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const tag = joinVersionTags(values.tags);
    if (tag && tag.length > 255) {
      // 受控 open：不关窗；勿 reject（webpack overlay 会挡后续操作）
      return;
    }
    const ok = await versionDispatch.saveNewVersion({
      version: values.version,
      versionDesc: values.versionDesc,
      tag,
    });
    if (ok === false) {
      // 拒绝关闭（对齐 ModalForm onFinish 返回 false）；受控 open 须自行关
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <Button
        key="artifact"
        type="primary"
        data-testid={testId}
        aria-label={buttonLabel}
        onClick={openModal}
      >
        <PlusOutlined />
        {buttonLabel}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'versionModal.addVersion.title' })}
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
                message: intl.formatMessage({ id: 'versionModal.validation.max100' }),
              },
            ]}
          >
            <Input
              ref={versionInputRef}
              placeholder={intl.formatMessage({ id: 'versionModal.addVersion.versionPlaceholder' })}
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
              placeholder={intl.formatMessage({
                id: 'versionModal.addVersion.versionDescPlaceholder',
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

export default React.memo(AddVersion);
