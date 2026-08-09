import request from '@/utils/request';

export type CatalogTemplateSummary = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  authorHandle: string;
  authorDisplayName?: string;
  installCount: number;
  ratingAverage: number;
  ratingCount: number;
  official?: boolean;
  createTime?: string;
};

export type CatalogTemplateDetail = CatalogTemplateSummary & {
  projectJSON?: Record<string, unknown>;
  configJSON?: Record<string, unknown>;
  userRating?: number | null;
  installed?: boolean;
  commentsEnabled?: boolean;
  canManageComments?: boolean;
};

export type CatalogComment = {
  id: string;
  userId: string;
  username?: string;
  body: string;
  createTime?: string;
  own?: boolean;
};

export type CatalogCommentPage = {
  total: number;
  records: CatalogComment[];
};

export type CatalogPage<T> = {
  total: number;
  records: T[];
};

export type CatalogInstallResult = {
  projectId: string;
  projectName: string;
  templateId: string;
};

export const listCatalogTemplates = (params?: {
  q?: string;
  tag?: string;
  origin?: string;
  sort?: string;
  page?: number;
  size?: number;
}) =>
  request.get<CatalogPage<CatalogTemplateSummary>>('/ncnb/catalog/v1/templates', {
    params,
  });

export const getCatalogTemplate = (id: string) =>
  request.get<CatalogTemplateDetail>(`/ncnb/catalog/v1/templates/${encodeURIComponent(id)}`);

export const installCatalogTemplate = (id: string) =>
  request.post<CatalogInstallResult>(`/ncnb/catalog/v1/templates/${encodeURIComponent(id)}/install`);

export const rateCatalogTemplate = (id: string, score: number) =>
  request.post<boolean>(`/ncnb/catalog/v1/templates/${encodeURIComponent(id)}/rating`, {
    data: { score },
  });

export const getCatalogCreator = (handle: string) =>
  request.get<{ handle: string; displayName?: string; templates: CatalogTemplateSummary[] }>(
    `/ncnb/catalog/v1/creators/${encodeURIComponent(handle)}`,
  );

export const submitCatalogTemplate = (body: {
  projectId: string;
  title: string;
  description?: string;
  tags?: string;
}) => request.post('/ncnb/catalog/v1/submissions', { data: body });

export const listCatalogComments = (templateId: string, params?: { page?: number; size?: number }) =>
  request.get<CatalogCommentPage>(
    `/ncnb/catalog/v1/templates/${encodeURIComponent(templateId)}/comments`,
    { params },
  );

export const addCatalogComment = (templateId: string, body: string) =>
  request.post<CatalogComment>(
    `/ncnb/catalog/v1/templates/${encodeURIComponent(templateId)}/comments`,
    { data: { body } },
  );

export const reportCatalogComment = (templateId: string, commentId: string, reason?: string) =>
  request.post(
    `/ncnb/catalog/v1/templates/${encodeURIComponent(templateId)}/comments/${encodeURIComponent(commentId)}/report`,
    { data: reason ? { reason } : {} },
  );

export const toggleCatalogComments = (templateId: string, enabled: boolean) =>
  request.post<boolean>(
    `/ncnb/catalog/v1/templates/${encodeURIComponent(templateId)}/comments-enabled`,
    { data: { enabled } },
  );

export const restrictCatalogCommenter = (templateId: string, userId: string) =>
  request.post(
    `/ncnb/catalog/v1/templates/${encodeURIComponent(templateId)}/restrict-user`,
    { data: { userId } },
  );
