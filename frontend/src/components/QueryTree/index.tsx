import React, { useEffect, useRef, useState } from 'react';
import { Tree, Input, Button, Typography } from 'antd';
import { PlusOutlined, DownOutlined, FolderOutlined, CodeOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { erdColors } from '@/theme/tokens';
import './style.less';

const { Text } = Typography;
const { Search } = Input;

interface QueryTreeProps {
  treeData: DataNode[];
  onSelect: (selectedKeys: React.Key[], info: any) => void;
  onSearch: (value: string) => void;
  onAdd?: (() => void) | React.ReactNode; // 修改这里，允许函数或 React 节点
  renderActions?: (node: DataNode) => React.ReactNode;
  renderExtraIcons?: (node: DataNode) => React.ReactNode;
  renderIcon?: (props: any) => React.ReactNode;
  compactLevel?: number;
  /** 受控展开 keys（默认展开「表/关系」由调用方计算） */
  expandedKeys?: React.Key[];
  onExpand?: (keys: React.Key[]) => void;
}

const QueryTree: React.FC<QueryTreeProps> = ({
  treeData,
  onSelect,
  onSearch,
  onAdd,
  renderActions,
  renderExtraIcons,
  renderIcon,
  compactLevel = 0,
  expandedKeys,
  onExpand,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [treeHeight, setTreeHeight] = useState(0);

  // 虚拟滚动需要显式高度；容器是 flex 弹性高，用 ResizeObserver 量（ADR-0017）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect?.height || 0;
      setTreeHeight(Math.floor(h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const titleRender = (nodeData: DataNode) => {
    const level = nodeData.key.toString().split('-').length - 1;
    const paddingLeft = Math.max(0, (level - compactLevel) * 24);

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between',
        paddingLeft: `${paddingLeft}px`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, marginRight: '8px' }}>
          {renderIcon && renderIcon(nodeData)}

          <span
            data-testid={(nodeData as { testId?: string }).testId}
            style={{ marginLeft: 8, flex: 1, minWidth: 0, width: 120, display: 'inline-flex' }}
          >
            <Text ellipsis={{ tooltip: nodeData?.title }} style={{ width: '100%' }}>
              {nodeData.title}
            </Text>
          </span>

          {renderExtraIcons && renderExtraIcons(nodeData)}
        </div>
        {renderActions && (
          <div style={{ flexShrink: 0, width: '24px', textAlign: 'center' }}>
            {renderActions(nodeData)}
          </div>
        )}
      </div>
    );
  };

  const defaultRenderIcon = (props: any) => {
    if (props.isLeaf) {
      return <CodeOutlined style={{ color: erdColors.ink600 }} />;
    }
    return <FolderOutlined style={{ color: erdColors.warning }} />;
  };

  const renderAddButton = () => {
    if (typeof onAdd === 'function') {
      return (
        <Button
          icon={<PlusOutlined />}
          onClick={onAdd}
          style={{ width: '40px' }}
        />
      );
    } else if (React.isValidElement(onAdd)) {
      return onAdd;
    }
    return null;
  };

  return (
    <div className="query-tree" data-testid="query-tree">
      <div className="query-tree__toolbar">
        <Search
          placeholder="搜索"
          onSearch={onSearch}
          style={{ flex: 1, marginRight: '8px' }}
        />
        {renderAddButton()}
      </div>
      <div
        ref={containerRef}
        className={`tree-container custom-tree compact-tree compact-level-${compactLevel}`}
      >
        {treeHeight > 0 && (
          <Tree.DirectoryTree
            showIcon={false}
            switcherIcon={<DownOutlined />}
            onSelect={onSelect}
            treeData={treeData}
            expandAction="click"
            titleRender={titleRender}
            icon={renderIcon || defaultRenderIcon}
            expandedKeys={expandedKeys}
            onExpand={onExpand}
            height={treeHeight}
            blockNode
          />
        )}
      </div>
    </div>
  );
};

export default QueryTree;
