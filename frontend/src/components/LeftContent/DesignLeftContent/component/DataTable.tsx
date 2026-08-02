import QueryTree from '@/components/QueryTree';
import useGlobalStore from "@/store/global/globalStore";
import useProjectStore from "@/store/project/useProjectStore";
import useTabStore, { TabGroup } from "@/store/tab/useTabStore";
import { history } from "@@/core/history";
import { AppstoreOutlined, DatabaseOutlined, FolderOutlined, NodeIndexOutlined, PlusOutlined, TableOutlined, EditOutlined, CopyOutlined, ScissorOutlined, SnippetsOutlined, DeleteOutlined, EllipsisOutlined } from "@ant-design/icons";
import { Badge, Button, Dropdown, Empty, Menu, message, Modal, Tooltip, Typography } from 'antd';
import type { MenuProps } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import shallow from "zustand/shallow";
import EntityModal from './EntityModal';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { erdColors } from '@/theme/tokens';
import { relationTabEntity } from '@/utils/diagram';

const iconStyle = (color: string) => ({ color, fontSize: '16px' });

/** 树计数徽章：erd 中性色（ADR-0017；禁 antd 默认灰蓝散落） */
const countBadgeStyle: React.CSSProperties = {
  backgroundColor: erdColors.surfaceSunk,
  color: erdColors.ink600,
  border: `1px solid ${erdColors.line}`,
  boxShadow: 'none',
};

export type DataTableProps = {};

const { Text } = Typography;

