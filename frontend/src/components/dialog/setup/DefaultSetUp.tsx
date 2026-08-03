import React, {useContext, useEffect, useState} from 'react';
import {Button, Form, Input, Modal, Switch, Tabs, Upload, message} from 'antd';
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
        message.success('设置成功');
        setOpen(false);
      }
      // 失败：request 已 toast；失败不关窗可重试
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
          aria-label="默认项设置"
          onClick={openModal}
        >
          默认项设置
        </Button>
      )}
      <Modal
        title="默认项设置"
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
          // tab1「默认字段」为默认页；Handsontable 首焦不稳，落在选中 Tab
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
                label: '默认字段',
                children: <DefaultField />,
              },
              {
                key: 'tab2',
                label: '默认配置',
                children: (
                  <>
                    <Form.Item
                      name="erdPassword"
                      label="ERD秘钥"
                      extra="仅用于ERD导入导出加密解密"
                    >
                      <Input.Password placeholder="默认为ERDOnline" />
                    </Form.Item>
                    <Form.Item
                      name="sqlConfig"
                      label="SQL分隔符"
                      extra="分隔每条往数据库执行的SQL"
                      rules={[{max: 100, message: '不能大于 100 个字符'}]}
                    >
                      <Input placeholder="默认为/*SQL@Run*/" />
                    </Form.Item>
                    <Form.Item
                      label="WORD模板配置"
                      extra="默认为系统自带的模板，如需修改，请先下载，再重新上传模板文件"
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
                              message.error(e.file.response?.msg ?? '上传失败');
                            }
                          } else if (e.file.status === 'error') {
                            message.error('上传失败');
                          }
                        }}
                        action={`${API_URL}/ncnb/doc/uploadWordTemplate/${projectId}`}
                      >
                        <Button>点击上传</Button>
                      </Upload>
                      <Button
                        style={{marginLeft: 8}}
                        title="下载模板"
                        aria-label="下载模板"
                        onClick={() => {
                          void projectDispatch.downloadWordTemplate();
                        }}
                      >
                        下载模板
                      </Button>
                    </Form.Item>
                    <Form.Item
                      name="operationMode"
                      label="新手模式"
                      extra="开启新手模式，所有菜单均需要一次单击才能打开或关闭"
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
