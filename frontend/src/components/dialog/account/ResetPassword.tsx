import React, {useRef, useState} from 'react';
import {Button, Form, Input, Modal, message, type InputRef} from 'antd';
import {POST} from '@/services/crud';
import '../io-modal.scss';

export type ResetPasswordProps = {};

type FormValues = {
  pwd?: string;
  pwdCK?: string;
};

const pwdRules = [
  {required: true, message: '密码不能为空'},
  {
    pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,20}$/,
    message: '密码至少包含 数字和英文，长度6-20',
  },
];

const ResetPassword: React.FC<ResetPasswordProps> = () => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const pwdInputRef = useRef<InputRef>(null);

  const closeModal = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    if (values.pwd !== values.pwdCK) {
      message.error('两次输入的密码不一致');
      return;
    }
    const r = await POST('/syst/user/settings/update', values);
    if (r && r.code === 200) {
      message.success('更新密码信息成功');
      setOpen(false);
      return;
    }
    // 对齐原 ModalForm：接口非 200 仍关窗
    setOpen(false);
  };

  return (
    <>
      <Button
        type="link"
        aria-label="修改密码"
        data-testid="reset-password-trigger"
        onClick={() => setOpen(true)}
      >
        修改
      </Button>
      <Modal
        title="修改密码"
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        destroyOnClose
        width={400}
        forceRender
        className="erd-io-modal"
        rootClassName="erd-io-modal-root"
        keyboard
        focusTriggerAfterClose
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
            label="密码"
            tooltip="密码至少包含 数字和英文，长度6-20"
            rules={pwdRules}
          >
            <Input.Password
              ref={pwdInputRef}
              placeholder="请输入密码"
              aria-label="密码"
            />
          </Form.Item>
          <Form.Item
            name="pwdCK"
            label="确认密码"
            tooltip="密码至少包含 数字和英文，长度6-20"
            rules={pwdRules}
          >
            <Input.Password placeholder="请输入密码" aria-label="确认密码" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(ResetPassword);
