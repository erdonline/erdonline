import React, {useEffect, useState} from 'react';
import {Form, Input, Modal, Typography, message} from 'antd';
import {useIntl} from '@umijs/max';
import {submitCatalogTemplate} from '@/services/catalog';

export type PublishTemplateModalProps = {
  projectId: string;
  projectName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

/**
 * 发布为模板：projectId 由调用方从当前上下文注入，用户只填标题与可选简介。
 */
const PublishTemplateModal: React.FC<PublishTemplateModalProps> = ({
  projectId,
  projectName,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm<{title: string; description?: string}>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        title: projectName?.trim() || '',
        description: '',
      });
    }
  }, [open, projectId, projectName, form]);

  const close = () => onOpenChange(false);

  const handleSubmit = async () => {
    if (!projectId) {
      message.error(intl.formatMessage({ id: 'catalogPublish.noProject' }));
      return;
    }
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const res: {code?: number; msg?: string} = await submitCatalogTemplate({
        projectId,
        title: values.title.trim(),
        description: values.description?.trim(),
      });
      if (res?.code === 200) {
        message.success(intl.formatMessage({ id: 'catalogPublish.submitSuccess' }));
        close();
        onSuccess?.();
        return;
      }
      message.error(res?.msg || intl.formatMessage({ id: 'catalogPublish.submitFailed' }));
    } catch (e: unknown) {
      const err = e as {data?: {msg?: string}; message?: string};
      message.error(
        err?.data?.msg || err?.message || intl.formatMessage({ id: 'catalogPublish.submitFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: 'catalogPublish.title' })}
      open={open}
      onOk={handleSubmit}
      onCancel={close}
      okText={intl.formatMessage({ id: 'catalogPublish.okText' })}
      confirmLoading={submitting}
      destroyOnClose
      width={480}
      data-testid="catalog-publish-modal"
    >
      <Typography.Paragraph type="secondary" style={{marginBottom: 12}}>
        {intl.formatMessage({ id: 'catalogPublish.hint' })}
      </Typography.Paragraph>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="title"
          label={intl.formatMessage({ id: 'catalogPublish.titleLabel' })}
          rules={[
            {required: true, message: intl.formatMessage({ id: 'catalogPublish.titleRequired' })},
            {max: 100, message: intl.formatMessage({ id: 'catalogPublish.titleMax' })},
          ]}
        >
          <Input data-testid="catalog-publish-title" aria-label={intl.formatMessage({ id: 'catalogPublish.titleAria' })} />
        </Form.Item>
        <Form.Item
          name="description"
          label={intl.formatMessage({ id: 'catalogPublish.descLabel' })}
          rules={[{max: 500, message: intl.formatMessage({ id: 'catalogPublish.descMax' })}]}
        >
          <Input.TextArea
            rows={3}
            data-testid="catalog-publish-description"
            aria-label={intl.formatMessage({ id: 'catalogPublish.descAria' })}
            placeholder={intl.formatMessage({ id: 'catalogPublish.descPlaceholder' })}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PublishTemplateModal;
