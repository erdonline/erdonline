import { getIntl } from '@umijs/max';

/** ADR-0033：非 React store 层在函数内取当前 locale，禁止 module scope 固化文案。 */
export function storeFmt(
  id: string,
  values?: Record<string, string | number>,
): string {
  return getIntl().formatMessage({ id }, values);
}
