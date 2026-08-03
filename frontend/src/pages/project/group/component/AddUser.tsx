import React, {useRef, useState} from 'react';
import {PlusOutlined} from '@ant-design/icons';
import {Button, Form, Modal, Select, message} from 'antd';
import type {RefSelectProps} from 'antd/es/select';
import {GET, POST} from '@/services/crud';

type ReloadableRef = {
  current?: {reload?: () => void} | null;
};

export type AddUserProps = {
  projectId: string;
  roleId: string;
  actionRef: ReloadableRef;
};

type FormValues = {
  user?: string[];
};

type UserOption = {
  value: string;
  label: string;
};

const AddUser: React.FC<AddUserProps> = (props) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [options, setOptions] = useState<UserOption[]>([]);
  const [fetching, setFetching] = useState(false);
  const userSelectRef = useRef<RefSelectProps>(null);

  const fetchUsers = async (username?: string) => {
    setFetching(true);
    try {
      const result = await GET('/ncnb/project/group/users', {
        pageSize: 6,
        current: 1,
        username,
        roleId: props.roleId,
      });
      const records = result?.data?.records ?? [];
      setOptions(
        records.map((m: {id: string; username: string; email: string}) => ({
          value: m.id,
          label: `${m.username}  -  ${m.email}`,
        })),
      );
    } finally {
      setFetching(false);
    }
  };

  const openModal = () => {
    form.resetFields();
    setOptions([]);
    setOpen(true);
    void fetchUsers();
  };

  const closeModal = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      const resp = await POST('/ncnb/project/group/role/users', {
        projectId: props.projectId,
        roleId: props.roleId,
        userIds: values.user,
      });
      if (resp?.code === 200) {
        message.success('保存成功');
        props.actionRef.current?.reload?.();
        setOpen(false);
        return;
      }
      // 业务失败：request 已 toast；失败不关窗（勿伪装成功）
    } catch {
      // 网络/HTTP：errorHandler 已 toast；失败不关窗
    }
  };

  return (
    <>
      <Button key="add-user" type="primary" aria-label="添加成员" onClick={openModal}>
        <PlusOutlined />
        添加成员
      </Button>
      <Modal
        title="添加成员"
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        destroyOnClose
        width={520}
        forceRender
        okButtonProps={{'aria-label': '确定'}}
        cancelButtonProps={{type: 'dashed'}}
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          // 首焦「选择用户」Select；挂载后经 ref.focus
          const tryFocus = (attempt = 0) => {
            if (userSelectRef.current) {
              userSelectRef.current.focus();
              return;
            }
            if (attempt >= 20) {
              return;
            }
            window.setTimeout(() => tryFocus(attempt + 1), 50);
          };
          window.setTimeout(() => tryFocus(), 0);
        }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="user"
            label="选择用户"
            rules={[{required: true, message: '请选择用户'}]}
          >
            <Select
              ref={userSelectRef}
              mode="multiple"
              showSearch
              filterOption={false}
              onSearch={(kw) => {
                void fetchUsers(kw);
              }}
              options={options}
              loading={fetching}
              placeholder="添加用户"
              aria-label="选择用户"
              notFoundContent={fetching ? '加载中…' : null}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(AddUser);
