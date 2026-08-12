import React, {useEffect, useMemo, useState} from 'react';
import {CopyOutlined, DownOutlined, UpOutlined} from '@ant-design/icons';
import {Button, Segmented, Spin, Table, Tag, Typography, message} from 'antd';
import {useIntl, useParams, history} from '@umijs/max';
import AuthBrandShell from '@/components/AuthBrandShell';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import ShareRelationCanvas from './ShareRelationCanvas';
import ShareEmptyState from './ShareEmptyState';
import {listDiagrams} from '@/utils/diagram';
import {
  demoDiagramName,
  demoModuleLabel,
  demoProjectDescription,
  demoProjectName,
  isPublicDemoShare,
} from '@/utils/demoShareI18n';
import * as cache from '@/utils/cache';
import {buildApiHref} from '@/utils/apiHref';
import {track} from '@/utils/analytics';
import {usePageSeo} from '@/hooks/usePageSeo';
import '@/layouts/erd-chrome.less';
import './index.less';

type ModuleData = {
  name?: string;
  chnname?: string;
  entities?: { title?: string; chnname?: string; fields?: unknown[] }[];
  associations?: unknown[];
  graphCanvas?: { nodes?: { id: string; x?: number; y?: number }[] };
  diagrams?: Array<{
    id: string;
    name: string;
    layout?: { nodes?: { id: string; x?: number; y?: number }[] };
    groups?: unknown[];
  }>;
};

type SharePayload = {
  readonly?: boolean;
  projectName?: string;
  description?: string;
  projectJSON?: {
    modules?: ModuleData[];
  };
};

/** 底栏表清单默认每页行数；密表防撑屏，demo（8 表）可走翻页 */
export const SHARE_TABLES_PAGE_SIZE = 5;

