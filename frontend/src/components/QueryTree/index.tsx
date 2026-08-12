import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Tree, Input, Button, Typography, Empty } from 'antd';
import { useIntl } from '@umijs/max';
import { PlusOutlined, DownOutlined, FolderOutlined, CodeOutlined } from '@ant-design/icons';
import type { DataNode, DirectoryTreeProps } from 'antd/es/tree';
import { erdColors } from '@/theme/tokens';
import './style.less';

const { Text } = Typography;
const { Search } = Input;

/** ADR-0016：左树行高与 22 chrome 同阶；须与虚拟滚动 itemHeight / CSS 行高一致 */
export const TREE_ROW_HEIGHT = 22;

/** rc-tree 对键盘的入口：隐藏 input（aria-label 由库写死） */
const TREE_KEYBOARD_INPUT = 'input[aria-label="for screen reader"]';

/** Skip 地标 → ↓/↑/Enter 切入 antd 树键盘面 */
export type QueryTreeHandle = {
  focusKeyboard: (opts?: { direction?: 'down' | 'up' }) => void;
};

interface QueryTreeProps {
  treeData: DataNode[];
  onSelect: DirectoryTreeProps['onSelect'];
  onSearch: (value: string) => void;
  /** 受控搜索词（与 store searchKey 同步；× 清除必须回写空串） */
  searchValue?: string;
  /** 有搜索词且无匹配表时，在树区展示空态（勿白屏） */
  searchEmpty?: boolean;
  onAdd?: (() => void) | React.ReactNode;
  renderActions?: (node: DataNode) => React.ReactNode;
  renderExtraIcons?: (node: DataNode) => React.ReactNode;
  renderIcon?: (props: DataNode) => React.ReactNode;
  compactLevel?: number;
  /** 受控展开 keys（默认展开「表/关系」由调用方计算） */
  expandedKeys?: React.Key[];
  onExpand?: (keys: React.Key[]) => void;
}

/** rc-tree 实例上用于键盘漫游的方法（antd 未在 TS 暴露） */
type RcTreeKeyboard = {
  offsetActiveKey?: (offset: number) => void;
  state?: { activeKey?: React.Key | null };
};

const QueryTree = forwardRef<QueryTreeHandle, QueryTreeProps>(function QueryTree(
  {
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
  },
  ref,
) {
  const intl = useIntl();
  const containerRef = useRef<HTMLDivElement>(null);
  const treeHostRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<RcTreeKeyboard | null>(null);
  const [treeHeight, setTreeHeight] = useState(0);
  /** 键盘漫游高亮 key（供 E2E / 焦点环，勿依赖 .ant-tree-treenode-active） */
  const [kbActiveKey, setKbActiveKey] = useState<React.Key | null>(null);
  /** 输入框本地态：Enter/搜索钮才 commit；× / 清空立刻 commit 空串 */
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

  useImperativeHandle(
    ref,
    () => ({
      focusKeyboard: (opts) => {
        const host = treeHostRef.current;
        if (!host) {
          return;
        }
        const input = host.querySelector<HTMLInputElement>(TREE_KEYBOARD_INPUT);
        if (!input) {
          return;
        }
        input.focus();
        const tree = treeRef.current;
        // 已有 active：只回焦点，保留漫游位置；否则 ↓首行 / ↑末行
        if (tree?.state?.activeKey != null) {
          return;
        }
        tree?.offsetActiveKey?.(opts?.direction === 'up' ? -1 : 1);
      },
    }),
    [],
  );

  const titleRender = (nodeData: DataNode) => {
    const level = nodeData.key.toString().split('-').length - 1;
    const paddingLeft = Math.max(0, (level - compactLevel) * 16);
    const isKbActive = kbActiveKey != null && nodeData.key === kbActiveKey;

    return (
      <div
        data-tree-kb-active={isKbActive ? '1' : undefined}
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
              {nodeData.title as React.ReactNode}
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

  const defaultRenderIcon = (props: DataNode & { isLeaf?: boolean }) => {
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
          aria-label={intl.formatMessage({ id: 'queryTree.createAria' })}
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
      <div className="query-tree__toolbar" data-testid="query-tree-toolbar">
        <Search
          size="small"
          placeholder={intl.formatMessage({ id: 'queryTree.searchPlaceholder' })}
          aria-label={intl.formatMessage({ id: 'queryTree.searchAria' })}
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
              description={
                <span>{intl.formatMessage({ id: 'queryTree.emptyDescription' })}</span>
              }
            />
          </div>
        ) : (
          treeHeight > 0 && (
            <div ref={treeHostRef} className="query-tree__tree-host">
              <Tree.DirectoryTree
                ref={(instance) => {
                  treeRef.current = instance as unknown as RcTreeKeyboard | null;
                }}
                showIcon={false}
                switcherIcon={<DownOutlined style={{ fontSize: 10 }} />}
                onSelect={onSelect}
                treeData={treeData}
                expandAction="click"
                titleRender={titleRender}
                icon={(renderIcon || defaultRenderIcon) as DirectoryTreeProps['icon']}
                expandedKeys={expandedKeys}
                onExpand={onExpand}
                onActiveChange={(key) => setKbActiveKey(key)}
                height={treeHeight}
                itemHeight={TREE_ROW_HEIGHT}
                blockNode
              />
            </div>
          )
        )}
      </div>
    </div>
  );
});

export default QueryTree;
