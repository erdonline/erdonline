import { ADD, EDIT } from '@/services/crud';
import { generateJdbcUrl, getDriverClassName, pingDatabase } from '@/utils/databaseUtils';
import { LinkOutlined, QuestionCircleOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  message,
  Radio,
  Row,
  Select,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;
const { Text } = Typography;

const DATABASE_CONFIG_URL = '/ncnb/dataSources';

interface DatabaseConfigFormProps {
  initialValues?: any;
  onFinish: () => void;
}

const DatabaseConfigForm: React.FC<DatabaseConfigFormProps> = ({ initialValues, onFinish }) => {
  const [form] = Form.useForm();
  const [connectionType, setConnectionType] = useState(initialValues?.connectionType || 'host');
  const [testing, setTesting] = useState(false);

  const handleSubmit = async (values: any) => {
    const action = initialValues ? EDIT : ADD;
    const url = initialValues ? `${DATABASE_CONFIG_URL}/${initialValues.id}` : DATABASE_CONFIG_URL;
    const res = await action(url, values);
    if (res.code === 200) {
      message.success(initialValues ? '更新成功' : '添加成功');
      onFinish();
    } else {
      message.error(initialValues ? '更新失败' : '添加失败');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const values = await form.validateFields();
      const pingParams = {
        driverClassName: values.driverClassName,
        url:
          values.url || generateJdbcUrl(values.type, values.host, values.port, values.databaseName),
        username: values.username,
        password: values.password,
      };

      const success = await pingDatabase(pingParams);
      if (success) {
        message.success('连接测试成功');
      } else {
        message.error('连接测试失败');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      message.error('表单验证失败，请检查输入');
    } finally {
      setTesting(false);
    }
  };

  const dbTypeMap: Record<string, string> = {
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    oracle: 'Oracle',
    sqlserver: 'SQLServer',
    // Add more mappings as needed
  };

  const getDefaultPort = (dbType: string) => {
    const defaultPorts: Record<string, string> = {
      mysql: '3306',
      postgresql: '5432',
      oracle: '1521',
      sqlserver: '1433',
      // Add more default ports for other database types as needed
    };
    return defaultPorts[dbType.toLowerCase()] || '';
  };

  const parseUrl = (url: string) => {
    try {
      // General JDBC URL pattern
      const regex = /jdbc:([^:]+):\/\/([^:/]+)(?::(\d+))?(?:\/([^?]+))?/;
      const match = url.match(regex);

      if (match) {
        const [, dbType, host, port, databaseName] = match;
        return {
          type: dbTypeMap[dbType.toLowerCase()] || dbType,
          host,
          port: port || getDefaultPort(dbType),
          databaseName: databaseName || '',
        };
      }
      return null;
    } catch (error) {
      console.error('Invalid URL:', error);
      return null;
    }
  };

  // Update JDBC URL when form values change
  const updateJdbcUrl = () => {
    if (connectionType === 'host') {
      const type = form.getFieldValue('type');
      const host = form.getFieldValue('host');
      const port = form.getFieldValue('port');
      const databaseName = form.getFieldValue('databaseName');

      if (type && host && port && databaseName) {
        const newUrl = generateJdbcUrl(type, host, port, databaseName);
        form.setFieldValue('url', newUrl);
        form.setFieldValue('driverClassName', getDriverClassName(type));
      }
    }
  };

  useEffect(() => {
    if (connectionType === 'url') {
      const url = form.getFieldValue('url');
      if (url) {
        const parsedData = parseUrl(url);
        if (parsedData) {
          form.setFieldsValue(parsedData);
        }
      }
    }
  }, [connectionType, form]);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      updateJdbcUrl();
    }
  }, [initialValues]);

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            connectionType: 'host',
            type: 'MySQL',
            port: 3306,
            ...initialValues,
          }}
          onValuesChange={(changedValues) => {
            if (connectionType === 'host' && !changedValues.url) {
              updateJdbcUrl();
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={
                  <Space>
                    连接名称
                    <Tooltip title="为您的连接起一个易记的名字">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: '请输入连接名称' }]}
              >
                <Input placeholder="例如：生产环境主数据库" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="数据库类型"
                rules={[{ required: true, message: '请选择数据库类型' }]}
              >
                <Select>
                  <Option value="MySQL">MySQL</Option>
                  <Option value="PostgreSQL">PostgreSQL</Option>
                  <Option value="Oracle">Oracle</Option>
                  <Option value="SQLServer">SQL Server</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="connectionType" label="连接方式" initialValue="host">
            <Radio.Group onChange={(e) => setConnectionType(e.target.value)}>
              <Radio value="host">主机</Radio>
              <Radio value="url">URL</Radio>
            </Radio.Group>
          </Form.Item>

          {connectionType === 'url' ? (
            <Form.Item
              name="url"
              label="URL"
              rules={[{ required: true, message: '请输入数据库URL' }]}
              extra="例如：jdbc:mysql://localhost:3306/mydatabase"
            >
              <Input
                placeholder="jdbc:mysql://localhost:3306/mydatabase"
                onChange={(e) => {
                  const parsedData = parseUrl(e.target.value);
                  if (parsedData) {
                    form.setFieldsValue(parsedData);
                  }
                }}
              />
            </Form.Item>
          ) : (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="host"
                    label="主机"
                    rules={[{ required: true, message: '请输入主机地址' }]}
                  >
                    <Input placeholder="例如：localhost 或 192.168.1.1" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="port"
                    label="端口"
                    rules={[{ required: true, message: '请输入端口号' }]}
                  >
                    <Input type="number" placeholder="例如：3306" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="databaseName"
                label="数据库名称"
                rules={[{ required: true, message: '请输入数据库名称' }]}
              >
                <Input placeholder="例如：mydatabase" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="driverClassName"
            label={
              <Space>
                驱动类名
                <Tooltip title="数据库驱动的完整类名">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[{ required: true, message: '请输入驱动类名' }]}
          >
            <Input placeholder="例如：com.mysql.cj.jdbc.Driver" />
          </Form.Item>

          <Form.Item label="认证信息">
            <Input.Group compact>
              <Form.Item
                name="username"
                noStyle
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="用户名" style={{ width: '50%' }} />
              </Form.Item>
              <Form.Item
                name="password"
                noStyle
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="密码" style={{ width: '50%' }} />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {initialValues ? '更新连接' : '保存连接'}
              </Button>
              <Button onClick={testConnection} icon={<LinkOutlined />} loading={testing}>
                测试连接
              </Button>
              <Button onClick={onFinish}>取消</Button>
            </Space>
          </Form.Item>
        </Form>

        <Text type="secondary">
          需要帮助？查看我们的{' '}
          <a href="/docs" target="_blank">
            文档
          </a>{' '}
          或{' '}
          <a href="/support" target="_blank">
            联系支持
          </a>
        </Text>
      </Space>
    </Card>
  );
};

export default DatabaseConfigForm;
