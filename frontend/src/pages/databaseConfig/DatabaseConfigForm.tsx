import { ADD, EDIT } from '@/services/crud';
import { generateJdbcUrl, getDriverClassName, pingDatabase } from '@/utils/databaseUtils';
import { LinkOutlined, QuestionCircleOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Button,
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
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useIntl } from '@@/exports';

const { Option } = Select;

const DATABASE_CONFIG_URL = '/ncnb/dataSources';

interface DatabaseConfigFormProps {
  initialValues?: Record<string, unknown> & { id?: string; connectionType?: string };
  onFinish: () => void;
}

const DatabaseConfigForm: React.FC<DatabaseConfigFormProps> = ({ initialValues, onFinish }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [connectionType, setConnectionType] = useState(initialValues?.connectionType || 'host');
  const [testing, setTesting] = useState(false);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const action = initialValues ? EDIT : ADD;
    const url = initialValues ? `${DATABASE_CONFIG_URL}/${initialValues.id}` : DATABASE_CONFIG_URL;
    const res = await action(url, values);
    if (res.code === 200) {
      message.success(
        intl.formatMessage({
          id: initialValues ? 'datasource.form.success.update' : 'datasource.form.success.add',
        }),
      );
      onFinish();
    } else {
      message.error(
        intl.formatMessage({
          id: initialValues ? 'datasource.form.error.update' : 'datasource.form.error.add',
        }),
      );
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
        message.success(intl.formatMessage({ id: 'datasource.form.test.success' }));
      } else {
        message.error(intl.formatMessage({ id: 'datasource.form.test.failed' }));
      }
    } catch (error) {
      console.error('Connection test error:', error);
      message.error(intl.formatMessage({ id: 'datasource.form.validation.failed' }));
    } finally {
      setTesting(false);
    }
  };

  const dbTypeMap: Record<string, string> = {
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    oracle: 'Oracle',
    sqlserver: 'SQLServer',
  };

  const getDefaultPort = (dbType: string) => {
    const defaultPorts: Record<string, string> = {
      mysql: '3306',
      postgresql: '5432',
      oracle: '1521',
      sqlserver: '1433',
    };
    return defaultPorts[dbType.toLowerCase()] || '';
  };

  const parseUrl = (url: string) => {
    try {
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
    <Form
      form={form}
      layout="vertical"
      size="small"
      className="database-config-form"
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
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name="name"
            label={
              <Space size={4}>
                {intl.formatMessage({ id: 'datasource.form.name.label' })}
                <Tooltip title={intl.formatMessage({ id: 'datasource.form.name.tooltip' })}>
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'datasource.form.name.required' }),
              },
            ]}
          >
            <Input
              id="database-config-name"
              placeholder={intl.formatMessage({ id: 'datasource.form.name.placeholder' })}
              aria-label={intl.formatMessage({ id: 'datasource.form.name.ariaLabel' })}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="type"
            label={intl.formatMessage({ id: 'datasource.form.type.label' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'datasource.form.type.required' }),
              },
            ]}
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

      <Form.Item
        name="connectionType"
        label={intl.formatMessage({ id: 'datasource.form.connectionType.label' })}
        initialValue="host"
      >
        <Radio.Group onChange={(e) => setConnectionType(e.target.value)}>
          <Radio value="host">
            {intl.formatMessage({ id: 'datasource.form.connectionType.host' })}
          </Radio>
          <Radio value="url">URL</Radio>
        </Radio.Group>
      </Form.Item>

      {connectionType === 'url' ? (
        <Form.Item
          name="url"
          label="URL"
          rules={[
            {
              required: true,
              message: intl.formatMessage({ id: 'datasource.form.url.required' }),
            },
          ]}
          extra={intl.formatMessage({ id: 'datasource.form.url.extra' })}
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
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="host"
                label={intl.formatMessage({ id: 'datasource.form.host.label' })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({ id: 'datasource.form.host.required' }),
                  },
                ]}
              >
                <Input placeholder={intl.formatMessage({ id: 'datasource.form.host.placeholder' })} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="port"
                label={intl.formatMessage({ id: 'datasource.form.port.label' })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({ id: 'datasource.form.port.required' }),
                  },
                ]}
              >
                <Input
                  type="number"
                  placeholder={intl.formatMessage({ id: 'datasource.form.port.placeholder' })}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="databaseName"
            label={intl.formatMessage({ id: 'datasource.form.databaseName.label' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'datasource.form.databaseName.required' }),
              },
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: 'datasource.form.databaseName.placeholder' })} />
          </Form.Item>
        </>
      )}

      <Form.Item
        name="driverClassName"
        label={
          <Space size={4}>
            {intl.formatMessage({ id: 'datasource.form.driver.label' })}
            <Tooltip title={intl.formatMessage({ id: 'datasource.form.driver.tooltip' })}>
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
        }
        rules={[
          {
            required: true,
            message: intl.formatMessage({ id: 'datasource.form.driver.required' }),
          },
        ]}
      >
        <Input placeholder={intl.formatMessage({ id: 'datasource.form.driver.placeholder' })} />
      </Form.Item>

      <Form.Item label={intl.formatMessage({ id: 'datasource.form.auth.label' })}>
        <Input.Group compact>
          <Form.Item
            name="username"
            noStyle
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'datasource.form.username.required' }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({ id: 'datasource.form.username.placeholder' })}
              style={{ width: '50%' }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            noStyle
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'datasource.form.password.required' }),
              },
            ]}
          >
            <Input.Password
              placeholder={intl.formatMessage({ id: 'datasource.form.password.placeholder' })}
              style={{ width: '50%' }}
            />
          </Form.Item>
        </Input.Group>
      </Form.Item>

      <Divider />

      <Form.Item>
        <Space size={8}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            {intl.formatMessage({
              id: initialValues ? 'datasource.form.submit.update' : 'datasource.form.submit.save',
            })}
          </Button>
          <Button
            onClick={testConnection}
            icon={<LinkOutlined />}
            loading={testing}
            aria-label={intl.formatMessage({ id: 'datasource.form.test.ariaLabel' })}
          >
            {intl.formatMessage({ id: 'datasource.form.test.label' })}
          </Button>
          <Button onClick={onFinish}>
            {intl.formatMessage({ id: 'datasource.action.cancel' })}
          </Button>
        </Space>
      </Form.Item>

      <p className="database-config-form__hint">
        {intl.formatMessage({ id: 'datasource.form.hint' })}
      </p>
    </Form>
  );
};

export default DatabaseConfigForm;
