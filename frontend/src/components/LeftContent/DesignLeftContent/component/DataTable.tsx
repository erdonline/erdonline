import QueryTree, { type QueryTreeHandle } from '@/components/QueryTree';
import useGlobalStore from "@/store/global/globalStore";
import useProjectStore from "@/store/project/useProjectStore";
import useTabStore, { TabGroup } from "@/store/tab/useTabStore";
import { history } from "@@/core/history";
import { AppstoreOutlined, DatabaseOutlined, FolderOutlined, NodeIndexOutlined, PlusOutlined, TableOutlined, EditOutlined, CopyOutlined, ScissorOutlined, SnippetsOutlined, DeleteOutlined, EllipsisOutlined } from "@ant-design/icons";
import { Badge, Button, Dropdown, Empty, Menu, message, Typography } from 'antd';
import { useIntl } from '@umijs/max';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import shallow from "zustand/shallow";
import EntityModal from './EntityModal';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { erdColors } from '@/theme/tokens';
import {
  DEFAULT_DIAGRAM_ID,
  parseDiagramIdFromTabEntity,
  relationTabEntity,
} from '@/utils/diagram';
import {
  confirmDestructive,
  focusTreeActionTrigger,
} from '@/utils/destructiveConfirm';

const iconStyle = (color: string) => ({ color, fontSize: 12 });

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
  const intl = useIntl();
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
  const queryTreeRef = useRef<QueryTreeHandle>(null);
  // 默认展开到「表/关系」可操作层级（ADR-0017）；已见 key 不回顶用户的手动折叠
  const seenExpandableKeysRef = useRef<Set<string>>(new Set());

  /** Skip 地标聚焦时：↓/↑/Enter 切入树键盘面（Tab 仍进搜索，无 trap） */
  const onTreeLandmarkKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) {
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      queryTreeRef.current?.focusKeyboard({ direction: 'down' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      queryTreeRef.current?.focusKeyboard({ direction: 'up' });
    }
  }, []);

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
      // 点表 → 切到该模块关系图并定位高亮（表设计走菜单「编辑表」）
      activeEntity(node.module, node);
      const relationTab = useTabStore
        .getState()
        .tableTabs.find(
          (t) => t.module === node.module && (t.entity || '').startsWith('关系图'),
        );
      const diagramId = relationTab
        ? parseDiagramIdFromTabEntity(node.module, relationTab.entity)
        : DEFAULT_DIAGRAM_ID;
      tabDispatch.switchRelationDiagram(
        node.module,
        relationTabEntity(node.module, diagramId),
      );
      globalDispatch.requestLocateTable(node.module, node.title);
    } else if (node.type === "relation") {
      // 同模块关系图就地切签（ADR-0017）；图名 ≠ 表名，禁 setCurrentEntity
      projectDispatch.setCurrentModule(node.module);
      tabDispatch.switchRelationDiagram(
        node.module,
        relationTabEntity(node.module, node.diagramId),
      );
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
    } else if (type === 'relation') {
      // showModal 仅用于新建；重命名走 handleRename → renameDiagram
      const defaultModule = node?.module || (modules && modules.length > 0 ? modules[0].name : null);
      setCurrentNode({
        type: 'relation',
        module: defaultModule,
        isNew: true,
      });
    } else {
      setCurrentNode(node);
    }
    setModalVisible(true);
  };

  const handleModalOk = async (values: Record<string, unknown>): Promise<boolean> => {
    const isNew = !currentNode || Object.keys(currentNode).length === 0 || currentNode?.isNew;
    const persist = { persist: true as const };

    switch (modalType) {
      case 'module': {
        const ok = isNew
          ? await Promise.resolve(projectDispatch.addModule(values, persist))
          : await Promise.resolve(
              projectDispatch.renameModule({ ...values, oldName: values.name }, persist),
            );
        if (!ok) {
          return false;
        }
        break;
      }
      case 'entity': {
        if (isNew) {
          const moduleName = (values.module || values.moduleName) as string | undefined;
          const ok = await Promise.resolve(
            projectDispatch.addEntity(
              {
                ...values,
                title: values.name,
                moduleName,
              },
              persist,
            ),
          );
          if (!ok) {
            return false;
          }
          // 建表后直开关系图，跳过「双击表→再切关系图」
          if (moduleName) {
            tabDispatch.addTab({
              group: TabGroup.MODEL,
              module: moduleName,
              entity: relationTabEntity(moduleName),
            });
          }
        } else {
          const ok = await Promise.resolve(
            projectDispatch.renameEntity(
              {
                oldModuleName: currentNode.module,
                newModuleName: values.moduleName as string,
                oldTitle: currentNode.title,
                newTitle: values.name as string,
                newChnname: values.chnname as string,
              },
              persist,
            ),
          );
          if (!ok) {
            return false;
          }
        }
        break;
      }
      case 'relation': {
        const moduleName = currentNode?.module || (modules && modules.length > 0 ? modules[0].name : null);
        if (!moduleName) {
          message.warning(intl.formatMessage({ id: 'designLeft.createModuleFirst' }));
          return false;
        }
        if (isNew) {
          const id = await Promise.resolve(
            projectDispatch.createDiagram(moduleName, values.name as string, persist),
          );
          if (!id) {
            return false;
          }
          tabDispatch.switchRelationDiagram(
            moduleName,
            relationTabEntity(moduleName, id),
          );
        } else if (currentNode?.diagramId) {
          const ok = await Promise.resolve(
            projectDispatch.renameDiagram(
              moduleName,
              currentNode.diagramId,
              values.name as string,
              persist,
            ),
          );
          if (!ok) {
            return false;
          }
        }
        break;
      }
    }
    setModalVisible(false);
    return true;
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

  /** 表菜单「编辑表」→ 表设计字段签（与画布 canvas-open-field 同路径） */
  const handleOpenEntityDesign = (node: any) => {
    tabDispatch.addTab({
      group: TabGroup.MODEL,
      module: node.module,
      entity: node.title,
      designPane: 'field',
    });
    activeEntity(node.module, node);
    if (history.location.pathname !== '/design/table/model') {
      history.push({ pathname: '/design/table/model' });
    }
  };

  const handleRemove = (node: any) => {
    const actionLabel =
      node.type === 'module'
        ? intl.formatMessage({ id: 'designLeft.actionModule' })
        : node.type === 'entity'
          ? intl.formatMessage({ id: 'designLeft.actionTable' })
          : intl.formatMessage({ id: 'designLeft.actionDiagram' });
    // Dropdown menuitem unmounts; park focus on the row trigger for Esc return
    focusTreeActionTrigger(node.title, actionLabel);

    if (node.type === 'relation') {
      if (node.diagramId === DEFAULT_DIAGRAM_ID) {
        message.warning(intl.formatMessage({ id: 'designLeft.mainDiagramNoDelete' }));
        return;
      }
      confirmDestructive({
        title: intl.formatMessage({ id: 'designLeft.deleteDiagramTitle' }, { name: node.title }),
        icon: <ExclamationCircleOutlined />,
        content: intl.formatMessage({ id: 'designLeft.deleteDiagramContent' }),
        okText: intl.formatMessage({ id: 'designLeft.deleteOk' }),
        okType: 'danger',
        cancelText: intl.formatMessage({ id: 'shareModal.cancel' }),
        async onOk() {
          const ok = await Promise.resolve(
            projectDispatch.removeDiagram(node.module, node.diagramId, { persist: true }),
          );
          if (!ok) {
            return Promise.reject(new Error(intl.formatMessage({ id: 'designLeft.diagramDeletePersistFailed' })));
          }
        },
      });
      return;
    }

    const kind =
      node.type === 'module'
        ? intl.formatMessage({ id: 'designLeft.kindModule' })
        : intl.formatMessage({ id: 'designLeft.kindTable' });
    confirmDestructive({
      title: intl.formatMessage(
        { id: node.type === 'module' ? 'designLeft.deleteModuleTitle' : 'designLeft.deleteTableTitle' },
        { name: node.title },
      ),
      icon: <ExclamationCircleOutlined />,
      content:
        node.type === 'module'
          ? intl.formatMessage({ id: 'designLeft.deleteModuleContent' })
          : intl.formatMessage({ id: 'designLeft.deleteTableContent' }),
      okText: intl.formatMessage({ id: 'designLeft.deleteOk' }),
      okType: 'danger',
      cancelText: intl.formatMessage({ id: 'shareModal.cancel' }),
      async onOk() {
        if (node.type === 'module') {
          const ok = await Promise.resolve(
            projectDispatch.removeModule(node.module || node.name, { persist: true }),
          );
          if (!ok) {
            return Promise.reject(new Error(intl.formatMessage({ id: 'designLeft.moduleDeletePersistFailed' })));
          }
          return;
        }
        if (node.type === 'entity') {
          const ok = await Promise.resolve(
            projectDispatch.removeEntity(node.module, node.title, { persist: true }),
          );
          if (!ok) {
            return Promise.reject(new Error(intl.formatMessage({ id: 'designLeft.tableDeletePersistFailed' })));
          }
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
    // 禁止本地 mutate 即「剪切成功」；仅 saveProject code===200 移出；失败保留原位
    if (node.type === 'module') {
      void projectDispatch.cutModule(
        {
          name: node.name || node.title,
          chnname: node.chnname,
        },
        { persist: true },
      );
    } else if (node.type === 'entity') {
      void projectDispatch.cutEntity(node.module, node.title, { persist: true });
    }
  };

  const handlePaste = (node: any) => {
    // 禁止本地 mutate 即「粘贴成功」；仅 saveProject code===200 写入；失败不建副本
    if (node.type === 'module') {
      void projectDispatch.pastModule({ persist: true });
    } else if (node.type === 'entity' || node.type === 'folder') {
      void projectDispatch.pastEntity(node.module, { persist: true });
    }
  };

  const folderAddIconStyle: React.CSSProperties = {
    padding: '0 4px',
    fontSize: 12,
    color: erdColors.brand,
    cursor: 'pointer',
  };

  const renderActions = (node: any) => {
    if (node.type === 'folder' && node.title === '表') {
      return (
        <PlusOutlined
          role="button"
          tabIndex={0}
          aria-label={intl.formatMessage({ id: 'designLeft.addTableAria' })}
          data-testid="tree-folder-add-entity"
          style={folderAddIconStyle}
          onClick={(e) => {
            e.stopPropagation();
            showModal('entity', { module: node.module });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              showModal('entity', { module: node.module });
            }
          }}
        />
      );
    }
    if (node.type === 'folder' && node.title === '关系图') {
      return (
        <PlusOutlined
          role="button"
          tabIndex={0}
          aria-label={intl.formatMessage({ id: 'designLeft.addDiagramAria' })}
          data-testid="tree-folder-add-relation"
          style={folderAddIconStyle}
          onClick={(e) => {
            e.stopPropagation();
            showModal('relation', { module: node.module });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              showModal('relation', { module: node.module });
            }
          }}
        />
      );
    }

    const hasClipboard = node.type !== 'relation';
    const hasPaste = node.type === 'module' || node.type === 'entity';
    const canDelete = !(node.type === 'relation' && node.diagramId === DEFAULT_DIAGRAM_ID);

    const menu = (
      <Menu className="erd-dense-menu" onClick={(e) => e.domEvent.stopPropagation()}>
        {node.type !== 'folder' && (
          <>
            {node.type === 'entity' ? (
              <>
                <Menu.Item
                  key="edit"
                  icon={<EditOutlined style={iconStyle(erdColors.ink600)} />}
                  onClick={() => handleOpenEntityDesign(node)}
                >
                  {intl.formatMessage({ id: 'designLeft.editTable' })}
                </Menu.Item>
                <Menu.Item key="rename" onClick={() => handleRename(node)}>
                  {intl.formatMessage({ id: 'designLeft.renameTable' })}
                </Menu.Item>
              </>
            ) : (
              <Menu.Item key="rename" icon={<EditOutlined style={iconStyle(erdColors.ink600)} />} onClick={() => handleRename(node)}>
                {node.type === 'module'
                  ? intl.formatMessage({ id: 'designLeft.editModule' })
                  : intl.formatMessage({ id: 'designLeft.renameDiagram' })}
              </Menu.Item>
            )}
            {hasClipboard && (
              <>
                <Menu.Divider />
                <Menu.Item key="copy" icon={<CopyOutlined style={iconStyle(erdColors.success)} />} onClick={() => handleCopy(node)}>
                  {node.type === 'module'
                    ? intl.formatMessage({ id: 'designLeft.copyModule' })
                    : intl.formatMessage({ id: 'designLeft.copyTable' })}
                </Menu.Item>
                <Menu.Item key="cut" icon={<ScissorOutlined style={iconStyle(erdColors.warning)} />} onClick={() => handleCut(node)}>
                  {node.type === 'module'
                    ? intl.formatMessage({ id: 'designLeft.cutModule' })
                    : intl.formatMessage({ id: 'designLeft.cutTable' })}
                </Menu.Item>
                {hasPaste && (
                  <Menu.Item key="paste" icon={<SnippetsOutlined style={iconStyle(erdColors.ink600)} />} onClick={() => handlePaste(node)}>
                    {node.type === 'module'
                      ? intl.formatMessage({ id: 'designLeft.pasteToModule' })
                      : intl.formatMessage({ id: 'designLeft.pasteToTable' })}
                  </Menu.Item>
                )}
              </>
            )}
            {canDelete && (
              <>
                <Menu.Divider />
                <Menu.Item
                  key="remove"
                  icon={<DeleteOutlined style={iconStyle(erdColors.brand)} />}
                  danger
                  onClick={() => handleRemove(node)}
                >
                  {node.type === 'module'
                    ? intl.formatMessage({ id: 'designLeft.deleteModule' })
                    : node.type === 'entity'
                      ? intl.formatMessage({ id: 'designLeft.deleteTable' })
                      : intl.formatMessage({ id: 'designLeft.deleteDiagram' })}
                </Menu.Item>
              </>
            )}
          </>
        )}
      </Menu>
    );

    return node.type !== 'folder' ? (
      <Dropdown overlay={menu} trigger={['click']}>
        <EllipsisOutlined
          role="button"
          tabIndex={0}
          data-testid="tree-node-menu"
          aria-label={
            node.type === 'module'
              ? intl.formatMessage({ id: 'designLeft.actionModule' })
              : node.type === 'entity'
                ? intl.formatMessage({ id: 'designLeft.actionTable' })
                : intl.formatMessage({ id: 'designLeft.actionDiagram' })
          }
          style={{ padding: '0 4px', fontSize: 12 }}
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
      const relationsCount = node.children.find((child: any) => child.title === '关系图')?.children.length || 0;
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
      } else if (node.title === '关系图') {
        return <NodeIndexOutlined style={{ color: erdColors.ink600 }} />;
      }
      return <FolderOutlined style={{ color: erdColors.ink400 }} />;
    }
    return null;
  };

  /** 有模块时：树头仅保留「新增模型」（表/关系图走文件夹 inline +） */
  const renderAddModuleButton = () => (
    <Button
      size="small"
      icon={<PlusOutlined />}
      aria-label={intl.formatMessage({ id: 'designLeft.addModuleAria' })}
      data-testid="design-tree-add-module"
      onClick={() => showModal('module')}
    />
  );

  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE} // 请确保有这个SVG文件，或使用 Empty.PRESENTED_IMAGE_SIMPLE
      imageStyle={{
        height: 60,
      }}
      description={
        <span>{intl.formatMessage({ id: 'designLeft.emptyDescription' })}</span>
      }
    >
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => showModal('module')}
        data-testid="add-module-empty"
      >
        {intl.formatMessage({ id: 'designLeft.addModule' })}
      </Button>
    </Empty>
  );

  const trimmedSearch = (searchKey || '').trim();
  const hasSearch = trimmedSearch.length > 0;
  const rawTree = projectDispatch.getModuleEntityTree(searchKey || '', true);
  // 搜索时隐藏「表」为空的模型，避免只剩空文件夹误导；零匹配 → 树区空态
  const treeData = hasSearch
    ? (rawTree || []).filter((m: { children?: Array<{ title?: string; type?: string; children?: unknown[] }> }) => {
        const tables = m.children?.find((c) => c.type === 'folder' && c.title === '表');
        return (tables?.children?.length || 0) > 0;
      })
    : rawTree;

  return (
    <div
      id="erd-design-tree"
      className="design-left-data"
      data-testid="erd-design-tree"
      tabIndex={-1}
      role="navigation"
      aria-label={intl.formatMessage({ id: 'designLeft.treeAria' })}
      onKeyDown={onTreeLandmarkKeyDown}
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
          ref={queryTreeRef}
          treeData={treeData}
          searchValue={searchKey || ''}
          searchEmpty={hasSearch && (!treeData || treeData.length === 0)}
          onSelect={handleSelect}
          onSearch={handleSearch}
          renderActions={renderActions}
          renderExtraIcons={renderExtraIcons}
          renderIcon={renderIcon}
          compactLevel={2}
          onAdd={renderAddModuleButton()}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
        />
      ) : renderEmptyState()}

      <EntityModal
        visible={modalVisible}
        title={`${
          currentNode && !currentNode.isNew
            ? intl.formatMessage({ id: 'designLeft.modalEdit' })
            : intl.formatMessage({ id: 'designLeft.modalAdd' })
        }${
          modalType === 'module'
            ? intl.formatMessage({ id: 'designLeft.kindModule' })
            : modalType === 'entity'
              ? intl.formatMessage({ id: 'designLeft.kindTable' })
              : intl.formatMessage({ id: 'designLeft.kindDiagram' })
        }`}
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