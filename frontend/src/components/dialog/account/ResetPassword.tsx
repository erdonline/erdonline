import React, {useMemo, useRef, useState} from 'react';
import {Button, Form, Input, Modal, message, type InputRef} from 'antd';
import {POST} from '@/services/crud';
import {useIntl} from '@umijs/max';
import '../io-modal.scss';

export type ResetPasswordProps = {};

type FormValues = {
  pwd?: string;
  pwdCK?: string;
};

const ResetPassword: React.FC<ResetPasswordProps> = () => {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, string>) =>
    intl.formatMessage({id}, values);

  const pwdRules = useMemo(
    () => [
      {required: true, message: t('accountSettings.resetPassword.required')},
      {
        pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,20}$/,
        message: t('accountSettings.resetPassword.pattern'),
      },
    ],
    [intl],
  );

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const pwdInputRef = useRef<InputRef>(null);

  const closeModal = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    if (values.pwd !== values.pwdCK) {
      message.error(t('accountSettings.resetPassword.mismatch'));
      return;
    }
    setSubmitting(true);
    try {
      const r = await POST('/syst/user/settings/update', values);
      if (r?.code === 200) {
        message.success(t('accountSettings.resetPassword.success'));
        setOpen(false);
        return;
      }
      // 业务失败：request 已 toast；失败不关窗（勿伪装成功）
      if (!r?.msg) {
        message.error(t('accountSettings.resetPassword.failed'));
      }
    } catch {
      // 网络/HTTP：errorHandler 已 toast；失败不关窗
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="link"
        aria-label={t('accountSettings.resetPassword.triggerAria')}
        data-testid="reset-password-trigger"
        onClick={() => setOpen(true)}
      >
        {t('accountSettings.resetPassword.trigger')}
      </Button>
      <Modal
        title={t('accountSettings.resetPassword.title')}
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        confirmLoading={submitting}
        destroyOnClose
        width={400}
        forceRender
        className="erd-io-modal"
        rootClassName="erd-io-modal-root"
        keyboard
        focusTriggerAfterClose
        cancelText={t('accountSettings.common.cancel')}
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => pwdInputRef.current?.focus(), 0);
        }}
      >
        <Form form={form} layout="vertical" size="small" preserve={false}>
          <Form.Item
            name="pwd"
            label={t('accountSettings.resetPassword.passwordLabel')}
            tooltip={t('accountSettings.resetPassword.passwordTooltip')}
            rules={pwdRules}
          >
            <Input.Password
              ref={pwdInputRef}
              placeholder={t('accountSettings.resetPassword.passwordPlaceholder')}
              aria-label={t('accountSettings.resetPassword.passwordAria')}
            />
          </Form.Item>
          <Form.Item
            name="pwdCK"
            label={t('accountSettings.resetPassword.confirmLabel')}
            tooltip={t('accountSettings.resetPassword.passwordTooltip')}
            rules={pwdRules}
          >
            <Input.Password
              placeholder={t('accountSettings.resetPassword.confirmPlaceholder')}
              aria-label={t('accountSettings.resetPassword.confirmAria')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(ResetPassword);
