import {
  Button,
  Card,
  Empty,
  Input,
  List,
  Popconfirm,
  Rate,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import {useEffect, useState} from 'react';
import {history, Link, useParams} from '@@/exports';
import * as cache from '@/utils/cache';
import {CONSTANT} from '@/utils/constant';
import {
  addCatalogComment,
  getCatalogTemplate,
  installCatalogTemplate,
  listCatalogComments,
  rateCatalogTemplate,
  reportCatalogComment,
  restrictCatalogCommenter,
  toggleCatalogComments,
  type CatalogComment,
  type CatalogTemplateDetail,
} from '@/services/catalog';
import CatalogPreviewPanel from './CatalogPreviewPanel';
import './catalog.scss';

const {Title, Paragraph, Text} = Typography;

export default function CatalogDetailPage() {
  const params = useParams<{id: string}>();
  const id = params.id ?? '';
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [detail, setDetail] = useState<CatalogTemplateDetail | null>(null);
  const [comments, setComments] = useState<CatalogComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const reloadComments = () => {
    if (!id) return;
    listCatalogComments(id, {page: 1, size: 50})
      .then((res) => {
        const data = res?.data ?? res;
        setComments(data?.records ?? []);
      })
      .catch(() => setComments([]));
  };

  const reload = () => {
    if (!id) return;
    setLoading(true);
    getCatalogTemplate(id)
      .then((res) => setDetail((res?.data ?? res) as CatalogTemplateDetail))
      .catch(() => message.error('模板不存在'))
      .finally(() => setLoading(false));
    reloadComments();
  };

  useEffect(() => {
    reload();
  }, [id]);

  const handleInstall = async () => {
    if (!id || !detail) return;
    const returnPath = `/catalog/${id}`;
    const isReinstall = detail.installed === true;
    const auth = cache.getItem('Authorization');
    if (!auth) {
      history.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    setInstalling(true);
    try {
      const res: any = await installCatalogTemplate(id);
      const data = res?.data ?? res;
      if (data?.projectId) {
        message.success(isReinstall ? '已创建新副本，正在打开…' : '已安装到你的项目');
        cache.setItem(CONSTANT.PROJECT_ID, String(data.projectId));
        history.push(`/design/table/model?projectId=${data.projectId}`);
        return;
      }
      if (res?.code === 401) {
        history.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }
      message.error(res?.msg || '安装失败，请先登录');
    } catch (e: any) {
      if (e?.data?.code === 401 || e?.response?.status === 401) {
        history.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }
      message.error(e?.data?.msg || e?.message || '安装失败');
    } finally {
      setInstalling(false);
    }
  };

  const handleRate = async (value: number) => {
    if (!id) return;
    if (!cache.getItem('Authorization')) {
      history.push(`/login?redirect=${encodeURIComponent(`/catalog/${id}`)}`);
      return;
    }
    try {
      await rateCatalogTemplate(id, value);
      message.success('感谢评分');
      reload();
    } catch (e: any) {
      message.error(e?.data?.msg || e?.message || '评分失败（须先安装）');
    }
  };

  const handleComment = async () => {
    if (!id || !commentBody.trim()) return;
    if (!cache.getItem('Authorization')) {
      history.push(`/login?redirect=${encodeURIComponent(`/catalog/${id}`)}`);
      return;
    }
    setCommentSubmitting(true);
    try {
      await addCatalogComment(id, commentBody.trim());
      message.success('评论已发布');
      setCommentBody('');
      reloadComments();
    } catch (e: any) {
      message.error(e?.data?.msg || e?.message || '评论失败（须先安装）');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleReport = async (commentId: string) => {
    if (!id) return;
    try {
      await reportCatalogComment(id, commentId);
      message.success('已举报，感谢反馈');
      reloadComments();
    } catch (e: any) {
      message.error(e?.data?.msg || e?.message || '举报失败');
    }
  };

  const handleRestrict = async (userId: string) => {
    if (!id) return;
    try {
      await restrictCatalogCommenter(id, userId);
      message.success('已限制该用户评论');
      reloadComments();
    } catch (e: any) {
      message.error(e?.data?.msg || e?.message || '操作失败');
    }
  };

  const handleToggleComments = async (enabled: boolean) => {
    if (!id) return;
    try {
      await toggleCatalogComments(id, enabled);
      message.success(enabled ? '已开启评论' : '已关闭评论');
      reload();
    } catch (e: any) {
      message.error(e?.data?.msg || e?.message || '操作失败');
    }
  };

  if (loading) {
    return (
      <div className="catalog-page" data-testid="catalog-detail-page">
        <Spin />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="catalog-page" data-testid="catalog-detail-page">
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
    <div className="catalog-page" data-testid="catalog-detail-page">
      <Button type="link" className="catalog-page__back" onClick={() => history.push('/catalog')}>
        ← 返回模板广场
      </Button>
      <Card>
        <Space direction="vertical" size={16} style={{width: '100%'}}>
          <div className="catalog-detail__hero">
            <div className="catalog-detail__identity">
              <Title level={2} className="catalog-page__title catalog-detail__title">
                {detail.title}
              </Title>
              <Space wrap className="catalog-detail__meta">
                {(detail.tags ?? []).map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
                <Text type="secondary" data-testid="catalog-install-count">
                  {detail.installCount} 次安装
                </Text>
                <Rate
                  disabled
                  allowHalf
                  value={detail.ratingAverage}
                  data-testid="catalog-rating-display"
                />
                <Text type="secondary" data-testid="catalog-rating-count">
                  ({detail.ratingCount} 人评分)
                </Text>
                <Link to={`/catalog/creator/${detail.authorHandle}`}>
                  {detail.authorDisplayName || detail.authorHandle}
                </Link>
              </Space>
              <Text type="secondary" className="catalog-detail__metrics">
                {moduleCount} 个模块 · {entityCount} 张表（安装后可编辑并保存版本）
              </Text>
            </div>
            <div className="catalog-detail__actions" data-testid="catalog-detail-action-bar">
              <Button
                type="primary"
                size="middle"
                loading={installing}
                data-testid="catalog-install-btn"
                aria-label={detail.installed ? '再次安装，创建新副本' : '安装到我的项目'}
                onClick={handleInstall}
              >
                {detail.installed ? '再次安装（创建新副本）' : '安装到我的项目'}
              </Button>
              {detail.installed ? (
                <div className="catalog-detail__my-rating">
                  <Text type="secondary">你的评分</Text>
                  <Rate
                    value={detail.userRating ?? 0}
                    onChange={handleRate}
                    data-testid="catalog-rate"
                  />
                </div>
              ) : (
                <Text type="secondary" className="catalog-detail__rate-hint">
                  安装后可评分
                </Text>
              )}
            </div>
          </div>
          <CatalogPreviewPanel projectJSON={detail.projectJSON} />
          {detail.description ? <Paragraph>{detail.description}</Paragraph> : null}
        </Space>
      </Card>

      <Card
        className="catalog-comments"
        title="评论"
        data-testid="catalog-comments-section"
        extra={
          detail.canManageComments ? (
            <Space>
              <Text type="secondary">评论开关</Text>
              <Switch
                checked={detail.commentsEnabled !== false}
                onChange={handleToggleComments}
                data-testid="catalog-comments-toggle"
              />
            </Space>
          ) : null
        }
      >
        {detail.commentsEnabled === false ? (
          <Text type="secondary">作者已关闭评论</Text>
        ) : detail.installed ? (
          <Space direction="vertical" style={{width: '100%'}} size={8}>
            <Input.TextArea
              rows={3}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="分享使用体验…"
              maxLength={2000}
              data-testid="catalog-comment-input"
            />
            <Button
              type="primary"
              loading={commentSubmitting}
              disabled={!commentBody.trim()}
              data-testid="catalog-comment-submit"
              onClick={handleComment}
            >
              发布评论
            </Button>
          </Space>
        ) : (
          <Text type="secondary">安装后可评论</Text>
        )}
        <List
          className="catalog-comments__list"
          dataSource={comments}
          locale={{emptyText: '暂无评论'}}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              data-testid={`catalog-comment-${item.id}`}
              actions={[
                !item.own ? (
                  <Button
                    key="report"
                    type="link"
                    size="small"
                    data-testid={`catalog-comment-report-${item.id}`}
                    onClick={() => handleReport(item.id)}
                  >
                    举报
                  </Button>
                ) : null,
                detail.canManageComments && !item.own ? (
                  <Popconfirm
                    key="restrict"
                    title="限制该用户在此模板下评论？"
                    onConfirm={() => handleRestrict(item.userId)}
                  >
                    <Button type="link" size="small" data-testid={`catalog-comment-restrict-${item.id}`}>
                      限制
                    </Button>
                  </Popconfirm>
                ) : null,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={item.username || item.userId}
                description={
                  <>
                    <div>{item.body}</div>
                    {item.createTime ? (
                      <Text type="secondary" style={{fontSize: 12}}>
                        {item.createTime}
                      </Text>
                    ) : null}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
