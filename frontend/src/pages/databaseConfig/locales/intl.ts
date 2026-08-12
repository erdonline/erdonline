import { getIntl } from '@umijs/max';

/** ADR-0033: call inside functions only — never at module scope. */
export function datasourceIntl(
  id: string,
  values?: Record<string, string | number | boolean>,
) {
  return getIntl().formatMessage({ id }, values);
}
