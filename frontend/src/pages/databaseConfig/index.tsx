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
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from '@@/exports';
import {confirmDestructive} from '@/utils/destructiveConfirm';
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
  const intl = useIntl();
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
  /** Drawer 无 focusTriggerAfterClose；关闭后手动归还打开前触发器 */
  const drawerTriggerRef = useRef<HTMLElement | null>(null);

  const resolveStatus = (record: DatabaseConfigItem): ConnectionStatus =>
    statusOverrides[record.id] ?? record.status;

  const openDrawer = (record: DatabaseConfigItem | null) => {
    const active = document.activeElement;
    drawerTriggerRef.current =
      active instanceof HTMLElement ? active : null;
    setEditingRecord(record);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingRecord(null);
  };

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
        message.error(intl.formatMessage({ id: 'datasource.error.loadFailed' }));
        setData([]);
        setTotal(0);
      }
    } catch {
      message.error(intl.formatMessage({ id: 'datasource.error.loadFailed' }));
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [intl]);

  const reload = useCallback(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    pageRef.current = { page, pageSize, keyword };
    void loadData(page, pageSize, keyword);
  }, [page, pageSize, keyword, loadData]);

  const handleDelete = (id: string) => {
    confirmDestructive({
      title: intl.formatMessage({ id: 'datasource.confirm.delete.title' }),
      content: intl.formatMessage({ id: 'datasource.confirm.delete.single' }),
      okText: intl.formatMessage({ id: 'datasource.action.delete' }),
      okType: 'danger',
      cancelText: intl.formatMessage({ id: 'datasource.action.cancel' }),
      onOk: async () => {
        try {
          const res = await DEL(`${DATABASE_CONFIG_URL}/${id}`);
          if (res.code === 200) {
            message.success(intl.formatMessage({ id: 'datasource.success.delete' }));
            reload();
          } else {
            message.error(intl.formatMessage({ id: 'datasource.error.delete' }));
          }
        } catch (error) {
          console.error('删除出错:', error);
          message.error(intl.formatMessage({ id: 'datasource.error.deleteRetry' }));
        }
      },
    });
  };

  const handleBatchDelete = () => {
    confirmDestructive({
      title: intl.formatMessage({ id: 'datasource.confirm.delete.title' }),
      content: intl.formatMessage(
        { id: 'datasource.confirm.delete.batch' },
        { count: selectedRowKeys.length },
      ),
      okText: intl.formatMessage({ id: 'datasource.action.delete' }),
      okType: 'danger',
      cancelText: intl.formatMessage({ id: 'datasource.action.cancel' }),
      onOk: async () => {
        try {
          const res = await DEL(`${DATABASE_CONFIG_URL}/multiple_delete`, {
            keys: selectedRowKeys,
          });
          if (res.code === 200) {
            message.success(
              intl.formatMessage(
                { id: 'datasource.success.batchDelete' },
                { count: selectedRowKeys.length },
              ),
            );
            setSelectedRowKeys([]);
            reload();
          } else {
            message.error(intl.formatMessage({ id: 'datasource.error.batchDelete' }));
          }
        } catch (error) {
          console.error('批量删除出错:', error);
          message.error(intl.formatMessage({ id: 'datasource.error.batchDeleteRetry' }));
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
        message.success(intl.formatMessage({ id: 'datasource.success.syncOnline' }));
      } else {
        message.warning(intl.formatMessage({ id: 'datasource.warning.syncOffline' }));
      }
    } catch (error) {
      console.error('同步状态出错:', error);
      message.error(intl.formatMessage({ id: 'datasource.error.syncRetry' }));
    } finally {
      setSyncingId(null);
    }
  };

  const statusLabel = useCallback(
    (status: ConnectionStatus) => {
      if (status === 'online') {
        return intl.formatMessage({ id: 'datasource.status.online' });
      }
      if (status === 'offline') {
        return intl.formatMessage({ id: 'datasource.status.offline' });
      }
      return intl.formatMessage({ id: 'datasource.status.error' });
    },
    [intl],
  );

  const columns: ColumnsType<DatabaseConfigItem> = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: 'datasource.column.name' }),
        dataIndex: 'name',
        key: 'name',
        render: (text: string, record) => (
          <Link
            onClick={() => openDrawer(record)}
            aria-label={intl.formatMessage(
              { id: 'datasource.aria.editConnection' },
              { name: text },
            )}
          >
            {text}
          </Link>
        ),
      },
      {
        title: intl.formatMessage({ id: 'datasource.column.type' }),
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
        title: intl.formatMessage({ id: 'datasource.column.host' }),
        dataIndex: 'host',
        key: 'host',
      },
      {
        title: intl.formatMessage({ id: 'datasource.column.port' }),
        dataIndex: 'port',
        key: 'port',
      },
      {
        title: intl.formatMessage({ id: 'datasource.column.username' }),
        dataIndex: 'username',
        key: 'username',
      },
      {
        title: intl.formatMessage({ id: 'datasource.column.database' }),
        dataIndex: 'databaseName',
        key: 'databaseName',
      },
      {
        title: intl.formatMessage({ id: 'datasource.column.driver' }),
        dataIndex: 'driverClassName',
        key: 'driverClassName',
        ellipsis: true,
      },
      {
        title: intl.formatMessage({ id: 'datasource.column.status' }),
        dataIndex: 'status',
        key: 'status',
        render: (_status, record) => {
          const status = resolveStatus(record);
          return (
            <Badge
              status={status === 'online' ? 'success' : status === 'offline' ? 'default' : 'error'}
              text={statusLabel(status)}
            />
          );
        },
      },
      {
        title: intl.formatMessage({ id: 'datasource.column.actions' }),
        key: 'action',
        render: (_text, record) => (
          <Space size={4}>
            <Tooltip title={intl.formatMessage({ id: 'datasource.action.edit' })}>
              <Button
                type="link"
                icon={<EditOutlined />}
                aria-label={intl.formatMessage({ id: 'datasource.action.edit' })}
                onClick={() => openDrawer(record)}
              />
            </Tooltip>
            <Tooltip title={intl.formatMessage({ id: 'datasource.action.delete' })}>
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                aria-label={intl.formatMessage(
                  { id: 'datasource.aria.deleteConnection' },
                  { name: record.name },
                )}
                onClick={() => handleDelete(record.id)}
              />
            </Tooltip>
            <Tooltip title={intl.formatMessage({ id: 'datasource.action.syncStatus' })}>
              <Button
                type="link"
                icon={<SyncOutlined spin={syncingId === record.id} />}
                aria-label={intl.formatMessage({ id: 'datasource.action.syncStatus' })}
                loading={syncingId === record.id}
                disabled={syncingId !== null && syncingId !== record.id}
                onClick={() => handleSyncStatus(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [intl, syncingId, statusLabel],
  );

  const onTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  return (
    <div className="database-config-page" data-testid="database-config-page">
      <h2 className="database-config-page__title">
        {intl.formatMessage({ id: 'datasource.page.title' })}
      </h2>
      <p className="database-config-page__hint">
        {intl.formatMessage({ id: 'datasource.page.hint' })}
      </p>
      <div className="database-config-page__sheet">
        <div className="database-config-page__toolbar">
          <p className="database-config-page__toolbar-title">
            {intl.formatMessage({ id: 'datasource.list.title' })}
          </p>
          <Space size={8} wrap>
            <Input.Search
              allowClear
              size="small"
              placeholder={intl.formatMessage({ id: 'datasource.search.placeholder' })}
              aria-label={intl.formatMessage({ id: 'datasource.search.ariaLabel' })}
              onSearch={(value) => {
                setPage(1);
                setKeyword(value);
              }}
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => openDrawer(null)}
            >
              {intl.formatMessage({ id: 'datasource.action.new' })}
            </Button>
            <Button
              danger
              size="small"
              disabled={selectedRowKeys.length === 0}
              onClick={handleBatchDelete}
            >
              {intl.formatMessage({ id: 'datasource.action.batchDelete' })}
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
        rootClassName="database-config-drawer-root"
        title={intl.formatMessage({
          id: editingRecord ? 'datasource.drawer.edit' : 'datasource.drawer.new',
        })}
        placement="right"
        width={520}
        onClose={closeDrawer}
        open={drawerVisible}
        destroyOnClose
        keyboard
        autoFocus={false}
        afterOpenChange={(open) => {
          if (open) {
            const tryFocus = (attempt = 0) => {
              const input = document.getElementById(
                'database-config-name',
              ) as HTMLInputElement | null;
              if (input) {
                input.focus();
                return;
              }
              if (attempt >= 20) {
                return;
              }
              window.setTimeout(() => tryFocus(attempt + 1), 50);
            };
            window.setTimeout(() => tryFocus(), 0);
            return;
          }
          const trigger = drawerTriggerRef.current;
          drawerTriggerRef.current = null;
          if (trigger && document.contains(trigger)) {
            trigger.focus();
          }
        }}
      >
        <DatabaseConfigForm
          initialValues={editingRecord}
          onFinish={() => {
            closeDrawer();
            reload();
          }}
        />
      </Drawer>
    </div>
  );
};

export default DatabaseConfigPage;
