import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Collapse,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Tag,
  Tree,
  Typography,
  message,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  createDataDict,
  deleteDataDict,
  fetchDataDictTree,
  updateDataDict,
  type DataDictEnum,
  type DataDictField,
  type DataDictInfo,
  type DataDictScopeType,
  type DataDictTreeNode,
} from '@/services/data-dict';
import FieldLibraryFieldsEditor, {
  emptyFieldRow,
} from '@/components/field-library/FieldLibraryFieldsEditor';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import './setting-common.scss';

type FormValues = {
  title: string;
  dictCode?: string;
  description?: string;
  parentId?: string;
  isLeaf: boolean;
  scopeType: DataDictScopeType;
  fields?: DataDictField[];
  fieldJson?: string;
};

export type FieldLibraryManagerProps = {
  compact?: boolean;
};

function toManagerNodes(nodes: DataDictTreeNode[]): DataNode[] {
  return (nodes || []).map((n) => ({
    key: n.id,
    title: (
      <span>
        {n.title}
        {n.readOnly ? (
          <Tag color="default" style={{ marginLeft: 8 }}>
            只读
          </Tag>
        ) : null}
        {n.scopeType === 'platform' ? (
          <Tag color="blue" style={{ marginLeft: 4 }}>
            平台
          </Tag>
        ) : null}
      </span>
    ),
    isLeaf: !!n.isLeaf,
    children: n.children?.length ? toManagerNodes(n.children) : undefined,
    // @ts-expect-error 扩展 raw
    raw: n,
  }));
}

