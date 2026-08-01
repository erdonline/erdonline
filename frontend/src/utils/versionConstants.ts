/** 无 JDBC 数据源时的模型快照通道（仅落库版本，不同步 DDL） */
export const SNAPSHOT_DB_KEY = '__erd_snapshot__';

export const SNAPSHOT_DB = {
  key: SNAPSHOT_DB_KEY,
  name: '模型快照',
  defaultDB: true,
  isSnapshot: true,
} as const;

/** 根据已有版本列表建议下一个 semver（x.y.z） */
export function suggestNextVersion(versions: { version?: string }[]): string {
  if (!versions?.length) {
    return '1.0.0';
  }
  const latest = versions[0]?.version || '0.0.0';
  const parts = latest.replace(/[^\d.]/g, '').split('.').map((p) => parseInt(p, 10) || 0);
  while (parts.length < 3) {
    parts.push(0);
  }
  parts[2] += 1;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}
