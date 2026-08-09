import {Button, List, Space, Typography, message} from 'antd';
import {useEffect, useState} from 'react';
import {history} from '@@/exports';
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
      .catch(() => message.error('无审核权限或加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const review = async (id: string, action: 'approve' | 'reject') => {
    try {
      await request.post(`/ncnb/catalog/v1/submissions/${id}/${action}`, {
        data: action === 'reject' ? {note: '不符合上架标准'} : undefined,
      });
      message.success(action === 'approve' ? '已通过' : '已拒绝');
      reload();
    } catch (e: any) {
      message.error(e?.data?.msg || '操作失败');
    }
  };

  return (
    <div className="catalog-page catalog-page--maint" data-testid="catalog-review-page">
      <Button type="link" className="catalog-page__back" onClick={() => history.push('/catalog')}>
        ← 返回模板广场
      </Button>
      <div className="catalog-page__maint-panel">
        <h2>模板审核（维护者）</h2>
        <List
          loading={loading}
          dataSource={records}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="approve" type="link" onClick={() => review(item.id, 'approve')}>
                  通过
                </Button>,
                <Button key="reject" type="link" danger onClick={() => review(item.id, 'reject')}>
                  拒绝
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
