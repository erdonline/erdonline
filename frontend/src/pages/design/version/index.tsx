import React, {useCallback, useEffect, useState} from 'react';
import shallow from "zustand/shallow";
import useVersionStore from "@/store/version/useVersionStore";
import './index.less';
import {compareStringVersion} from "@/utils/string";
import {Button, ConfigProvider, Input, message, Space, Tag, Tooltip} from "antd";
import {ProList} from '@ant-design/pro-components';
import AddVersion from "@/components/dialog/version/AddVersion";
import SyncConfig from "@/components/dialog/version/SyncConfig";
import RebuildVersion from "@/components/dialog/version/RebuildVersion";
import CompareVersion, {CompareVersionType} from "@/components/dialog/version/CompareVersion";
import RenameVersion from "@/components/dialog/version/RenameVersion";
import RemoveVersion from "@/components/dialog/version/RemoveVersion";
import SyncVersion from "@/components/dialog/version/SyncVersion";
import {ArrowLeftOutlined, CheckCircleFilled, WarningFilled} from "@ant-design/icons";
import {Access, useAccess} from "@@/plugin-access";
import RevertVersion from "@/components/dialog/version/RevertVersion";
import CopyProject from "@/components/dialog/project/CopyProject";
import { fetchDatabaseConfigs } from '@/utils/databaseUtils';
import { DataSourceSelect } from '@/components/DataSourceSelect';
import PageSkeleton from '@/components/PageSkeleton';
import {splitVersionTags, versionTagsMatchFilter} from '@/utils/versionTags';
import { history } from '@@/core/history';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';

const Version: React.FC = () => {
  const {
    synchronous,
    dbVersion,
    changes,
    versions,
    pageSize,
    fetch,
    versionDispatch,
  } = useVersionStore(state => ({
    synchronous: state.synchronous,
    dbVersion: state.dbVersion || '0.0.0',
    changes: state.changes,
    versions: state.versions,
    pageSize: state.pageSize,
    fetch: state.fetch,
    versionDispatch: state.dispatch,
  }), shallow);

  const access = useAccess();

  const activeKey = 'tab1';
  const [selectedDB, setSelectedDB] = useState<{ value: string; label: string } | undefined>(undefined);
  const [dbs, setDbs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tagFilter, setTagFilter] = useState('');

  const filteredVersions = React.useMemo(() => {
    return versions.filter((v: { tag?: string }) => versionTagsMatchFilter(v.tag, tagFilter));
  }, [versions, tagFilter]);

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

  const goBackToModel = useCallback(() => {
    const projectId =
      new URLSearchParams(window.location.search).get('projectId') ||
      cache.getItem(CONSTANT.PROJECT_ID) ||
      '';
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    history.push(`/design/table/model${q}`);
  }, []);

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
        <div className="version-page" data-testid="version-page">
          <div className="version-page__bar">
            <Button
              type="link"
              size="small"
              icon={<ArrowLeftOutlined />}
              onClick={goBackToModel}
              aria-label="返回模型"
              data-testid="version-back-to-model"
            >
              返回模型
            </Button>
            {dbs.length === 0 && (
              <span className="version-page__hint">
                未配置数据源：可直接「新增版本」保存模型快照（不同步 DDL）。需要同步时再在设置中添加 JDBC。
              </span>
            )}
          </div>
          <ProList<any>
            className="version-page__list"
            rowKey="id"
            dataSource={filteredVersions}
            pagination={false}
            locale={{ emptyText: tagFilter.trim() ? '无匹配标签的版本' : '暂无版本。改完模型后点「新增版本」保存快照。' }}
            metas={{
              title: {
                dataIndex: 'version',
              },
              description: {
                dataIndex: 'versionDesc',
                render: (_dom, row) => {
                  const ch = Array.isArray(row.changes) ? row.changes : [];
                  const add = ch.filter((c: { opt?: string }) => c.opt === 'add').length;
                  const del = ch.filter((c: { opt?: string }) => c.opt === 'delete').length;
                  const upd = ch.filter((c: { opt?: string }) => c.opt === 'update').length;
                  const tags = splitVersionTags(row.tag);
                  return (
                    <div className="version-row-meta">
                      <div className="version-row-prose">
                        <span>{row.creator}</span>
                        <span>{row.versionDate}</span>
                        <span>{row.versionDesc}</span>
                      </div>
                      {tags.length > 0 && (
                        <div
                          className="version-row-tags"
                          data-testid="version-tags"
                          aria-label="版本标签"
                        >
                          <span className="version-row-tags__label">标签</span>
                          <Space size={[4, 4]} wrap>
                            {tags.map((t: string) => (
                              <Tag
                                color="purple"
                                key={t}
                                className="version-row-tags__chip"
                                data-testid={`version-tag-${t}`}
                              >
                                {t}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      )}
                      {ch.length > 0 && (
                        <div
                          className="version-row-changes"
                          data-testid="version-change-summary"
                          aria-label="变更摘要"
                        >
                          <span className="version-row-changes__label">变更</span>
                          <span className="version-row-changes__text">
                            {add > 0 && <span className="version-row-changes__add">+{add}</span>}
                            {del > 0 && <span className="version-row-changes__del">−{del}</span>}
                            {upd > 0 && <span className="version-row-changes__upd">~{upd}</span>}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                },
              },
              subTitle: {
                dataIndex: 'labels',
                render: (_dom, row) => {
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
                render: (_text, row) => [
                  <CompareVersion key="detail" type={CompareVersionType.DETAIL}/>,
                  <Access
                    key="rename"
                    accessible={access.canErdHisprojectEdit}
                    fallback={<></>}
                  >
                    <RenameVersion/>
                  </Access>,
                  <Access
                    key="remove"
                    accessible={access.canErdHisprojectDel}
                    fallback={<></>}
                  >
                    <RemoveVersion/>
                  </Access>,
                  <CopyProject key="copy" projectJSON={row.projectJSON}/>,
                  <RevertVersion
                    key="revert"
                    synced={compareStringVersion(row.version, dbVersion) > 0}
                  />,
                  <Access
                    key="sync"
                    accessible={access.canErdConnectorDbsync}
                    fallback={<></>}
                  >
                    <SyncVersion synced={compareStringVersion(row.version, dbVersion) <= 0}/>
                  </Access>

                ],
              },
            }}
            onRow={(record: any) => {
              return {
                'data-testid': `version-row-${record.version}`,
                onMouseEnter: () => {
                  const fullIndex = versions.findIndex((v: { id?: string }) => v.id === record.id);
                  versionDispatch.setCurrentVersion(record, fullIndex >= 0 ? fullIndex : 0);
                },
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
                <Input
                  key="tag-filter"
                  allowClear
                  placeholder="按标签筛选"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  style={{ width: 160 }}
                  data-testid="version-tag-filter"
                  aria-label="按标签筛选"
                />,
                <Access
                  key="add-version"
                  accessible={access.canErdHisprojectAdd}
                  fallback={<></>}
                >
                  <AddVersion trigger="bp"/>
                </Access>,
                <CompareVersion key="compare" type={CompareVersionType.COMPARE}/>,
                <Access
                  key="sync-config"
                  accessible={access.canErdHisprojectConfig}
                  fallback={<></>}
                >
                  <SyncConfig/>
                </Access>,
                <Access
                  key="rebuild"
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
