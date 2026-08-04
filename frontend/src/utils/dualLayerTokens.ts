/**
 * 双层一致性视觉与文案 token（ADR-0022 #12）。
 * A 层（工作区 ↔ 版本）与 B 层（模型 ↔ 实库）共用 parity 动词与 Tag 色，层前缀区分语义。
 */

/** 五态 parity 动词 — A/B 层对齐 */
export const PARITY_VERB = {
  SYNCED: '一致',
  AHEAD: '领先',
  BEHIND: '落后',
  DIVERGED: '分叉',
  UNKNOWN: '未知',
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

export const LAYER = {
  /** A 层：内存 projectJSON ↔ 最新版本 */
  A: { name: '版本', compareHint: '工作区 ↔ 已存版本' },
  /** B 层：模型 ↔ 活库 schema */
  B: { name: '实库', compareHint: '模型 ↔ 活库 schema' },
} as const;

/** 顶栏三信号：落盘 / 未存版本 / 与库 — 图例说明 */
export const TOP_BAR_SIGNALS = [
  { key: 'persist', label: '落盘', hint: '模型自动保存到服务器（project 表）' },
  { key: 'version', label: '未存版本', hint: LAYER.A.compareHint },
  { key: 'schema', label: '与库', hint: LAYER.B.compareHint },
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

export function versionLayerPresentation(
  state: VersionLayerState,
  changes: { opt?: string }[],
): VersionLayerPresentation {
  const summary = formatChangeSummary(countChanges(changes));
  const summarySuffix = summary ? (state === 'dirty' ? ` ${summary}` : `（${summary}）`) : '';

  switch (state) {
    case 'unknown':
      return {
        parity: 'UNKNOWN',
        tagColor: PARITY_TAG_COLOR.UNKNOWN,
        chipTone: 'unknown',
        label: `${LAYER.A.name}${PARITY_VERB.UNKNOWN}`,
        title: '尚未取到最新版本基线，点击重试；无法判断是否有未存版本',
        testId: 'version-dirty-chip-unknown',
        openSaveFlow: false,
      };
    case 'no-baseline':
      return {
        parity: 'UNKNOWN',
        tagColor: 'warning',
        chipTone: 'warn',
        label: `尚无版本${summarySuffix}`,
        title: '该项目还没有任何版本；点击前往保存第一个版本',
        testId: 'version-dirty-chip-no-baseline',
        openSaveFlow: true,
      };
    case 'dirty':
      return {
        parity: 'AHEAD',
        tagColor: PARITY_TAG_COLOR.AHEAD,
        chipTone: 'dirty',
        label: `未存版本${summarySuffix}`,
        title: '当前模型相对最新版本有改动（模型领先版本）；点击前往保存版本',
        testId: 'version-dirty-chip-dirty',
        openSaveFlow: true,
      };
    default:
      return {
        parity: 'SYNCED',
        tagColor: PARITY_TAG_COLOR.SYNCED,
        chipTone: 'clean',
        label: `${LAYER.A.name}${PARITY_VERB.SYNCED}`,
        title: '当前模型与最新保存版本一致；点击查看版本历史',
        testId: 'version-dirty-chip-clean',
        openSaveFlow: false,
      };
  }
}

/** B 层五态 Tag 文案（由 parity 动词 + 层前缀组合） */
export type SchemaProbeStatus = 'SYNCED' | 'AHEAD' | 'BEHIND' | 'DIVERGED' | 'UNKNOWN';

export const B_STATUS_LABEL: Record<SchemaProbeStatus, string> = {
  SYNCED: `${LAYER.B.name}${PARITY_VERB.SYNCED}`,
  AHEAD: `模型${PARITY_VERB.AHEAD}`,
  BEHIND: `${LAYER.B.name}${PARITY_VERB.AHEAD}`,
  DIVERGED: `双向${PARITY_VERB.DIVERGED}`,
  UNKNOWN: `${LAYER.B.name}${PARITY_VERB.UNKNOWN}`,
};

export const B_STATUS_COLOR: Record<SchemaProbeStatus, ParityTagColor> = {
  SYNCED: PARITY_TAG_COLOR.SYNCED,
  AHEAD: PARITY_TAG_COLOR.AHEAD,
  BEHIND: PARITY_TAG_COLOR.BEHIND,
  DIVERGED: PARITY_TAG_COLOR.DIVERGED,
  UNKNOWN: PARITY_TAG_COLOR.UNKNOWN,
};
