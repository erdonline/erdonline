import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Card, Empty, Segmented, Spin, Table, Typography} from 'antd';
import {useParams} from '@umijs/max';
import ShareRelationCanvas from './ShareRelationCanvas';

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

  return (
    <div style={{minHeight: '100vh', background: '#f5f5f5', padding: 24}}>
      <Card style={{maxWidth: 1100, margin: '0 auto'}}>
        <Typography.Title level={3} style={{marginTop: 0}}>
          {data?.projectName || '只读分享'}
        </Typography.Title>
        <Alert
          type="info"
          showIcon
          style={{marginBottom: 16}}
          message="只读分享"
          description="当前为匿名只读视图（含关系图），无法编辑或保存。"
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
