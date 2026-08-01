import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Card, Empty, Spin, Table, Typography} from 'antd';
import {useParams} from '@umijs/max';

type SharePayload = {
  readonly?: boolean;
  projectName?: string;
  description?: string;
  projectJSON?: {
    modules?: Array<{
      name?: string;
      chnname?: string;
      entities?: Array<{ title?: string; chnname?: string; fields?: unknown[] }>;
      associations?: unknown[];
    }>;
  };
};

const SharePage: React.FC = () => {
  const {token} = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SharePayload | null>(null);

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

  const rows = useMemo(() => {
    const modules = data?.projectJSON?.modules || [];
    const list: Array<{ key: string; module: string; table: string; fields: number; relations: number }> = [];
    modules.forEach((m, mi) => {
      (m.entities || []).forEach((e, ei) => {
        list.push({
          key: `${mi}-${ei}-${e.title}`,
          module: m.chnname || m.name || '-',
          table: e.title || '-',
          fields: e.fields?.length || 0,
          relations: (m.associations || []).length,
        });
      });
    });
    return list;
  }, [data]);

  return (
    <div style={{minHeight: '100vh', background: '#f5f5f5', padding: 24}}>
      <Card style={{maxWidth: 960, margin: '0 auto'}}>
        <Typography.Title level={3} style={{marginTop: 0}}>
          {data?.projectName || '只读分享'}
        </Typography.Title>
        <Alert
          type="info"
          showIcon
          style={{marginBottom: 16}}
          message="只读分享"
          description="当前为匿名只读视图，无法编辑或保存。需要协作请登录后打开原项目。"
        />
        {data?.description ? (
          <Typography.Paragraph type="secondary">{data.description}</Typography.Paragraph>
        ) : null}
        <Spin spinning={loading}>
          {error ? (
            <Empty description={error}/>
          ) : (
            <Table
              size="small"
              pagination={false}
              dataSource={rows}
              locale={{emptyText: '暂无表'}}
              columns={[
                {title: '模块', dataIndex: 'module'},
                {title: '表', dataIndex: 'table'},
                {title: '字段数', dataIndex: 'fields', width: 90},
                {title: '模块关联数', dataIndex: 'relations', width: 110},
              ]}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default SharePage;
