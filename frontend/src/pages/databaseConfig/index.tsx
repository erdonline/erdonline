import { DEL, PAGE } from '@/services/crud';
import { generateJdbcUrl, getDriverClassName, pingDatabase } from '@/utils/databaseUtils';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-layout';
import { Badge, Button, Card, Drawer, message, Modal, Space, Tooltip, Typography } from 'antd';
import React, { useRef, useState } from 'react';
import DatabaseConfigForm from './DatabaseConfigForm';

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
  status: 'online' | 'offline' | 'error';
  createTime: string;
  updateTime: string;
}

const DatabaseConfigPage: React.FC = () => {
  const actionRef = useRef();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DatabaseConfigItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

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
            actionRef.current?.reload();
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
            actionRef.current?.reload();
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
    try {
      const pingParams = {
        driverClassName: getDriverClassName(record.type),
        url:
          record.url || generateJdbcUrl(record.type, record.host, record.port, record.databaseName),
        username: record.username,
        password: record.password,
      };

      const success = await pingDatabase(pingParams);

      if (success) {
        message.success('连接状态已更新');
        actionRef.current?.reload();
      } else {
        message.error('更新连接状态失败');
      }
    } catch (error) {
      console.error('同步状态出错:', error);
      message.error('同步状态出错，请稍后重试');
    }
  };

  const columns = [
    {
      title: '连接名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Link>{text}</Link>,
      search: true,
    },
    {
      title: '数据库类型',
      dataIndex: 'type',
      key: 'type',
      valueType: 'select',
      valueEnum: {
        MySQL: { text: 'MySQL' },
        PostgreSQL: { text: 'PostgreSQL' },
        Oracle: { text: 'Oracle' },
        SQLServer: { text: 'SQL Server' },
      },
      filters: true,
      filterMultiple: false,
      search: true,
    },
    {
      title: '主机',
      dataIndex: 'host',
      key: 'host',
      search: true,
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
      search: true,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      search: true,
    },
    {
      title: '数据库',
      dataIndex: 'databaseName',
      key: 'databaseName',
      search: true,
    },
    {
      title: '驱动类名',
      dataIndex: 'driverClassName',
      key: 'driverClassName',
      search: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      valueEnum: {
        online: { text: '在线', status: 'Success' },
        offline: { text: '离线', status: 'Default' },
        error: { text: '错误', status: 'Error' },
      },
      render: (_, record) => (
        <Badge
          status={
            record.status === 'online'
              ? 'success'
              : record.status === 'offline'
              ? 'default'
              : 'error'
          }
          text={record.status === 'online' ? '在线' : record.status === 'offline' ? '离线' : '错误'}
        />
      ),
      search: false,
    },
    {
      title: '操作',
      key: 'action',
      search: false,
      render: (_, record: DatabaseConfigItem) => (
        <Space size="middle">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
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
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
          <Tooltip title="同步状态">
            <Button type="link" icon={<SyncOutlined />} onClick={() => handleSyncStatus(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={
        <Space>
          数据库连接管理
        </Space>
      }
      subTitle="管理和监控您的所有数据库连接"
    >
      <Card>
        <ProTable<DatabaseConfigItem>
          headerTitle="数据库连接列表"
          actionRef={actionRef}
          rowKey="id"
          search={{
            labelWidth: 'auto',
          }}
          toolBarRender={() => [
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRecord(null);
                setDrawerVisible(true);
              }}
            >
              新建连接
            </Button>,
            <Button
              key="batchDelete"
              danger
              disabled={selectedRowKeys.length === 0}
              onClick={handleBatchDelete}
            >
              批量删除
            </Button>,
          ]}
          request={async (params, sorter) => {
            const { current, pageSize, ...restParams } = params;
            const res = await PAGE(
              DATABASE_CONFIG_URL,
              {
                current,
                size: pageSize,
                ...restParams,
              },
              sorter,
            );
            if (res.code === 200 && res.data) {
              // 对每个记录进行状态同步
              const updatedRecords = await Promise.all(
                res.data.records.map(async (record) => {
                  try {
                    const pingParams = {
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
                      status: success ? 'online' : 'error',
                    };
                  } catch (error) {
                    console.error('Ping error:', error);
                    return {
                      ...record,
                      status: 'error',
                    };
                  }
                }),
              );

              return {
                data: updatedRecords,
                success: true,
                total: res.data.total,
              };
            }
            message.error('获取数据库配置信息失败');
            return { data: [], success: false };
          }}
          columns={columns}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            pageSize: 10,
          }}
          dateFormatter="string"
        />
      </Card>
      <Drawer
        title={editingRecord ? '编辑数据库连接' : '新建数据库连接'}
        placement="right"
        width={600}
        onClose={() => {
          setDrawerVisible(false);
          setEditingRecord(null);
        }}
        visible={drawerVisible}
      >
        <DatabaseConfigForm
          initialValues={editingRecord}
          onFinish={() => {
            setDrawerVisible(false);
            setEditingRecord(null);
            actionRef.current?.reload();
          }}
        />
      </Drawer>
    </PageContainer>
  );
};

export default DatabaseConfigPage;
