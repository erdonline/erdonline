import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Button, Card, Empty, Segmented, Space, Spin, Table, Typography, message} from 'antd';
import {useParams, history} from '@umijs/max';
import ShareRelationCanvas from './ShareRelationCanvas';
import * as cache from '@/utils/cache';

type ModuleData = {
  name?: string;
  chnname?: string;
  entities?: Array<{ title?: string; chnname?: string; fields?: unknown[] }>;
  associations?: unknown[];
  graphCanvas?: { nodes?: Array<{ id: string; x?: number; y?: number }> };
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
          setModuleKey(mods[0]?.name || mods[0]?.chnname || '');
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || '加载失败');
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

  const modules = data?.projectJSON?.modules || [];
  const currentModule = useMemo(
    () => modules.find(m => (m.name || m.chnname) === moduleKey) || modules[0],
    [modules, moduleKey],
  );

  const rows = useMemo(() => {
    const list: Array<{ key: string; module: string; table: string; fields: number }> = [];
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

  const onFork = async () => {
    if (!token) {
      return;
    }
    const auth = cache.getItem('Authorization');
    if (!auth) {
      history.push(`/login?redirect=${encodeURIComponent(`/s/${token}`)}`);
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
        history.push(`/login?redirect=${encodeURIComponent(`/s/${token}`)}`);
        return;
      }
      if (json?.code !== 200 || !json?.data?.projectId) {
        message.error(json?.msg || '复制失败');
        return;
      }
      message.success('已复制到我的项目');
      history.push(`/design/table/model?projectId=${json.data.projectId}`);
    } catch (e: any) {
      message.error(e?.message || '复制失败');
    } finally {
      setForking(false);
    }
  };

  return (
    <div style={{minHeight: '100vh', background: '#f5f5f5', padding: 24}}>
      <Card style={{maxWidth: 1100, margin: '0 auto'}}>
        <Space style={{width: '100%', justifyContent: 'space-between', marginBottom: 8}} align="start">
          <Typography.Title level={3} style={{marginTop: 0, marginBottom: 0}}>
            {data?.projectName || '只读分享'}
          </Typography.Title>
          {!error && data ? (
            <Space>
              <Button
                type="primary"
                loading={forking}
                onClick={onFork}
                aria-label="复制到我的项目"
              >
                复制到我的项目
              </Button>
              {token ? (
                <Button
                  type="default"
                  aria-label="注册并带回"
                  onClick={() =>
                    history.push(`/register?redirect=${encodeURIComponent(`/s/${token}`)}`)
                  }
                >
                  注册并带回
                </Button>
              ) : null}
            </Space>
          ) : null}
        </Space>
        <Alert
          type="info"
          showIcon
          style={{marginBottom: 16}}
          message="只读分享"
          description="匿名只读。登录或注册后可「复制到我的项目」继续编辑并产生版本保存。"
        />
        {data?.description ? (
          <Typography.Paragraph type="secondary">{data.description}</Typography.Paragraph>
        ) : null}
        <Spin spinning={loading}>
          {error ? (
            <Empty description={error}/>
          ) : (
            <>
              {modules.length > 1 ? (
                <Segmented
                  style={{marginBottom: 12}}
                  value={moduleKey}
                  onChange={(v) => setModuleKey(String(v))}
                  options={modules.map(m => ({
                    label: m.chnname || m.name || '模块',
                    value: m.name || m.chnname || '',
                  }))}
                />
              ) : null}
              {currentModule ? <ShareRelationCanvas module={currentModule as any}/> : null}
              <Typography.Title level={5} style={{marginTop: 20}}>表清单</Typography.Title>
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
            </>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default SharePage;
