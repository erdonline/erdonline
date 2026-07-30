import CodeEditor from "@/components/CodeEditor";
import { DataSourceSelect } from '@/components/DataSourceSelect';
import QueryTree from '@/components/QueryTree';
import ExplainResult from "@/pages/design/query/component/ExplainResult";
import QueryHistory from "@/pages/design/query/component/QueryHistory";
import QueryResult from "@/pages/design/query/component/QueryResult";
import { POST } from "@/services/crud";
import useProjectStore from "@/store/project/useProjectStore";
import useQueryStore from "@/store/query/useQueryStore";
import useVersionStore from "@/store/version/useVersionStore";
import * as cache from "@/utils/cache";
import { uuid } from "@/utils/uuid";
import { ApiOutlined, BarChartOutlined, BarsOutlined, CodeOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FolderOutlined, LockOutlined, MoreOutlined, PlayCircleOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import { Data, HistoryQuery, Plan } from "@icon-park/react";
import { Button, Checkbox, Dropdown, Empty, Form, Input, Layout, List, message, Modal, Select, Spin, Tooltip, TreeSelect, Typography } from "antd";
import type { DataNode } from 'antd/es/tree';
import _ from "lodash";
import moment from "moment";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { format } from "sql-formatter";
import shallow from "zustand/shallow";
import './style.less';

import CommonTabs from '@/components/CommonTabs';
import useTabStore from '@/store/tab/useTabStore';
import { FileSearchOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Search } = Input;
const { Sider, Content } = Layout;

const { Option } = Select;
export type QueryProps = {
  id: string | number;
};

const DataQuery: React.FC<QueryProps> = (props) => {
  const { dbs } = useVersionStore(state => ({
    dbs: state.dbs,
    versionDispatch: state.dispatch,
  }), shallow);


  const { tables, modules, fetch: fetchProject } = useProjectStore(state => ({
    tables: state.tables,
    modules: state.project?.projectJSON?.modules || [],
    fetch: state.fetch,
  }), shallow);

  console.log(130, tables);

  const [tableResult, setTableResult] = useState({
    columns: [],
    dataSource: [],
    total: 0,
    current: 1,
    pageSize: 10
  });
  const [explainTable, setExplainTable] = useState({
    columns: [],
    dataSource: [],
    total: 0
  });
  const [tab, setTab] = useState('result');
  const [selectDB, setSelectDB] = useState<{ value: string; label: string } | undefined>(undefined); const [sqlMode, setSqlMode] = useState('mysql');
  const [theme, setTheme] = useState('xcode');

  const { queryDispatch, treeData } = useQueryStore(state => ({
    queryDispatch: state.dispatch,
    treeData: state.treeData,
  }), shallow);

  const [queryInfo, setQueryInfo] = useState({
    sqlInfo: ''
  });

  const editorRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    queryDispatch.fetchQueryInfo(props.id).then(r => {
      if (r.code === 200) {
        setQueryInfo(r.data);
      }
    });
    console.log(26, queryInfo);
  }, [])

  useEffect(() => {

  }, [tableResult])

  const EDITOR_THEME = ['xcode', 'terminal',];

  const [selectedTable, setSelectedTable] = useState([]);
  const [chatId, setChatId] = useState(uuid());
  const [open, setOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [siderCollapsed, setSiderCollapsed] = useState(false);

  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedNode, setSelectedNode] = useState<DataNode | null>(null);

  const [selectedNodeKey, setSelectedNodeKey] = useState<string>("");
  const renderIcon = (node: DataNode) => {
    if (!node.isLeaf) {
      return <FolderOutlined style={{ color: '#FFB300' }} />;
    }
    switch (node.type) {
      case 'sql':
        return <CodeOutlined style={{ color: '#1890FF' }} />;
      case 'stored_procedure':
        return <ApiOutlined style={{ color: '#52C41A' }} />;
      case 'report':
        return <BarChartOutlined style={{ color: '#722ED1' }} />;
      default:
        return <CodeOutlined style={{ color: '#1890FF' }} />;
    }
  };
  const renderExtraIcons = (nodeData: DataNode) => {
    const hasProjectId = 'projectId' in nodeData && nodeData.projectId != null && nodeData.projectId !== '';

    if (hasProjectId) {
      return (
        <Tooltip title="This item is locked to a project">
          <LockOutlined style={{ marginLeft: 8, fontSize: '12px', color: '#999' }} />
        </Tooltip>
      );
    }
    return null;
  };

  const handleProjectSelect = async () => {
    await fetchProject();
    // After fetching the project, update the CodeEditor's autocomplete data
    if (editorRef.current) {
      const tables = useProjectStore.getState().tables;
      const fields = useProjectStore.getState().project?.projectJSON?.modules.flatMap(
        (module: any) => module.entities.flatMap((entity: any) => entity.fields.map((field: any) => field.name))
      );
      editorRef.current.updateAutoCompleteData(tables, fields);
    }
    // Fetch tree data for all projects
    queryDispatch.fetchTreeData({});
  };

  // Call handleProjectSelect on component mount
  useEffect(() => {
    handleProjectSelect();
  }, []);

  const showModal = (type: 'add' | 'edit', node?: DataNode) => {
    setModalType(type);
    setSelectedNode(node || null);
    setModalVisible(true);
    if (type === 'edit' && node) {
      form.setFieldsValue({
        name: node.title,
        isLeaf: node.isLeaf
      });
    } else {
      form.resetFields();
      if (node) {
        form.setFieldsValue({ parentId: node.key });
      }
      // 设置默认查询类型为 SQL
      form.setFieldsValue({ type: 'sql', isLeaf: true });
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (modalType === 'add') {
        await queryDispatch.addQuery({
          title: values.name,
          parentId: values.parentId || '0',
          type: values.type,
          isLeaf: values.isLeaf,
        });
      } else {
        await queryDispatch.renameQuery({
          id: selectedNode!.key,
          title: values.name,
          isLeaf: values.isLeaf,
        });
      }
      setModalVisible(false);
      queryDispatch.fetchTreeData({});
    } catch (error) {
      console.error("handleModalOk 中的错误:", error);
    }
  };

  const handleDelete = async (node: DataNode) => {
    Modal.confirm({
      title: '确定要删除此项吗？',
      content: '此操作无法撤销。',
      onOk: async () => {
        try {
          await queryDispatch.removeQuery({
            id: node.key,
          });
          queryDispatch.fetchTreeData({});
        } catch (error) {
          console.error("handleDelete 中的错误:", error);
        }
      },
    });
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedTable([]);
    setOpen(false);
  };

  // 修改执行查询的函数
  const executeQuery = (page = currentPage, size = pageSize) => {
    if (!selectDB) {
      message.warning("未选中数据源");
      return;
    }

    // @ts-ignore
    const selectValue = editorRef?.current?.getSelectValue();
    if (!selectValue) {
      message.warning('未选中要执行的SQL');
      return;
    }

    const params = {
      key: selectDB.value,
      queryId: selectedNodeKey,
      sql: selectValue,
      dbName: selectDB.label,
      current: page,
      size: size
    };

    queryDispatch.exec(params).then(r => {
      if (r?.code === 200) {
        setTableResult({
          columns: r?.data.columns,
          dataSource: r.data.tableData.records,
          total: r.data.tableData.total,
          current: page,
          pageSize: size
        });
        setTab("result");
      }
    });
  };

  // 添加分页变化处理函数
  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    setPageSize(pageSize);
    executeQuery(page, pageSize);
  };

  const operationButtons = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Tooltip title="运行">
        <Button type="text" icon={<PlayCircleOutlined />} onClick={() => executeQuery()} />
      </Tooltip>
      <Tooltip title="格式化">
        <Button type="text" icon={<BarsOutlined />} onClick={() => {
          // @ts-ignore
          const selectValue = editorRef?.current?.getSelectValue();
          if (!selectValue) {
            message.warning('未选中要格式化的SQL');
          } else {
            // @ts-ignore
            const formatSqlInfo = format(selectValue || '', { language: sqlMode });
            console.log(130, formatSqlInfo);
            // @ts-ignore
            editorRef?.current?.setSelectValue(formatSqlInfo);
          }
        }} />
      </Tooltip>
      <Tooltip title="查看执行计划">
        <Button type="text" icon={<EyeOutlined />} onClick={() => {
          // @ts-ignore
          const selectValue = editorRef?.current?.getSelectValue();
          console.log(267, selectValue, selectDB);
          if (!selectValue) {
            message.warning('未选中要执行的SQL');
          } else {
            if (!selectDB) {
              message.warning("未选中数据源");
            } else {
              const params = {
                key: selectDB.value,
                queryId: selectedNodeKey,
                sql: selectValue,
                dbName: selectDB.label,
              }
              queryDispatch.explain(params).then(r => {
                if (r?.code === 200) {
                  setExplainTable({
                    columns: r?.data.columns,
                    dataSource: r?.data.tableData,
                    total: r?.data?.tableData?.length
                  });
                  setTab("plan");
                }
              });
            }
          }
        }} />
      </Tooltip>
      <Tooltip title="保存SQL">
        <Button type="text" icon={<SaveOutlined />} onClick={() => {
          queryDispatch.updateSqlInfo({
            id: selectedNodeKey,
            sqlInfo: queryInfo.sqlInfo
          });
        }} />
      </Tooltip>
    </div>
  );

  const dataSourceOptions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>数据源</span>
      <DataSourceSelect
        value={selectDB}
        onChange={(value) => setSelectDB(value)}
        style={{ width: '200px' }}
        size="small"
        onDbChange={(db) => {
          // You can handle additional logic here if needed when the database changes
        }}
      />
      <span>模式</span>
      <Select key={'model'} size="small" style={{ width: 90 }} value={sqlMode}
        onSelect={(e: any) => setSqlMode(e)}>
        <Option key="mysql" value="mysql">MySQL</Option>
        <Option key="sql" value="sql">SQL</Option>
      </Select>
      <span>主题</span>
      <Select key={'topic'} size="small" style={{ width: 170 }} value={theme} onSelect={(e: any) => {
        setTheme(e);
        console.log(58, e)
      }}>
        {
          EDITOR_THEME.map(v => <Option key={v} value={v}>{v}</Option>)
        }
      </Select>
    </div>
  );

  const [prefix, setPrefix] = useState('select'); // 初始选择第一个前缀

  const placeholderMap = {
    select: "查询近30天销售额",
    delete: "删除过期的用户数据",
    insert: "插入新的产品信息",
    update: "更新客户联系方式",
    alter: "给用户表添加年龄字段",
    create: "创建订单历史表",
    drop: "删除临时表",
    truncate: "清空日志表"
  };

  const getPlaceholder = (prefix) => {
    return `AI助手: 输入需求,自动生成${prefix}语句 (如:${placeholderMap[prefix]})`;
  };

  const aiSearch = (command: string) => {
    const sqlInfo = (queryInfo?.sqlInfo || '') + '\n' + '-- ' + cache.getItem('username') + ':' + command + moment().format('YYYY-MM-DD HH:mm:ss');
    setQueryInfo({
      ...queryInfo,
      sqlInfo: sqlInfo
    });
    setAiLoading(true);
    POST('/ncnb/ai/sql', {
      chatId,
      command: prefix + ":" + command,
      "tables": selectedTable,
      "schema": "Mysql",
    }
    ).then((result) => {
      console.log(151, result)
      console.log(152, queryInfo?.sqlInfo)
      if (result && result.code === 200) {
        setQueryInfo({
          ...queryInfo,
          sqlInfo: sqlInfo + '\n' + result.data
        });
      } else {
        if (result && result?.msg) {
          message.error(result?.msg);
        }
      }
      setAiLoading(false);
    });

  }

  const onDrop = (e: any) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('Text');
    console.log(283, data)
    if (data.startsWith('entity&')) {
      let moduleName = data.split('&')[1];
      let tableName = data.split('&')[2];
      const tmpModule = _.filter(modules, { 'name': moduleName });
      console.log(283, tmpModule);
      const table = _.filter(tmpModule[0]?.entities, { 'title': tableName });
      console.log(283, table);
      const map = _.map(table[0]?.fields, 'name');
      console.log(283, map);
      const fields = map?.join(",");
      console.log(283, fields);
      const template = '{tableName}({fields})';
      // @ts-ignore
      const aiKey = template.render({
        tableName,
        fields
      });
      console.log(283, aiKey);
      if (_.includes(selectedTable, aiKey)) {
        message.warning(`表「${tableName}」已经添加！`);
        return;
      }
      if (selectedTable.length >= 10) {
        message.warning('最多只能同时分析10张表！');
        return;
      }
      // @ts-ignore
      setSelectedTable([...selectedTable, aiKey]);
      message.success('添加成功');
    } else {
      message.error('移动无效,该内容不是数据表，无法参与AI分析！')
    }
  };

  const onDragOver = (e: any) => {
    e.preventDefault();
  };


  const selectBefore = (
    <Select defaultValue="select" onChange={(value) => setPrefix(value)}>
      <Option value="select">查询</Option>
      <Option value="delete">删除</Option>
      <Option value="insert">插入</Option>
      <Option value="update">修改</Option>
      <Option value="alter">改表</Option>
      <Option value="create">建表</Option>
      <Option value="drop">删表</Option>
      <Option value="truncate">快删</Option>
    </Select>
  );

  const { tabs: tableTabs = [], selectTabId: activeKey, dispatch: tabDispatch } = useTabStore(state => ({
    tabs: state.tableTabs,
    selectTabId: state.selectTabId,
    dispatch: state.dispatch,
  }), shallow);

  const handleTabChange = useCallback((key: string) => {
    const [module, entity] = key.split('###');
    tabDispatch.activeTab({ module, entity });
  }, [tabDispatch]);

  const handleTabEdit = useCallback((targetKey: any, action: 'add' | 'remove') => {
    if (action === 'remove') {
      tabDispatch.removeTab(targetKey);
    }
  }, [tabDispatch]);

  const handleSelectQuery = useCallback((selectedKeys: React.Key[], info: any) => {
    if (info.node.isLeaf) {
      setSelectedNode(info.node);
      setSelectedNodeKey(info.node.key as string);
      queryDispatch.fetchQueryInfo(info.node.key).then(r => {
        if (r.code === 200) {
          setQueryInfo(r.data);
          const newTab = {
            module: 'dataQuery',
            entity: info.node.title,
            key: info.node.key,
          };
          tabDispatch.addTab(newTab);
          tabDispatch.activeTab(newTab);
        }
      });
    } else {
      setSelectedNode(null);
      setSelectedNodeKey(null);
    }
  }, [queryDispatch, tabDispatch]);

  const handleTreeSearch = (value: string) => {
    queryDispatch.setQuerySearchKey(value);
    queryDispatch.fetchTreeData({});
  };

  // 添加这个新函数
  const renderTreeSelectNodes = (nodes: DataNode[]): any[] => {
    return nodes.map(node => ({
      title: node.title,
      value: node.key,
      key: node.key,
      children: node.children ? renderTreeSelectNodes(node.children) : undefined,
      disabled: node.isLeaf // 如果是叶子节点，则禁用选择
    }));
  };

  const renderTreeActions = (node: DataNode) => {
    const hasProjectId = 'projectId' in node && node.projectId != null && node.projectId !== '';

    if (!hasProjectId) {
      return (
        <Dropdown
          menu={{
            items: [
              ...(!node.isLeaf ? [{
                key: 'add',
                label: '添加子项',
                icon: <PlusOutlined />,
                onClick: () => showModal('add', node)
              }] : []),
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => showModal('edit', node)
              },
              {
                key: 'delete',
                label: '删除',
                icon: <DeleteOutlined />,
                onClick: () => handleDelete(node)
              }
            ]
          }}
          trigger={['hover']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            onClick={(e) => e.stopPropagation()}
            style={{ visibility: 'visible', marginLeft: 'auto' }}
            className="tree-node-action"
          />
        </Dropdown>
      );
    }
    return null;
  };

  const renderTabContent = useCallback((moduleEntity: ModuleEntity) => {
    return (
      <Content >
        <Search
          placeholder={getPlaceholder(prefix)}
          enterButton
          addonBefore={selectBefore}
          onSearch={(value) => {
            aiSearch(value)
          }}
          style={{ paddingLeft: 12, paddingRight: 12 }}
        />
        <ProCard
          size={'small'}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ProCard layout="center" bordered size={'small'}
            style={{ height: '100%' }}
            bodyStyle={{ height: 'calc(100% - 56px)' }}
            headStyle={{ minHeight: 'auto' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>SQL查询</span>
                {operationButtons}
              </div>
            }
            extra={dataSourceOptions}>
            <CodeEditor
              tables={tables}
              onRef={editorRef}
              height="250px"
              mode={sqlMode}
              theme={theme}
              value={queryInfo?.sqlInfo || ''}
              onChange={(value) => {
                setQueryInfo({
                  ...queryInfo,
                  sqlInfo: value
                });
              }}
            />
          </ProCard>
        </ProCard>
        <ProCard size={'small'}>
          <ProCard size={'small'} layout="center" bordered
            wrap={true}
            tabs={{
              activeKey: tab,
              items: [
                {
                  label: <span><Data theme="filled" size="13" fill="#DE2910" strokeWidth={2} /> 执行结果</span>,
                  key: 'result',
                  children: <QueryResult tableResult={tableResult} onPageChange={handlePageChange} />,
                },
                {
                  label: <span><Plan theme="filled" size="13" fill="#DE2910" strokeWidth={2} strokeLinejoin="miter" /> 执行计划</span>,
                  key: 'plan',
                  children: <ExplainResult tableResult={explainTable} />,
                },
                {
                  label: <span><HistoryQuery theme="filled" size="13" fill="#DE2910" strokeWidth={2} /> 历史记录</span>,
                  key: 'history',
                  children: <QueryHistory queryId={selectedNodeKey} key={tab} />,
                },
              ],
              onChange: (key) => {
                setTab(key);
              },
            }}
          >
            Auto
          </ProCard>
          <Modal
            title="已选中元数据"
            visible={open}
            onCancel={handleClose}
            footer={[
              <Button key="clear" onClick={handleClear}>
                清空
              </Button>,
              <Button key="back" onClick={handleClose}>
                返回
              </Button>,
            ]}
          >
            <List
              className="demo-loadmore-list"
              itemLayout="horizontal"
              dataSource={selectedTable}
              renderItem={(item, index) => (
                <List.Item
                  actions={[<a key={"delete" + index} onClick={() => {
                    let tmp = [...selectedTable];
                    _.pull(tmp, item);
                    console.log(283, tmp);
                    setSelectedTable(tmp);
                  }}>删除</a>]}
                >
                  <Text
                    style={{ width: 200 }}
                    ellipsis
                  >
                    {item}
                  </Text>
                </List.Item>
              )}
            />
          </Modal>
        </ProCard>
      </Content>
    );
  }, [prefix, aiLoading, operationButtons, dataSourceOptions, tables, editorRef, sqlMode, theme, queryInfo, tableResult, explainTable, selectedNodeKey, tab, selectedTable, open, handleClear, handleClose]);

  const renderWelcomePage = () => (
    <Empty
      image={<FileSearchOutlined style={{ fontSize: 60 }} />}
      imageStyle={{ height: 60 }}
      description={
        <span>
          欢迎使用数据查询功能
          <br />
          请从左侧选择一个查询或新建查询开始
        </span>
      }
    >
      <Button type="primary" onClick={() => showModal('add')}>
        新建查询
      </Button>
    </Empty>
  );

  return (
    <>
      <ProCard
      >
        <Layout style={{ minHeight: '100vh' }}>
          <Sider
            collapsible
            collapsed={siderCollapsed}
            onCollapse={setSiderCollapsed}
            theme="light"
            width={300}
          >
            <QueryTree
              treeData={treeData}
              onSelect={handleSelectQuery}
              onSearch={handleTreeSearch}
              onAdd={() => showModal('add')}
              renderActions={renderTreeActions}
              renderExtraIcons={renderExtraIcons}
              renderIcon={renderIcon}
            />
          </Sider>
          <Layout>
            {tableTabs.length > 0 ? (
              <CommonTabs
                tabs={tableTabs}
                activeKey={activeKey}
                onTabChange={(key) => {
                  const [module, entity] = key.split('###');
                  tabDispatch.activeTab({ module, entity });
                }}
                onTabEdit={handleTabEdit}
                renderTabContent={renderTabContent}
              />
            ) : (
              renderWelcomePage()
            )}
          </Layout>
        </Layout>
      </ProCard>
      <Modal
        title={modalType === 'add' ? '新建查询' : '编辑查询'}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="查询名称"
            rules={[{ required: true, message: '请输入查询名称！' }]}
          >
            <Input placeholder="输入描述性的查名称" />
          </Form.Item>
          {modalType === 'add' && (
            <>
              <Form.Item
                name="parentId"
                label="所属文件夹"
                rules={[{ required: true, message: '请选择所属文件夹！' }]}
              >
                <TreeSelect
                  treeData={[{ title: '根目录', key: '0', value: '0' }, ...renderTreeSelectNodes(treeData)]}
                  treeDefaultExpandAll
                  placeholder="选择所属文件夹"
                />
              </Form.Item>
              <Form.Item
                name="type"
                label="查询类型"
                rules={[{ required: true, message: '请选择查询类型！' }]}
                initialValue="sql"
              >
                <Select placeholder="选择查询类型">
                  <Select.Option value="sql">SQL 查询</Select.Option>
                  <Select.Option value="stored_procedure">存储过程</Select.Option>
                  <Select.Option value="report">报表查询</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
          <Form.Item
            name="isLeaf"
            valuePropName="checked"
          >
            <Checkbox>是叶子节点</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(DataQuery)
