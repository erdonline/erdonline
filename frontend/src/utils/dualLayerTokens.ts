/**
 * 双层一致性视觉与文案 token（ADR-0022 #12）。
 * A 层（工作区 ↔ 版本）与 B 层（模型 ↔ 实库）共用 parity 动词与 Tag 色，层前缀区分语义。
 */

import { type MessageFormatFn, zhCnFormat } from './messageFormat';

/** 五态 parity 键 — 文案经 designer.parity.* i18n key 解析 */
export const PARITY_VERB = {
  SYNCED: 'synced',
  AHEAD: 'ahead',
  BEHIND: 'behind',
  DIVERGED: 'diverged',
  UNKNOWN: 'unknown',
} as const;

export type ParityKind = keyof typeof PARITY_VERB;

/** antd Tag color prop */
export type ParityTagColor =
  | 'success'
  | 'processing'
  | 'error'
  | 'warning'
  | 'default'
  | 'green'
  | 'blue'
  | 'orange'
  | 'red';

/** 五态 Tag 色：一致绿 / 领先蓝 / 落后橙 / 分叉红 / 未知灰 */
export const PARITY_TAG_COLOR: Record<ParityKind, ParityTagColor> = {
  SYNCED: 'green',
  AHEAD: 'blue',
  BEHIND: 'orange',
  DIVERGED: 'red',
  UNKNOWN: 'default',
};

export function layerAName(format: MessageFormatFn = zhCnFormat()): string {
  return format('designer.layer.a.name');
}

export function layerBName(format: MessageFormatFn = zhCnFormat()): string {
  return format('designer.layer.b.name');
}

export function layerACompareHint(format: MessageFormatFn = zhCnFormat()): string {
  return format('designer.layer.a.compareHint');
}

export function layerBCompareHint(format: MessageFormatFn = zhCnFormat()): string {
  return format('designer.layer.b.compareHint');
}

export function parityLabel(
  kind: ParityKind,
  format: MessageFormatFn = zhCnFormat(),
): string {
  return format(`designer.parity.${PARITY_VERB[kind]}`);
}

/** @deprecated use layerAName/layerBName — kept for VersionDiffPanel 等未 key 化模块 */
export const LAYER = {
  A: { name: '版本', compareHint: '工作区 ↔ 已存版本' },
  B: { name: '实库', compareHint: '模型 ↔ 活库 schema' },
} as const;

/** 顶栏三信号键 — DualLayerLegend 经 i18n 解析 */
export const TOP_BAR_SIGNALS = [
  { key: 'persist' as const },
  { key: 'version' as const },
  { key: 'schema' as const },
] as const;

/** 结构化 diff 操作：VersionDiffPanel / 版本行摘要 / dirty 摘要共用 */
export type ChangeOpt = 'add' | 'delete' | 'update';

export const CHANGE_OPT: Record<
  ChangeOpt,
  { color: ParityTagColor; label: string; symbol: string; cssClass: string }
> = {
  add: { color: 'success', label: '新增', symbol: '+', cssClass: 'erd-change--add' },
  delete: { color: 'error', label: '删除', symbol: '−', cssClass: 'erd-change--del' },
  update: { color: 'warning', label: '修改', symbol: '~', cssClass: 'erd-change--upd' },
};

export type ChangeCounts = { add: number; delete: number; update: number };

export function countChanges(items: { opt?: string }[]): ChangeCounts {
  const counts: ChangeCounts = { add: 0, delete: 0, update: 0 };
  for (const item of items) {
    const k = item.opt as ChangeOpt | undefined;
    if (k && counts[k] !== undefined) {
      counts[k] += 1;
    }
  }
  return counts;
}

/** 紧凑摘要：`+2 −1 ~1` */
export function formatChangeSummary(counts: ChangeCounts): string {
  const parts: string[] = [];
  if (counts.add > 0) parts.push(`${CHANGE_OPT.add.symbol}${counts.add}`);
  if (counts.delete > 0) parts.push(`${CHANGE_OPT.delete.symbol}${counts.delete}`);
  if (counts.update > 0) parts.push(`${CHANGE_OPT.update.symbol}${counts.update}`);
  return parts.join(' ');
}

/** diff 面板摘要 Tag 文案 */
export function changeSummaryTags(counts: ChangeCounts): { opt: ChangeOpt; count: number; text: string }[] {
  const out: { opt: ChangeOpt; count: number; text: string }[] = [];
  (['add', 'delete', 'update'] as const).forEach((opt) => {
    const n = counts[opt];
    if (n > 0) {
      const meta = CHANGE_OPT[opt];
      out.push({ opt, count: n, text: `${meta.symbol}${n} ${meta.label}` });
    }
  });
  return out;
}

