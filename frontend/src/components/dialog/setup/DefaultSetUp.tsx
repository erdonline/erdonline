import React, {useContext, useState} from 'react';
import {Button, Form, Input, Modal, Switch, Tabs, Upload, message} from 'antd';
import './index.less';
import DefaultField from '@/components/dialog/setup/DefaultField';
import * as cache from '@/utils/cache';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import {CONSTANT} from '@/utils/constant';
import {ProjectMenuCloseContext} from '@/components/Menu/projectMenuClose';

export type DefaultSetUpProps = {};

type FormValues = {
  erdPassword?: string;
  sqlConfig?: string;
  operationMode?: boolean;
};

const DefaultSetUp: React.FC<DefaultSetUpProps> = () => {
  const [tab, setTab] = useState('tab1');
  const [open, setOpen] = useState(false);
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

  const openModal = () => {
    closeProjectMenu();
    form.setFieldsValue({
      erdPassword: profile?.erdPassword,
      sqlConfig: profile?.sqlConfig,
      operationMode: profile?.operationMode,
    });
    setTab('tab1');
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    await projectDispatch.updateProfile({
      erdPassword: values.erdPassword,
      sqlConfig: values.sqlConfig,
      operationMode: values.operationMode,
    });
    setOpen(false);
  };

  return (
    <>
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
      <Modal
        title="默认项设置"
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        destroyOnClose
        width={720}
        forceRender
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Tabs
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
                              projectDispatch.updateWordTemplateConfig(e.file.response.data);
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
                        onClick={() => projectDispatch.downloadWordTemplate()}
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
