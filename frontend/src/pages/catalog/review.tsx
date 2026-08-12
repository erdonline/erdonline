import {Button, List, Space, Typography, message} from 'antd';
import {useEffect, useState} from 'react';
import {history, useIntl} from '@@/exports';
import request from '@/utils/request';
import './catalog.scss';

const {Text} = Typography;

type SubmissionRow = {
  id: string;
  title: string;
  description?: string;
  createTime?: string;
};

export default function CatalogReviewPage() {
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<SubmissionRow[]>([]);

  const reload = () => {
    setLoading(true);
    request
      .get('/ncnb/catalog/v1/submissions', {params: {page: 1, size: 50}})
      .then((res: any) => {
        const data = res?.data ?? res;
        setRecords(data?.records ?? []);
      })
      .catch(() => message.error(intl.formatMessage({id: 'catalog.review.loadError'})))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const review = async (id: string, action: 'approve' | 'reject') => {
    try {
      await request.post(`/ncnb/catalog/v1/submissions/${id}/${action}`, {
        data:
          action === 'reject'
            ? {note: intl.formatMessage({id: 'catalog.review.rejectReason'})}
            : undefined,
      });
      message.success(
        intl.formatMessage({
          id:
            action === 'approve'
              ? 'catalog.review.approveSuccess'
              : 'catalog.review.rejectSuccess',
        }),
      );
      reload();
    } catch (e: any) {
      message.error(e?.data?.msg || intl.formatMessage({id: 'catalog.common.actionError'}));
    }
  };

  return (
    <div className="catalog-page catalog-page--maint" data-testid="catalog-review-page">
      <Button type="link" className="catalog-page__back" onClick={() => history.push('/catalog')}>
        {intl.formatMessage({id: 'catalog.backToCatalog'})}
      </Button>
      <div className="catalog-page__maint-panel">
        <h2>{intl.formatMessage({id: 'catalog.review.title'})}</h2>
        <List
          loading={loading}
          dataSource={records}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="approve" type="link" onClick={() => review(item.id, 'approve')}>
                  {intl.formatMessage({id: 'catalog.review.approve'})}
                </Button>,
                <Button key="reject" type="link" danger onClick={() => review(item.id, 'reject')}>
                  {intl.formatMessage({id: 'catalog.review.reject'})}
                </Button>,
              ]}
            >
              <Space direction="vertical" size={0}>
                <Text strong>{item.title}</Text>
                <Text type="secondary">{item.description}</Text>
                <Text type="secondary">{item.createTime}</Text>
              </Space>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
}