/** A 层 dirty 四态 → parity + 呈现 */
export type VersionLayerState = 'unknown' | 'no-baseline' | 'clean' | 'dirty';

export type VersionLayerPresentation = {
  parity: ParityKind;
  tagColor: ParityTagColor;
  chipTone: 'unknown' | 'warn' | 'clean' | 'dirty';
  label: string;
  title: string;
  testId: string;
  openSaveFlow: boolean;
};

function versionSummarySuffix(
  state: VersionLayerState,
  summary: string,
): string {
  if (!summary) return '';
  return state === 'dirty' ? ` ${summary}` : `（${summary}）`;
}

export function versionLayerPresentation(
  state: VersionLayerState,
  changes: { opt?: string }[],
  format: MessageFormatFn = zhCnFormat(),
): VersionLayerPresentation {
  const summary = formatChangeSummary(countChanges(changes));
  const summarySuffix = versionSummarySuffix(state, summary);
  const layer = layerAName(format);
  const synced = parityLabel('SYNCED', format);
  const unknown = parityLabel('UNKNOWN', format);

  switch (state) {
    case 'unknown':
      return {
        parity: 'UNKNOWN',
        tagColor: PARITY_TAG_COLOR.UNKNOWN,
        chipTone: 'unknown',
        label: format('designer.versionDirty.unknown.label', { layer, parity: unknown }),
        title: format('designer.versionDirty.unknown.title'),
        testId: 'version-dirty-chip-unknown',
        openSaveFlow: false,
      };
    case 'no-baseline':
      return {
        parity: 'UNKNOWN',
        tagColor: 'warning',
        chipTone: 'warn',
        label: format('designer.versionDirty.noBaseline.label', { summary: summarySuffix }),
        title: format('designer.versionDirty.noBaseline.title'),
        testId: 'version-dirty-chip-no-baseline',
        openSaveFlow: true,
      };
    case 'dirty':
      return {
        parity: 'AHEAD',
        tagColor: PARITY_TAG_COLOR.AHEAD,
        chipTone: 'dirty',
        label: format('designer.versionDirty.dirty.label', { summary: summarySuffix }),
        title: format('designer.versionDirty.dirty.title'),
        testId: 'version-dirty-chip-dirty',
        openSaveFlow: true,
      };
    default:
      return {
        parity: 'SYNCED',
        tagColor: PARITY_TAG_COLOR.SYNCED,
        chipTone: 'clean',
        label: format('designer.versionDirty.clean.label', { layer, parity: synced }),
        title: format('designer.versionDirty.clean.title'),
        testId: 'version-dirty-chip-clean',
        openSaveFlow: false,
      };
  }
}

/** B 层五态 Tag 文案（由 parity 动词 + 层前缀组合） */
export type SchemaProbeStatus = 'SYNCED' | 'AHEAD' | 'BEHIND' | 'DIVERGED' | 'UNKNOWN';

export function bStatusLabel(
  status: SchemaProbeStatus,
  format: MessageFormatFn = zhCnFormat(),
): string {
  const layer = layerBName(format);
  switch (status) {
    case 'SYNCED':
      return format('designer.schemaProbe.status.synced', {
        layer,
        parity: parityLabel('SYNCED', format),
      });
    case 'AHEAD':
      return format('designer.schemaProbe.status.ahead', {
        parity: parityLabel('AHEAD', format),
      });
    case 'BEHIND':
      return format('designer.schemaProbe.status.behind', {
        layer,
        parity: parityLabel('AHEAD', format),
      });
    case 'DIVERGED':
      return format('designer.schemaProbe.status.diverged', {
        parity: parityLabel('DIVERGED', format),
      });
    default:
      return format('designer.schemaProbe.status.unknown', {
        layer,
        parity: parityLabel('UNKNOWN', format),
      });
  }
}

/** @deprecated use bStatusLabel(format, status) */
export const B_STATUS_LABEL: Record<SchemaProbeStatus, string> = {
  SYNCED: bStatusLabel('SYNCED'),
  AHEAD: bStatusLabel('AHEAD'),
  BEHIND: bStatusLabel('BEHIND'),
  DIVERGED: bStatusLabel('DIVERGED'),
  UNKNOWN: bStatusLabel('UNKNOWN'),
};

export const B_STATUS_COLOR: Record<SchemaProbeStatus, ParityTagColor> = {
  SYNCED: PARITY_TAG_COLOR.SYNCED,
  AHEAD: PARITY_TAG_COLOR.AHEAD,
  BEHIND: PARITY_TAG_COLOR.BEHIND,
  DIVERGED: PARITY_TAG_COLOR.DIVERGED,
  UNKNOWN: PARITY_TAG_COLOR.UNKNOWN,
};