const DataTable: React.FC<DataTableProps> = (props) => {
  const { modules, projectDispatch } = useProjectStore(state => ({
    modules: state.project?.projectJSON?.modules,
    projectDispatch: state.dispatch,
  }), shallow);
  const { tabDispatch } = useTabStore(state => ({ tableTabs: state.tableTabs, tabDispatch: state.dispatch }));
  const { searchKey, globalDispatch } = useGlobalStore(state => ({
    searchKey: state.searchKey,
    globalDispatch: state.dispatch,
  }), shallow);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'module' | 'entity' | 'relation'>('module');
  const [currentNode, setCurrentNode] = useState<any>(null);
  // 默认展开到「表/关系」可操作层级（ADR-0017）；已见 key 不回顶用户的手动折叠
  const seenExpandableKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const expandable = (modules || []).flatMap((m: any) => [
      m.name,
      `${m.name}-tables`,
      `${m.name}-relations`,
    ]);
    const fresh = expandable.filter(k => !seenExpandableKeysRef.current.has(k));
    if (fresh.length === 0) {
      return;
    }
    fresh.forEach(k => seenExpandableKeysRef.current.add(k));
    setExpandedKeys(prev => [...prev, ...fresh]);
  }, [modules]);

  const activeEntity = (module: any, entity: any) => {
    projectDispatch.setCurrentModule(module);
    projectDispatch.setCurrentEntity(module, entity.title || entity.name);  // 使用 title 或 name
  }

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    const node = info.node;
    if (node.type === "module") {
      projectDispatch.setCurrentModule(node.module)
    } else if (node.type === "entity") {
      // 当选中实体(表)时,打开编辑字段页面
      tabDispatch.addTab({ group: TabGroup.MODEL, module: node.module, entity: node.title });
      activeEntity(node.module, node)
    } else if (node.type === "relation") {
      // 同模块关系图就地切签（ADR-0017），避免堆多个 canvas
      tabDispatch.switchRelationDiagram(
        node.module,
        relationTabEntity(node.module, node.diagramId),
      );
      activeEntity(node.module, node)
    }

    if (history.location.pathname !== '/design/table/model') {
      history.push({
        pathname: '/design/table/model'
      });
    }
  };

  const handleSearch = (value: string) => {
    globalDispatch.setSearchKey(value);
  };

  const showModal = (type: 'module' | 'entity' | 'relation', node?: any) => {
    setModalType(type);
    if (type === 'entity') {
      let defaultModule = node?.module || (modules && modules.length > 0 ? modules[0].name : null);
      setCurrentNode({
        type: 'entity',
        module: defaultModule,
        isNew: true
      });
    } else {
      setCurrentNode(node);
    }
    setModalVisible(true);
  };

  const handleModalOk = (values: any) => {
    const isNew = !currentNode || Object.keys(currentNode).length === 0 || currentNode?.isNew;

    switch (modalType) {
      case 'module':
        if (isNew) {
          projectDispatch.addModule(values);
        } else {
          projectDispatch.renameModule({ ...values, oldName: values.name });
        }
        break;
      case 'entity':
        if (isNew) {
          const moduleName = values.module || values.moduleName;
          projectDispatch.addEntity({
            ...values,
            title: values.name,
            moduleName,
          });
          // 建表后直开关系图，跳过「双击表→再切关系图」
          if (moduleName) {
            tabDispatch.addTab({
              group: TabGroup.MODEL,
              module: moduleName,
              entity: relationTabEntity(moduleName),
            });
          }
        } else {
          projectDispatch.renameEntity({
            oldModuleName: currentNode.module,
            newModuleName: values.moduleName,
            oldTitle: currentNode.title,
            newTitle: values.name,
            newChnname: values.chnname
          });
        }
        break;
      case 'relation':
        // 处理关系添加的逻辑（如果需要）
        break;
    }
    setModalVisible(false);
  };

  const handleRename = (node: any) => {
    setModalType(node.type);
    setCurrentNode({
      ...node,
      isNew: false, // 添加这个标志来区分新增和编辑
      name: node.title || node.name, // 确保name字段存在
      chnname: node.chnname // 如果有中文名,也要传递
    });
    setModalVisible(true);
  };

  const handleRemove = (node: any) => {
    Modal.confirm({
      title: `确定删除${node.type === 'module' ? '模型' : '表'} "${node.title}" 吗?`,
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可逆，请谨慎操作。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        if (node.type === 'module') {
          projectDispatch.removeModule(node.name);
        } else if (node.type === 'entity') {
          projectDispatch.removeEntity(node.module, node.title);
        }
      },
    });
  };

  const handleCopy = (node: any) => {
    if (node.type === 'module') {
      projectDispatch.copyModule({
        name: node.name || node.title,
        chnname: node.chnname
      });
    } else if (node.type === 'entity') {
      projectDispatch.copyEntity(node.module, node.title);
    }
    // 移除这里的 message.success,因为我们在 slice 中已经处理了消息
  };

  const handleCut = (node: any) => {
    if (node.type === 'module') {
      projectDispatch.cutModule({
        name: node.name || node.title,
        chnname: node.chnname
      });
    } else if (node.type === 'entity') {
      projectDispatch.cutEntity(node.module, node.title);
    }
    message.success('剪切成功');
  };

  const handlePaste = (node: any) => {
    if (node.type === 'module') {
      projectDispatch.pastModule();
    } else if (node.type === 'entity' || node.type === 'folder') {
      projectDispatch.pastEntity(node.module);
    }
    // 移除这里的 message.success,因为我们在 slice 中已经处理了消息
  };

  const renderActions = (node: any) => {
    if (node.type === 'folder' && node.title === '表') {
      return (
        <PlusOutlined
          style={{
            padding: '0 8px',
            fontSize: '16px',
            color: erdColors.brand,
            cursor: 'pointer'
          }}
          onClick={(e) => {
            e.stopPropagation();
            showModal('entity', { module: node.module });
          }}
        />
      );
    }

    const menu = (
      <Menu onClick={(e) => e.domEvent.stopPropagation()}>
        {node.type !== 'folder' && (
          <>
            <Menu.Item key="rename" icon={<EditOutlined style={iconStyle(erdColors.ink600)} />} onClick={() => handleRename(node)}>
              {node.type === 'module' ? '编辑模型' : node.type === 'entity' ? '编辑表' : '编辑关系'}
            </Menu.Item>
            <Menu.Item key="copy" icon={<CopyOutlined style={iconStyle(erdColors.success)} />} onClick={() => handleCopy(node)}>
              {`复制${node.type === 'module' ? '模型' : node.type === 'entity' ? '表' : '关系'}`}
            </Menu.Item>
            <Menu.Item key="cut" icon={<ScissorOutlined style={iconStyle(erdColors.warning)} />} onClick={() => handleCut(node)}>
              {`剪切${node.type === 'module' ? '模型' : node.type === 'entity' ? '表' : '关系'}`}
            </Menu.Item>
            {(node.type === 'module' || node.type === 'entity') && (
              <Menu.Item key="paste" icon={<SnippetsOutlined style={iconStyle(erdColors.ink600)} />} onClick={() => handlePaste(node)}>
                {`粘贴${node.type === 'module' ? '到模型' : '到表'}`}
              </Menu.Item>
            )}
            <Menu.Divider />
            <Menu.Item
              key="remove"
              icon={<DeleteOutlined style={iconStyle(erdColors.brand)} />}
              danger
              onClick={() => handleRemove(node)}
            >
              {`删除${node.type === 'module' ? '模型' : node.type === 'entity' ? '表' : '关系'}`}
            </Menu.Item>
          </>
        )}
      </Menu>
    );

    return node.type !== 'folder' ? (
      <Dropdown overlay={menu} trigger={['click']}>
        <EllipsisOutlined
          data-testid="tree-node-menu"
          aria-label={`${node.type === 'module' ? '模型' : node.type === 'entity' ? '表' : '关系'}操作`}
          style={{ padding: '0 8px', fontSize: '16px' }}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    ) : null;
  };

  const renderExtraIcons = (node: any) => {
    if (node.type === 'folder') {
      return (
        <Badge
          count={node.children.length}
          size="small"
          style={countBadgeStyle}
        />
      );
    } else if (node.type === 'module') {
      const tablesCount = node.children.find((child: any) => child.title === '表')?.children.length || 0;
      const relationsCount = node.children.find((child: any) => child.title === '关系')?.children.length || 0;
      return (
        <Badge
          count={tablesCount + relationsCount}
          size="small"
          style={countBadgeStyle}
        />
      );
    } else if (node.type === 'entity') {
      const fieldsCount = Array.isArray(node.fields) ? node.fields.length : 0;
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Text
            ellipsis={{ tooltip: node.chnname }}
            style={{
              color: erdColors.ink400,
              maxWidth: '100px',
              marginRight: '8px'
            }}
          >
            {node.chnname}
          </Text>
          <Badge
            count={fieldsCount}
            size="small"
            style={countBadgeStyle}
          />
        </div>
      );
    }
    return null;
  };

  const renderIcon = (node: any) => {
    if (node.type === "module") {
      return <AppstoreOutlined style={{ color: erdColors.ink900 }} />;
    } else if (node.type === "relation") {
      return <NodeIndexOutlined style={{ color: erdColors.success }} />;
    } else if (node.type === "entity") {
      return <TableOutlined style={{ color: erdColors.warning }} />;
    } else if (node.type === "folder") {
      if (node.title === '表') {
        return <DatabaseOutlined style={{ color: erdColors.ink600 }} />;
      } else if (node.title === '关系') {
        return <NodeIndexOutlined style={{ color: erdColors.ink600 }} />;
      }
      return <FolderOutlined style={{ color: erdColors.ink400 }} />;
    }
    return null;
  };

  const handleAdd = () => {
    const items: MenuProps['items'] = [
      {
        key: 'addModule',
        icon: <AppstoreOutlined style={{ color: erdColors.ink900 }} />,
        label: <span data-testid="menu-add-module">新增模型</span>,
        onClick: () => showModal('module'),
      },
      {
        key: 'addEntity',
        icon: <TableOutlined style={{ color: erdColors.warning }} />,
        label: <span data-testid="menu-add-entity">新增表</span>,
        onClick: () => showModal('entity'),
      },
      {
        key: 'addRelation',
        icon: <NodeIndexOutlined style={{ color: erdColors.success }} />,
        label: '新增关系',
        onClick: () => showModal('relation'),
      },
    ];

    return (
      <Dropdown menu={{ items }} trigger={['click']} placement="bottomLeft">
        <Button
          icon={<PlusOutlined />}
          style={{ width: '40px' }}
          aria-label="新建"
          data-testid="design-tree-add"
        />
      </Dropdown>
    );
  };

  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE} // 请确保有这个SVG文件，或使用 Empty.PRESENTED_IMAGE_SIMPLE
      imageStyle={{
        height: 60,
      }}
      description={
        <span>还没有任何模型哦</span>
      }
    >
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => showModal('module')}
        data-testid="add-module-empty"
      >
        新增模型
      </Button>
    </Empty>
  );

  return (
    <div
      className="design-left-data"
      style={{
        height: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {modules && modules.length > 0 ? (
        <QueryTree
          treeData={projectDispatch.getModuleEntityTree(searchKey || '', true)}
          onSelect={handleSelect}
          onSearch={handleSearch}
          renderActions={renderActions}
          renderExtraIcons={renderExtraIcons}
          renderIcon={renderIcon}
          compactLevel={2}
          onAdd={handleAdd()}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
        />
      ) : renderEmptyState()}

      <EntityModal
        visible={modalVisible}
        title={`${currentNode && !currentNode.isNew ? '编辑' : '新增'}${modalType === 'module' ? '模型' : modalType === 'entity' ? '表' : '关系'}`}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        initialValues={currentNode}
        modules={modules}
        modalType={modalType}
      />
    </div>
  );
}

export default React.memo(DataTable)