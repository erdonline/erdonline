import React, {useRef, useState} from 'react';
import {Button, Form, Input, Modal, Select, message} from 'antd';
import {useIntl} from '@umijs/max';
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
  const intl = useIntl();
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
      message.success(intl.formatMessage({ id: 'projectModal.createSuccess' }));
      props.fetchProjects();
      setOpen(false);
      return;
    }
    if (!res?.msg && !res?.message) {
      message.error(intl.formatMessage({ id: 'projectModal.createFailed' }));
    }
  };

  return (
    <>
      <Button
        type="primary"
        data-testid="project-create-trigger"
        onClick={() => setOpen(true)}
      >
        {intl.formatMessage({ id: 'projectModal.create' })}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'projectModal.addTitle' })}
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        okText={intl.formatMessage({ id: 'projectModal.ok' })}
        cancelText={intl.formatMessage({ id: 'projectModal.cancel' })}
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
            label={intl.formatMessage({ id: 'projectModal.typeLabel' })}
            rules={[{required: true, message: intl.formatMessage({ id: 'projectModal.typeRequired' })}]}
          >
            <Select
              ref={typeSelectRef}
              placeholder={intl.formatMessage({ id: 'projectModal.typePlaceholder' })}
              options={[
                {label: intl.formatMessage({ id: 'projectList.type.person' }), value: 1},
                {label: intl.formatMessage({ id: 'projectList.type.team' }), value: 2},
              ]}
            />
          </Form.Item>
          <Form.Item
            name="projectName"
            label={intl.formatMessage({ id: 'projectModal.nameLabel' })}
            rules={[
              {required: true, message: intl.formatMessage({ id: 'versionModal.validation.required' })},
              {max: 100, message: intl.formatMessage({ id: 'versionModal.validation.max100' })},
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: 'projectModal.namePlaceholder' })} />
          </Form.Item>
          <Form.Item
            name="tags"
            label={intl.formatMessage({ id: 'projectModal.tagsLabel' })}
            rules={[{required: true, message: intl.formatMessage({ id: 'versionModal.validation.required' })}]}
          >
            <Select
              mode="tags"
              tokenSeparators={[',']}
              placeholder={intl.formatMessage({ id: 'projectModal.tagsPlaceholder' })}
              data-testid="project-tags"
              notFoundContent={null}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.formatMessage({ id: 'projectModal.descLabel' })}
            rules={[
              {required: true, message: intl.formatMessage({ id: 'versionModal.validation.required' })},
              {max: 100, message: intl.formatMessage({ id: 'versionModal.validation.max100' })},
            ]}
          >
            <Input.TextArea placeholder={intl.formatMessage({ id: 'projectModal.descPlaceholder' })} rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(AddProject);
