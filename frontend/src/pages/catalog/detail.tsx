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
import {history, Link, useIntl, useParams} from '@@/exports';
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
  const intl = useIntl();
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
      .catch(() => message.error(intl.formatMessage({id: 'catalog.detail.notFound'})))
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
        message.success(
          intl.formatMessage({
            id: isReinstall
              ? 'catalog.detail.reinstallSuccess'
              : 'catalog.detail.installSuccess',
          }),
        );
        cache.setItem(CONSTANT.PROJECT_ID, String(data.projectId));
        history.push(`/design/table/model?projectId=${data.projectId}`);
        return;
      }
      if (res?.code === 401) {
        history.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }
      message.error(res?.msg || intl.formatMessage({id: 'catalog.detail.installLoginError'}));
    } catch (e: any) {
      if (e?.data?.code === 401 || e?.response?.status === 401) {
        history.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }
      message.error(
        e?.data?.msg || e?.message || intl.formatMessage({id: 'catalog.detail.installError'}),
      );
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
      message.success(intl.formatMessage({id: 'catalog.detail.rateSuccess'}));
      reload();
    } catch (e: any) {
      message.error(
        e?.data?.msg || e?.message || intl.formatMessage({id: 'catalog.detail.rateError'}),
      );
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
      message.success(intl.formatMessage({id: 'catalog.detail.commentSuccess'}));
      setCommentBody('');
      reloadComments();
    } catch (e: any) {
      message.error(
        e?.data?.msg || e?.message || intl.formatMessage({id: 'catalog.detail.commentError'}),
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleReport = async (commentId: string) => {
    if (!id) return;
    try {
      await reportCatalogComment(id, commentId);
      message.success(intl.formatMessage({id: 'catalog.detail.reportSuccess'}));
      reloadComments();
    } catch (e: any) {
      message.error(
        e?.data?.msg || e?.message || intl.formatMessage({id: 'catalog.detail.reportError'}),
      );
    }
  };

  const handleRestrict = async (userId: string) => {
    if (!id) return;
    try {
      await restrictCatalogCommenter(id, userId);
      message.success(intl.formatMessage({id: 'catalog.detail.restrictSuccess'}));
      reloadComments();
    } catch (e: any) {
      message.error(
        e?.data?.msg || e?.message || intl.formatMessage({id: 'catalog.common.actionError'}),
      );
    }
  };

  const handleToggleComments = async (enabled: boolean) => {
    if (!id) return;
    try {
      await toggleCatalogComments(id, enabled);
      message.success(
        intl.formatMessage({
          id: enabled
            ? 'catalog.detail.commentsEnabled'
            : 'catalog.detail.commentsDisabled',
        }),
      );
      reload();
    } catch (e: any) {
      message.error(
        e?.data?.msg || e?.message || intl.formatMessage({id: 'catalog.common.actionError'}),
      );
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
        <Empty description={intl.formatMessage({id: 'catalog.detail.notFound'})}>
          <Button onClick={() => history.push('/catalog')}>
            {intl.formatMessage({id: 'catalog.backToCatalogShort'})}
          </Button>
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
        {intl.formatMessage({id: 'catalog.backToCatalog'})}
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
                  {intl.formatMessage(
                    {id: 'catalog.installCount'},
                    {count: detail.installCount},
                  )}
                </Text>
                <Rate
                  disabled
                  allowHalf
                  value={detail.ratingAverage}
                  data-testid="catalog-rating-display"
                />
                <Text type="secondary" data-testid="catalog-rating-count">
                  {intl.formatMessage(
                    {id: 'catalog.detail.ratingCount'},
                    {count: detail.ratingCount},
                  )}
                </Text>
                <Link to={`/catalog/creator/${detail.authorHandle}`}>
                  {detail.authorDisplayName || detail.authorHandle}
                </Link>
              </Space>
              <Text type="secondary" className="catalog-detail__metrics">
                {intl.formatMessage(
                  {id: 'catalog.detail.modelMetrics'},
                  {moduleCount, entityCount},
                )}
              </Text>
            </div>
            <div className="catalog-detail__actions" data-testid="catalog-detail-action-bar">
              <Button
                type="primary"
                size="middle"
                loading={installing}
                data-testid="catalog-install-btn"
                aria-label={intl.formatMessage({
                  id: detail.installed
                    ? 'catalog.detail.reinstallAria'
                    : 'catalog.detail.install',
                })}
                onClick={handleInstall}
              >
                {intl.formatMessage({
                  id: detail.installed
                    ? 'catalog.detail.reinstall'
                    : 'catalog.detail.install',
                })}
              </Button>
              {detail.installed ? (
                <div className="catalog-detail__my-rating">
                  <Text type="secondary">
                    {intl.formatMessage({id: 'catalog.detail.yourRating'})}
                  </Text>
                  <Rate
                    value={detail.userRating ?? 0}
                    onChange={handleRate}
                    data-testid="catalog-rate"
                  />
                </div>
              ) : (
                <Text type="secondary" className="catalog-detail__rate-hint">
                  {intl.formatMessage({id: 'catalog.detail.rateAfterInstall'})}
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
        title={intl.formatMessage({id: 'catalog.detail.comments.title'})}
        data-testid="catalog-comments-section"
        extra={
          detail.canManageComments ? (
            <Space>
              <Text type="secondary">
                {intl.formatMessage({id: 'catalog.detail.comments.toggle'})}
              </Text>
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
          <Text type="secondary">
            {intl.formatMessage({id: 'catalog.detail.comments.closed'})}
          </Text>
        ) : detail.installed ? (
          <Space direction="vertical" style={{width: '100%'}} size={8}>
            <Input.TextArea
              rows={3}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder={intl.formatMessage({id: 'catalog.detail.comments.placeholder'})}
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
              {intl.formatMessage({id: 'catalog.detail.comments.publish'})}
            </Button>
          </Space>
        ) : (
          <Text type="secondary">
            {intl.formatMessage({id: 'catalog.detail.comments.afterInstall'})}
          </Text>
        )}
        <List
          className="catalog-comments__list"
          dataSource={comments}
          locale={{emptyText: intl.formatMessage({id: 'catalog.detail.comments.empty'})}}
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
                    {intl.formatMessage({id: 'catalog.detail.comments.report'})}
                  </Button>
                ) : null,
                detail.canManageComments && !item.own ? (
                  <Popconfirm
                    key="restrict"
                    title={intl.formatMessage({id: 'catalog.detail.comments.restrictConfirm'})}
                    onConfirm={() => handleRestrict(item.userId)}
                  >
                    <Button type="link" size="small" data-testid={`catalog-comment-restrict-${item.id}`}>
                      {intl.formatMessage({id: 'catalog.detail.comments.restrict'})}
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
