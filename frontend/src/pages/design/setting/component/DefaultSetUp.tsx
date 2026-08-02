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
    await projectDispatch.updateProfile(values);
  };

  return (
    <div className="setting-common-page" data-testid="default-setup-page">
      <h2 className="setting-common-page__title">系统默认项设置</h2>
      <p className="setting-common-page__hint">配置导入导出秘钥、元数据展示与 WORD 模板</p>
      <Form
        form={form}
        layout="vertical"
        size="small"
        className="setting-common-form"
        onFinish={handleFinish}
      >
        <Form.Item
          name="erdPassword"
          label="ERD秘钥"
          extra="仅用于ERD导入导出加密解密"
        >
          <Input.Password placeholder="默认为ERDOnline" />
        </Form.Item>
        <Form.Item
          name="tableLimit"
          label="元数据表展示上限"
          extra="控制元数据表展示上限，默认展示1000个表。当可见范围看不到表时，请使用元数据搜索功能；当元数据表很多时，可以减小此参数，加快页面渲染速度，减少卡顿。"
        >
          <InputNumber min={1} max={1000} placeholder="默认1000，最小1，最大1000" />
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
          name="moduleNameFormat"
          label="元数据->模型名显示格式"
          extra="模型->元数据中，模型名称显示格式：{name}显示英文名，{chnname}显示中文名，{name} {chnname}为英文和中文的组合名"
          rules={[{max: 100, message: '不能大于 100 个字符'}]}
        >
          <Input placeholder="默认为 {name} {chnname}" />
        </Form.Item>
        <Form.Item
          name="tableNameFormat"
          label="元数据->表名显示格式"
          extra="模型->元数据中，表名称显示格式：{title}显示英文名，{chnname}显示中文名，{title} {chnname}为英文和中文的组合名"
          rules={[{max: 100, message: '不能大于 100 个字符'}]}
        >
          <Input placeholder="默认为 {title} {chnname}" />
        </Form.Item>
        <Form.Item
          label="WORD模板配置"
          extra="默认为系统自带的模板，如需修改，请先下载，再重新上传模板文件"
        >
          <Access accessible={access.canErdDocUploadwordtemplate} fallback={<></>}>
            <Upload
              maxCount={1}
              name="file"
              headers={{Authorization: 'Bearer 1'}}
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
          </Access>
          <Access accessible={access.canErdDocDownloadwordtemplate} fallback={<></>}>
            <Button
              style={{marginLeft: 8}}
              title="下载模板"
              onClick={() => projectDispatch.downloadWordTemplate()}
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
