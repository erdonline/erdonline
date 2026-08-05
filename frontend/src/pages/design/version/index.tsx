import React, {useCallback, useEffect, useState} from 'react';
import shallow from "zustand/shallow";
import useVersionStore from "@/store/version/useVersionStore";
import './index.less';
import {isVersionGreater, isVersionLessOrEqual} from "@/utils/string";
import {Empty, Input, List, message, Space, Tag, Tooltip} from "antd";
import AddVersion from "@/components/dialog/version/AddVersion";
import SyncConfig from "@/components/dialog/version/SyncConfig";
import InitVersion from "@/components/dialog/version/InitVersion";
import RebuildVersion from "@/components/dialog/version/RebuildVersion";
import CompareVersion, {CompareVersionType} from "@/components/dialog/version/CompareVersion";
import RenameVersion from "@/components/dialog/version/RenameVersion";
import RemoveVersion from "@/components/dialog/version/RemoveVersion";
import SyncVersion from "@/components/dialog/version/SyncVersion";
import {Access, useAccess} from "@@/plugin-access";
import RevertVersion from "@/components/dialog/version/RevertVersion";
import CopyProject from "@/components/dialog/project/CopyProject";
import { fetchDatabaseConfigs } from '@/utils/databaseUtils';
import { DataSourceSelect } from '@/components/DataSourceSelect';
import VersionLayerStatusTag from '@/components/VersionLayerStatusTag';
import DualLayerLegend from '@/components/DualLayerLegend';
import PageSkeleton from '@/components/PageSkeleton';
import {splitVersionTags, versionTagsMatchFilter} from '@/utils/versionTags';
import { countChanges } from '@/utils/dualLayerTokens';
import { useIntl } from '@@/exports';

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
  const intl = useIntl();
  const {
    synchronous,
    dbVersion,
    changes,
    versions,
    versionBaseline,
    baselineLoaded,
    pageSize,
    fetch,
    versionDispatch,
  } = useVersionStore(state => ({
    synchronous: state.synchronous,
    dbVersion: state.dbVersion || '0.0.0',
    changes: state.changes,
    versions: state.versions,
    versionBaseline: state.versionBaseline,
    baselineLoaded: state.baselineLoaded,
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
        message.error(intl.formatMessage({ id: 'versionPage.error.fetchDbFailed' }));
        // 仍进入界面，允许快照保存
        versionDispatch.initDbs([]);
        await fetch(null, 1, pageSize);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabases();
  }, [versionDispatch, fetch, pageSize, intl]);

  const handleDbChange = useCallback(
    async (value: { value: string; label: string } | undefined) => {
      if (!value || !value.value) {
        return;
      }
      const prev = selectedDB;
      setSelectedDB(value);
      const ok = await versionDispatch.dbChange({ value: value.value });
      if (!ok) {
        setSelectedDB(prev);
        return;
      }

      const updatedDbs = [
        ...dbs.filter((db) => db.name === value.value),
        ...dbs.filter((db) => db.name !== value.value),
      ];
      versionDispatch.initDbs(updatedDbs);

      const selectedDbObject = dbs.find((db) => db.name === value.value);
      if (selectedDbObject) {
        fetch(selectedDbObject, 1, pageSize);
      } else {
        console.error('无法找到选中的数据源信息2');
      }
    },
    [dbs, versionDispatch, fetch, pageSize, selectedDB],
  );


  const setRowCurrent = useCallback((record: VersionRow) => {
    const fullIndex = (versions as VersionRow[]).findIndex((v) => v.id === record.id);
    versionDispatch.setCurrentVersion(record, fullIndex >= 0 ? fullIndex : 0);
  }, [versions, versionDispatch]);

  const renderSyncTag = (row: VersionRow) => {
    const bookmarkCmp = isVersionLessOrEqual(row.version, dbVersion);
    if (bookmarkCmp === null) {
      return (
        <Tag
          title={intl.formatMessage({ id: 'versionPage.pushBookmark.unknown.title' })}
          color="default"
          data-testid="version-push-bookmark-unknown-tag"
        >
          {intl.formatMessage({ id: 'versionPage.pushBookmark.unknown.label' })}
        </Tag>
      );
    }
    if (bookmarkCmp) {
      return (
        <Tag
          title={intl.formatMessage({ id: 'versionPage.pushBookmark.pushed.title' })}
          color="blue"
          data-testid="version-push-bookmark-tag"
        >
          {intl.formatMessage({ id: 'versionPage.pushBookmark.pushed.label' })}
        </Tag>
      );
    }
    if (synchronous[row.version]) {
      return (
        <Tag
          title={intl.formatMessage({ id: 'versionPage.pushBookmark.syncing.title' })}
          color="lime"
        >
          {intl.formatMessage({ id: 'versionPage.pushBookmark.syncing.label' })}
        </Tag>
      );
    }
    return (
      <Tag
        title={intl.formatMessage({ id: 'versionPage.pushBookmark.notPushed.title' })}
        color="default"
        data-testid="version-not-pushed-tag"
      >
        {intl.formatMessage({ id: 'versionPage.pushBookmark.notPushed.label' })}
      </Tag>
    );
  };

  const renderRowMeta = (row: VersionRow) => {
    const ch = Array.isArray(row.changes) ? row.changes : [];
    const { add, delete: del, update: upd } = countChanges(ch);
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
            aria-label={intl.formatMessage({ id: 'versionPage.row.tagsAria' })}
          >
            <span className="version-row-tags__label">
              {intl.formatMessage({ id: 'versionPage.row.tagsLabel' })}
            </span>
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
            aria-label={intl.formatMessage({ id: 'versionPage.row.changesAria' })}
          >
            <span className="version-row-changes__label">
              {intl.formatMessage({ id: 'versionPage.row.changesLabel' })}
            </span>
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
    const bookmarkGreater = isVersionGreater(row.version, dbVersion);
    const unsynced = bookmarkGreater === true;
    const bookmarkUnknown = bookmarkGreater === null;
    return [
      <CompareVersion key="detail" type={CompareVersionType.DETAIL} />,
      <Access key="submit-order" accessible={access.enterprise} fallback={<></>}>
        {unsynced ? (
          <CompareVersion
            type={CompareVersionType.DETAIL}
            buttonLabel={intl.formatMessage({ id: 'versionPage.action.submitOrder' })}
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
      <RevertVersion key="revert" synced={unsynced || bookmarkUnknown} />,
      <Access
        key="sync"
        accessible={access.canErdConnectorDbsync}
        fallback={<></>}
      >
        <SyncVersion synced={!unsynced && !bookmarkUnknown} version={row} />
      </Access>,
    ];
  };

  const emptyNode = tagFilter.trim() ? (
    <div data-testid="version-empty-filter">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={intl.formatMessage({ id: 'versionPage.empty.filter' })}
      />
    </div>
  ) : (
    <div data-testid="version-empty">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={intl.formatMessage({ id: 'versionPage.empty.noVersions' })}
      >
        <Access
          accessible={access.canErdHisprojectAdd}
          fallback={<></>}
        >
          <AddVersion
            trigger="empty"
            label={intl.formatMessage({ id: 'versionPage.empty.saveFirst' })}
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
          {dbs.length === 0 && (
            <div className="version-page__bar">
              <span className="version-page__hint">
                {intl.formatMessage({ id: 'versionPage.hint.noDatasource' })}
              </span>
            </div>
          )}

          <div className="version-page__toolbar" data-testid="version-toolbar">
            <Space wrap size={[4, 4]} className="version-page__toolbar-status">
              <VersionLayerStatusTag
                baselineLoaded={baselineLoaded}
                versionBaseline={versionBaseline}
                changes={changes}
              />
              <DualLayerLegend />
              <Space size={4}>
                <span className="version-page__toolbar-label">
                  {intl.formatMessage({ id: 'versionPage.toolbar.datasource' })}
                </span>
                <DataSourceSelect
                  value={selectedDB}
                  onChange={handleDbChange}
                  style={{ width: 180 }}
                  size="small"
                  loading={isLoading}
                />
              </Space>
            </Space>
            <Space wrap size={[4, 4]} className="version-page__toolbar-actions">
              <Input
                allowClear
                size="small"
                placeholder={intl.formatMessage({ id: 'versionPage.toolbar.tagFilterPlaceholder' })}
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                style={{ width: 140 }}
                data-testid="version-tag-filter"
                aria-label={intl.formatMessage({ id: 'versionPage.toolbar.tagFilterAria' })}
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
                accessible={access.canErdHisprojectInit}
                fallback={<></>}
              >
                <InitVersion/>
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
