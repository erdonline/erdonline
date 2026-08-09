import React, {useEffect, useState} from 'react';
import {Form, Input, Modal, Typography, message} from 'antd';
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
      message.error('未找到当前项目，请先打开一个项目');
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
        message.success('已提交审核，维护者通过后会上架');
        close();
        onSuccess?.();
        return;
      }
      message.error(res?.msg || '提交失败（须绑定 GitHub 且为项目创建人）');
    } catch (e: unknown) {
      const err = e as {data?: {msg?: string}; message?: string};
      message.error(err?.data?.msg || err?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="发布为模板"
      open={open}
      onOk={handleSubmit}
      onCancel={close}
      okText="提交审核"
      confirmLoading={submitting}
      destroyOnClose
      width={480}
      data-testid="catalog-publish-modal"
    >
      <Typography.Paragraph type="secondary" style={{marginBottom: 12}}>
        须为项目创建人且已绑定 GitHub（账号设置 → 安全）。提交后由维护者审核。
      </Typography.Paragraph>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="title"
          label="模板标题"
          rules={[{required: true, message: '请输入模板标题'}, {max: 100, message: '最多 100 字'}]}
        >
          <Input data-testid="catalog-publish-title" aria-label="模板标题" />
        </Form.Item>
        <Form.Item name="description" label="简介（可选）" rules={[{max: 500, message: '最多 500 字'}]}>
          <Input.TextArea
            rows={3}
            data-testid="catalog-publish-description"
            aria-label="模板简介"
            placeholder="一句话说明适用场景"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PublishTemplateModal;
