import React, { useState } from 'react';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import { Button, Form, Modal, Radio } from 'antd';
import { ControlOutlined } from '@ant-design/icons';

export type SyncConfigProps = {};

type FormValues = {
  upgradeType?: string;
};

const SyncConfig: React.FC<SyncConfigProps> = () => {
  const { upgradeType, projectDispatch } = useProjectStore(
    (state) => ({
      upgradeType: state.project?.configJSON?.synchronous?.upgradeType,
      projectDispatch: state.dispatch,
    }),
    shallow,
  );

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const openModal = () => {
    form.setFieldsValue({
      upgradeType: upgradeType || 'increment',
    });
    setOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    await projectDispatch.setUpgradeType(values);
    setOpen(false);
  };

  return (
    <>
      <Button key="refresh" type="default" aria-label="同步配置" onClick={openModal}>
        <ControlOutlined />
        同步配置
      </Button>
      <Modal
        title={
          <span>
            同步配置
            <span style={{ color: 'red' }}>
              （配置成功后，后续的同步的操作都使用该配置，仅建议项目初始化之后设置一次，以后不要变动，免得出现版本混乱）
            </span>
          </span>
        }
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="upgradeType" label="数据表升级方式" rules={[{ required: true }]}>
            <Radio.Group
              options={[
                { label: '字段增量', value: 'increment' },
                { label: '重建数据表', value: 'rebuild' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(SyncConfig);
