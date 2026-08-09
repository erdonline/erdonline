import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Rate,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {useEffect, useState} from 'react';
import {history, Link} from '@@/exports';
import {
  listCatalogTemplates,
  type CatalogTemplateSummary,
} from '@/services/catalog';
import request from '@/utils/request';
import * as cache from '@/utils/cache';
import './catalog.scss';

const {Title, Paragraph, Text} = Typography;

export default function CatalogListPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CatalogTemplateSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('hot');
  const [origin, setOrigin] = useState<string | undefined>(undefined);
  const [showReviewLink, setShowReviewLink] = useState(false);

  useEffect(() => {
    if (!cache.getItem('Authorization')) {
      return;
    }
    request
      .get('/ncnb/catalog/v1/submissions', {params: {page: 1, size: 1}})
      .then(() => setShowReviewLink(true))
      .catch(() => setShowReviewLink(false));
  }, []);

  const fetchList = (nextPage = page, keyword = q, nextSort = sort, nextOrigin = origin) => {
    setLoading(true);
    listCatalogTemplates({
      q: keyword || undefined,
      origin: nextOrigin,
      sort: nextSort,
      page: nextPage,
      size: 12,
    })
      .then((res) => {
        const data = res?.data ?? res;
        setRecords(data?.records ?? []);
        setTotal(data?.total ?? 0);
      })
      .catch(() => message.error('加载模板失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList(1);
  }, [sort, origin]);

  return (
    <div className="catalog-page" data-testid="catalog-list-page">
      <div className="catalog-page__toolbar">
        <Title level={2} className="catalog-page__title">
          模板广场
        </Title>
        <Space wrap>
          <Input.Search
            placeholder="搜索模板"
            allowClear
            onSearch={(value) => {
              setQ(value);
              setPage(1);
              fetchList(1, value, sort, origin);
            }}
            aria-label="搜索模板"
            data-testid="catalog-search"
          />
          <Button
            type={sort === 'hot' ? 'primary' : 'default'}
            data-testid="catalog-sort-hot"
            onClick={() => setSort('hot')}
          >
            热门
          </Button>
          <Button
            type={sort === 'installs' ? 'primary' : 'default'}
            data-testid="catalog-sort-installs"
            onClick={() => setSort('installs')}
          >
            最多安装
          </Button>
          <Button
            type={sort === 'rating' ? 'primary' : 'default'}
            data-testid="catalog-sort-rating"
            onClick={() => setSort('rating')}
          >
            最高评分
          </Button>
          <Button
            type={sort === 'newest' ? 'primary' : 'default'}
            data-testid="catalog-sort-newest"
            onClick={() => setSort('newest')}
          >
            最新
          </Button>
          <Button
            type={origin === 'official' ? 'primary' : 'default'}
            data-testid="catalog-origin-official"
            onClick={() => setOrigin(origin === 'official' ? undefined : 'official')}
          >
            官方
          </Button>
          <Button
            type={origin === 'community' ? 'primary' : 'default'}
            data-testid="catalog-origin-community"
            onClick={() => setOrigin(origin === 'community' ? undefined : 'community')}
          >
            社区
          </Button>
          {showReviewLink ? (
            <Link to="/catalog/review" data-testid="catalog-review-link">
              模板审核
            </Link>
          ) : null}
        </Space>
      </div>

      <List
        grid={{gutter: 12, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4}}
        loading={loading}
        dataSource={records}
        locale={{
          emptyText: (
            <Empty description="暂无模板">
              <Button type="primary" onClick={() => history.push('/catalog/blank')}>
                从空白项目开始
              </Button>
            </Empty>
          ),
        }}
        pagination={{
          current: page,
          pageSize: 12,
          total,
          onChange: (p) => {
            setPage(p);
            fetchList(p);
          },
        }}
        renderItem={(item, index) => (
          <List.Item>
            <Card
              hoverable
              className="catalog-card"
              data-testid={index === 0 ? 'catalog-tile-first' : `catalog-tile-${item.id}`}
              onClick={() => history.push(`/catalog/${item.slug || item.id}`)}
            >
              <Space direction="vertical" size={8} style={{width: '100%'}}>
                <Title level={5} style={{margin: 0}}>
                  {item.title}
                </Title>
                <Paragraph type="secondary" ellipsis={{rows: 2}} style={{margin: 0, minHeight: 40}}>
                  {item.description || '暂无描述'}
                </Paragraph>
                <Space wrap size={4}>
                  {(item.tags ?? []).slice(0, 4).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                  {item.official ? <Tag color="blue">官方</Tag> : null}
                </Space>
                <Space split={<Text type="secondary">·</Text>}>
                  <Text type="secondary">{item.installCount} 次安装</Text>
                  <Rate disabled allowHalf value={item.ratingAverage} style={{fontSize: 12}} />
                  <Link
                    to={`/catalog/creator/${item.authorHandle}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.authorDisplayName || item.authorHandle}
                  </Link>
                </Space>
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