const SharePage: React.FC = () => {
  const intl = useIntl();
  usePageSeo('share.seo.title', 'share.seo.description');
  const {token} = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [forking, setForking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SharePayload | null>(null);
  const [moduleKey, setModuleKey] = useState<string>('');
  const [diagramId, setDiagramId] = useState<string>('');
  const [autoForkDone, setAutoForkDone] = useState(false);
  const [authed, setAuthed] = useState(() => Boolean(cache.getItem('Authorization')));
  /** 默认折叠：图为主平面；展开后表清单落在视口折线下 */
  const [tablesOpen, setTablesOpen] = useState(false);

  useEffect(() => {
    track(isPublicDemoShare(token) ? 'demo_open' : 'share_view', {token: token || ''});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [tablesPage, setTablesPage] = useState(1);
  const [tablesPageSize, setTablesPageSize] = useState(SHARE_TABLES_PAGE_SIZE);

  const shareReturnPath = token
    ? `/s/${token}?autofork=1`
    : '/';

  const onFork = async () => {
    if (!token) {
      return;
    }
    const auth = cache.getItem('Authorization');
    if (!auth) {
      history.push(`/login?redirect=${encodeURIComponent(shareReturnPath)}`);
      return;
    }
    setForking(true);
    try {
      const res = await fetch(buildApiHref(`/ncnb/share/${encodeURIComponent(token)}/fork`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json();
      if (res.status === 401 || json?.code === 401) {
        history.push(`/login?redirect=${encodeURIComponent(shareReturnPath)}`);
        return;
      }
      if (json?.code !== 200 || !json?.data?.projectId) {
        message.error(json?.msg || intl.formatMessage({ id: 'share.fork.failed' }));
        return;
      }
      message.success(intl.formatMessage({ id: 'share.fork.success' }));
      history.push(`/design/table/model?projectId=${json.data.projectId}`);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : intl.formatMessage({ id: 'share.fork.failed' }));
    } finally {
      setForking(false);
    }
  };

  useEffect(() => {
    setAuthed(Boolean(cache.getItem('Authorization')));
  }, [loading, error, data]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) {
        setError(intl.formatMessage({ id: 'share.error.invalidLink' }));
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(buildApiHref(`/ncnb/share/${encodeURIComponent(token)}`));
        const json = await res.json();
        if (cancelled) {
          return;
        }
        if (json?.code !== 200) {
          setError(json?.msg || intl.formatMessage({ id: 'share.error.notFound' }));
          setData(null);
        } else {
          setData(json.data);
          const mods = json.data?.projectJSON?.modules || [];
          const firstMod = mods[0];
          setModuleKey(firstMod?.name || firstMod?.chnname || '');
          const firstDiagram = listDiagrams(firstMod)[0];
          setDiagramId(firstDiagram?.id || '');
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : intl.formatMessage({ id: 'share.error.loadFailed' }));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // 登录/注册带回 ?autofork=1 时自动复制，少点一次
  useEffect(() => {
    if (loading || error || !data || !token || autoForkDone || forking) {
      return;
    }
    const want = new URLSearchParams(window.location.search).get('autofork') === '1';
    if (!want || !cache.getItem('Authorization')) {
      return;
    }
    setAutoForkDone(true);
    onFork();
  }, [loading, error, data, token, autoForkDone, forking]);

  const isDemoShare = isPublicDemoShare(token);

  const modules = data?.projectJSON?.modules || [];
  const currentModule = useMemo(
    () => modules.find(m => (m.name || m.chnname) === moduleKey) || modules[0],
    [modules, moduleKey],
  );
  const diagrams = useMemo(() => listDiagrams(currentModule), [currentModule]);
  const activeDiagramId = useMemo(() => {
    if (diagramId && diagrams.some((d) => d.id === diagramId)) {
      return diagramId;
    }
    return diagrams[0]?.id || '';
  }, [diagramId, diagrams]);

  const onModuleChange = (v: string) => {
    setModuleKey(v);
    const next = modules.find((m) => (m.name || m.chnname) === v) || modules[0];
    setDiagramId(listDiagrams(next)[0]?.id || '');
  };

  const rows = useMemo(() => {
    const list: { key: string; module: string; table: string; fields: number }[] = [];
    modules.forEach((m, mi) => {
      const moduleLabel = isDemoShare
        ? demoModuleLabel(intl, m.name || m.chnname, m.chnname || m.name)
        : (m.chnname || m.name || '-');
      (m.entities || []).forEach((e, ei) => {
        list.push({
          key: `${mi}-${ei}-${e.title}`,
          module: moduleLabel,
          table: e.title || '-',
          fields: e.fields?.length || 0,
        });
      });
    });
    return list;
  }, [modules, isDemoShare, intl]);

  // 表数变少时（换模块/载荷）夹紧页码，避免空页
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(rows.length / tablesPageSize) || 1);
    if (tablesPage > maxPage) {
      setTablesPage(maxPage);
    }
  }, [rows.length, tablesPage, tablesPageSize]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--erd-surface-sunk)',
        }}
      >
        <Spin size="large" tip={intl.formatMessage({ id: 'share.loading' })} />
      </div>
    );
  }

  // 失效 / 无效：AuthBrandShell 同语言（ADR-0016）；激活漏斗主 CTA = 打开示例
  if (error) {
    return (
      <AuthBrandShell
        title={intl.formatMessage({ id: 'share.invalid.title' })}
        subtitle={error}
        skipLabel={intl.formatMessage({ id: 'common.skipMainAction' })}
        skipTargetId="exception-main-cta"
      >
        <div
          className="auth-shell__gate-actions"
          id="exception-main-cta"
          tabIndex={-1}
          data-testid="share-invalid-gate"
        >
          <Button type="primary" block onClick={() => history.push('/demo')}>
            {intl.formatMessage({ id: 'exception.cta.openDemo' })}
          </Button>
          <Button block onClick={() => history.push('/')}>
            {intl.formatMessage({ id: 'exception.cta.backHome' })}
          </Button>
        </div>
      </AuthBrandShell>
    );
  }

  const projectName = isDemoShare
    ? demoProjectName(intl)
    : (data?.projectName || intl.formatMessage({ id: 'share.defaultProjectName' }));
  const projectDescription = isDemoShare
    ? demoProjectDescription(intl)
    : data?.description;
  const redirectQ = `?redirect=${encodeURIComponent(shareReturnPath)}`;

  const focusSkipTarget = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.focus({preventScroll: false});
    el.scrollIntoView({block: 'nearest'});
  };

  return (
    <div className="share-page">
      <nav
        className="erd-skip-nav"
        aria-label={intl.formatMessage({id: 'common.skipNav'})}
        data-testid="share-skip-nav"
      >
        <a
          href="#share-canvas-stage"
          className="erd-skip-link"
          data-testid="share-skip-canvas"
          onClick={(e) => {
            e.preventDefault();
            focusSkipTarget('share-canvas-stage');
          }}
        >
          {intl.formatMessage({ id: 'share.skip.canvas' })}
        </a>
      </nav>
      <header className="erd-chrome-header share-page__header" data-testid="share-chrome-header">
        <div
          className="erd-chrome-brand"
          role="link"
          tabIndex={0}
          aria-label={intl.formatMessage({ id: 'landing.nav.brandAria' })}
          onClick={() => history.push('/')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              history.push('/');
            }
          }}
        >
          <img src="/logo.svg" alt="" width={28} height={28} />
          <span>ERD Online</span>
        </div>
        <div className="share-page__project">
          <Typography.Title level={4} className="share-page__project-name">
            {projectName}
          </Typography.Title>
          <Tag className="share-page__readonly-tag">
            {intl.formatMessage({ id: 'share.readonly.tag' })}
          </Tag>
        </div>
        <div className="erd-chrome-actions" data-testid="erd-chrome-actions">
          <LocaleSwitcher variant="chrome" />
          <Button
            type="primary"
            icon={!forking ? <CopyOutlined /> : undefined}
            loading={forking}
            onClick={onFork}
            aria-label={intl.formatMessage({ id: 'share.fork.aria' })}
          >
            {intl.formatMessage({ id: 'share.fork.cta' })}
          </Button>
          {!authed ? (
            <>
              <a
                className="erd-chrome-link"
                href={`/login${redirectQ}`}
                aria-label={intl.formatMessage({ id: 'share.loginAria' })}
                onClick={(e) => {
                  e.preventDefault();
                  history.push(`/login${redirectQ}`);
                }}
              >
                {intl.formatMessage({ id: 'share.login' })}
              </a>
              <a
                className="erd-chrome-link"
                href={`/register${redirectQ}`}
                aria-label={intl.formatMessage({ id: 'share.registerAria' })}
                onClick={(e) => {
                  e.preventDefault();
                  history.push(`/register${redirectQ}`);
                }}
              >
                {intl.formatMessage({ id: 'share.register' })}
              </a>
            </>
          ) : null}
        </div>
      </header>
      <main className="share-page__body">
        <div
          id="share-canvas-stage"
          className="share-page__stage"
          data-testid="share-canvas-stage"
          tabIndex={-1}
        >
          <div className="share-page__meta" data-testid="share-page-meta">
            <div className="share-page__meta-row">
              <p className="share-page__hint">
                <strong className="share-page__hint-strong">
                  {intl.formatMessage({ id: 'share.hint.anonymousStrong' })}
                </strong>
                {' · '}
                {intl.formatMessage({ id: 'share.hint.anonymousRest' })}
              </p>
              {(modules.length > 1 || diagrams.length > 1) ? (
                <div className="share-page__meta-switches">
                  {modules.length > 1 ? (
                    <div
                      className="share-page__module-switch-wrap"
                      role="group"
                      aria-label={intl.formatMessage({ id: 'share.moduleSwitch.aria' })}
                      data-testid="module-switcher"
                    >
                      <Segmented
                        size="small"
                        className="share-page__module-switch"
                        value={moduleKey}
                        onChange={(v) => onModuleChange(String(v))}
                        options={modules.map(m => ({
                          label: isDemoShare
                            ? demoModuleLabel(intl, m.name || m.chnname, m.chnname || m.name)
                            : (m.chnname || m.name || intl.formatMessage({ id: 'share.module.fallback' })),
                          value: m.name || m.chnname || '',
                        }))}
                      />
                    </div>
                  ) : null}
                  {diagrams.length > 1 ? (
                    <div
                      className="share-page__diagram-bar"
                      data-testid="diagram-switcher"
                      role="group"
                      aria-label={intl.formatMessage({ id: 'share.diagramSwitch.aria' })}
                    >
                      <Segmented
                        size="small"
                        value={activeDiagramId}
                        onChange={(v) => setDiagramId(String(v))}
                        options={diagrams.map((d) => ({
                          label: isDemoShare
                            ? demoDiagramName(intl, d.id, d.name)
                            : d.name,
                          value: d.id,
                        }))}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            {projectDescription ? (
              <Typography.Paragraph
                className="share-page__desc"
                ellipsis={{ rows: 1, tooltip: true }}
              >
                {projectDescription}
              </Typography.Paragraph>
            ) : null}
          </div>
          {currentModule ? (
            <ShareRelationCanvas
              module={currentModule as React.ComponentProps<typeof ShareRelationCanvas>['module']}
              diagramId={activeDiagramId}
              shareToken={token}
            />
          ) : (
            <ShareEmptyState message={intl.formatMessage({ id: 'share.empty.noModel' })} />
          )}
          <button
            type="button"
            className="share-page__tables-toggle"
            data-testid="share-tables-toggle"
            aria-expanded={tablesOpen}
            aria-controls="share-tables-panel"
            onClick={() => setTablesOpen((open) => !open)}
          >
            <span className="share-page__tables-toggle-label">
              {tablesOpen
                ? intl.formatMessage({ id: 'share.tables.toggle.collapse' })
                : intl.formatMessage(
                    { id: 'share.tables.toggle.expand' },
                    { count: rows.length },
                  )}
            </span>
            {tablesOpen ? <UpOutlined aria-hidden /> : <DownOutlined aria-hidden />}
          </button>
        </div>
        {tablesOpen ? (
          <div
            id="share-tables-panel"
            className="share-page__tables"
            data-testid="share-tables-panel"
            role="region"
            aria-label={intl.formatMessage({ id: 'share.tables.aria' })}
          >
            <Typography.Title level={5} className="share-page__tables-title">
              {intl.formatMessage({ id: 'share.tables.title' })}
            </Typography.Title>
            <Table
              size="small"
              dataSource={rows}
              locale={{emptyText: intl.formatMessage({ id: 'share.tables.empty' })}}
              pagination={{
                size: 'small',
                current: tablesPage,
                pageSize: tablesPageSize,
                total: rows.length,
                showSizeChanger: true,
                pageSizeOptions: ['5', '10', '20', '50'],
                hideOnSinglePage: true,
                showTotal: (total) =>
                  intl.formatMessage({ id: 'share.tables.total' }, { total }),
                onChange: (page, pageSize) => {
                  setTablesPage(page);
                  setTablesPageSize(pageSize);
                },
              }}
              data-testid="share-tables-table"
              columns={[
                {title: intl.formatMessage({ id: 'share.tables.col.module' }), dataIndex: 'module'},
                {title: intl.formatMessage({ id: 'share.tables.col.table' }), dataIndex: 'table'},
                {
                  title: intl.formatMessage({ id: 'share.tables.col.fields' }),
                  dataIndex: 'fields',
                  width: 90,
                },
              ]}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default SharePage;
