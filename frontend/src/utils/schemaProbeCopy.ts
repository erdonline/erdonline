/** B-layer probe status (mirrors backend SchemaProbeStatus). */
import {
  B_STATUS_COLOR,
  bStatusLabel,
  layerBName,
  parityLabel,
  type SchemaProbeStatus,
} from './dualLayerTokens';
import { type MessageFormatFn, zhCnFormat } from './messageFormat';

export type { SchemaProbeStatus } from './dualLayerTokens';

/** @deprecated use bStatusLabel — kept for existing imports */
export const STATUS_LABEL: Record<SchemaProbeStatus, string> = {
  SYNCED: bStatusLabel('SYNCED'),
  AHEAD: bStatusLabel('AHEAD'),
  BEHIND: bStatusLabel('BEHIND'),
  DIVERGED: bStatusLabel('DIVERGED'),
  UNKNOWN: bStatusLabel('UNKNOWN'),
};

/** @deprecated use B_STATUS_COLOR — kept for existing imports */
export { B_STATUS_COLOR as STATUS_COLOR };

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

export type UnknownCopy = {
  title: string;
  hint: string;
  ctaLabel: string;
  ctaTestId: string;
};

const UNKNOWN_REASON_KEYS = new Set<string>([
  'PROBE_NO_DATASOURCE',
  'PROBE_NOT_PROBED',
  'PROBE_CONNECTION_FAILED',
  'PROBE_NO_PERMISSION',
]);

function unknownCopyForReason(
  reason: 'PROBE_NO_DATASOURCE' | 'PROBE_NOT_PROBED' | 'PROBE_CONNECTION_FAILED' | 'PROBE_NO_PERMISSION',
  format: MessageFormatFn,
): UnknownCopy {
  const layer = layerBName(format);
  const unknownParity = parityLabel('UNKNOWN', format);
  switch (reason) {
    case 'PROBE_NO_DATASOURCE':
      return {
        title: format('designer.schemaProbe.unknown.noDatasource.title'),
        hint: format('designer.schemaProbe.unknown.noDatasource.hint'),
        ctaLabel: format('designer.schemaProbe.unknown.noDatasource.cta'),
        ctaTestId: 'schema-probe-cta-datasource',
      };
    case 'PROBE_NOT_PROBED':
      return {
        title: format('designer.schemaProbe.unknown.notProbed.title'),
        hint: format('designer.schemaProbe.unknown.notProbed.hint', {
          layer,
          parity: unknownParity,
        }),
        ctaLabel: format('designer.schemaProbe.btn'),
        ctaTestId: 'schema-probe-cta-probe',
      };
    case 'PROBE_CONNECTION_FAILED':
      return {
        title: format('designer.schemaProbe.unknown.connectionFailed.title'),
        hint: format('designer.schemaProbe.unknown.connectionFailed.hint'),
        ctaLabel: format('designer.schemaProbe.unknown.retryCta'),
        ctaTestId: 'schema-probe-cta-retry',
      };
    default:
      return {
        title: format('designer.schemaProbe.unknown.noPermission.title'),
        hint: format('designer.schemaProbe.unknown.noPermission.hint'),
        ctaLabel: format('designer.schemaProbe.unknown.retryCta'),
        ctaTestId: 'schema-probe-cta-retry',
      };
  }
}

/** Four actionable unknown paths (ADR-0022 #10). */
export function resolveUnknownCopy(
  reason?: SchemaProbeReason,
  message?: string,
  format: MessageFormatFn = zhCnFormat(),
): UnknownCopy {
  if (reason && UNKNOWN_REASON_KEYS.has(reason)) {
    return unknownCopyForReason(
      reason as 'PROBE_NO_DATASOURCE' | 'PROBE_NOT_PROBED' | 'PROBE_CONNECTION_FAILED' | 'PROBE_NO_PERMISSION',
      format,
    );
  }
  if (reason === 'PROBE_REVERSE_EMPTY' || reason === 'PROBE_NO_MODEL') {
    return {
      title: format('designer.schemaProbe.unknown.indeterminate.title'),
      hint: message || format('designer.schemaProbe.unknown.indeterminate.hint'),
      ctaLabel: format('designer.schemaProbe.unknown.retryCta'),
      ctaTestId: 'schema-probe-cta-retry',
    };
  }
  return {
    title: bStatusLabel('UNKNOWN', format),
    hint: message || format('designer.schemaProbe.unknown.fallback.hint'),
    ctaLabel: format('designer.schemaProbe.btn'),
    ctaTestId: 'schema-probe-cta-probe',
  };
}

export function statusHint(
  result: ProbeResult,
  format: MessageFormatFn = zhCnFormat(),
): string | undefined {
  const { status, reason, message, fingerprint, tableCount } = result;
  const synced = parityLabel('SYNCED', format);
  if (status === 'SYNCED') {
    return fingerprint
      ? format('designer.schemaProbe.hint.syncedWithFingerprint', {
          fingerprint: fingerprint.slice(0, 12),
          tableCount: tableCount ?? 0,
          parity: synced,
        })
      : format('designer.schemaProbe.hint.synced', { parity: synced });
  }
  if (status === 'AHEAD') {
    return format('designer.schemaProbe.hint.ahead');
  }
  if (status === 'BEHIND') {
    return format('designer.schemaProbe.hint.behind');
  }
  if (status === 'DIVERGED') {
    return format('designer.schemaProbe.hint.diverged');
  }
  if (status === 'UNKNOWN') {
    return resolveUnknownCopy(reason, message, format).hint;
  }
  return message;
}

export function getSchemaProbeStatusLabel(
  status: SchemaProbeStatus,
  format: MessageFormatFn,
): string {
  return bStatusLabel(status, format);
}
