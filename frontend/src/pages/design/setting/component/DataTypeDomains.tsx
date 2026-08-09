import React, { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Form, Input, Modal, Radio, Space, Table } from 'antd';
import { history, useIntl } from '@@/exports';
import DatabaseTemplatesModal from '@/components/dialog/setup/DatabaseTemplatesModal';
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
  /** 逻辑类型：方言 code → 物理类型字串（落盘为 apply[code].type） */
  applyTypes?: Record<string, string>;
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

const applyTypesFromApply = (
  apply: DataTypeRow['apply'] | undefined,
  dialectCodes: string[],
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const code of dialectCodes) {
    out[code] = String(apply?.[code]?.type ?? '');
  }
  return out;
};

const buildApplyFromTypes = (
  applyTypes: Record<string, string> | undefined,
  dialectCodes: string[],
): Record<string, { type: string }> => {
  const apply: Record<string, { type: string }> = {};
  for (const code of dialectCodes) {
    apply[code] = { type: String(applyTypes?.[code] ?? '').trim() };
  }
  return apply;
};

const DataTypeDomains: React.FC = () => {
  const intl = useIntl();
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
  const [modalDialects, setModalDialects] = useState<string[]>([]);
  const [ddlTemplatesOpen, setDdlTemplatesOpen] = useState(false);
  const kindWatch = Form.useWatch('kind', form);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('openDdlTemplates') !== '1') {
      return;
    }
    setDdlTemplatesOpen(true);
    params.delete('openDdlTemplates');
    const next = params.toString();
    history.replace(`${window.location.pathname}${next ? `?${next}` : ''}`);
  }, []);

  const databaseDialectCodes = useMemo(() => {
    const codes: string[] = [];
    for (const d of database) {
      if (d?.code) {
        codes.push(d.code);
      }
    }
    return codes;
  }, [database]);

  const openCreate = (kind: 'logic' | 'enum' = 'logic') => {
    setEditing(null);
    const codes = [...databaseDialectCodes];
    setModalDialects(codes);
    form.resetFields();
    form.setFieldsValue({
      kind,
      values: kind === 'enum' ? [{ name: '', chnname: '' }] : [],
      applyTypes: applyTypesFromApply(undefined, codes),
    });
    setOpen(true);
  };

  const openEdit = (row: DataTypeRow) => {
    setEditing(row);
    const codes = new Set(databaseDialectCodes);
    if (row.apply) {
      for (const key of Object.keys(row.apply)) {
        if (key) {
          codes.add(key);
        }
      }
    }
    const dialects = Array.from(codes);
    setModalDialects(dialects);
    form.setFieldsValue({
      name: row.name,
      code: row.code,
      kind: row.kind === 'enum' ? 'enum' : 'logic',
      values:
        row.kind === 'enum'
          ? (row.values || []).map((v) => ({
              name: v.name,
              chnname: v.chnname || '',
            }))
          : [],
      applyTypes: applyTypesFromApply(row.apply, dialects),
    });
    setOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }
    setOpen(false);
    setEditing(null);
    setModalDialects([]);
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
          : buildApplyFromTypes(values.applyTypes, modalDialects);

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
        setModalDialects([]);
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

  const ddlTemplatesButton = (
    <Button
      size="small"
      aria-label={intl.formatMessage({ id: 'datatypeDomains.openDdlTemplatesAria' })}
      data-testid="datatype-open-ddl-templates"
      onClick={() => setDdlTemplatesOpen(true)}
    >
      {intl.formatMessage({ id: 'datatypeDomains.openDdlTemplates' })}
    </Button>
  );

  const toolbar = (
    <div className="setting-common-page__toolbar">
      <Space wrap size={8}>
        {ddlTemplatesButton}
        {datatype.length > 0 ? (
          <>
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
          </>
        ) : null}
      </Space>
    </div>
  );

  return (
    <div className="setting-common-page" data-testid="datatype-domains-page">
      <h2 className="setting-common-page__title">
        {intl.formatMessage({ id: 'datatypeDomains.title' })}
      </h2>
      <p className="setting-common-page__hint">
        {intl.formatMessage({ id: 'datatypeDomains.hint' })}
      </p>
      {toolbar}
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
        width={560}
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
          initialValues={{ kind: 'logic', values: [], applyTypes: {} }}
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
            if (changed.kind === 'logic') {
              const cur = form.getFieldValue('applyTypes') as
                | Record<string, string>
                | undefined;
              if (!cur || Object.keys(cur).length === 0) {
                form.setFieldsValue({
                  applyTypes: applyTypesFromApply(
                    undefined,
                    modalDialects.length
                      ? modalDialects
                      : databaseDialectCodes,
                  ),
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
          ) : (
            <div data-testid="datatype-apply-map">
              <div className="setting-common-form__list-label">
                库方言映射
              </div>
              <p
                className="setting-common-form__list-hint"
                data-testid="datatype-apply-hint"
              >
                按方言填写物理类型（如 VARCHAR(32)）；空值表示该库暂无映射。枚举种类由系统自动生成 apply。
              </p>
              {modalDialects.length === 0 ? (
                <p
                  className="setting-common-form__list-hint"
                  data-testid="datatype-apply-empty"
                >
                  当前项目尚无库方言；请先在数据源/模板中配置 database[]。
                </p>
              ) : (
                modalDialects.map((code) => (
                  <div
                    key={code}
                    className="setting-common-form__apply-row"
                  >
                    <span
                      className="setting-common-form__apply-code"
                      title={code}
                    >
                      {code}
                    </span>
                    <Form.Item
                      name={['applyTypes', code]}
                      rules={[
                        { max: 200, message: '不能大于 200 个字符' },
                      ]}
                      style={{ marginBottom: 0, flex: 1 }}
                    >
                      <Input
                        placeholder="物理类型，如 VARCHAR(32)"
                        aria-label={`方言 ${code} 物理类型`}
                        data-testid={`datatype-apply-${code}`}
                      />
                    </Form.Item>
                  </div>
                ))
              )}
            </div>
          )}
        </Form>
      </Modal>
      <DatabaseTemplatesModal
        hideTrigger
        open={ddlTemplatesOpen}
        onOpenChange={setDdlTemplatesOpen}
      />
    </div>
  );
};

export default React.memo(DataTypeDomains);
