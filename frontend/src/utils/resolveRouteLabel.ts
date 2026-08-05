import type { IntlShape } from '@umijs/max';

export type RouteNameSource = {
  nameKey?: string;
  name?: string;
};

/** ProLayout _defaultProps：nameKey 优先，name 仅作迁移兜底 */
export function resolveRouteLabel(intl: IntlShape, route: RouteNameSource): string {
  if (route.nameKey) {
    return intl.formatMessage({ id: route.nameKey });
  }
  return route.name ?? '';
}
