import React, { useEffect, useRef, useState } from 'react';
import { Tree, Input, Button, Typography, Empty } from 'antd';
import { PlusOutlined, DownOutlined, FolderOutlined, CodeOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { erdColors } from '@/theme/tokens';
import './style.less';

const { Text } = Typography;
const { Search } = Input;

/** ADR-0016：左树行高与 22 chrome 同阶；须与虚拟滚动 itemHeight / CSS 行高一致 */
export const TREE_ROW_HEIGHT = 22;

interface QueryTreeProps {
  treeData: DataNode[];
  onSelect: (selectedKeys: React.Key[], info: any) => void;
  onSearch: (value: string) => void;
  /** 受控搜索词（与 store searchKey 同步；× 清除必须回写空串） */
  searchValue?: string;
  /** 有搜索词且无匹配表时，在树区展示空态（勿白屏） */
  searchEmpty?: boolean;
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
  searchValue = '',
  searchEmpty = false,
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
  /** 输入框本地态：Enter/搜索钮才 commit；× / 清空立即 commit 空串 */
  const [draft, setDraft] = useState(searchValue);

  useEffect(() => {
    setDraft(searchValue);
  }, [searchValue]);

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
    const paddingLeft = Math.max(0, (level - compactLevel) * 16);

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: `${paddingLeft}px`,
          minHeight: TREE_ROW_HEIGHT,
          lineHeight: `${TREE_ROW_HEIGHT}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 4 }}>
          {renderIcon && renderIcon(nodeData)}

          <span
            data-testid={(nodeData as { testId?: string }).testId}
            style={{ marginLeft: 4, flex: 1, minWidth: 0, width: 120, display: 'inline-flex' }}
          >
            <Text
              ellipsis={{ tooltip: nodeData?.title }}
              style={{ width: '100%', fontSize: 12, lineHeight: `${TREE_ROW_HEIGHT}px` }}
            >
              {nodeData.title}
            </Text>
          </span>

          {renderExtraIcons && renderExtraIcons(nodeData)}
        </div>
        {renderActions && (
          <div style={{ flexShrink: 0, width: 20, textAlign: 'center' }}>
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
          size="small"
          icon={<PlusOutlined />}
          onClick={onAdd}
          aria-label="新建"
        />
      );
    } else if (React.isValidElement(onAdd)) {
      return onAdd;
    }
    return null;
  };

  const clearSearch = () => {
    setDraft('');
    onSearch('');
  };

  return (
    <div className="query-tree" data-testid="query-tree">
      <div className="query-tree__toolbar">
        <Search
          size="small"
          placeholder="搜索表名"
          aria-label="搜索表名"
          value={draft}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            // antd Search 的 onSearch 不随 allowClear 触发 → × 须立刻清过滤残留
            if (!next) {
              onSearch('');
            }
          }}
          onSearch={(value) => {
            setDraft(value);
            onSearch(value);
          }}
          onClear={clearSearch}
          style={{ flex: 1 }}
          allowClear
        />
        {renderAddButton()}
      </div>
      <div
        ref={containerRef}
        className={`tree-container custom-tree compact-tree compact-level-${compactLevel}`}
      >
        {searchEmpty ? (
          <div data-testid="tree-search-empty" className="query-tree__search-empty">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              imageStyle={{ height: 48 }}
              description={<span>未找到匹配的表</span>}
            />
          </div>
        ) : (
          treeHeight > 0 && (
            <Tree.DirectoryTree
              showIcon={false}
              switcherIcon={<DownOutlined style={{ fontSize: 10 }} />}
              onSelect={onSelect}
              treeData={treeData}
              expandAction="click"
              titleRender={titleRender}
              icon={renderIcon || defaultRenderIcon}
              expandedKeys={expandedKeys}
              onExpand={onExpand}
              height={treeHeight}
              itemHeight={TREE_ROW_HEIGHT}
              blockNode
            />
          )
        )}
      </div>
    </div>
  );
};

export default QueryTree;
