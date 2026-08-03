import React, {useContext, useEffect, useRef, useState} from 'react';
import {DeleteOutlined, ExclamationCircleOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Col, Form, Input, Modal, Radio, Row, Select, Space, message} from 'antd';
import _ from 'lodash';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import {uuid} from '@/utils/uuid';
import * as Save from '@/utils/save';
import {confirmDestructive} from '@/utils/destructiveConfirm';
import {ProjectMenuCloseContext} from '@/components/Menu/projectMenuClose';
import type {MenuDialogControl} from '@/components/Menu/menuDialog';
import '../io-modal.scss';

export type DatabaseSetUpProps = {
  isGlobal?: boolean;
} & MenuDialogControl;

type DbProperties = {
  driver_class_name?: string;
  url?: string;
  username?: string;
  password?: string;
};

type DataSourceRow = {
  key: string;
  name?: string;
  select?: string;
  defaultDB?: boolean;
  properties?: DbProperties;
};

type DialectRow = {
  code?: string;
  defaultDatabase?: boolean;
};

type FormValues = DbProperties & {
  dbs?: DataSourceRow[];
};

const URL_TEMPLATES: Record<string, {url: string; driver_class_name: string}> = {
  mysql: {
    url: 'jdbc:mysql://IP地址:端口号/数据库名?characterEncoding=UTF-8&useSSL=false&useUnicode=true&serverTimezone=UTC',
    driver_class_name: 'com.mysql.jdbc.Driver',
  },
  oracle: {
    url: 'jdbc:oracle:thin:@IP地址:端口号/数据库名',
    driver_class_name: 'oracle.jdbc.driver.OracleDriver',
  },
  sqlserver: {
    url: 'jdbc:sqlserver://IP地址:端口号;DatabaseName=数据库名',
    driver_class_name: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
  },
  postgresql: {
    url: 'jdbc:postgresql://IP地址:端口号/数据库名',
    driver_class_name: 'org.postgresql.Driver',
  },
};

