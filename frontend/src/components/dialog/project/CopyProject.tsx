import React, {useRef, useState} from 'react';
import {Button, Form, Input, Modal, Select, message} from 'antd';
import type {InputRef} from 'antd';
import defaultData from '@/utils/defaultData.json';
import _ from 'lodash';
import {addProject} from '@/services/project';
import {addGroupProject} from '@/services/group-project';
import {CopyOutlined} from '@ant-design/icons';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';

export type CopyProjectProps = {
  projectJSON?: {
    modules?: unknown;
  };
};

type FormValues = {
  type?: 1 | 2;
  projectName?: string;
  tags?: string[];
  description?: string;
};

const emptyProject = {
  projectName: '',
  description: '',
  tags: '',
  projectJSON: {
    ...defaultData,
  },
  configJSON: {synchronous: {upgradeType: 'increment'}},
};

const CopyProject: React.FC<CopyProjectProps> = (props) => {
  const {profile, dataTypeDomains} = useProjectStore(
    (state) => ({
      profile: state.project?.projectJSON?.profile,
      dataTypeDomains: state.project?.projectJSON?.dataTypeDomains,
    }),
    shallow,
  );
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const projectNameInputRef = useRef<InputRef>(null);

  const openModal = () => {
    form.setFieldsValue({
      type: 1,
      tags: undefined,
      projectName: undefined,
      description: undefined,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const addFunction = values.type === 1 ? addProject : addGroupProject;
    const res = await addFunction({
      ...emptyProject,
      projectJSON: {
        profile,
        dataTypeDomains,
        modules: props.projectJSON?.modules || emptyProject.projectJSON.modules,
      },
      projectName: values.projectName,
      description: values.description,
      tags: _.join(values.tags, ','),
    });
    if (res?.code === 200) {
      message.success(
        <>
          复刻成功，
          <a href="/project/recent">立即打开</a>
        </>,
        5,
      );
      setOpen(false);
      return;
    }
    message.error(res?.message || res?.msg || '复刻失败');
  };

  return (
    <>
      <Button
        key="copy"
        size="small"
        type="link"
        icon={<CopyOutlined />}
        data-testid="project-copy-trigger"
        aria-label="复刻"
        onClick={openModal}
      >
        复刻
      </Button>
      <Modal
        title="复刻为新项目(从当前版本创建新项目)"
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        destroyOnClose
        width={520}
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => projectNameInputRef.current?.focus(), 0);
        }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="projectName"
            label="项目名"
            rules={[
              {required: true, message: '不能为空'},
              {max: 100, message: '不能大于 100 个字符'},
            ]}
          >
            <Input
              ref={projectNameInputRef}
              aria-label="项目名"
              placeholder="请输入项目名"
            />
          </Form.Item>
          <Form.Item
            name="type"
            label="项目类型"
            rules={[{required: true, message: '请选择项目类型'}]}
          >
            <Select
              placeholder="请选择项目类型"
              options={[
                {label: '个人项目', value: 1},
                {label: '团队项目', value: 2},
              ]}
            />
          </Form.Item>
          <Form.Item
            name="tags"
            label="标签"
            rules={[{required: true, message: '不能为空'}]}
          >
            <Select
              mode="tags"
              tokenSeparators={[',']}
              placeholder="请输入项目标签,按回车分割"
              data-testid="project-copy-tags"
              notFoundContent={null}
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
              aria-label="项目描述"
              placeholder="请输入项目描述"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(CopyProject);
