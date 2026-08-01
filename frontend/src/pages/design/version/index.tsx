import React, {useCallback, useEffect, useMemo, useState} from 'react';
import shallow from "zustand/shallow";
import useVersionStore from "@/store/version/useVersionStore";
import './index.less';
import {compareStringVersion} from "@/utils/string";
import {message, Pagination, Select, Space, Tag} from "antd";
import {ProList} from '@ant-design/pro-components';
import AddVersion from "@/components/dialog/version/AddVersion";
import SyncConfig from "@/components/dialog/version/SyncConfig";
import InitVersion from "@/components/dialog/version/InitVersion";
import RebuildVersion from "@/components/dialog/version/RebuildVersion";
import CompareVersion, {CompareVersionType} from "@/components/dialog/version/CompareVersion";
import RenameVersion from "@/components/dialog/version/RenameVersion";
import RemoveVersion from "@/components/dialog/version/RemoveVersion";
import SyncVersion from "@/components/dialog/version/SyncVersion";
import {CheckCircleFilled, CloseCircleFilled, WarningFilled} from "@ant-design/icons";
import _, { debounce } from "lodash";
import {Access, useAccess} from "@@/plugin-access";
import RevertVersion from "@/components/dialog/version/RevertVersion";
import CopyVersion from "@/components/dialog/version/CopyVersion";
import CopyProject from "@/components/dialog/project/CopyProject";
import { fetchDatabaseConfigs } from '@/utils/databaseUtils';
import { SyncOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { ConfigProvider } from 'antd';
import { DataSourceSelect } from '@/components/DataSourceSelect';
import PageSkeleton from '@/components/PageSkeleton';

const {Option, OptGroup} = Select;

export type VersionProps = {};

export type IDatabase = any;

const Version: React.FC<VersionProps> = (props) => {
  const {
    synchronous, 
    dbVersion, 
    changes, 
    versions,
    totalVersions,
    currentPage,
    pageSize,
    fetch, 
    setPageSize,
    versionDispatch, 
    hasDB,
    recalculateChanges
  } = useVersionStore(state => ({
    synchronous: state.synchronous,
    dbVersion: state.dbVersion || '0.0.0',
    changes: state.changes,
    versions: state.versions,
    totalVersions: state.totalVersions,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    fetch: state.fetch,
    setPageSize: state.setPageSize,
    versionDispatch: state.dispatch,
    hasDB: state.hasDB,
    recalculateChanges: state.dispatch.recalculateChanges,
  }), shallow);

  const access = useAccess();

  const [activeKey, setActiveKey] = useState<string>('tab1');
  const [selectedDB, setSelectedDB] = useState<{ value: string; label: string } | undefined>(undefined);
  const [dbs, setDbs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeDatabases = async () => {
      setIsLoading(true);
      try {
        const databases = await fetchDatabaseConfigs();
        setDbs(databases || []);
        if (databases && databases.length > 0) {
          const firstDb = databases[0];
          setSelectedDB({ value: firstDb.name, label: firstDb.name });
          versionDispatch.initDbs(databases);
          await fetch(firstDb, 1, pageSize);
        } else {
          // 无 JDBC：走模型快照通道，禁止永远 Loading
          versionDispatch.initDbs([]);
          await fetch(null, 1, pageSize);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching database configs:', error);
        message.error('获取数据源配置失败');
        // 仍进入界面，允许快照保存
        versionDispatch.initDbs([]);
        await fetch(null, 1, pageSize);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabases();
  }, [versionDispatch, fetch, pageSize]);

  const handleDbChange = useCallback((value: { value: string; label: string } | undefined) => {
    if (!value || !value.value) {
      return;
    }
    
    setSelectedDB(value);
    versionDispatch.dbChange({ value: value.value });
    
    const updatedDbs = [
      ...dbs.filter(db => db.name === value.value),
      ...dbs.filter(db => db.name !== value.value)
    ];
    versionDispatch.initDbs(updatedDbs);
  
    const selectedDbObject = dbs.find(db => db.name === value.value);
    if (selectedDbObject) {
      fetch(selectedDbObject, 1, pageSize);
    } else {
      console.error('无法找到选中的数据源信息2');
    }
  }, [dbs, versionDispatch, fetch, pageSize]);

  const handlePageChange = (page: number, newPageSize?: number) => {
    const selectedDbObject = dbs.find(db => db.name === selectedDB?.value);
    if (selectedDbObject) {
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize || 10);
      }
      fetch(selectedDbObject, page, newPageSize || pageSize);
    } else {
      message.error('无法找到选中的数据源信息3');
    }
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          List: {
            paddingLG: 0,
          },
        },
      }}
    >
      {isInitialized ? (
        <div style={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
          {dbs.length === 0 && (
            <div style={{ padding: '8px 16px', color: 'rgba(0,0,0,0.65)', fontSize: 13 }}>
              未配置数据源：可直接「新增版本」保存模型快照（不同步 DDL）。需要同步数据库时再在设置中添加 JDBC。入口：侧栏「版本管理」或项目菜单「版本」。
            </div>
          )}
          <ProList<any>
            rowKey="id"
            dataSource={versions}
            pagination={false}
            locale={{ emptyText: '暂无版本。改完模型后点「新增版本」保存快照。' }}
            style={{
              height: '100%',
              overflowY: 'auto',
            }}
            metas={{
              title: {
                dataIndex: 'version',
              },
              description: {
                dataIndex: 'versionDesc',
                render: (_, row) => {
                  const ch = Array.isArray(row.changes) ? row.changes : [];
                  const add = ch.filter((c: any) => c.opt === 'add').length;
                  const del = ch.filter((c: any) => c.opt === 'delete').length;
                  const upd = ch.filter((c: any) => c.opt === 'update').length;
                  return (
                    <Space wrap size={[8, 4]}>
                      <span>{row.creator}</span>
                      <span>{row.versionDate}</span>
                      <span>{row.versionDesc}</span>
                      {ch.length > 0 && (
                        <Space size={4} data-testid="version-change-summary">
                          {add > 0 && <Tag color="success">+{add}</Tag>}
                          {del > 0 && <Tag color="error">-{del}</Tag>}
                          {upd > 0 && <Tag color="warning">~{upd}</Tag>}
                        </Space>
                      )}
                    </Space>
                  );
                },
              },
              subTitle: {
                dataIndex: 'labels',
                render: (_, row) => {
                  return (
                    <Space>
                      {
                        // eslint-disable-next-line no-nested-ternary
                        compareStringVersion(row.version, dbVersion) <= 0 ?
                          <Tag title={"已同步到数据源"} color="blue">已同步</Tag>
                          :
                          synchronous[row.version] ?
                            <Tag title={"正在同步到数据源"} color="lime">正在同步</Tag>
                            :
                            <Tag title={"未同到数据源"} color="red">未同步</Tag>
                      }
                    </Space>
                  );
                },
                search: false,
              },
              actions: {
                render: (text, row) => [
                  <CompareVersion type={CompareVersionType.DETAIL}/>,
                  <Access
                    accessible={access.canErdHisprojectEdit}
                    fallback={<></>}
                  >
                    <RenameVersion/>
                  </Access>,
                  <Access
                    accessible={access.canErdHisprojectDel}
                    fallback={<></>}
                  >
                    <RemoveVersion/>
                  </Access>,
                  <CopyProject projectJSON={row.projectJSON}/>,
                  <RevertVersion synced={compareStringVersion(row.version, dbVersion) > 0}/>,
                  <Access
                    accessible={access.canErdConnectorDbsync}
                    fallback={<></>}
                  >
                    <SyncVersion synced={compareStringVersion(row.version, dbVersion) <= 0}/>
                  </Access>

                ],
              },
            }}
            onRow={(record: any, index: number) => {
              return {
                'data-testid': `version-row-${record.version}`,
                onMouseEnter: () => {
                  versionDispatch.setCurrentVersion(record, index);
                }, // 鼠标移入行
              };
            }}
            toolbar={{
              menu: {
                activeKey,
                items: [
                  {
                    key: 'tab1',
                    label: (
                      <Space>
                        {changes.length > 0 ? (
                          <Tooltip title="当前内容与上一版本的内容有变化，但未保存同步版本！">
                            <Tag color="red">
                              <WarningFilled />
                            </Tag>
                          </Tooltip>
                        ) : (
                          <Tooltip title="当前内容与上一版本内容无变化">
                            <Tag color="blue">
                              <CheckCircleFilled />
                            </Tag>
                          </Tooltip>
                        )}
                      </Space>
                    ),
                  },
                  {
                    key: 'tab2',
                    label: 
                      <Space>
                        数据源
                        <DataSourceSelect
                          value={selectedDB}
                          onChange={handleDbChange}
                          style={{ width: 200 }}
                          loading={isLoading}
                        />
                      </Space>
                  },
                ]
              },
              actions: [
                <Access
                accessible={access.canErdHisprojectAdd}
                fallback={<></>}
                >
                  <AddVersion trigger="bp"/>
                </Access>,
                <CompareVersion type={CompareVersionType.COMPARE}/>,
                <Access
                  accessible={access.canErdHisprojectConfig}
                  fallback={<></>}
                >
                  <SyncConfig/>
                </Access>,
                <Access
                  accessible={access.canErdHisprojectRebuild}
                  fallback={<></>}
                >
                  <RebuildVersion/>
                </Access>,

              ],
            }}
          />
        </div>
      ) : (
        <PageSkeleton rows={5} />
      )}
    </ConfigProvider>
  );
}

export default React.memo(Version)