/** 设计器菜单「数据源设置」：读写 /ncnb/dataSources（ADR-0008），不写 profile.dbs */
const DatabaseSetUp: React.FC<DatabaseSetUpProps> = ({
  hideTrigger,
  open: openProp,
  onOpenChange,
}) => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch, dialects} = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      dialects: (state.project?.projectJSON?.dataTypeDomains?.database || []) as DialectRow[],
    }),
    shallow,
  );

  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) {
      setInnerOpen(v);
    }
    onOpenChange?.(v);
  };
  const [databases, setDatabases] = useState<DataSourceRow[]>([]);
  const [pingLoading, setPingLoading] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const addBtnRef = useRef<React.ElementRef<typeof Button>>(null);

  const reload = async () => {
    const list = (await projectDispatch.refreshDataSources()) as DataSourceRow[] | undefined;
    setDatabases(list || []);
  };

  useEffect(() => {
    reload();
  }, []);

  const defaultDatabase =
    _.find(dialects, {defaultDatabase: true})?.code || dialects[0]?.code || 'MYSQL';
  const defaultDBData = URL_TEMPLATES[defaultDatabase.toLowerCase()] || URL_TEMPLATES.mysql;

  const defaultDbs = databases.find((d) => d.defaultDB) || databases[0];
  const defaultDB = databases.find((d) => d.defaultDB);

  useEffect(() => {
    form.setFieldsValue({
      ...(defaultDbs?.properties || {}),
      dbs: databases,
    });
  }, [databases, defaultDbs, form]);

  const connectJDBC = () => {
    form.validateFields().then(() => {
      const {properties} = defaultDbs || {};
      setPingLoading(true);
      Save.ping({
        ...properties,
      })
        .then((res: {code?: number; msg?: string}) => {
          if (res.code !== 200) {
            message.error('连接失败:' + res.msg);
          } else {
            message.success('连接成功');
          }
        })
        .catch(() => {
          message.error('连接失败！');
        })
        .finally(() => {
          setPingLoading(false);
        });
    });
  };

  const dialectOptions = dialects.map((d) => ({
    label: d.code,
    value: d.code,
  }));

  const addDatabase = async (data: DataSourceRow) => {
    await projectDispatch.addDbs(data);
    await reload();
  };

  const removeDatabase = async (key: string) => {
    await projectDispatch.removeDbs(key);
    await reload();
  };

  const updateDatabase = async (key: string, data: DataSourceRow) => {
    if (data?.defaultDB) {
      projectDispatch.setDefaultDb(key);
    }
    await projectDispatch.updateDbs(key, data);
    await reload();
  };

  useEffect(() => {
    if (open) {
      void reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openModal = () => {
    closeProjectMenu();
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
  };

  const listLabel = defaultDB
    ? ` 当前使用的数据源为「${defaultDB.name}」`
    : databases.length > 0
      ? ' 当前未选择默认数据源'
      : '当前未创建数据源';

  return (
    <>
      {hideTrigger ? null : (
        <Button
          key="db"
          type="text"
          size="small"
          block
          style={{textAlign: 'left'}}
          aria-label="数据源设置"
          onClick={openModal}
        >
          数据源设置
        </Button>
      )}
      <Modal
        title="数据源连接配置"
        open={open}
        onCancel={closeModal}
        destroyOnClose
        width={880}
        className="erd-io-modal"
        rootClassName="erd-io-modal-root"
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => addBtnRef.current?.focus(), 0);
        }}
        footer={[
          <Button
            disabled={!defaultDbs}
            key="test"
            size="small"
            loading={pingLoading}
            onClick={() => connectJDBC()}
          >
            {pingLoading ? '正在连接' : '测试'}
          </Button>,
          <Button
            type="primary"
            key="submit"
            size="small"
            onClick={() => {
              message.success('保存成功！');
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" size="small" preserve={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label={listLabel}>
                <Form.List name="dbs">
                  {(fields) => (
                    <>
                      {fields.map((field) => {
                        const record =
                          (form.getFieldValue(['dbs', field.name]) as DataSourceRow | undefined) ||
                          databases[field.name];
                        return (
                          <Space
                            key={field.key}
                            size={8}
                            style={{display: 'flex', marginBottom: 8}}
                            align="start"
                          >
                            <Form.Item
                              name={[field.name, 'defaultDB']}
                              valuePropName="checked"
                              noStyle
                            >
                              <Radio
                                onChange={() => {
                                  if (!record?.key) return;
                                  updateDatabase(record.key, {...record, defaultDB: true});
                                }}
                              />
                            </Form.Item>
                            <Form.Item name={[field.name, 'select']} noStyle>
                              <Select
                                options={dialectOptions}
                                disabled={!record?.defaultDB}
                                style={{width: 120}}
                                onChange={(value: string) => {
                                  if (!record?.key) return;
                                  const tpl =
                                    URL_TEMPLATES[value.toLowerCase()] || defaultDBData;
                                  updateDatabase(record.key, {
                                    ...record,
                                    select: value,
                                    properties: {
                                      driver_class_name: tpl.driver_class_name,
                                      url: tpl.url,
                                      username: '',
                                      password: '',
                                    },
                                  });
                                }}
                              />
                            </Form.Item>
                            <Form.Item
                              name={[field.name, 'name']}
                              rules={[{required: true}]}
                              noStyle
                            >
                              <Input
                                size="small"
                                disabled={!record?.defaultDB}
                                onBlur={(e) => {
                                  if (!record?.key) return;
                                  updateDatabase(record.key, {
                                    ...record,
                                    name: e.target.value,
                                  });
                                }}
                              />
                            </Form.Item>
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              aria-label={
                                record?.name
                                  ? `删除数据源 ${record.name}`
                                  : '删除数据源'
                              }
                              onClick={() => {
                                if (!record?.key) return;
                                confirmDestructive({
                                  title: '删除数据源',
                                  icon: <ExclamationCircleOutlined />,
                                  content: record.defaultDB
                                    ? '是否要删除默认数据源？删除之后，系统将不存在默认数据源！'
                                    : '是否删除该数据源？',
                                  okText: '删除',
                                  okType: 'danger',
                                  cancelText: '取消',
                                  onOk: () => removeDatabase(record.key),
                                });
                              }}
                            />
                          </Space>
                        );
                      })}
                    </>
                  )}
                </Form.List>
              </Form.Item>
              <Button
                ref={addBtnRef}
                type="dashed"
                block
                size="small"
                icon={<PlusOutlined />}
                aria-label="新增数据源"
                onClick={async () => {
                  // 以 API 列表为准，避免闭包里 databases 过期导致首条未标 defaultDB、不落盘 defaultDataSourceId
                  const latest =
                    ((await projectDispatch.refreshDataSources()) as DataSourceRow[] | undefined) ||
                    [];
                  await addDatabase({
                    name: `数据源_${Date.now().toString(36).slice(-6)}`,
                    select: defaultDatabase,
                    key: uuid(32),
                    defaultDB: latest.findIndex((db) => db.defaultDB) === -1,
                    properties: {
                      driver_class_name: defaultDBData.driver_class_name,
                      url: defaultDBData.url,
                      password: '',
                      username: '',
                    },
                  });
                }}
              >
                新增数据源
              </Button>
            </Col>
            <Col span={12}>
              <Form.Item
                name="driver_class_name"
                label="driver_class_name"
                rules={[
                  {required: true, message: '不能为空'},
                  {max: 300, message: '不能大于 300 个字符'},
                ]}
              >
                <Input
                  placeholder="driver_class_name"
                  onBlur={(e) => {
                    if (!defaultDbs?.key) return;
                    updateDatabase(defaultDbs.key, {
                      ...defaultDbs,
                      properties: {
                        ...defaultDbs.properties,
                        driver_class_name: e.target.value,
                      },
                    });
                  }}
                />
              </Form.Item>
              <Form.Item
                name="url"
                label="url"
                rules={[
                  {required: true, message: '不能为空'},
                  {max: 300, message: '不能大于 300 个字符'},
                ]}
              >
                <Input
                  placeholder="请输入url"
                  onBlur={(e) => {
                    if (!defaultDbs?.key) return;
                    updateDatabase(defaultDbs.key, {
                      ...defaultDbs,
                      properties: {
                        ...defaultDbs.properties,
                        url: e.target.value,
                      },
                    });
                  }}
                />
              </Form.Item>
              <Form.Item
                name="username"
                label="username"
                rules={[
                  {required: true, message: '不能为空'},
                  {max: 100, message: '不能大于 100 个字符'},
                ]}
              >
                <Input
                  placeholder="请输入username"
                  onBlur={(e) => {
                    if (!defaultDbs?.key) return;
                    updateDatabase(defaultDbs.key, {
                      ...defaultDbs,
                      properties: {
                        ...defaultDbs.properties,
                        username: e.target.value,
                      },
                    });
                  }}
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="password"
                rules={[
                  {required: true, message: '不能为空'},
                  {max: 100, message: '不能大于 100 个字符'},
                ]}
              >
                <Input.Password
                  placeholder="请输入password"
                  onBlur={(e) => {
                    if (!defaultDbs?.key) return;
                    updateDatabase(defaultDbs.key, {
                      ...defaultDbs,
                      properties: {
                        ...defaultDbs.properties,
                        password: e.target.value,
                      },
                    });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(DatabaseSetUp);
