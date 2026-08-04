/** B-layer probe status (mirrors backend SchemaProbeStatus). */
export type SchemaProbeStatus = 'SYNCED' | 'AHEAD' | 'BEHIND' | 'DIVERGED' | 'UNKNOWN';

/** Machine-readable unknown / skip reasons (mirrors backend + client-only). */
export type SchemaProbeReason =
  | 'PROBE_NO_DATASOURCE'
  | 'PROBE_NOT_PROBED'
  | 'PROBE_CONNECTION_FAILED'
  | 'PROBE_NO_PERMISSION'
  | 'PROBE_REVERSE_EMPTY'
  | 'PROBE_NO_MODEL'
  | 'FINGERPRINT_MISMATCH'
  | 'PROBE_ACL_DENIED';

export type ProbeResult = {
  status?: SchemaProbeStatus;
  fingerprint?: string;
  modelFingerprint?: string;
  checkedAt?: string;
  tableCount?: number;
  reason?: SchemaProbeReason;
  message?: string;
};

export const STATUS_LABEL: Record<SchemaProbeStatus, string> = {
  SYNCED: '实库一致',
  AHEAD: '模型领先',
  BEHIND: '实库领先',
  DIVERGED: '双向分叉',
  UNKNOWN: '实库未知',
};

export const STATUS_COLOR: Record<SchemaProbeStatus, string> = {
  SYNCED: 'green',
  AHEAD: 'blue',
  BEHIND: 'orange',
  DIVERGED: 'red',
  UNKNOWN: 'default',
};

export type UnknownCopy = {
  title: string;
  hint: string;
  ctaLabel: string;
  ctaTestId: string;
};

/** Four actionable unknown paths (ADR-0022 #10). */
export const UNKNOWN_COPY: Record<
  'PROBE_NO_DATASOURCE' | 'PROBE_NOT_PROBED' | 'PROBE_CONNECTION_FAILED' | 'PROBE_NO_PERMISSION',
  UnknownCopy
> = {
  PROBE_NO_DATASOURCE: {
    title: '未配置数据源',
    hint: '请在左侧选择 JDBC 数据源后再探测实库 schema。',
    ctaLabel: '选择数据源',
    ctaTestId: 'schema-probe-cta-datasource',
  },
  PROBE_NOT_PROBED: {
    title: '尚未探测',
    hint: '实库状态未知。点击「探测实库」后才会对比活库 schema。',
    ctaLabel: '探测实库',
    ctaTestId: 'schema-probe-cta-probe',
  },
  PROBE_CONNECTION_FAILED: {
    title: '无法连接实库',
    hint: 'JDBC 连接或逆向解析失败。请检查网络、地址与凭证后重试。',
    ctaLabel: '重试探测',
    ctaTestId: 'schema-probe-cta-retry',
  },
  PROBE_NO_PERMISSION: {
    title: '无读取权限',
    hint: '账号无法 introspect 目标库 schema。请换有 SHOW/METADATA 权限的账号。',
    ctaLabel: '重试探测',
    ctaTestId: 'schema-probe-cta-retry',
  },
};

const UNKNOWN_REASON_KEYS = new Set<string>([
  'PROBE_NO_DATASOURCE',
  'PROBE_NOT_PROBED',
  'PROBE_CONNECTION_FAILED',
  'PROBE_NO_PERMISSION',
]);

export function resolveUnknownCopy(reason?: SchemaProbeReason, message?: string): UnknownCopy {
  if (reason && UNKNOWN_REASON_KEYS.has(reason)) {
    return UNKNOWN_COPY[reason as keyof typeof UNKNOWN_COPY];
  }
  if (reason === 'PROBE_REVERSE_EMPTY' || reason === 'PROBE_NO_MODEL') {
    return {
      title: '无法判定',
      hint: message || '探测结果不完整，请重试。',
      ctaLabel: '重试探测',
      ctaTestId: 'schema-probe-cta-retry',
    };
  }
  return {
    title: '实库未知',
    hint: message || '尚未获得可靠的实库对比结果。',
    ctaLabel: '探测实库',
    ctaTestId: 'schema-probe-cta-probe',
  };
}

export function statusHint(result: ProbeResult): string | undefined {
  const { status, reason, message, fingerprint, tableCount } = result;
  if (status === 'SYNCED') {
    return fingerprint
      ? `指纹 ${fingerprint.slice(0, 12)}… · ${tableCount ?? 0} 表 · 与模型一致`
      : '与模型一致';
  }
  if (status === 'AHEAD') {
    return '模型含实库尚未落地的结构（后续可用「推送」同步 DDL）';
  }
  if (status === 'BEHIND') {
    return '实库含模型未收录的结构（后续可用「拉取」反向存版）';
  }
  if (status === 'DIVERGED') {
    return '两侧各有独有或冲突变更，需人工决策拉取或推送';
  }
  if (status === 'UNKNOWN') {
    return resolveUnknownCopy(reason, message).hint;
  }
  return message;
}
