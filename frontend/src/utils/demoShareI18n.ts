import type { IntlShape } from '@umijs/max';

export const PUBLIC_DEMO_TOKEN = 'public-demo';

const DEMO_GROUP_KEYS: Record<string, string> = {
  f_detail: 'demo.group.detail',
  f_core: 'demo.group.core',
  f2_detail: 'demo.group.detail',
  f2_core: 'demo.group.core',
};

const DEMO_DIAGRAM_KEYS: Record<string, string> = {
  main: 'demo.diagram.main',
  d_session: 'demo.diagram.d_session',
};

const DEMO_ENTITY_KEYS = new Set([
  'sys_user',
  'sys_role',
  'sys_permission',
  'sys_user_role',
  'sys_role_permission',
  'sys_session',
  'sys_audit_log',
  'biz_order',
]);

export function isPublicDemoShare(token?: string | null): boolean {
  return token === PUBLIC_DEMO_TOKEN;
}

export function demoProjectName(intl: IntlShape): string {
  return intl.formatMessage({ id: 'demo.project.name' });
}

export function demoProjectDescription(intl: IntlShape): string {
  return intl.formatMessage({ id: 'demo.project.description' });
}

export function demoModuleLabel(intl: IntlShape, moduleKey?: string, fallback?: string): string {
  if (moduleKey === 'AUTHZ') {
    return intl.formatMessage({ id: 'demo.module.AUTHZ' });
  }
  return fallback || moduleKey || intl.formatMessage({ id: 'share.module.fallback' });
}

export function demoDiagramName(
  intl: IntlShape,
  diagramId?: string,
  fallback?: string,
): string {
  const key = diagramId ? DEMO_DIAGRAM_KEYS[diagramId] : undefined;
  if (key) {
    return intl.formatMessage({ id: key });
  }
  return fallback || diagramId || '';
}

export function demoGroupName(intl: IntlShape, groupId?: string, fallback?: string): string {
  const key = groupId ? DEMO_GROUP_KEYS[groupId] : undefined;
  if (key) {
    return intl.formatMessage({ id: key });
  }
  return fallback || '';
}

export function demoEntityChnname(
  intl: IntlShape,
  entityTitle?: string,
  fallback?: string,
): string | undefined {
  if (!entityTitle || !DEMO_ENTITY_KEYS.has(entityTitle)) {
    return fallback;
  }
  return intl.formatMessage({ id: `demo.entity.${entityTitle}`, defaultMessage: fallback });
}
