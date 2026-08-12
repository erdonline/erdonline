import React, {useRef, useState} from 'react';
import {Button, Form, Input, Modal, Select, message} from 'antd';
import {useIntl} from '@umijs/max';
import type {InputRef} from 'antd/es/input';
import {updateProject} from '@/services/project';
import type {MenuDialogControl} from '@/components/Menu/menuDialog';
import _ from 'lodash';

export type RenameProjectProps = MenuDialogControl & {
  fetchProjects?: () => void;
  onSuccess?: (values: {
    projectName: string;
    description?: string;
    tags?: string;
  }) => void;
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
  const intl = useIntl();
  const {
    hideTrigger,
    open: openProp,
    onOpenChange,
    fetchProjects,
    onSuccess,
    project,
  } = props;
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
  const nameInputRef = useRef<InputRef>(null);

  const closeModal = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const res = await updateProject({
        id: project.id,
        projectName: values.projectName,
        description: values.description,
        tags: _.join(values.tags, ','),
      });
      if (res?.code === 200) {
        fetchProjects?.();
        onSuccess?.({
          projectName: values.projectName!,
          description: values.description,
          tags: _.join(values.tags, ','),
        });
        message.success(intl.formatMessage({ id: 'projectModal.renameSuccess' }));
        setOpen(false);
        return;
      }
      message.error(
        res?.message || res?.msg || intl.formatMessage({ id: 'projectModal.renameFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {hideTrigger ? null : (
        <Button
          type="link"
          data-testid="project-rename-trigger"
          aria-label={intl.formatMessage({ id: 'projectModal.renameAria' })}
          onClick={() => setOpen(true)}
        >
          {intl.formatMessage({ id: 'projectModal.renameTrigger' })}
        </Button>
      )}
      <Modal
        title={intl.formatMessage({ id: 'projectModal.renameTitle' })}
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        destroyOnClose
        width={520}
        keyboard
        focusTriggerAfterClose
        confirmLoading={submitting}
        data-testid="project-rename-modal"
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          form.setFieldsValue({
            projectName: project.projectName,
            description: project.description,
            tags: splitProjectTags(project.tags),
          });
          window.setTimeout(() => nameInputRef.current?.focus(), 0);
        }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="projectName"
            label={intl.formatMessage({ id: 'projectModal.nameLabelShort' })}
            rules={[
              {required: true, message: intl.formatMessage({ id: 'versionModal.validation.required' })},
              {max: 100, message: intl.formatMessage({ id: 'versionModal.validation.max100' })},
            ]}
          >
            <Input
              ref={nameInputRef}
              placeholder={intl.formatMessage({ id: 'projectModal.namePlaceholderShort' })}
              data-testid="project-rename-name"
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
              data-testid="project-rename-tags"
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
              placeholder={intl.formatMessage({ id: 'projectModal.descPlaceholder' })}
              rows={3}
              data-testid="project-rename-description"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(RenameProject);
