import { SNAPSHOT_DB_KEY } from './versionConstants';

/** CamelCase JDBC fields after save.js `updateFieldName`. */
const CREDENTIAL_KEYS = [
  'url',
  'username',
  'password',
  'driverClassName',
  'driver_class_name',
] as const;

/**
 * Resolve a persisted dataSources id from common FE aliases.
 * Snapshot channel / blank / "null" are not real ids.
 */
export function resolveConnectorDataSourceId(
  data: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const candidates = [data.dataSourceId, data.dbKey, data.key, data.id];
  for (const c of candidates) {
    if (c == null) {
      continue;
    }
    const s = String(c).trim();
    if (!s || s.toLowerCase() === 'null' || s === SNAPSHOT_DB_KEY) {
      continue;
    }
    return s;
  }
  return undefined;
}

/**
 * When a saved `dataSourceId` is present, prefer id and omit client JDBC overrides
 * (matches backend `ConnectorCredentialResolver` overwrite semantics).
 * Without id, keep raw credentials for test-connection / unsaved datasource UX.
 */
export function preferDataSourceIdPayload<T extends Record<string, unknown>>(
  data: T,
): T & { dataSourceId?: string } {
  const id = resolveConnectorDataSourceId(data);
  if (!id) {
    return { ...data };
  }
  const next: Record<string, unknown> = { ...data, dataSourceId: id };
  for (const k of CREDENTIAL_KEYS) {
    delete next[k];
  }
  return next as T & { dataSourceId: string };
}
