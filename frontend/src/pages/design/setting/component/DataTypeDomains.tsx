import React, { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import './setting-common.scss';

type DataTypeRow = {
  name: string;
  code: string;
  apply?: Record<string, { type?: string }>;
};

type FormValues = {
  name: string;
  code: string;
};

const DataTypeDomains: React.FC = () => {
  const { projectDispatch, datatype, database } = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      datatype: (state.project?.projectJSON?.dataTypeDomains?.datatype ||
        []) as DataTypeRow[],
      database: (state.project?.projectJSON?.dataTypeDomains?.database ||
        []) as Array<{ code?: string }>,
    }),
    shallow,
  );

  const [form] = Form.useForm<FormValues>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DataTypeRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyApply = useMemo(() => {
    const apply: Record<string, { type: string }> = {};
    for (const d of database) {
      if (d?.code) {
        apply[d.code] = { type: '' };
      }
    }
    return apply;
  }, [database]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (row: DataTypeRow) => {
    setEditing(row);
    form.setFieldsValue({ name: row.name, code: row.code });
    setOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      try {
        if (editing) {
          const ok = await Promise.resolve(
            projectDispatch.updateDatatype(
              {
                ...editing,
                name: values.name,
                code: values.code,
                apply: editing.apply || emptyApply,
                originalCode: editing.code,
              },
              { persist: true },
            ),
          );
          if (!ok) {
            return;
          }
        } else {
          const ok = await Promise.resolve(
            projectDispatch.addDatatype(
              {
                name: values.name,
                code: values.code,
                apply: emptyApply,
              },
              { persist: true },
            ),
          );
          if (!ok) {
            return;
          }
        }
        setOpen(false);
        setEditing(null);
        form.resetFields();
      } finally {
        setSubmitting(false);
      }
    } catch {
      // 校验失败：留窗
    }
  };

  const handleRemove = (row: DataTypeRow) => {
    confirmDestructive({
      title: '删除字段类型',
      content: `确认删除「${row.name}」（${row.code}）？引用此类型的字段不会自动改名。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const ok = await Promise.resolve(
          projectDispatch.removeDatatype(row.code, { persist: true }),
        );
        if (!ok) {
          return Promise.reject();
        }
      },
    });
  };

  const columns: ColumnsType<DataTypeRow> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 160,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: unknown, row) => (
        <>
          <Button
            type="link"
            size="small"
            aria-label={`编辑类型 ${row.code}`}
            data-testid={`datatype-edit-${row.code}`}
            onClick={() => openEdit(row)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            aria-label={`删除类型 ${row.code}`}
            data-testid={`datatype-remove-${row.code}`}
            onClick={() => handleRemove(row)}
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="setting-common-page" data-testid="datatype-domains-page">
      <h2 className="setting-common-page__title">数据类型字典</h2>
      <p className="setting-common-page__hint">
        逻辑类型映射至各库方言；新建/编辑/删除仅保存成功后生效
      </p>
      <div style={{ marginBottom: 8 }}>
        <Button
          type="primary"
          size="small"
          aria-label="新增字段类型"
          data-testid="datatype-add"
          onClick={openCreate}
        >
          新增字段类型
        </Button>
      </div>
      <Table
        size="small"
        rowKey="code"
        pagination={false}
        dataSource={datatype}
        columns={columns}
        data-testid="datatype-table"
        locale={{ emptyText: '暂无类型，请新增' }}
      />
      <Modal
        title={editing ? '编辑字段类型' : '新增字段类型'}
        open={open}
        onOk={() => {
          void handleOk();
        }}
        onCancel={closeModal}
        confirmLoading={submitting}
        destroyOnClose
        width={420}
        className="erd-io-modal"
        rootClassName="erd-io-modal-root"
        transitionName=""
        maskTransitionName=""
        okText={editing ? '保存' : '提交'}
        cancelText="取消"
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          // 首焦名称，便于键盘与 E2E
          const input = document.querySelector<HTMLInputElement>(
            '.erd-io-modal-root input#datatype-name',
          );
          input?.focus();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          size="small"
          className="setting-common-form"
          onFinish={() => {
            void handleOk();
          }}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[
              { required: true, message: '不能为空' },
              { max: 100, message: '不能大于 100 个字符' },
            ]}
          >
            <Input
              id="datatype-name"
              placeholder="请输入名称"
              aria-label="类型名称"
              data-testid="datatype-name"
            />
          </Form.Item>
          <Form.Item
            name="code"
            label="代码"
            rules={[
              { required: true, message: '不能为空' },
              { max: 100, message: '不能大于 100 个字符' },
            ]}
          >
            <Input
              placeholder="请输入代码"
              aria-label="类型代码"
              data-testid="datatype-code"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default React.memo(DataTypeDomains);
