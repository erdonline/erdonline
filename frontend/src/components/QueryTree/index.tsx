import React from 'react';
import { Tree, Input, Button, Typography, Tooltip } from 'antd';
import { PlusOutlined, DownOutlined, FolderOutlined, CodeOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
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
}) => {
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

          <Text ellipsis={{ tooltip: nodeData?.title }} style={{ marginLeft: '8px', flex: 1, minWidth: 0 ,width: 120}}>
            {nodeData.title}
          </Text>

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
      return <CodeOutlined style={{ color: '#1890FF' }} />;
    }
    return <FolderOutlined style={{ color: '#FFB300' }} />;
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
    <>
      <div style={{ paddingBottom: '16px', paddingRight: '16px', display: 'flex' }}>
        <Search
          placeholder="搜索"
          onSearch={onSearch}
          style={{ flex: 1, marginRight: '8px' }}
        />
        {renderAddButton()}
      </div>
      <div className={`tree-container custom-tree compact-tree compact-level-${compactLevel}`}>
        <Tree.DirectoryTree
          showIcon={false}
          switcherIcon={<DownOutlined />}
          onSelect={onSelect}
          treeData={treeData}
          expandAction="click"
          titleRender={titleRender}
          icon={renderIcon || defaultRenderIcon}
          blockNode
        />
      </div>
    </>
  );
};

export default QueryTree;