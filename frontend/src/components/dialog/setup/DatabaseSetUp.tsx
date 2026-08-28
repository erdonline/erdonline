import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {DeleteOutlined, ExclamationCircleOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Col, Form, Input, Modal, Radio, Row, Select, Space, message} from 'antd';
import {useIntl} from '@umijs/max';
import _ from 'lodash-es';
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

const DRIVER_BY_DIALECT: Record<string, string> = {
  mysql: 'com.mysql.jdbc.Driver',
  oracle: 'oracle.jdbc.driver.OracleDriver',
  sqlserver: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
  postgresql: 'org.postgresql.Driver',
};

/** 设计器菜单「数据源设置」：读写 /ncnb/dataSources（ADR-0008），不写 profile.dbs */
const DatabaseSetUp: React.FC<DatabaseSetUpProps> = ({
  hideTrigger,
  open: openProp,
  onOpenChange,
}) => {
  const intl = useIntl();
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch, dialects} = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      dialects: (state.project?.projectJSON?.dataTypeDomains?.database || []) as DialectRow[],
    }),
    shallow,
  );

  const urlTemplates = useMemo(
    () => ({
      mysql: {
        url: intl.formatMessage({ id: 'setupModal.db.urlTemplateMysql' }),
        driver_class_name: DRIVER_BY_DIALECT.mysql,
      },
      oracle: {
        url: intl.formatMessage({ id: 'setupModal.db.urlTemplateOracle' }),
        driver_class_name: DRIVER_BY_DIALECT.oracle,
      },
      sqlserver: {
        url: intl.formatMessage({ id: 'setupModal.db.urlTemplateSqlserver' }),
        driver_class_name: DRIVER_BY_DIALECT.sqlserver,
      },
      postgresql: {
        url: intl.formatMessage({ id: 'setupModal.db.urlTemplatePostgresql' }),
        driver_class_name: DRIVER_BY_DIALECT.postgresql,
      },
    }),
    [intl],
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
  const [submitting, setSubmitting] = useState(false);
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
  const defaultDBData = urlTemplates[defaultDatabase.toLowerCase()] || urlTemplates.mysql;

  const defaultDbs = databases.find((d) => d.defaultDB) || databases[0];
  const defaultDB = databases.find((d) => d.defaultDB);

  useEffect(() => {
    form.setFieldsValue({dbs: databases});
  }, [databases, form]);

  useEffect(() => {
    if (!defaultDbs?.key) {
      return;
    }
    form.setFieldsValue({
      ...(defaultDbs.properties || {}),
    });
  }, [defaultDbs?.key, defaultDbs?.select, form]);

  const connectJDBC = () => {
    form.validateFields().then(() => {
      const {properties} = defaultDbs || {};
      setPingLoading(true);
      Save.ping({
        ...properties,
      })
        .then((res: {code?: number; msg?: string}) => {
          if (res.code !== 200) {
            message.error(
              intl.formatMessage({ id: 'setupModal.db.connectFailed' }, { msg: res.msg ?? '' }),
            );
          } else {
            message.success(intl.formatMessage({ id: 'setupModal.db.connectSuccess' }));
          }
        })
        .catch(() => {
          message.error(intl.formatMessage({ id: 'setupModal.db.connectFailedGeneric' }));
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
      const ok = await projectDispatch.setDefaultDb(key);
      if (!ok) {
        await reload();
        return;
      }
    }
    const putOk = await projectDispatch.updateDbs(key, data);
    if (!putOk) {
      await reload();
      return;
    }
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

  const handleOk = async () => {
    if (!defaultDbs?.key) {
      setOpen(false);
      return;
    }
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const ok = await projectDispatch.updateDbs(defaultDbs.key, {
        ...defaultDbs,
        properties: {
          driver_class_name: values.driver_class_name,
          url: values.url,
          username: values.username,
          password: values.password,
        },
      });
      if (ok) {
        message.success(intl.formatMessage({ id: 'setupModal.db.saveSuccess' }));
        setOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const listLabel = defaultDB
    ? intl.formatMessage({ id: 'setupModal.db.currentDefault' }, { name: defaultDB.name ?? '' })
    : databases.length > 0
      ? intl.formatMessage({ id: 'setupModal.db.noDefaultSelected' })
      : intl.formatMessage({ id: 'setupModal.db.noDataSource' });

  const requiredMsg = intl.formatMessage({ id: 'versionModal.validation.required' });
  const max300Msg = intl.formatMessage({ id: 'setupModal.validation.max300' });
  const max100Msg = intl.formatMessage({ id: 'versionModal.validation.max100' });

  return (
    <>
      {hideTrigger ? null : (
        <Button
          key="db"
          type="text"
          size="small"
          block
          style={{textAlign: 'left'}}
          aria-label={intl.formatMessage({ id: 'setupModal.db.triggerAria' })}
          onClick={openModal}
        >
          {intl.formatMessage({ id: 'setupModal.db.trigger' })}
        </Button>
      )}
      <Modal
        title={intl.formatMessage({ id: 'setupModal.db.title' })}
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
            {pingLoading
              ? intl.formatMessage({ id: 'setupModal.db.testing' })
              : intl.formatMessage({ id: 'setupModal.db.test' })}
          </Button>,
          <Button
            type="primary"
            key="submit"
            size="small"
            loading={submitting}
            aria-label={intl.formatMessage({ id: 'setupModal.db.okAria' })}
            onClick={() => void handleOk()}
          >
            {intl.formatMessage({ id: 'setupModal.db.ok' })}
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
                                aria-label={
                                  record?.name
                                    ? intl.formatMessage(
                                        { id: 'setupModal.db.setDefaultNamed' },
                                        { name: record.name },
                                      )
                                    : intl.formatMessage({ id: 'setupModal.db.setDefault' })
                                }
                                onChange={() => {
                                  if (!record?.key) return;
                                  void updateDatabase(record.key, {
                                    ...record,
                                    defaultDB: true,
                                  });
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
                                  const tpl = urlTemplates[value.toLowerCase()] || defaultDBData;
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
                                  ? intl.formatMessage(
                                      { id: 'setupModal.db.deleteNamed' },
                                      { name: record.name },
                                    )
                                  : intl.formatMessage({ id: 'setupModal.db.delete' })
                              }
                              onClick={() => {
                                if (!record?.key) return;
                                confirmDestructive({
                                  title: intl.formatMessage({ id: 'setupModal.db.deleteTitle' }),
                                  icon: <ExclamationCircleOutlined />,
                                  content: record.defaultDB
                                    ? intl.formatMessage({ id: 'setupModal.db.deleteDefaultContent' })
                                    : intl.formatMessage({ id: 'setupModal.db.deleteContent' }),
                                  okText: intl.formatMessage({ id: 'setupModal.db.deleteOk' }),
                                  okType: 'danger',
                                  cancelText: intl.formatMessage({ id: 'setupModal.db.deleteCancel' }),
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
                aria-label={intl.formatMessage({ id: 'setupModal.db.addAria' })}
                onClick={async () => {
                  const latest =
                    ((await projectDispatch.refreshDataSources()) as DataSourceRow[] | undefined) ||
                    [];
                  await addDatabase({
                    name: `${intl.formatMessage({ id: 'setupModal.db.newNamePrefix' })}${uuid(8)}`,
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
                {intl.formatMessage({ id: 'setupModal.db.add' })}
              </Button>
            </Col>
            <Col span={12}>
              <Form.Item
                name="driver_class_name"
                label="driver_class_name"
                rules={[
                  {required: true, message: requiredMsg},
                  {max: 300, message: max300Msg},
                ]}
              >
                <Input placeholder="driver_class_name" />
              </Form.Item>
              <Form.Item
                name="url"
                label="url"
                rules={[
                  {required: true, message: requiredMsg},
                  {max: 300, message: max300Msg},
                ]}
              >
                <Input placeholder={intl.formatMessage({ id: 'setupModal.db.urlPlaceholder' })} />
              </Form.Item>
              <Form.Item
                name="username"
                label="username"
                rules={[
                  {required: true, message: requiredMsg},
                  {max: 100, message: max100Msg},
                ]}
              >
                <Input placeholder={intl.formatMessage({ id: 'setupModal.db.usernamePlaceholder' })} />
              </Form.Item>
              <Form.Item
                name="password"
                label="password"
                rules={[
                  {required: true, message: requiredMsg},
                  {max: 100, message: max100Msg},
                ]}
              >
                <Input.Password placeholder={intl.formatMessage({ id: 'setupModal.db.passwordPlaceholder' })} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(DatabaseSetUp);
