import React, {useEffect, useMemo, useState} from 'react';
import {DownOutlined, UpOutlined} from '@ant-design/icons';
import {Button, Segmented, Spin, Table, Tag, Typography, message} from 'antd';
import {useParams, history} from '@umijs/max';
import AuthBrandShell from '@/components/AuthBrandShell';
import ShareRelationCanvas from './ShareRelationCanvas';
import ShareEmptyState from './ShareEmptyState';
import {listDiagrams} from '@/utils/diagram';
import * as cache from '@/utils/cache';
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

const SharePage: React.FC = () => {
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
      const res = await fetch(`/ncnb/share/${encodeURIComponent(token)}/fork`, {
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
        message.error(json?.msg || '复制失败');
        return;
      }
      message.success('已复制到我的项目');
      history.push(`/design/table/model?projectId=${json.data.projectId}`);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '复制失败');
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
        setError('分享链接无效');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/ncnb/share/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (cancelled) {
          return;
        }
        if (json?.code !== 200) {
          setError(json?.msg || '分享不存在或已失效');
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
          setError(e instanceof Error ? e.message : '加载失败');
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
      (m.entities || []).forEach((e, ei) => {
        list.push({
          key: `${mi}-${ei}-${e.title}`,
          module: m.chnname || m.name || '-',
          table: e.title || '-',
          fields: e.fields?.length || 0,
        });
      });
    });
    return list;
  }, [modules]);

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
        <Spin size="large" tip="加载分享…" />
      </div>
    );
  }

  // 失效 / 无效：AuthBrandShell 同语言（ADR-0016）；激活漏斗主 CTA = 打开示例
  if (error) {
    return (
      <AuthBrandShell title="分享不可用" subtitle={error}>
        <div className="auth-shell__gate-actions" data-testid="share-invalid-gate">
          <Button type="primary" block onClick={() => history.push('/demo')}>
            打开示例 demo
          </Button>
          <Button block onClick={() => history.push('/')}>
            返回首页
          </Button>
        </div>
      </AuthBrandShell>
    );
  }

  const projectName = data?.projectName || '只读分享';
  const redirectQ = `?redirect=${encodeURIComponent(shareReturnPath)}`;

  return (
    <div className="share-page">
      <header className="erd-chrome-header share-page__header" data-testid="share-chrome-header">
        <div
          className="erd-chrome-brand"
          role="link"
          tabIndex={0}
          aria-label="ERD Online 首页"
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
          <Tag className="share-page__readonly-tag">只读</Tag>
        </div>
        <div className="erd-chrome-actions">
          <Button
            type="primary"
            loading={forking}
            onClick={onFork}
            aria-label="复制到我的项目"
          >
            复制到我的项目
          </Button>
          {!authed ? (
            <>
              <a
                className="erd-chrome-link"
                href={`/login${redirectQ}`}
                aria-label="登录"
                onClick={(e) => {
                  e.preventDefault();
                  history.push(`/login${redirectQ}`);
                }}
              >
                登录
              </a>
              <a
                className="erd-chrome-link"
                href={`/register${redirectQ}`}
                aria-label="注册"
                onClick={(e) => {
                  e.preventDefault();
                  history.push(`/register${redirectQ}`);
                }}
              >
                注册
              </a>
            </>
          ) : null}
        </div>
      </header>
      <main className="share-page__body">
        <div className="share-page__stage" data-testid="share-canvas-stage">
          <div className="share-page__meta" data-testid="share-page-meta">
            <p className="share-page__hint">
              匿名只读 · 登录后可「复制到我的项目」继续编辑并保存版本
            </p>
            {data?.description ? (
              <Typography.Paragraph
                className="share-page__desc"
                ellipsis={{ rows: 1, tooltip: true }}
              >
                {data.description}
              </Typography.Paragraph>
            ) : null}
            {modules.length > 1 ? (
              <Segmented
                size="small"
                className="share-page__module-switch"
                value={moduleKey}
                onChange={(v) => onModuleChange(String(v))}
                options={modules.map(m => ({
                  label: m.chnname || m.name || '模块',
                  value: m.name || m.chnname || '',
                }))}
              />
            ) : null}
            {diagrams.length > 1 ? (
              <div
                className="share-page__diagram-bar"
                data-testid="diagram-switcher"
                role="group"
                aria-label="切换关系图"
              >
                <Segmented
                  size="small"
                  value={activeDiagramId}
                  onChange={(v) => setDiagramId(String(v))}
                  options={diagrams.map((d) => ({
                    label: d.name,
                    value: d.id,
                  }))}
                />
              </div>
            ) : null}
          </div>
          {currentModule ? (
            <ShareRelationCanvas
              module={currentModule as React.ComponentProps<typeof ShareRelationCanvas>['module']}
              diagramId={activeDiagramId}
            />
          ) : (
            <ShareEmptyState message="该分享暂无模型" />
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
                ? '收起表清单'
                : `展开表清单（${rows.length}）`}
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
            aria-label="表清单"
          >
            <Typography.Title level={5} className="share-page__tables-title">
              表清单
            </Typography.Title>
            <Table
              size="small"
              pagination={false}
              dataSource={rows}
              locale={{emptyText: '暂无表'}}
              columns={[
                {title: '模块', dataIndex: 'module'},
                {title: '表', dataIndex: 'table'},
                {title: '字段数', dataIndex: 'fields', width: 90},
              ]}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default SharePage;
