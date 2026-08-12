import React, {useContext, useEffect, useState} from 'react';
import {Button, Form, Input, Modal, Switch, Tabs, Upload, message} from 'antd';
import {useIntl} from '@umijs/max';
import './index.less';
import '../io-modal.scss';
import DefaultField from '@/components/dialog/setup/DefaultField';
import * as cache from '@/utils/cache';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import {CONSTANT} from '@/utils/constant';
import {ProjectMenuCloseContext} from '@/components/Menu/projectMenuClose';
import type {MenuDialogControl} from '@/components/Menu/menuDialog';

export type DefaultSetUpProps = MenuDialogControl;

type FormValues = {
  erdPassword?: string;
  sqlConfig?: string;
  operationMode?: boolean;
};

const DefaultSetUp: React.FC<DefaultSetUpProps> = ({
  hideTrigger,
  open: openProp,
  onOpenChange,
}) => {
  const intl = useIntl();
  const [tab, setTab] = useState('tab1');
  const [innerOpen, setInnerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) {
      setInnerOpen(v);
    }
    onOpenChange?.(v);
  };
  const [form] = Form.useForm<FormValues>();
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  const closeProjectMenu = useContext(ProjectMenuCloseContext);

  const {projectDispatch, profile} = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      profile: state.project?.projectJSON?.profile,
    }),
    shallow,
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    form.setFieldsValue({
      erdPassword: profile?.erdPassword,
      sqlConfig: profile?.sqlConfig,
      operationMode: profile?.operationMode,
    });
    setTab('tab1');
  }, [open, form, profile]);

  const openModal = () => {
    closeProjectMenu();
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const ok = await projectDispatch.updateProfile({
        erdPassword: values.erdPassword,
        sqlConfig: values.sqlConfig,
        operationMode: values.operationMode,
      });
      if (ok) {
        message.success(intl.formatMessage({ id: 'setupModal.default.success' }));
        setOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {hideTrigger ? null : (
        <Button
          key="default"
          type="text"
          size="small"
          block
          style={{textAlign: 'left'}}
          aria-label={intl.formatMessage({ id: 'setupModal.default.triggerAria' })}
          onClick={openModal}
        >
          {intl.formatMessage({ id: 'setupModal.default.trigger' })}
        </Button>
      )}
      <Modal
        title={intl.formatMessage({ id: 'setupModal.default.title' })}
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        confirmLoading={submitting}
        destroyOnClose
        width={720}
        className="erd-io-modal"
        rootClassName="erd-io-modal-root"
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => {
            document
              .querySelector<HTMLElement>(
                '[data-testid="default-setup-tabs"] [role="tab"][aria-selected="true"]',
              )
              ?.focus();
          }, 0);
        }}
      >
        <Form form={form} layout="vertical" size="small" preserve={false}>
          <Tabs
            data-testid="default-setup-tabs"
            size="small"
            activeKey={tab}
            onChange={setTab}
            items={[
              {
                key: 'tab1',
                label: intl.formatMessage({ id: 'setupModal.default.tabFields' }),
                children: <DefaultField />,
              },
              {
                key: 'tab2',
                label: intl.formatMessage({ id: 'setupModal.default.tabConfig' }),
                children: (
                  <>
                    <Form.Item
                      name="erdPassword"
                      label={intl.formatMessage({ id: 'setupModal.default.erdKeyLabel' })}
                      extra={intl.formatMessage({ id: 'setupModal.default.erdKeyExtra' })}
                    >
                      <Input.Password placeholder={intl.formatMessage({ id: 'setupModal.default.erdKeyPlaceholder' })} />
                    </Form.Item>
                    <Form.Item
                      name="sqlConfig"
                      label={intl.formatMessage({ id: 'setupModal.default.sqlSepLabel' })}
                      extra={intl.formatMessage({ id: 'setupModal.default.sqlSepExtra' })}
                      rules={[{max: 100, message: intl.formatMessage({ id: 'versionModal.validation.max100' })}]}
                    >
                      <Input placeholder={intl.formatMessage({ id: 'setupModal.default.sqlSepPlaceholder' })} />
                    </Form.Item>
                    <Form.Item
                      label={intl.formatMessage({ id: 'setupModal.default.wordLabel' })}
                      extra={intl.formatMessage({ id: 'setupModal.default.wordExtra' })}
                    >
                      <Upload
                        maxCount={1}
                        name="file"
                        headers={{
                          Authorization: 'Bearer 1',
                        }}
                        onChange={(e) => {
                          if (e.file.status === 'done') {
                            if (e.file.response?.code === 200) {
                              void projectDispatch.updateWordTemplateConfig(
                                e.file.response.data,
                              );
                            } else {
                              message.error(
                                e.file.response?.msg ?? intl.formatMessage({ id: 'setupModal.default.uploadFailed' }),
                              );
                            }
                          } else if (e.file.status === 'error') {
                            message.error(intl.formatMessage({ id: 'setupModal.default.uploadFailed' }));
                          }
                        }}
                        action={`${API_URL}/ncnb/doc/uploadWordTemplate/${projectId}`}
                      >
                        <Button>{intl.formatMessage({ id: 'setupModal.default.uploadButton' })}</Button>
                      </Upload>
                      <Button
                        style={{marginLeft: 8}}
                        title={intl.formatMessage({ id: 'setupModal.default.downloadTemplate' })}
                        aria-label={intl.formatMessage({ id: 'setupModal.default.downloadAria' })}
                        onClick={() => {
                          void projectDispatch.downloadWordTemplate();
                        }}
                      >
                        {intl.formatMessage({ id: 'setupModal.default.downloadTemplate' })}
                      </Button>
                    </Form.Item>
                    <Form.Item
                      name="operationMode"
                      label={intl.formatMessage({ id: 'setupModal.default.noviceLabel' })}
                      extra={intl.formatMessage({ id: 'setupModal.default.noviceExtra' })}
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(DefaultSetUp);
