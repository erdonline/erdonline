import React, {useRef, useState} from 'react';
import {Button, Form, Input, Modal, Select, message} from 'antd';
import {useIntl} from '@umijs/max';
import type {InputRef} from 'antd';
import defaultData from '@/utils/defaultData.json';
import { join as _join } from 'lodash-es';
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
  const intl = useIntl();
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
      tags: _join(values.tags, ','),
    });
    if (res?.code === 200) {
      message.success(
        <>
          {intl.formatMessage({ id: 'projectModal.copySuccess' })}
          <a href="/project/recent">{intl.formatMessage({ id: 'projectModal.copyOpenNow' })}</a>
        </>,
        5,
      );
      setOpen(false);
      return;
    }
    message.error(res?.message || res?.msg || intl.formatMessage({ id: 'projectModal.copyFailed' }));
  };

  return (
    <>
      <Button
        key="copy"
        size="small"
        type="link"
        icon={<CopyOutlined />}
        data-testid="project-copy-trigger"
        aria-label={intl.formatMessage({ id: 'projectModal.copyAria' })}
        onClick={openModal}
      >
        {intl.formatMessage({ id: 'projectModal.copyTrigger' })}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'projectModal.copyTitle' })}
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
            label={intl.formatMessage({ id: 'projectModal.nameLabel' })}
            rules={[
              {required: true, message: intl.formatMessage({ id: 'versionModal.validation.required' })},
              {max: 100, message: intl.formatMessage({ id: 'versionModal.validation.max100' })},
            ]}
          >
            <Input
              ref={projectNameInputRef}
              aria-label={intl.formatMessage({ id: 'projectModal.nameLabelShort' })}
              placeholder={intl.formatMessage({ id: 'projectModal.namePlaceholder' })}
            />
          </Form.Item>
          <Form.Item
            name="type"
            label={intl.formatMessage({ id: 'projectModal.typeLabel' })}
            rules={[{required: true, message: intl.formatMessage({ id: 'projectModal.typeRequiredShort' })}]}
          >
            <Select
              placeholder={intl.formatMessage({ id: 'projectModal.typePlaceholder' })}
              options={[
                {label: intl.formatMessage({ id: 'projectList.type.person' }), value: 1},
                {label: intl.formatMessage({ id: 'projectList.type.team' }), value: 2},
              ]}
            />
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
              data-testid="project-copy-tags"
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
            <Input.TextArea
              aria-label={intl.formatMessage({ id: 'projectModal.descLabel' })}
              placeholder={intl.formatMessage({ id: 'projectModal.descPlaceholder' })}
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(CopyProject);
