import { designIntl } from '@/pages/design/locales/intl';
import React, {useEffect} from 'react';
import {Access, useAccess} from '@@/plugin-access';
import {Button, Form, Input, InputNumber, Upload, message} from 'antd';
import * as cache from '@/utils/cache';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import {CONSTANT} from '@/utils/constant';
import './setting-common.scss';

export type DefaultSetUpProps = {};

type FormValues = {
  erdPassword?: string;
  tableLimit?: number;
  sqlConfig?: string;
  moduleNameFormat?: string;
  tableNameFormat?: string;
};

const DefaultSetUp: React.FC<DefaultSetUpProps> = () => {
  const projectId = cache.getItem(CONSTANT.PROJECT_ID);
  const access = useAccess();
  const [form] = Form.useForm<FormValues>();

  const {projectDispatch, profile} = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      profile: state.project?.projectJSON?.profile,
    }),
    shallow,
  );

  useEffect(() => {
    form.setFieldsValue({
      erdPassword: profile?.erdPassword,
      tableLimit: profile?.tableLimit,
      sqlConfig: profile?.sqlConfig,
      moduleNameFormat: profile?.moduleNameFormat,
      tableNameFormat: profile?.tableNameFormat,
    });
  }, [profile, form]);

  const handleFinish = async (values: FormValues) => {
    const ok = await projectDispatch.updateProfile(values);
    if (ok) {
      message.success(designIntl('design.common.error.settingsSaved'));
    }
    // 失败：request 已 toast
  };

  return (
    <div className="setting-common-page" data-testid="default-setup-page">
      <h2 className="setting-common-page__title">{designIntl('design.setting.defaultSetup.page.title')}</h2>
      <p className="setting-common-page__hint">{designIntl('design.setting.defaultSetup.page.hint')}</p>
      <Form
        form={form}
        layout="vertical"
        size="small"
        className="setting-common-form"
        onFinish={handleFinish}
      >
        <Form.Item
          name="erdPassword"
          label={designIntl('design.setting.defaultSetup.erdPassword.label')}
          extra={designIntl('design.setting.defaultSetup.erdPassword.extra')}
        >
          <Input.Password placeholder={designIntl('design.setting.defaultSetup.erdPassword.placeholder')} />
        </Form.Item>
        <Form.Item
          name="tableLimit"
          label={designIntl('design.setting.defaultSetup.tableLimit.label')}
          extra={designIntl('design.setting.defaultSetup.tableLimit.extra')}
        >
          <InputNumber min={1} max={1000} placeholder={designIntl('design.setting.defaultSetup.tableLimit.placeholder')} />
        </Form.Item>
        <Form.Item
          name="sqlConfig"
          label={designIntl('design.setting.defaultSetup.sqlConfig.label')}
          extra={designIntl('design.setting.defaultSetup.sqlConfig.extra')}
          rules={[{max: 100, message: designIntl('design.common.max100')}]}
        >
          <Input placeholder={designIntl('design.setting.defaultSetup.sqlConfig.placeholder')} />
        </Form.Item>
        <Form.Item
          name="moduleNameFormat"
          label={designIntl('design.setting.defaultSetup.moduleFormat.label')}
          extra={designIntl('design.setting.defaultSetup.moduleFormat.extra')}
          rules={[{max: 100, message: designIntl('design.common.max100')}]}
        >
          <Input placeholder={designIntl('design.setting.defaultSetup.moduleFormat.placeholder')} />
        </Form.Item>
        <Form.Item
          name="tableNameFormat"
          label={designIntl('design.setting.defaultSetup.tableFormat.label')}
          extra={designIntl('design.setting.defaultSetup.tableFormat.extra')}
          rules={[{max: 100, message: designIntl('design.common.max100')}]}
        >
          <Input placeholder={designIntl('design.setting.defaultSetup.tableFormat.placeholder')} />
        </Form.Item>
        <Form.Item
          label={designIntl('design.setting.defaultSetup.wordTemplate.label')}
          extra={designIntl('design.setting.defaultSetup.wordTemplate.extra')}
        >
          <Access accessible={access.canErdDocUploadwordtemplate} fallback={<></>}>
            <Upload
              maxCount={1}
              name="file"
              headers={{Authorization: 'Bearer 1'}}
              onChange={(e) => {
                if (e.file.status === 'done') {
                  if (e.file.response?.code === 200) {
                    void projectDispatch.updateWordTemplateConfig(
                      e.file.response.data,
                    );
                  } else {
                    message.error(e.file.response?.msg ?? designIntl('design.common.uploadFailed'));
                  }
                } else if (e.file.status === 'error') {
                  message.error(designIntl('design.common.uploadFailed'));
                }
              }}
              action={`${API_URL}/ncnb/doc/uploadWordTemplate/${projectId}`}
            >
              <Button>{designIntl('design.common.upload')}</Button>
            </Upload>
          </Access>
          <Access accessible={access.canErdDocDownloadwordtemplate} fallback={<></>}>
            <Button
              style={{marginLeft: 8}}
              title={designIntl('design.setting.defaultSetup.wordTemplate.download')}
              aria-label={designIntl('design.setting.defaultSetup.wordTemplate.downloadAria')}
              onClick={() => {
                void projectDispatch.downloadWordTemplate();
              }}
            >
              下载模板
            </Button>
          </Access>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default React.memo(DefaultSetUp);
