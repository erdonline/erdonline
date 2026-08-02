import React, {useEffect, useState} from 'react';
import {Button, Divider, Form, Input, Select, Space, Typography, message} from 'antd';
import {GET} from '@/services/crud';
import {useSearchParams} from '@@/exports';
import _ from 'lodash';
import RemoveGroupProject from '@/pages/project/group/component/RemoveGroupProject';
import {updateGroupProject} from '@/services/group-project';
import {Access, useAccess} from '@@/plugin-access';

const {Title, Text} = Typography;

export type BasicSettingProps = {};

type FormValues = {
  projectName?: string;
  tags?: string[];
  description?: string;
  createTime?: string;
  updateTime?: string;
};

const BasicSetting: React.FC<BasicSettingProps> = () => {
  const access = useAccess();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const canEdit = !!access.canErdProjectGroupEdit;

  useEffect(() => {
    if (!projectId) {
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await GET('/ncnb/project/group/get/' + projectId, {});
      if (cancelled) {
        return;
      }
      const data = result?.data;
      if (!data) {
        return;
      }
      const tags = data.tags;
      form.setFieldsValue({
        ...data,
        tags:
          typeof tags === 'string'
            ? tags
                .split(/[,;]/)
                .map((t: string) => t.trim())
                .filter(Boolean)
            : tags,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, form]);

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      const r = await updateGroupProject({
        id: projectId,
        projectName: values.projectName,
        description: values.description,
        tags: _.join(values.tags, ','),
      });
      if (r?.code === 200) {
        message.success('修改成功');
        return;
      }
      if (!r?.msg) {
        message.error('修改失败');
      }
    } catch {
      // HTTP/网络：request errorHandler 已 toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Title level={4}>基本设置</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{maxWidth: 520}}
      >
        <Form.Item
          name="projectName"
          label="项目名"
          rules={[
            {required: true, message: '不能为空'},
            {max: 100, message: '不能大于 100 个字符'},
          ]}
        >
          <Input
            placeholder="请输入项目名"
            disabled={!canEdit}
            bordered={canEdit}
          />
        </Form.Item>
        <Form.Item
          name="tags"
          label="标签"
          rules={[{required: true, message: '不能为空'}]}
        >
          <Select
            mode="tags"
            tokenSeparators={[',', ';']}
            placeholder="请输入项目标签,按回车分割"
            disabled={!canEdit}
            bordered={canEdit}
            aria-label="标签"
          />
        </Form.Item>
        <Form.Item
          name="description"
          label="项目描述"
          rules={[
            {required: true, message: '不能为空'},
            {max: 100, message: '不能大于 100 个字符'},
          ]}
        >
          <Input.TextArea
            placeholder="请输入项目描述"
            disabled={!canEdit}
            bordered={canEdit}
            rows={3}
          />
        </Form.Item>
        <Form.Item
          name="createTime"
          label="创建时间"
          rules={[
            {required: true, message: '不能为空'},
            {max: 100, message: '不能大于 100 个字符'},
          ]}
        >
          <Input bordered={false} disabled />
        </Form.Item>
        <Form.Item
          name="updateTime"
          label="最后修改时间"
          rules={[
            {required: true, message: '不能为空'},
            {max: 100, message: '不能大于 100 个字符'},
          ]}
        >
          <Input bordered={false} disabled />
        </Form.Item>
        {canEdit ? (
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              提 交
            </Button>
          </Form.Item>
        ) : null}
      </Form>

      <Divider />
      <Access accessible={access.canErdProjectGroupDel} fallback={<></>}>
        <Space direction="vertical">
          <Title level={4}>删除项目</Title>
          <Text type="secondary">删除项目全部模型，此操作无法恢复</Text>
          <RemoveGroupProject projectId={projectId} />
        </Space>
      </Access>
    </>
  );
};

export default React.memo(BasicSetting);
