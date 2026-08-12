import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Spin, Tree } from 'antd';
import { useIntl } from '@umijs/max';
import type { DataNode } from 'antd/es/tree';
import {
  fetchDataDictTree,
  type DataDictTreeNode,
} from '@/services/data-dict';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';

export type FieldLibraryTreeProps = {
  selectable?: boolean;
  selectedId?: string;
  onSelectLeaf?: (node: DataDictTreeNode) => void;
  /** 仅展示叶子（插入场景） */
  leafOnly?: boolean;
  /** 空态「去字段库管理」 */
  onManage?: () => void;
};

const FieldLibraryTree: React.FC<FieldLibraryTreeProps> = (props) => {
  const intl = useIntl();

  const scopeLabelOf = useCallback(
    (scopeType?: string) => {
      if (scopeType === 'platform') {
        return intl.formatMessage({ id: 'fieldLibrary.tree.scopePlatform' });
      }
      if (scopeType === 'group') {
        return intl.formatMessage({ id: 'fieldLibrary.tree.scopeGroup' });
      }
      if (scopeType === 'user') {
        return intl.formatMessage({ id: 'fieldLibrary.tree.scopeUser' });
      }
      return '';
    },
    [intl],
  );

  const toAntdNodes = useCallback(
    (nodes: DataDictTreeNode[], leafOnly: boolean): DataNode[] =>
      (nodes || [])
        .filter((n) => !leafOnly || n.isLeaf || (n.children && n.children.length > 0))
        .map((n) => {
          const children = n.children?.length
            ? toAntdNodes(n.children, leafOnly)
            : undefined;
          if (leafOnly && !n.isLeaf && (!children || children.length === 0)) {
            return null;
          }
          const scopeLabel = scopeLabelOf(n.scopeType);
          return {
            key: n.id,
            title: scopeLabel ? `${n.title} (${scopeLabel})` : n.title,
            isLeaf: !!n.isLeaf,
            disabled: leafOnly ? !n.isLeaf : false,
            children,
            // @ts-expect-error antd DataNode 允许扩展
            raw: n,
          } as DataNode;
        })
        .filter(Boolean) as DataNode[],
    [leafOnly, scopeLabelOf],
  );

  const { projectId } = useProjectStore(
    (s) => ({ projectId: s.project?.id }),
    shallow,
  );
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [treeData, setTreeData] = useState<DataDictTreeNode[]>([]);

  const load = useCallback(async (title?: string) => {
    setLoading(true);
    try {
      const data = await fetchDataDictTree({
        title: title?.trim() || undefined,
        projectId: projectId || undefined,
      });
      setTreeData(data || []);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, DataDictTreeNode>();
    const walk = (list: DataDictTreeNode[]) => {
      for (const n of list) {
        map.set(n.id, n);
        if (n.children?.length) {
          walk(n.children);
        }
      }
    };
    walk(treeData);
    return map;
  }, [treeData]);

  const antdTree = useMemo(
    () => toAntdNodes(treeData, !!props.leafOnly),
    [treeData, props.leafOnly, toAntdNodes],
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

  const onSelect = (keys: React.Key[]) => {
    const id = String(keys[0] || '');
    const node = nodeMap.get(id);
    if (node?.isLeaf) {
      props.onSelectLeaf?.(node);
    }
  };

  return (
    <div data-testid="field-library-tree">
      <Input.Search
        placeholder={intl.formatMessage({ id: 'fieldLibrary.tree.searchPlaceholder' })}
        allowClear
        data-testid="field-library-search"
        aria-label={intl.formatMessage({ id: 'fieldLibrary.tree.searchAria' })}
        onSearch={(v) => { void load(v); }}
        onChange={(e) => setKeyword(e.target.value)}
        onPressEnter={() => { void load(keyword); }}
        style={{ marginBottom: 12 }}
      />
      <Spin spinning={loading}>
        {antdTree.length === 0 && !loading ? (
          <Empty description={intl.formatMessage({ id: 'fieldLibrary.tree.empty' })}>
            {props.onManage ? (
              <Button
                type="link"
                data-testid="field-library-tree-empty-manage"
                aria-label={intl.formatMessage({ id: 'fieldLibrary.tree.manageEmptyAria' })}
                onClick={props.onManage}
              >
                {intl.formatMessage({ id: 'fieldLibrary.tree.manageEmpty' })}
              </Button>
            ) : null}
          </Empty>
        ) : (
          <Tree
            treeData={antdTree}
            expandedKeys={allExpandKeys}
            selectedKeys={props.selectedId ? [props.selectedId] : []}
            onSelect={props.selectable !== false ? onSelect : undefined}
          />
        )}
      </Spin>
    </div>
  );
};

export default React.memo(FieldLibraryTree);
