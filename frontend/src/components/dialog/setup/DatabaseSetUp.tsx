import React, {useEffect, useRef, useState} from 'react';
import {
  ModalForm,
  ProFormGroup,
  ProFormInstance,
  ProFormList,
  ProFormRadio,
  ProFormSelect,
  ProFormText
} from "@ant-design/pro-components";
import _ from "lodash";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {uuid} from '@/utils/uuid';
import {DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Col, message, Popconfirm, Row} from 'antd';
import * as Save from '@/utils/save';
export type DatabaseSetUpProps = {
  isGlobal?: boolean;
};


/** 设计器菜单「数据源设置」：读写 /ncnb/dataSources（ADR-0008），不写 profile.dbs */
const DatabaseSetUp: React.FC<DatabaseSetUpProps> = () => {
  const { projectDispatch, } = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);

  const [databases, setDatabases] = useState([]);

  const reload = async () => {
    const list = await projectDispatch.refreshDataSources();
    setDatabases(list || []);
  };

  useEffect(() => {
    reload();
  }, []);

  const dispatch = projectDispatch;

  const url = {
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

  const defaultDatabase = _.find(databases, {"defaultDatabase": true})?.code || databases[0]?.code || 'MYSQL';

  const dbName = defaultDatabase.toLocaleLowerCase();
  const defaultDBData = url[dbName] || {};

  const getDefaultDbs = (db: any) => {
    db = db ? db : databases;
    return db.filter((d: any) => d.defaultDB)[0];
  }

  const defaultDbs = getDefaultDbs(null);
  const defaultData = defaultDbs || databases[0];


  const [state, setState] = useState({
    loading: false
  });

  const connectJDBC = () => {
    const newVar = formRef && formRef.current?.validateFields();
    newVar?.then(() => {
      const {properties} = defaultData;
      setState({
        loading: true,
      });
      Save.ping({
        ...properties
      }).then((res: any) => {
        if (res.code !== 200) {
          message.error('连接失败:' + res.msg);
        } else {
          message.success('连接成功');
        }
      }).catch((err) => {
        message.error('连接失败！');
      }).finally(() => {
        setState({
          loading: false,
        });
      });
    });

  };

  // Ant Form 有个臭毛病，form只会加载一次，state变化不会重新加载，用此解决
  const formRef = useRef<ProFormInstance<any>>();
  useEffect(() => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    formRef && formRef.current?.resetFields();
  }, [databases]);


  const getData = () => {
    return databases.filter((d: any) => d.defaultDB)[0];
  };

  const defaultDB = getData();

  const databaseSelect = databases.map((d: any) => {
    return {
      label: d.code,
      value: d.code,
    }
  });

  const addDatabase = async (data: any) => {
    await dispatch.addDbs(data);
    await reload();
  };

  const removeDatabase = async (key: string) => {
    await dispatch.removeDbs(key);
    await reload();
  };

  const updateDatabase = async (key: string, data: any) => {
    if (data?.defaultDB) {
      dispatch.setDefaultDb(key);
    }
    await dispatch.updateDbs(key, data);
    await reload();
  };


  return (<>
      <ModalForm
        formRef={formRef}
        title={<span>数据源连接配置</span>}
        trigger={
          <Button
            key="db"
            type="text"
            size="small"
            block
            style={{ textAlign: 'left' }}
            aria-label="数据源设置"
          >数据源设置</Button>
        }
        initialValues={{
          ...defaultDbs?.properties,
          dbs: databases
        }}
        // 完全自定义整个区域
        submitter={{
          // 完全自定义整个区域
          render: (props, doms) => {
            // @ts-ignore
            return _.concat([], [
              <Button disabled={!defaultData} key="rest" loading={state.loading}
                      onClick={() => connectJDBC()}>{state.loading ? "正在连接" : "测试"}</Button>,
              <Button type="primary" key="submit" onClick={() => {
                message.success("保存成功！");
              }}>确定</Button>,
            ]);
          },
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <ProFormList
              name="dbs"
              creatorButtonProps={false}
              label={
                <span>{defaultDB ? ` 当前使用的数据源为「${defaultDB.name}」` : databases.length > 0 ? ' 当前未选择默认数据源' : '当前未创建数据源'}</span>}
              itemRender={
                ({listDom, action}, {record}) => {
                  return (
                    <ProFormGroup size={8}>
                      <ProFormRadio
                        name="defaultDB"
                        fieldProps={{
                          onChange: () => {
                            updateDatabase(record.key, { ...record, defaultDB: true });
                          }
                        }}/>
                      <ProFormSelect
                        options={databaseSelect || []}
                        name="select"
                        fieldProps={{
                          disabled: !record.defaultDB,
                          onChange: (value: any, option: any) => {
                            updateDatabase(record.key, {
                              ...record,
                              select: value,
                              properties: {
                                driver_class_name: url[value.toLowerCase()].driver_class_name,
                                url: url[value.toLowerCase()].url,
                                username: '',
                                password: ''
                              }
                            });
                          }
                        }}
                      />
                      <ProFormText
                        name="name"
                        fieldProps={{
                          size: "small",
                          disabled: !record.defaultDB,
                          onBlur: (e) => {
                            updateDatabase(record.key, { ...record, name: e.target.value });
                          }
                        }}
                        rules={[
                          {
                            required: true,
                          },
                        ]}
                      />
                      <Popconfirm
                        title={record.defaultDB ? "是否要删除默认数据源？删除之后，系统将不存在默认数据源！" : "是否删除该数据源？"}
                        onConfirm={() => removeDatabase(record.key)}
                        okText="是"
                        cancelText="否"
                      >
                        <a><DeleteOutlined title={"删除"}/></a>
                      </Popconfirm>
                    </ProFormGroup>
                  );
                }
              }
              copyIconProps={false}
            >
              <></>
            </ProFormList>
            <Button type="dashed" block icon={<PlusOutlined/>}
                       onClick={() => {
                         addDatabase({
                           name: '',
                           select: defaultDatabase,
                           key: uuid(),
                           defaultDB: databases.findIndex((db: any) => db.defaultDB) === -1,
                           properties: {
                             driver_class_name: defaultDBData.driver_class_name,
                             url: defaultDBData.url,
                             password: '',
                             username: ''
                           }
                         });
                       }}>新增数据源</Button>

          </Col>
          <Col span={12}>
            <ProFormText
              width="md"
              name="driver_class_name"
              label="driver_class_name"
              placeholder="driver_class_name"
              fieldProps={{
                onBlur: (e) => {
                  updateDatabase(defaultDbs.key, {
                    ...defaultDbs,
                    properties: {
                      ...defaultDbs.properties,
                      driver_class_name: e.target.value
                    }
                  });
                }
              }}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: '不能为空',
                  },
                  {
                    max: 300,
                    message: '不能大于 300 个字符',
                  },
                ],

              }}
            />
            <ProFormText
              width="md"
              name="url"
              label="url"
              placeholder="请输入url"
              fieldProps={{
                onBlur: (e) => {
                  updateDatabase(defaultDbs.key, {
                    ...defaultDbs,
                    properties: {
                      ...defaultDbs.properties,
                      url: e.target.value
                    }
                  });
                }
              }}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: '不能为空',
                  },
                  {
                    max: 300,
                    message: '不能大于 300 个字符',
                  },
                ],
              }}
            />
            <ProFormText
              width="md"
              name="username"
              label="username"
              placeholder="请输入username"
              fieldProps={{
                onBlur: (e) => {
                  updateDatabase(defaultDbs.key, {
                    ...defaultDbs,
                    properties: {
                      ...defaultDbs.properties,
                      username: e.target.value
                    }
                  });
                }
              }}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: '不能为空',
                  },
                  {
                    max: 100,
                    message: '不能大于 100 个字符',
                  },
                ],
              }}
            />
            <ProFormText.Password
              width="md"
              name="password"
              label="password"
              placeholder="请输入password"
              fieldProps={{
                onBlur: (e) => {
                  updateDatabase(defaultDbs.key, {
                    ...defaultDbs,
                    properties: {
                      ...defaultDbs.properties,
                      password: e.target.value
                    }
                  });
                }
              }}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: '不能为空',
                  },
                  {
                    max: 100,
                    message: '不能大于 100 个字符',
                  },
                ],
              }}
            />
          </Col>
        </Row>

      </ModalForm>


    </>
  );
};

export default React.memo(DatabaseSetUp)
