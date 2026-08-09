import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import shallow from "zustand/shallow";
import useVersionStore from "@/store/version/useVersionStore";
import './index.less';
import {isVersionGreater, isVersionLessOrEqual} from "@/utils/string";
import {Button, Empty, Input, List, message, Space, Tag} from "antd";
import {MoreOutlined} from "@ant-design/icons";
import AddVersion from "@/components/dialog/version/AddVersion";
import SyncConfig from "@/components/dialog/version/SyncConfig";
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

/**
 * 溢出菜单容器：自制轻量弹层，不用 antd Dropdown/Trigger。
 *
 * 原因：菜单里的操作（编辑/删除/复刻/同步/重建版本/同步配置…）大多是「点了就开一个
 * 自带 Modal 的组件」，Modal 默认 portal 到 document.body、脱离菜单 popup 子树。
 * antd Dropdown 一旦判定用户点击落在 popup 之外（哪怕是点了自己弹出来的 Modal 里的
 * 确定/取消按钮），就会收起并（无论是否设置 destroyOnHidden）在关闭动画结束后把
 * popup 子树连带其中的 Modal 一起卸载——用户填表填到一半，触发按钮和 Modal 同时消失。
 *
 * 因此这里的面板**始终挂载**在 document.body（只用 CSS display 切换可见性），
 * 从不因为「关闭菜单」而卸载 `items`——items 里各触发组件（SyncVersion/CopyProject
 * 等）的内部 Modal state 因此永不受菜单开关影响。菜单本身**不**在点击内部项后自动
 * 收起：点击「同步/编辑/删除…」后 Modal 会覆盖在上层，用户关闭 Modal 后期望焦点
 * 归还到刚点的触发按钮——若顺手收起菜单，触发按钮跟着隐藏，焦点无处可归。收起
 * 只在点击面板外（且非 Modal/Confirm 内容）时发生，与 antd Dropdown 默认语义一致。
 */
const MoreMenu: React.FC<{
  items: React.ReactNode[];
  triggerTestId: string;
  menuTestId: string;
  label: string;
  ariaLabel: string;
  linkStyle?: boolean;
}> = ({ items, triggerTestId, menuTestId, label, ariaLabel, linkStyle }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // 点触发钮**只开不切换**（不做「已展开再点一次收起」的 toggle）：菜单内点项后
  // 不主动收起（见上方注释），意味着 open 状态会在「打开→点项→Modal 关闭」这轮
  // 交互结束后仍停留在 true——若行的版本号后续变化（重命名/回滚使某行版本号更新），
  // List.Item 按 key=row.id 复用同一个 MoreMenu 实例，其 open 状态原样保留。用户再次
  // 点「更多」时如果这里做 toggle，会把「上一轮遗留的 open=true」直接翻成 false，
  // 表现为「点了却没打开」。因此改为幂等式打开：只要点了触发钮就保证展开、并刷新
  // 定位；收起只交给「点击面板外」/ Escape。
  const openMenu = () => {
    // 互斥：同一页只能有一个溢出菜单展开，避免 portal 层叠挡点击其它行的「更多」
    window.dispatchEvent(
      new CustomEvent('erd-version-more-menu-open', { detail: { id: menuTestId } }),
    );
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 180) });
    }
    setOpen(true);
  };

  useEffect(() => {
    const onPeerOpen = (e: Event) => {
      const peerId = (e as CustomEvent<{ id?: string }>).detail?.id;
      if (peerId && peerId !== menuTestId) {
        setOpen(false);
      }
    };
    window.addEventListener('erd-version-more-menu-open', onPeerOpen);
    return () => window.removeEventListener('erd-version-more-menu-open', onPeerOpen);
  }, [menuTestId]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (btnRef.current?.contains(target)) return;
      // 面板内点击（编辑/删除/复刻/同步…）不在这里收起：见 openMenu 上方注释，
      // 收起会让触发按钮跟着隐藏，Modal 关闭后 focusTriggerAfterClose 找不到焦点归宿。
      if (panelRef.current?.contains(target)) return;
      if (target?.closest?.('[role="dialog"]')) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        ref={btnRef}
        type={linkStyle ? 'link' : 'default'}
        size="small"
        icon={<MoreOutlined />}
        data-testid={triggerTestId}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={openMenu}
      >
        {label}
      </Button>
      {createPortal(
        <div
          ref={panelRef}
          className="version-page__more-menu"
          data-testid={menuTestId}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 1050,
            display: open ? 'flex' : 'none',
          }}
        >
          {items}
        </div>,
        document.body,
      )}
    </>
  );
};

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
        versionDispatch.initDbs(databases || []);
        const currentDb = useVersionStore.getState().dispatch.getCurrentDBData();
        if (currentDb?.name && !currentDb.isSnapshot) {
          setSelectedDB({ value: currentDb.name, label: currentDb.name });
        }
        await fetch(null, 1, pageSize);
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
    // 切换 hover 行时收起其它行的溢出菜单，避免 portal 层叠挡点击
    window.dispatchEvent(
      new CustomEvent('erd-version-more-menu-open', { detail: { id: `hover-${record.id}` } }),
    );
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

    // Git 心智：每行只留「详情」（=diff-against-parent）「回滚」（=checkout）两个主操作；
    // 编辑/删除/复刻/推送同步都是低频次要操作，收进「更多」溢出菜单，减少行内图标噪音。
    const moreItems: React.ReactNode[] = [];
    if (access.enterprise && unsynced) {
      moreItems.push(
        <CompareVersion
          key="submit-order"
          type={CompareVersionType.DETAIL}
          buttonLabel={intl.formatMessage({ id: 'versionPage.action.submitOrder' })}
          testId="version-submit-order-btn"
        />,
      );
    }
    if (access.canErdHisprojectEdit) {
      moreItems.push(<RenameVersion key="rename" />);
    }
    if (access.canErdHisprojectDel) {
      moreItems.push(<RemoveVersion key="remove" />);
    }
    moreItems.push(<CopyProject key="copy" projectJSON={row.projectJSON} />);
    if (access.canErdConnectorDbsync) {
      moreItems.push(
        <SyncVersion key="sync" synced={!unsynced && !bookmarkUnknown} version={row} />,
      );
    }

    return [
      <CompareVersion key="detail" type={CompareVersionType.DETAIL} />,
      <RevertVersion key="revert" />,
      <MoreMenu
        key="more"
        items={moreItems}
        triggerTestId="row-more-btn"
        menuTestId={`row-more-menu-${row.id}`}
        label={intl.formatMessage({ id: 'versionPage.action.more' })}
        ariaLabel={intl.formatMessage({ id: 'versionPage.action.more' })}
        linkStyle
      />,
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
              <MoreMenu
                items={[
                  ...(access.canErdHisprojectConfig ? [<SyncConfig key="sync-config" />] : []),
                  ...(access.canErdHisprojectRebuild ? [<RebuildVersion key="rebuild" />] : []),
                ]}
                triggerTestId="version-toolbar-more-btn"
                menuTestId="version-toolbar-more-menu"
                label={intl.formatMessage({ id: 'versionPage.toolbar.more' })}
                ariaLabel={intl.formatMessage({ id: 'versionPage.toolbar.moreAria' })}
              />
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
