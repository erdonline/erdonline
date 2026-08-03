import React, {useRef, useState} from 'react';
import {Button, Form, Input, Modal, Select, message} from 'antd';
import type {InputRef} from 'antd/es/input';
import {updateProject} from '@/services/project';
import _ from 'lodash';

export type RenameProjectProps = {
  fetchProjects: () => void;
  trigger?: string;
  project: {
    id: string;
    projectName?: string;
    description?: string;
    tags?: string;
  };
};

type FormValues = {
  projectName?: string;
  tags?: string[];
  description?: string;
};

function splitProjectTags(tags?: string): string[] {
  if (!tags) {
    return [];
  }
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

const RenameProject: React.FC<RenameProjectProps> = (props) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const nameInputRef = useRef<InputRef>(null);

  const closeModal = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const res = await updateProject({
      id: props.project.id,
      projectName: values.projectName,
      description: values.description,
      tags: _.join(values.tags, ','),
    });
    if (res?.code === 200) {
      props.fetchProjects();
      message.success('修改成功');
      setOpen(false);
      return;
    }
    message.error(res?.message || res?.msg || '修改失败');
  };

  return (
    <>
      <Button
        type="link"
        data-testid="project-rename-trigger"
        aria-label="修改项目"
        onClick={() => setOpen(true)}
      >
        修改
      </Button>
      <Modal
        title="修改项目"
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
          form.setFieldsValue({
            projectName: props.project.projectName,
            description: props.project.description,
            tags: splitProjectTags(props.project.tags),
          });
          window.setTimeout(() => nameInputRef.current?.focus(), 0);
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
            <Input ref={nameInputRef} placeholder="请输入项目名" />
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
              data-testid="project-rename-tags"
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

export default React.memo(RenameProject);
