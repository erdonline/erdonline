import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Spin,
  Tag,
  Tree,
  message,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  createDataDict,
  deleteDataDict,
  fetchDataDictTree,
  updateDataDict,
  type DataDictInfo,
  type DataDictScopeType,
  type DataDictTreeNode,
} from '@/services/data-dict';
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

const FieldLibraryManager: React.FC<FieldLibraryManagerProps> = ({ compact }) => {
  const { projectId, projectType } = useProjectStore(
    (s) => ({
      projectId: s.project?.id,
      projectType: s.project?.type,
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

  const openCreate = (parentId?: string) => {
    setEditing(null);
    form.setFieldsValue({
      title: '',
      dictCode: '',
      description: '',
      parentId: parentId || '0',
      isLeaf: true,
      scopeType: isGroupProject ? 'group' : 'user',
      fieldJson: JSON.stringify(
        {
          fields: [
            {
              name: '',
              chnname: '',
              type: 'MiddleString',
              typeName: '字串',
            },
          ],
        },
        null,
        2,
      ),
    });
    setModalOpen(true);
  };

  const openEdit = (node: DataDictTreeNode) => {
    if (node.readOnly) {
      message.info('平台字段库只读');
      return;
    }
    setEditing(node);
    form.setFieldsValue({
      title: node.title,
      dictCode: node.dictCode,
      description: node.description,
      parentId: node.parentId || '0',
      isLeaf: !!node.isLeaf,
      scopeType: (node.scopeType as DataDictScopeType) || 'user',
      fieldJson: JSON.stringify(node.dictInfo || { fields: [] }, null, 2),
    });
    setModalOpen(true);
  };

  const parseDictInfo = (raw: string | undefined): DataDictInfo | undefined => {
    if (!raw?.trim()) return undefined;
    return JSON.parse(raw) as DataDictInfo;
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    let dictInfo: DataDictInfo | undefined;
    if (values.isLeaf) {
      try {
        dictInfo = parseDictInfo(values.fieldJson);
      } catch {
        message.error('字段 JSON 格式无效');
        return;
      }
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
    } catch {
      message.error('保存失败');
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
          <Button size="small" onClick={() => { void load(); }}>
            刷新
          </Button>
        ) : null}
      </Space>

      <Spin spinning={loading}>
        <Tree
          treeData={antdTree}
          defaultExpandAll
          selectedKeys={selectedId ? [selectedId] : []}
          onSelect={(keys) => setSelectedId(keys[0] ? String(keys[0]) : undefined)}
        />
      </Spin>

      <Modal
        title={editing ? '编辑字段库' : '新建字段库'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => { void onSubmit(); }}
        confirmLoading={submitting}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="名称" rules={[{ required: true }]}>
            <Input data-testid="field-library-form-title" />
          </Form.Item>
          <Form.Item name="dictCode" label="代码">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="scopeType" label="范围">
            <Radio.Group>
              <Radio value="user">个人</Radio>
              {isGroupProject ? <Radio value="group">团队</Radio> : null}
            </Radio.Group>
          </Form.Item>
          <Form.Item name="isLeaf" label="类型">
            <Radio.Group>
              <Radio value={false}>文件夹</Radio>
              <Radio value={true}>字段条目</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.isLeaf !== c.isLeaf}>
            {({ getFieldValue }) =>
              getFieldValue('isLeaf') ? (
                <Form.Item
                  name="fieldJson"
                  label="字段定义 JSON（dict_info）"
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={10} data-testid="field-library-form-json" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default React.memo(FieldLibraryManager);
