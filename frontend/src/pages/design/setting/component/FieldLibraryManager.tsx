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
import { designIntl } from '@/pages/design/locales/intl';
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

function toManagerNodes(
  nodes: DataDictTreeNode[],
  readonlyLabel: string,
  platformLabel: string,
): DataNode[] {
  return (nodes || []).map((n) => ({
    key: n.id,
    title: (
      <span>
        {n.title}
        {n.readOnly ? (
          <Tag color="default" style={{ marginLeft: 8 }}>
            {readonlyLabel}
          </Tag>
        ) : null}
        {n.scopeType === 'platform' ? (
          <Tag color="blue" style={{ marginLeft: 4 }}>
            {platformLabel}
          </Tag>
        ) : null}
      </span>
    ),
    isLeaf: !!n.isLeaf,
    children: n.children?.length
      ? toManagerNodes(n.children, readonlyLabel, platformLabel)
      : undefined,
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
  const antdTree = useMemo(
    () =>
      toManagerNodes(
        treeData,
        designIntl('design.setting.fieldLibrary.tag.readonly'),
        designIntl('design.setting.fieldLibrary.tag.platform'),
      ),
    [treeData],
  );
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
      { value: '0', label: designIntl('design.setting.fieldLibrary.form.root') },
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
      message.info(designIntl('design.setting.fieldLibrary.readonly'));
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
        message.error(designIntl('design.setting.fieldLibrary.error.invalidJson'));
      } else if (err.message === 'EMPTY_FIELDS') {
        message.error(designIntl('design.setting.fieldLibrary.error.noEnglishName'));
      } else {
        message.error(designIntl('design.setting.fieldLibrary.error.invalidDef'));
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
        message.success(designIntl('design.setting.fieldLibrary.success.updated'));
      } else {
        await createDataDict(payload);
        message.success(designIntl('design.setting.fieldLibrary.success.created'));
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      message.error(designIntl('design.common.error.saveFailed'));
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = (node: DataDictTreeNode) => {
    if (node.readOnly) {
      message.info(designIntl('design.setting.fieldLibrary.readonly'));
      return;
    }
    confirmDestructive({
      title: designIntl('design.setting.fieldLibrary.confirmDelete.title'),
      content: designIntl('design.setting.fieldLibrary.confirmDelete.content', {name: node.title}),
      okText: designIntl('design.common.delete'),
      onOk: async () => {
        await deleteDataDict(node.id);
        message.success(designIntl('design.setting.fieldLibrary.success.deleted'));
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
          aria-label={designIntl('design.setting.fieldLibrary.aria.new')}
          onClick={() => openCreate(selected?.isLeaf ? selected.parentId : selectedId)}
        >
          {designIntl('design.common.create')}
        </Button>
        <Button
          size="small"
          data-testid="field-library-edit"
          aria-label={designIntl('design.setting.fieldLibrary.aria.edit')}
          disabled={!selected || selected.readOnly}
          onClick={() => selected && openEdit(selected)}
        >
          {designIntl('design.common.edit')}
        </Button>
        <Button
          size="small"
          danger
          data-testid="field-library-delete"
          aria-label={designIntl('design.setting.fieldLibrary.aria.delete')}
          disabled={!selected || selected.readOnly}
          onClick={() => selected && onDelete(selected)}
        >
          {designIntl('design.common.delete')}
        </Button>
        {!compact ? (
          <Button
            size="small"
            data-testid="field-library-refresh"
            aria-label={designIntl('design.setting.fieldLibrary.aria.refresh')}
            onClick={() => { void load(); }}
          >
            {designIntl('design.common.refresh')}
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
        title={
          editing
            ? designIntl('design.setting.fieldLibrary.modal.edit')
            : designIntl('design.setting.fieldLibrary.modal.new')
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => onSubmit()}
        confirmLoading={submitting}
        destroyOnClose
        width={780}
        okButtonProps={{ 'data-testid': 'field-library-form-submit' } as never}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="title"
            label={designIntl('design.common.name')}
            rules={[{ required: true, message: designIntl('design.setting.fieldLibrary.form.titleRequired') }]}
          >
            <Input
              data-testid="field-library-form-title"
              placeholder={designIntl('design.setting.fieldLibrary.form.titlePlaceholder')}
            />
          </Form.Item>
          <Form.Item name="dictCode" label={designIntl('design.common.code')}>
            <Input placeholder={designIntl('design.setting.fieldLibrary.form.codePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={designIntl('design.common.description')}>
            <Input.TextArea rows={2} placeholder={designIntl('design.setting.fieldLibrary.form.descPlaceholder')} />
          </Form.Item>
          <Form.Item name="parentId" label={designIntl('design.setting.fieldLibrary.form.parent')}>
            <Select
              options={parentOptions}
              showSearch
              optionFilterProp="label"
              data-testid="field-library-form-parent"
            />
          </Form.Item>
          <Form.Item
            name="scopeType"
            label={designIntl('design.setting.fieldLibrary.form.scope')}
            extra={
              isGroupProject
                ? designIntl('design.setting.fieldLibrary.form.scopeTeamHint')
                : designIntl('design.setting.fieldLibrary.form.scopePersonalHint')
            }
          >
            <Radio.Group>
              <Radio value="user">{designIntl('design.setting.fieldLibrary.scope.personal')}</Radio>
              {isGroupProject ? (
                <Radio value="group">{designIntl('design.setting.fieldLibrary.scope.team')}</Radio>
              ) : null}
            </Radio.Group>
          </Form.Item>
          <Form.Item name="isLeaf" label={designIntl('design.setting.fieldLibrary.form.type')}>
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
              <Radio value={false}>{designIntl('design.setting.fieldLibrary.type.folder')}</Radio>
              <Radio value={true}>{designIntl('design.setting.fieldLibrary.type.entry')}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.isLeaf !== c.isLeaf}>
            {({ getFieldValue }) =>
              getFieldValue('isLeaf') ? (
                <>
                  <Form.Item label={designIntl('design.setting.fieldLibrary.form.fieldsRequired')} required>
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
                        label: designIntl('design.setting.fieldLibrary.form.advancedJson'),
                        children: (
                          <Form.Item
                            name="fieldJson"
                            style={{ marginBottom: 0 }}
                            extra={designIntl('design.setting.fieldLibrary.form.advancedJsonExtra')}
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
                  {designIntl('design.setting.fieldLibrary.folderHint')}
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
