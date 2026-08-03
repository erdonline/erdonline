import React, { useMemo, useState } from 'react';
import { Button, Empty, Form, Input, Modal, Radio, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import { buildEnumApply } from '@/utils/dbml/toProjectJSON';
import './setting-common.scss';

type EnumValueRow = {
  name: string;
  chnname?: string;
};

type DataTypeRow = {
  name: string;
  code: string;
  kind?: 'enum';
  values?: EnumValueRow[];
  apply?: Record<string, { type?: string }>;
};

type FormValues = {
  name: string;
  code: string;
  kind: 'logic' | 'enum';
  values?: EnumValueRow[];
};

const normalizeEnumValues = (
  raw: EnumValueRow[] | undefined,
): EnumValueRow[] => {
  const out: EnumValueRow[] = [];
  for (const row of raw || []) {
    const name = String(row?.name || '').trim();
    if (!name) {
      continue;
    }
    const chnname = String(row?.chnname || '').trim();
    if (chnname) {
      out.push({ name, chnname });
    } else {
      out.push({ name });
    }
  }
  return out;
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
  const kindWatch = Form.useWatch('kind', form);

  const emptyApply = useMemo(() => {
    const apply: Record<string, { type: string }> = {};
    for (const d of database) {
      if (d?.code) {
        apply[d.code] = { type: '' };
      }
    }
    return apply;
  }, [database]);

  const openCreate = (kind: 'logic' | 'enum' = 'logic') => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      kind,
      values: kind === 'enum' ? [{ name: '', chnname: '' }] : [],
    });
    setOpen(true);
  };

  const openEdit = (row: DataTypeRow) => {
    setEditing(row);
    const isEnum = row.kind === 'enum';
    form.setFieldsValue({
      name: row.name,
      code: row.code,
      kind: isEnum ? 'enum' : 'logic',
      values: isEnum
        ? (row.values || []).map((v) => ({
            name: v.name,
            chnname: v.chnname || '',
          }))
        : [],
    });
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
      const isEnum = values.kind === 'enum';
      const enumValues = isEnum ? normalizeEnumValues(values.values) : [];
      if (isEnum && enumValues.length === 0) {
        form.setFields([
          {
            name: 'values',
            errors: ['枚举至少需要一个非空取值'],
          },
        ]);
        return;
      }

      setSubmitting(true);
      try {
        const apply = isEnum
          ? buildEnumApply(
              values.code,
              enumValues.map((v) => v.name),
            )
          : editing?.kind === 'enum'
            ? emptyApply
            : editing?.apply || emptyApply;

        const basePayload: DataTypeRow = {
          name: values.name,
          code: values.code,
          apply,
          ...(isEnum
            ? { kind: 'enum' as const, values: enumValues }
            : {}),
        };

        if (editing) {
          const ok = await Promise.resolve(
            projectDispatch.updateDatatype(
              {
                ...basePayload,
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
            projectDispatch.addDatatype(basePayload, { persist: true }),
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
      width: 128,
      ellipsis: true,
    },
    {
      title: '种类',
      key: 'kind',
      width: 64,
      render: (_: unknown, row) =>
        row.kind === 'enum' ? (
          <span data-testid={`datatype-kind-${row.code}`}>枚举</span>
        ) : (
          <span data-testid={`datatype-kind-${row.code}`}>逻辑</span>
        ),
    },
    {
      title: '取值',
      key: 'values',
      ellipsis: true,
      render: (_: unknown, row) => {
        if (row.kind !== 'enum') {
          return (
            <span data-testid={`datatype-values-${row.code}`} aria-hidden>
              —
            </span>
          );
        }
        const names = (row.values || [])
          .map((v) => v.name)
          .filter(Boolean);
        const text = names.length ? names.join(', ') : '（无取值）';
        return (
          <span
            data-testid={`datatype-values-${row.code}`}
            title={text}
          >{`${names.length}：${text}`}</span>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, row) => (
        <Space size={0}>
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
        </Space>
      ),
    },
  ];

  const toolbar = (
    <div className="setting-common-page__toolbar">
      <Button
        type="primary"
        size="small"
        aria-label="新增字段类型"
        data-testid="datatype-add"
        onClick={() => openCreate('logic')}
      >
        新增字段类型
      </Button>
      <Button
        size="small"
        aria-label="新增枚举"
        data-testid="datatype-add-enum"
        onClick={() => openCreate('enum')}
      >
        新增枚举
      </Button>
    </div>
  );

  return (
    <div className="setting-common-page" data-testid="datatype-domains-page">
      <h2 className="setting-common-page__title">数据类型字典</h2>
      <p className="setting-common-page__hint">
        逻辑类型映射各库方言；枚举写入 kind=enum + values[]，供 DBML / DDL 往返。新建/编辑/删除仅保存成功后生效
      </p>
      {datatype.length > 0 ? toolbar : null}
      {datatype.length === 0 ? (
        <div
          className="setting-common-page__empty"
          data-testid="datatype-empty"
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span data-testid="datatype-empty-hint">
                还没有自定义类型。可新增逻辑类型，或直接建枚举（values[]）。
              </span>
            }
          >
            <Space size={8}>
              <Button
                type="primary"
                size="small"
                aria-label="新增第一个字段类型"
                data-testid="datatype-empty-add"
                onClick={() => openCreate('logic')}
              >
                新增字段类型
              </Button>
              <Button
                size="small"
                aria-label="新增第一个枚举"
                data-testid="datatype-empty-add-enum"
                onClick={() => openCreate('enum')}
              >
                新增枚举
              </Button>
            </Space>
          </Empty>
        </div>
      ) : (
        <Table
          size="small"
          className="setting-common-page__dense-table"
          rowKey="code"
          pagination={false}
          dataSource={datatype}
          columns={columns}
          data-testid="datatype-table"
          locale={{ emptyText: '暂无类型，请新增' }}
        />
      )}
      <Modal
        title={
          kindWatch === 'enum'
            ? editing
              ? '编辑枚举'
              : '新增枚举'
            : editing
              ? '编辑字段类型'
              : '新增字段类型'
        }
        open={open}
        onOk={() => {
          void handleOk();
        }}
        onCancel={closeModal}
        confirmLoading={submitting}
        destroyOnClose
        keyboard={!submitting}
        focusTriggerAfterClose
        width={520}
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
          const tryFocus = (attempt = 0) => {
            const input = document.querySelector<HTMLInputElement>(
              '.erd-io-modal-root input#datatype-name',
            );
            if (input) {
              input.focus();
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
        <Form
          form={form}
          layout="vertical"
          size="small"
          className="setting-common-form"
          initialValues={{ kind: 'logic', values: [] }}
          onValuesChange={(changed) => {
            if (changed.kind === 'enum') {
              const cur = form.getFieldValue('values') as
                | EnumValueRow[]
                | undefined;
              if (!cur || cur.length === 0) {
                form.setFieldsValue({
                  values: [{ name: '', chnname: '' }],
                });
              }
            }
          }}
          onFinish={() => {
            void handleOk();
          }}
        >
          <Form.Item
            name="kind"
            label="种类"
            rules={[{ required: true, message: '请选择种类' }]}
          >
            <Radio.Group
              aria-label="类型种类"
              options={[
                { label: '逻辑类型', value: 'logic' },
                { label: '枚举', value: 'enum' },
              ]}
              optionType="button"
              buttonStyle="solid"
              size="small"
            />
          </Form.Item>
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
            extra={
              kindWatch === 'enum'
                ? '字段 type 引用此 code；DBML 导出为 Enum 块名'
                : undefined
            }
          >
            <Input
              placeholder="请输入代码"
              aria-label="类型代码"
              data-testid="datatype-code"
            />
          </Form.Item>
          {kindWatch === 'enum' ? (
            <Form.List name="values">
              {(fields, { add, remove }) => (
                <div data-testid="datatype-enum-values">
                  <div className="setting-common-form__list-label">
                    枚举取值
                  </div>
                  {fields.map((field, index) => (
                    <Space
                      key={field.key}
                      align="start"
                      size={8}
                      className="setting-common-form__list-row"
                      style={{ display: 'flex', marginBottom: 8 }}
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, 'name']}
                        rules={[
                          { required: true, message: '取值不能为空' },
                          { max: 100, message: '不能大于 100 个字符' },
                        ]}
                        style={{ marginBottom: 0, flex: 1 }}
                      >
                        <Input
                          placeholder="取值名"
                          aria-label={`枚举值名 ${index + 1}`}
                          data-testid={`datatype-enum-value-name-${index}`}
                        />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'chnname']}
                        style={{ marginBottom: 0, flex: 1 }}
                      >
                        <Input
                          placeholder="显示名（可选）"
                          aria-label={`枚举显示名 ${index + 1}`}
                          data-testid={`datatype-enum-value-chnname-${index}`}
                        />
                      </Form.Item>
                      <Button
                        type="link"
                        size="small"
                        danger
                        disabled={fields.length <= 1}
                        aria-label={`删除取值行 ${index + 1}`}
                        data-testid={`datatype-enum-value-remove-${index}`}
                        onClick={() => remove(field.name)}
                      >
                        删除
                      </Button>
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    size="small"
                    block
                    aria-label="添加枚举取值"
                    data-testid="datatype-enum-value-add"
                    onClick={() => add({ name: '', chnname: '' })}
                  >
                    添加取值
                  </Button>
                </div>
              )}
            </Form.List>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
};

export default React.memo(DataTypeDomains);
