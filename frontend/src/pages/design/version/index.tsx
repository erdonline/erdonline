import React, {useCallback, useEffect, useState} from 'react';
import shallow from "zustand/shallow";
import useVersionStore from "@/store/version/useVersionStore";
import './index.less';
import {compareStringVersion} from "@/utils/string";
import {Button, Empty, Input, List, message, Space, Tag, Tooltip} from "antd";
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

type VersionChange = { opt?: string };
type VersionRow = {
  id: string;
  version: string;
  versionDesc?: string;
  versionDate?: string;
  creator?: string;
  tag?: string;
  changes?: VersionChange[];
  projectJSON?: unknown;
};

type DbOption = { name: string; value?: string; label?: string };

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

  const [selectedDB, setSelectedDB] = useState<{ value: string; label: string } | undefined>(undefined);
  const [dbs, setDbs] = useState<DbOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tagFilter, setTagFilter] = useState('');

  const filteredVersions = React.useMemo(() => {
    return (versions as VersionRow[]).filter((v) => versionTagsMatchFilter(v.tag, tagFilter));
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

  const projectIdQuery = useCallback(() => {
    const projectId =
      new URLSearchParams(window.location.search).get('projectId') ||
      cache.getItem(CONSTANT.PROJECT_ID) ||
      '';
    return projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  }, []);

  const goBackToModel = useCallback(() => {
    history.push(`/design/table/model${projectIdQuery()}`);
  }, [projectIdQuery]);

  const goVersionSub = useCallback(
    (sub: 'order' | 'approval') => {
      history.push(`/design/table/version/${sub}${projectIdQuery()}`);
    },
    [projectIdQuery],
  );

  const setRowCurrent = useCallback((record: VersionRow) => {
    const fullIndex = (versions as VersionRow[]).findIndex((v) => v.id === record.id);
    versionDispatch.setCurrentVersion(record, fullIndex >= 0 ? fullIndex : 0);
  }, [versions, versionDispatch]);

  const renderSyncTag = (row: VersionRow) => {
    if (compareStringVersion(row.version, dbVersion) <= 0) {
      return <Tag title="已同步到数据源" color="blue">已同步</Tag>;
    }
    if (synchronous[row.version]) {
      return <Tag title="正在同步到数据源" color="lime">正在同步</Tag>;
    }
    return <Tag title="未同到数据源" color="red">未同步</Tag>;
  };

  const renderRowMeta = (row: VersionRow) => {
    const ch = Array.isArray(row.changes) ? row.changes : [];
    const add = ch.filter((c) => c.opt === 'add').length;
    const del = ch.filter((c) => c.opt === 'delete').length;
    const upd = ch.filter((c) => c.opt === 'update').length;
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
  };

  const renderRowActions = (row: VersionRow) => {
    const unsynced = compareStringVersion(row.version, dbVersion) > 0;
    return [
      <CompareVersion key="detail" type={CompareVersionType.DETAIL} />,
      <Access key="submit-order" accessible={access.enterprise} fallback={<></>}>
        {unsynced ? (
          <CompareVersion
            type={CompareVersionType.DETAIL}
            buttonLabel="提交工单"
            testId="version-submit-order-btn"
          />
        ) : (
          <></>
        )}
      </Access>,
      <Access
        key="rename"
        accessible={access.canErdHisprojectEdit}
        fallback={<></>}
      >
        <RenameVersion />
      </Access>,
      <Access
        key="remove"
        accessible={access.canErdHisprojectDel}
        fallback={<></>}
      >
        <RemoveVersion />
      </Access>,
      <CopyProject key="copy" projectJSON={row.projectJSON} />,
      <RevertVersion key="revert" synced={unsynced} />,
      <Access
        key="sync"
        accessible={access.canErdConnectorDbsync}
        fallback={<></>}
      >
        <SyncVersion synced={!unsynced} />
      </Access>,
    ];
  };

  const emptyNode = tagFilter.trim() ? (
    <div data-testid="version-empty-filter">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="无匹配标签的版本"
      />
    </div>
  ) : (
    <div data-testid="version-empty">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="还没有版本"
      >
        <Access
          accessible={access.canErdHisprojectAdd}
          fallback={<></>}
        >
          <AddVersion
            trigger="empty"
            label="保存第一个版本"
            testId="version-empty-save-btn"
          />
        </Access>
      </Empty>
    </div>
  );

  return (
    <>
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
            <Space size={4} className="version-page__trust-nav" wrap>
              <Button
                type="link"
                size="small"
                onClick={() => goVersionSub('order')}
                aria-label="我的工单"
                data-testid="version-nav-orders"
              >
                我的工单
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => goVersionSub('approval')}
                aria-label="我的审批"
                data-testid="version-nav-approvals"
              >
                我的审批
              </Button>
            </Space>
            {dbs.length === 0 && (
              <span className="version-page__hint">
                未配置数据源：可直接「新增版本」保存模型快照（不同步 DDL）。需要同步时再在设置中添加 JDBC。
              </span>
            )}
          </div>

          <div className="version-page__toolbar" data-testid="version-toolbar">
            <Space wrap size={[4, 4]} className="version-page__toolbar-status">
              {changes.length > 0 ? (
                <Tooltip title="当前内容与上一版本的内容有变化，但未保存同步版本！">
                  <Tag color="red" data-testid="version-dirty-tag">
                    <WarningFilled /> 未保存变更
                  </Tag>
                </Tooltip>
              ) : (
                <Tooltip title="当前内容与上一版本内容无变化">
                  <Tag color="blue" data-testid="version-clean-tag">
                    <CheckCircleFilled /> 已与最新版本一致
                  </Tag>
                </Tooltip>
              )}
              <Space size={4}>
                <span className="version-page__toolbar-label">数据源</span>
                <DataSourceSelect
                  value={selectedDB}
                  onChange={handleDbChange}
                  style={{ width: 180 }}
                  loading={isLoading}
                />
              </Space>
            </Space>
            <Space wrap size={[4, 4]} className="version-page__toolbar-actions">
              <Input
                allowClear
                size="small"
                placeholder="按标签筛选"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                style={{ width: 140 }}
                data-testid="version-tag-filter"
                aria-label="按标签筛选"
              />
              <Access
                accessible={access.canErdHisprojectAdd}
                fallback={<></>}
              >
                <AddVersion trigger="bp"/>
              </Access>
              <CompareVersion type={CompareVersionType.COMPARE}/>
              <Access
                accessible={access.canErdHisprojectConfig}
                fallback={<></>}
              >
                <SyncConfig/>
              </Access>
              <Access
                accessible={access.canErdHisprojectRebuild}
                fallback={<></>}
              >
                <RebuildVersion/>
              </Access>
            </Space>
          </div>

          <List
            className="version-page__list"
            data-testid="version-list"
            itemLayout="horizontal"
            dataSource={filteredVersions}
            locale={{ emptyText: emptyNode }}
            renderItem={(row) => (
              <List.Item
                key={row.id}
                data-testid={`version-row-${row.version}`}
                onMouseEnter={() => setRowCurrent(row)}
                actions={renderRowActions(row)}
              >
                <List.Item.Meta
                  title={
                    <Space size={4} wrap>
                      <strong className="version-row-title">{row.version}</strong>
                      {renderSyncTag(row)}
                    </Space>
                  }
                  description={renderRowMeta(row)}
                />
              </List.Item>
            )}
          />
        </div>
      ) : (
        <PageSkeleton rows={5} />
      )}
    </>
  );
}

export default React.memo(Version)
