import React, {useRef, useState} from 'react';
import {Button, Form, Input, Modal, Select, message} from 'antd';
import type {BaseSelectRef} from 'rc-select';
import defaultData from '@/utils/defaultData.json';
import _ from 'lodash';
import {addProject} from '@/services/project';
import {addGroupProject} from '@/services/group-project';

export type AddProjectProps = {
  fetchProjects: () => void;
  trigger?: string;
  /** 初始项目类型：1 个人 / 2 团队；调用方传入时用作表单初值 */
  type?: 1 | 2;
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

const AddProject: React.FC<AddProjectProps> = (props) => {
  const initialType = props.type ?? 1;
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const typeSelectRef = useRef<BaseSelectRef>(null);

  const closeModal = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const addFunction = values.type === 1 ? addProject : addGroupProject;
    const res = await addFunction({
      ...emptyProject,
      projectName: values.projectName,
      description: values.description,
      tags: _.join(values.tags, ','),
    });
    if (res?.code === 200) {
      message.success('创建成功');
      props.fetchProjects();
      setOpen(false);
      return;
    }
    if (!res?.msg && !res?.message) {
      message.error('创建失败');
    }
  };

  return (
    <>
      <Button
        type="primary"
        data-testid="project-create-trigger"
        onClick={() => setOpen(true)}
      >
        新建
      </Button>
      <Modal
        title="新增项目"
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        okText="确定"
        cancelText="取消"
        destroyOnClose
        width={520}
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => typeSelectRef.current?.focus(), 0);
        }}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{type: initialType, tags: ['新建']}}
        >
          <Form.Item
            name="type"
            label="项目类型"
            rules={[{required: true, message: '请选择项目类型'}]}
          >
            <Select
              ref={typeSelectRef}
              placeholder="请选择项目类型"
              options={[
                {label: '个人项目', value: 1},
                {label: '团队项目', value: 2},
              ]}
            />
          </Form.Item>
          <Form.Item
            name="projectName"
            label="项目名"
            rules={[
              {required: true, message: '不能为空'},
              {max: 100, message: '不能大于 100 个字符'},
            ]}
          >
            <Input placeholder="请输入项目名" />
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
              data-testid="project-tags"
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
            <Input.TextArea placeholder="请输入项目描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(AddProject);
