import { DEL, PAGE } from '@/services/crud';
import { generateJdbcUrl, getDriverClassName, pingDatabase } from '@/utils/databaseUtils';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Drawer,
  Input,
  Space,
  Table,
  Tooltip,
  Typography,
  message,
  Modal,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import DatabaseConfigForm from './DatabaseConfigForm';
import './database-config.scss';

const { Link } = Typography;

const DATABASE_CONFIG_URL = '/ncnb/dataSources';

interface DatabaseConfigItem {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  url: string;
  username: string;
  password: string;
  databaseName: string;
  driverClassName?: string;
  status: 'online' | 'offline' | 'error';
  createTime: string;
  updateTime: string;
}

type ConnectionStatus = 'online' | 'offline' | 'error';

const DatabaseConfigPage: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DatabaseConfigItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ConnectionStatus>>({});
  const [data, setData] = useState<DatabaseConfigItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const pageRef = useRef({ page: 1, pageSize: 10, keyword: '' });

  const resolveStatus = (record: DatabaseConfigItem): ConnectionStatus =>
    statusOverrides[record.id] ?? record.status;

  const loadData = useCallback(async (nextPage?: number, nextSize?: number, nextKeyword?: string) => {
    const p = nextPage ?? pageRef.current.page;
    const size = nextSize ?? pageRef.current.pageSize;
    const name = (nextKeyword ?? pageRef.current.keyword).trim();
    setLoading(true);
    try {
      // PAGE 第三参 sorter；params 需同时带 pageSize/size（与旧 ProTable request 对齐）
      const res = await PAGE(
        DATABASE_CONFIG_URL,
        {
          current: p,
          pageSize: size,
          size,
          ...(name ? { name } : {}),
        },
        {},
      );
      if (res?.code === 200 && res.data) {
        const updatedRecords = await Promise.all(
          (res.data.records || []).map(async (record: DatabaseConfigItem) => {
            try {
              const pingParams = record.id
                ? {dataSourceId: record.id}
                : {
                    driverClassName: getDriverClassName(record.type),
                    url:
                      record.url ||
                      generateJdbcUrl(record.type, record.host, record.port, record.databaseName),
                    username: record.username,
                    password: record.password,
                  };
              const success = await pingDatabase(pingParams);
              return {
                ...record,
                status: (success ? 'online' : 'error') as ConnectionStatus,
              };
            } catch (error) {
              console.error('Ping error:', error);
              return {
                ...record,
                status: 'error' as ConnectionStatus,
              };
            }
          }),
        );
        setData(updatedRecords);
        setTotal(res.data.total);
      } else {
        message.error('获取数据库配置信息失败');
        setData([]);
        setTotal(0);
      }
    } catch {
      message.error('获取数据库配置信息失败');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    pageRef.current = { page, pageSize, keyword };
    void loadData(page, pageSize, keyword);
  }, [page, pageSize, keyword, loadData]);

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这个数据库连接吗？此操作不可逆。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await DEL(`${DATABASE_CONFIG_URL}/${id}`);
          if (res.code === 200) {
            message.success('删除成功');
            reload();
          } else {
            message.error('删除失败');
          }
        } catch (error) {
          console.error('删除出错:', error);
          message.error('删除出错，请稍后重试');
        }
      },
    });
  };

  const handleBatchDelete = async () => {
    Modal.confirm({
      title: '确认删除',
      content: `您确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      onOk: async () => {
        try {
          const res = await DEL(`${DATABASE_CONFIG_URL}/multiple_delete`, {
            keys: selectedRowKeys,
          });
          if (res.code === 200) {
            message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
            setSelectedRowKeys([]);
            reload();
          } else {
            message.error('批量删除失败');
          }
        } catch (error) {
          console.error('批量删除出错:', error);
          message.error('批量删除出错，请稍后重试');
        }
      },
    });
  };

  const handleSyncStatus = async (record: DatabaseConfigItem) => {
    if (syncingId) {
      return;
    }
    setSyncingId(record.id);
    try {
      const pingParams = record.id
        ? {dataSourceId: record.id}
        : {
            driverClassName: getDriverClassName(record.type) || record.driverClassName,
            url:
              record.url ||
              generateJdbcUrl(record.type, record.host, record.port, record.databaseName),
            username: record.username,
            password: record.password,
          };

      const success = await pingDatabase(pingParams);
      const nextStatus: ConnectionStatus = success ? 'online' : 'error';
      setStatusOverrides((prev) => ({ ...prev, [record.id]: nextStatus }));
      if (success) {
        message.success('连接在线，状态已更新');
      } else {
        message.warning('连接不可达，状态已更新为错误');
      }
    } catch (error) {
      console.error('同步状态出错:', error);
      message.error('同步状态出错，请稍后重试');
    } finally {
      setSyncingId(null);
    }
  };

  const columns: ColumnsType<DatabaseConfigItem> = [
    {
      title: '连接名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record) => (
        <Link
          onClick={() => {
            setEditingRecord(record);
            setDrawerVisible(true);
          }}
          aria-label={`编辑连接 ${text}`}
        >
          {text}
        </Link>
      ),
    },
    {
      title: '数据库类型',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'MySQL', value: 'MySQL' },
        { text: 'PostgreSQL', value: 'PostgreSQL' },
        { text: 'Oracle', value: 'Oracle' },
        { text: 'SQL Server', value: 'SQLServer' },
      ],
      filterMultiple: false,
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '主机',
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '数据库',
      dataIndex: 'databaseName',
      key: 'databaseName',
    },
    {
      title: '驱动类名',
      dataIndex: 'driverClassName',
      key: 'driverClassName',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (_status, record) => {
        const status = resolveStatus(record);
        return (
          <Badge
            status={status === 'online' ? 'success' : status === 'offline' ? 'default' : 'error'}
            text={status === 'online' ? '在线' : status === 'offline' ? '离线' : '错误'}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_text, record) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              aria-label="编辑"
              onClick={() => {
                setEditingRecord(record);
                setDrawerVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              aria-label="删除"
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
          <Tooltip title="同步状态">
            <Button
              type="link"
              icon={<SyncOutlined spin={syncingId === record.id} />}
              aria-label="同步状态"
              loading={syncingId === record.id}
              disabled={syncingId !== null && syncingId !== record.id}
              onClick={() => handleSyncStatus(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const onTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  return (
    <div className="database-config-page" data-testid="database-config-page">
      <h2 className="database-config-page__title">数据库连接管理</h2>
      <p className="database-config-page__hint">管理和监控您的所有数据库连接</p>
      <div className="database-config-page__sheet">
        <div className="database-config-page__toolbar">
          <p className="database-config-page__toolbar-title">数据库连接列表</p>
          <Space size={8} wrap>
            <Input.Search
              allowClear
              size="small"
              placeholder="搜索连接名称"
              aria-label="搜索连接名称"
              onSearch={(value) => {
                setPage(1);
                setKeyword(value);
              }}
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRecord(null);
                setDrawerVisible(true);
              }}
            >
              新建连接
            </Button>
            <Button
              danger
              size="small"
              disabled={selectedRowKeys.length === 0}
              onClick={handleBatchDelete}
            >
              批量删除
            </Button>
          </Space>
        </div>
        <Table<DatabaseConfigItem>
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={data}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            size: 'small',
          }}
          onChange={onTableChange}
        />
      </div>
      <Drawer
        className="database-config-drawer"
        title={editingRecord ? '编辑数据库连接' : '新建数据库连接'}
        placement="right"
        width={520}
        onClose={() => {
          setDrawerVisible(false);
          setEditingRecord(null);
        }}
        open={drawerVisible}
        destroyOnClose
      >
        <DatabaseConfigForm
          initialValues={editingRecord}
          onFinish={() => {
            setDrawerVisible(false);
            setEditingRecord(null);
            reload();
          }}
        />
      </Drawer>
    </div>
  );
};

export default DatabaseConfigPage;