function flatten(nodes: DataDictTreeNode[]): Map<string, DataDictTreeNode> {
  const map = new Map<string, DataDictTreeNode>();
  const walk = (list: DataDictTreeNode[]) => {
    for (const n of list) {
      map.set(n.id, n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return map;
}

function collectFolderOptions(
  nodes: DataDictTreeNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  const rows: Array<{ value: string; label: string }> = [];
  for (const n of nodes) {
    if (!n.isLeaf) {
      rows.push({
        value: n.id,
        label: `${'—'.repeat(depth)}${depth ? ' ' : ''}${n.title}`,
      });
      if (n.children?.length) {
        rows.push(...collectFolderOptions(n.children, depth + 1));
      }
    }
  }
  return rows;
}

function normalizeFields(fields: DataDictField[] | undefined): DataDictField[] {
  return (fields || [])
    .map((f) => ({
      name: (f.name || '').trim(),
      chnname: f.chnname?.trim() || '',
      type: f.type || 'MiddleString',
      typeName: f.typeName || f.type || '字串',
      dataType: f.dataType,
      remark: f.remark,
      pk: !!f.pk,
      notNull: !!f.notNull,
      autoIncrement: f.autoIncrement,
      relationNoShow: f.relationNoShow,
      defaultValue: f.defaultValue,
      uiHint: f.uiHint,
      dictRef: f.dictRef,
    }))
    .filter((f) => f.name.length > 0);
}

function stringifyDictInfo(info: DataDictInfo): string {
  return JSON.stringify(info, null, 2);
}

const FieldLibraryManager: React.FC<FieldLibraryManagerProps> = ({ compact }) => {
  const { projectId, projectType, datatype } = useProjectStore(
    (s) => ({
      projectId: s.project?.id,
      projectType: s.project?.type,
      datatype: s.project?.projectJSON?.dataTypeDomains?.datatype,
    }),
    shallow,
  );
  const isGroupProject = String(projectType) === '2';

  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<DataDictTreeNode[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DataDictTreeNode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const preservedEnumsRef = useRef<DataDictEnum[] | undefined>();
  const baselineJsonRef = useRef<string>('');
  const jsonDirtyRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDataDictTree({ projectId: projectId || undefined });
      setTreeData(data || []);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const nodeMap = useMemo(() => flatten(treeData), [treeData]);
  const antdTree = useMemo(() => toManagerNodes(treeData), [treeData]);
  const allExpandKeys = useMemo(() => {
    const keys: string[] = [];
    const walk = (nodes: DataDictTreeNode[]) => {
      for (const n of nodes) {
        keys.push(n.id);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(treeData);
    return keys;
  }, [treeData]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  useEffect(() => {
    setExpandedKeys(allExpandKeys);
  }, [allExpandKeys]);
  const parentOptions = useMemo(
    () => [
      { value: '0', label: '（根目录）' },
      ...collectFolderOptions(treeData),
    ],
    [treeData],
  );

  const resetJsonBaseline = (info: DataDictInfo) => {
    const raw = stringifyDictInfo(info);
    baselineJsonRef.current = raw;
    jsonDirtyRef.current = false;
    return raw;
  };

  const openCreate = (parentId?: string) => {
    setEditing(null);
    preservedEnumsRef.current = undefined;
    const fields = [emptyFieldRow()];
    const info: DataDictInfo = { fields };
    form.setFieldsValue({
      title: '',
      dictCode: '',
      description: '',
      parentId: parentId || '0',
      isLeaf: true,
      scopeType: isGroupProject ? 'group' : 'user',
      fields,
      fieldJson: resetJsonBaseline(info),
    });
    setModalOpen(true);
  };

  const openEdit = (node: DataDictTreeNode) => {
    if (node.readOnly) {
      message.info('平台字段库只读');
      return;
    }
    setEditing(node);
    const fields =
      node.dictInfo?.fields?.length
        ? node.dictInfo.fields.map((f) => ({ ...f }))
        : [emptyFieldRow()];
    preservedEnumsRef.current = node.dictInfo?.enums;
    const info: DataDictInfo = {
      fields,
      ...(node.dictInfo?.enums ? { enums: node.dictInfo.enums } : {}),
    };
    form.setFieldsValue({
      title: node.title,
      dictCode: node.dictCode,
      description: node.description,
      parentId: node.parentId || '0',
      isLeaf: !!node.isLeaf,
      scopeType: (node.scopeType as DataDictScopeType) || 'user',
      fields,
      fieldJson: resetJsonBaseline(info),
    });
    setModalOpen(true);
  };

  const syncJsonFromFields = () => {
    const fields = form.getFieldValue('fields') as DataDictField[] | undefined;
    const info: DataDictInfo = {
      fields: fields?.length ? fields : [emptyFieldRow()],
      ...(preservedEnumsRef.current ? { enums: preservedEnumsRef.current } : {}),
    };
    const raw = stringifyDictInfo(info);
    form.setFieldValue('fieldJson', raw);
    if (!jsonDirtyRef.current) {
      baselineJsonRef.current = raw;
    }
  };

  const buildDictInfoFromForm = (values: FormValues): DataDictInfo | undefined => {
    if (!values.isLeaf) return undefined;
    const rawJson = values.fieldJson?.trim();
    if (jsonDirtyRef.current && rawJson) {
      try {
        return JSON.parse(rawJson) as DataDictInfo;
      } catch {
        throw new Error('INVALID_JSON');
      }
    }
    const fields = normalizeFields(values.fields);
    if (fields.length === 0) {
      throw new Error('EMPTY_FIELDS');
    }
    return {
      fields,
      ...(preservedEnumsRef.current ? { enums: preservedEnumsRef.current } : {}),
    };
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    let dictInfo: DataDictInfo | undefined;
    try {
      dictInfo = buildDictInfoFromForm(values);
    } catch (e) {
      const err = e as Error;
      if (err.message === 'INVALID_JSON') {
        message.error('字段 JSON 格式无效');
      } else if (err.message === 'EMPTY_FIELDS') {
        message.error('请至少填写一个字段英文名');
      } else {
        message.error('字段定义无效');
      }
      throw e;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: values.title.trim(),
        dictCode: values.dictCode?.trim(),
        description: values.description?.trim(),
        parentId: values.parentId || '0',
        isLeaf: values.isLeaf,
        dictInfo,
        scopeType: values.scopeType,
        scopeId: values.scopeType === 'group' ? projectId : undefined,
      };
      if (editing?.id) {
        await updateDataDict(editing.id, payload);
        message.success('已更新');
      } else {
        await createDataDict(payload);
        message.success('已创建');
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      message.error('保存失败');
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = (node: DataDictTreeNode) => {
    if (node.readOnly) {
      message.info('平台字段库只读');
      return;
    }
    confirmDestructive({
      title: '删除字段库条目',
      content: `确定删除「${node.title}」？`,
      okText: '删除',
      onOk: async () => {
        await deleteDataDict(node.id);
        message.success('已删除');
        await load();
      },
    });
  };

  const selected = selectedId ? nodeMap.get(selectedId) : undefined;

  return (
    <div
      className="erd-field-library-manager"
      data-testid="field-library-manager"
    >
      <Space wrap style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          size="small"
          data-testid="field-library-create"
          aria-label="新建字段库条目"
          onClick={() => openCreate(selected?.isLeaf ? selected.parentId : selectedId)}
        >
          新建
        </Button>
        <Button
          size="small"
          data-testid="field-library-edit"
          aria-label="编辑选中条目"
          disabled={!selected || selected.readOnly}
          onClick={() => selected && openEdit(selected)}
        >
          编辑
        </Button>
        <Button
          size="small"
          danger
          data-testid="field-library-delete"
          aria-label="删除选中条目"
          disabled={!selected || selected.readOnly}
          onClick={() => selected && onDelete(selected)}
        >
          删除
        </Button>
        {!compact ? (
          <Button
            size="small"
            data-testid="field-library-refresh"
            aria-label="刷新字段库"
            onClick={() => { void load(); }}
          >
            刷新
          </Button>
        ) : null}
      </Space>

      <Spin spinning={loading}>
        <Tree
          treeData={antdTree}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys.map(String))}
          selectedKeys={selectedId ? [selectedId] : []}
          onSelect={(keys) => setSelectedId(keys[0] ? String(keys[0]) : undefined)}
        />
      </Spin>

      <Modal
        title={editing ? '编辑字段库' : '新建字段库'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => onSubmit()}
        confirmLoading={submitting}
        destroyOnClose
        width={780}
        okButtonProps={{ 'data-testid': 'field-library-form-submit' } as never}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="title" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input data-testid="field-library-form-title" placeholder="如：客户姓名" />
          </Form.Item>
          <Form.Item name="dictCode" label="代码">
            <Input placeholder="可选，如 customer_name" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="可选说明" />
          </Form.Item>
          <Form.Item name="parentId" label="父级文件夹">
            <Select
              options={parentOptions}
              showSearch
              optionFilterProp="label"
              data-testid="field-library-form-parent"
            />
          </Form.Item>
          <Form.Item
            name="scopeType"
            label="范围"
            extra={
              isGroupProject
                ? '个人库仅自己可见；团队库对当前团队项目成员可见。'
                : '当前为个人项目，仅可创建个人字段库。'
            }
          >
            <Radio.Group>
              <Radio value="user">个人</Radio>
              {isGroupProject ? <Radio value="group">团队</Radio> : null}
            </Radio.Group>
          </Form.Item>
          <Form.Item name="isLeaf" label="类型">
            <Radio.Group
              onChange={(e) => {
                if (e.target.value) {
                  const fields = form.getFieldValue('fields') as DataDictField[] | undefined;
                  if (!fields?.length) {
                    form.setFieldValue('fields', [emptyFieldRow()]);
                  }
                  syncJsonFromFields();
                }
              }}
            >
              <Radio value={false}>文件夹</Radio>
              <Radio value={true}>字段条目</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.isLeaf !== c.isLeaf}>
            {({ getFieldValue }) =>
              getFieldValue('isLeaf') ? (
                <>
                  <Form.Item label="字段定义" required>
                    <FieldLibraryFieldsEditor datatype={datatype} />
                  </Form.Item>
                  <Collapse
                    ghost
                    onChange={(keys) => {
                      const open = (Array.isArray(keys) ? keys : [keys]).includes('json');
                      if (open) {
                        syncJsonFromFields();
                      }
                    }}
                    items={[
                      {
                        key: 'json',
                        label: '高级：原始 JSON',
                        children: (
                          <Form.Item
                            name="fieldJson"
                            style={{ marginBottom: 0 }}
                            extra="展开后若修改 JSON，保存时以 JSON 为准；否则以上方字段表单为准。"
                          >
                            <Input.TextArea
                              rows={10}
                              data-testid="field-library-form-json"
                              onChange={() => {
                                jsonDirtyRef.current = true;
                              }}
                            />
                          </Form.Item>
                        ),
                      },
                    ]}
                  />
                </>
              ) : (
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  文件夹用于分组，不含字段定义。
                </Typography.Paragraph>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default React.memo(FieldLibraryManager);
