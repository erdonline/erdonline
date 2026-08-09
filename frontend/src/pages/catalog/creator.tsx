import {Button, Card, Empty, List, Space, Typography, message} from 'antd';
import {useEffect, useState} from 'react';
import {history, Link, useParams} from '@@/exports';
import {
  getCatalogCreator,
  type CatalogTemplateSummary,
} from '@/services/catalog';
import '../project/project-list.scss';
import './catalog.scss';

const {Title, Paragraph, Text} = Typography;

export default function CatalogCreatorPage() {
  const params = useParams<{handle: string}>();
  const handle = params.handle ?? '';
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [templates, setTemplates] = useState<CatalogTemplateSummary[]>([]);

  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    getCatalogCreator(handle)
      .then((res) => {
        const data = res?.data ?? res;
        setDisplayName(data?.displayName || handle);
        setTemplates(data?.templates ?? []);
      })
      .catch(() => message.error('作者不存在'))
      .finally(() => setLoading(false));
  }, [handle]);

  return (
    <div className="catalog-page project-list-page" data-testid="catalog-creator-page">
      <Button type="link" onClick={() => history.push('/catalog')} style={{paddingLeft: 0}}>
        ← 返回模板广场
      </Button>
      <Title level={2}>{displayName || handle}</Title>
      <Paragraph type="secondary">@{handle}</Paragraph>
      <List
        loading={loading}
        dataSource={templates}
        locale={{emptyText: <Empty description="暂无模板" />}}
        renderItem={(item) => (
          <List.Item>
            <Card
              hoverable
              style={{width: '100%'}}
              onClick={() => history.push(`/catalog/${item.slug || item.id}`)}
            >
              <Space direction="vertical">
                <Link to={`/catalog/${item.slug || item.id}`}>{item.title}</Link>
                <Text type="secondary">{item.description}</Text>
                <Text type="secondary">{item.installCount} 次安装</Text>
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
