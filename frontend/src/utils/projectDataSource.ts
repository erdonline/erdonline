/**
 * 项目 ↔ 数据源绑定（ADR-0008）：
 * profile 只保留 defaultDataSourceId；JDBC 机密只存在 data_sources。
 */

/** 从 profile 剥掉 JDBC 机密，并尽量回填 defaultDataSourceId */
export function sanitizeProfileDataSources(profile: any): any {
  if (!profile || typeof profile !== 'object') {
    return profile;
  }
  const next = {...profile};
  const dbs = Array.isArray(next.dbs) ? next.dbs : [];

  if (!next.defaultDataSourceId) {
    const def = dbs.find((d: any) => d?.defaultDB) || dbs[0];
    if (def?.key) {
      next.defaultDataSourceId = def.key;
    }
  }

  // 不再在 projectJSON 中保留任何连接明细
  next.dbs = [];
  return next;
}

/** 按项目绑定标记 defaultDB，供选择器/版本页使用 */
export function markDefaultDataSource(list: any[], defaultDataSourceId?: string): any[] {
  const arr = Array.isArray(list) ? list : [];
  if (!defaultDataSourceId) {
    return arr.map((db, i) => ({...db, defaultDB: i === 0}));
  }
  const has = arr.some((d) => d.key === defaultDataSourceId);
  return arr.map((db, i) => ({
    ...db,
    defaultDB: has ? db.key === defaultDataSourceId : i === 0,
  }));
}
