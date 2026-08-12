import {Button, Card, Empty, List, Space, Typography, message} from 'antd';
import {useEffect, useState} from 'react';
import {history, Link, useIntl, useParams} from '@@/exports';
import {
  getCatalogCreator,
  type CatalogTemplateSummary,
} from '@/services/catalog';
import './catalog.scss';

const {Title, Paragraph, Text} = Typography;

export default function CatalogCreatorPage() {
  const intl = useIntl();
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
      .catch(() => message.error(intl.formatMessage({id: 'catalog.creator.notFound'})))
      .finally(() => setLoading(false));
  }, [handle]);

  return (
    <div className="catalog-page" data-testid="catalog-creator-page">
      <Button type="link" className="catalog-page__back" onClick={() => history.push('/catalog')}>
        {intl.formatMessage({id: 'catalog.backToCatalog'})}
      </Button>
      <Title level={2} className="catalog-page__title">
        {displayName || handle}
      </Title>
      <Paragraph className="catalog-page__subtitle">@{handle}</Paragraph>
      <List
        loading={loading}
        dataSource={templates}
        locale={{
          emptyText: <Empty description={intl.formatMessage({id: 'catalog.empty.templates'})} />,
        }}
        renderItem={(item) => (
          <List.Item>
            <Card
              hoverable
              className="catalog-card"
              style={{width: '100%'}}
              onClick={() => history.push(`/catalog/${item.slug || item.id}`)}
            >
              <Space direction="vertical">
                <Link to={`/catalog/${item.slug || item.id}`}>{item.title}</Link>
                <Text type="secondary">{item.description}</Text>
                <Text type="secondary">
                  {intl.formatMessage(
                    {id: 'catalog.installCount'},
                    {count: item.installCount},
                  )}
                </Text>
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
