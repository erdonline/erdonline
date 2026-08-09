import {
  Button,
  Card,
  Empty,
  Rate,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {useEffect, useState} from 'react';
import {history, Link, useParams} from '@@/exports';
import * as cache from '@/utils/cache';
import {CONSTANT} from '@/utils/constant';
import {
  getCatalogTemplate,
  installCatalogTemplate,
  rateCatalogTemplate,
  type CatalogTemplateDetail,
} from '@/services/catalog';
import '../project/project-list.scss';
import './catalog.scss';

const {Title, Paragraph, Text} = Typography;

export default function CatalogDetailPage() {
  const params = useParams<{id: string}>();
  const id = params.id ?? '';
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [detail, setDetail] = useState<CatalogTemplateDetail | null>(null);

  const reload = () => {
    if (!id) return;
    setLoading(true);
    getCatalogTemplate(id)
      .then((res) => setDetail((res?.data ?? res) as CatalogTemplateDetail))
      .catch(() => message.error('模板不存在'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, [id]);

  const handleInstall = async () => {
    if (!id) return;
    setInstalling(true);
    try {
      const res: any = await installCatalogTemplate(id);
      const data = res?.data ?? res;
      if (data?.projectId) {
        message.success('已安装到你的项目');
        cache.setItem(CONSTANT.PROJECT_ID, String(data.projectId));
        history.push(`/design/table/model?projectId=${data.projectId}`);
        return;
      }
      message.error(res?.msg || '安装失败，请先登录');
    } catch (e: any) {
      message.error(e?.data?.msg || e?.message || '安装失败');
    } finally {
      setInstalling(false);
    }
  };

  const handleRate = async (value: number) => {
    if (!id) return;
    try {
      await rateCatalogTemplate(id, value);
      message.success('感谢评分');
      reload();
    } catch (e: any) {
      message.error(e?.data?.msg || e?.message || '评分失败（须先安装）');
    }
  };

  if (loading) {
    return (
      <div className="catalog-page project-list-page" data-testid="catalog-detail-page">
        <Spin />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="catalog-page project-list-page" data-testid="catalog-detail-page">
        <Empty description="模板不存在">
          <Button onClick={() => history.push('/catalog')}>返回广场</Button>
        </Empty>
      </div>
    );
  }

  const moduleCount = Array.isArray(detail.projectJSON?.modules)
    ? detail.projectJSON.modules.length
    : 0;
  const entityCount = Array.isArray(detail.projectJSON?.modules)
    ? detail.projectJSON.modules.reduce(
        (sum: number, m: {entities?: unknown[]}) => sum + (m.entities?.length ?? 0),
        0,
      )
    : 0;

  return (
    <div className="catalog-page project-list-page" data-testid="catalog-detail-page">
      <Button type="link" onClick={() => history.push('/catalog')} style={{paddingLeft: 0}}>
        ← 返回模板广场
      </Button>
      <Card>
        <Space direction="vertical" size={12} style={{width: '100%'}}>
          <Title level={2} style={{margin: 0}}>
            {detail.title}
          </Title>
          <Paragraph>{detail.description}</Paragraph>
          <Space wrap className="catalog-detail__meta">
            {(detail.tags ?? []).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            <Text type="secondary">{detail.installCount} 次安装</Text>
            <Rate disabled allowHalf value={detail.ratingAverage} />
            <Text type="secondary">({detail.ratingCount} 人评分)</Text>
            <Link to={`/catalog/creator/${detail.authorHandle}`}>
              {detail.authorDisplayName || detail.authorHandle}
            </Link>
          </Space>
          <Text type="secondary">
            预览：{moduleCount} 个模块 · {entityCount} 张表（安装后可编辑并保存版本）
          </Text>
          <Space className="catalog-detail__actions">
            <Button
              type="primary"
              loading={installing}
              data-testid="catalog-install-btn"
              onClick={handleInstall}
            >
              安装到我的项目
            </Button>
            {detail.installed ? (
              <Space>
                <Text>你的评分：</Text>
                <Rate
                  value={detail.userRating ?? 0}
                  onChange={handleRate}
                  data-testid="catalog-rate"
                />
              </Space>
            ) : (
              <Text type="secondary">安装后可评分</Text>
            )}
          </Space>
        </Space>
      </Card>
    </div>
  );
}
