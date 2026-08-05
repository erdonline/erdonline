/**
 * A 层 dirty 状态（工作区 ↔ 最新版本基线，ADR-0022）。
 * 供顶栏 chip 与版本页 toolbar 共用文案与变更摘要。
 */

import { hasBaseline, type BaselineRecord } from './versionBaseline';
import {
  countChanges,
  formatChangeSummary,
  versionLayerPresentation,
  type VersionLayerState,
} from './dualLayerTokens';
import { type MessageFormatFn } from './messageFormat';

export type VersionChangeItem = { opt?: string };

export type VersionDirtyState = VersionLayerState;

export function summarizeChanges(changes: VersionChangeItem[]): string {
  return formatChangeSummary(countChanges(changes));
}

export function resolveVersionDirtyState(input: {
  baselineLoaded: boolean;
  versionBaseline: BaselineRecord;
  changes: VersionChangeItem[];
}): VersionDirtyState {
  if (!input.baselineLoaded) {
    return 'unknown';
  }
  if (!hasBaseline(input.versionBaseline)) {
    return 'no-baseline';
  }
  if (input.changes.length > 0) {
    return 'dirty';
  }
  return 'clean';
}

export type VersionDirtyCopy = {
  label: string;
  title: string;
  tone: 'unknown' | 'warn' | 'clean' | 'dirty';
  testId: string;
  /** 点击应打开保存版本流程（尚无版本 / 有未存变更） */
  openSaveFlow: boolean;
};

export function versionDirtyCopy(
  state: VersionDirtyState,
  changes: VersionChangeItem[],
  format?: MessageFormatFn,
): VersionDirtyCopy {
  const pres = versionLayerPresentation(state, changes, format);
  return {
    label: pres.label,
    title: pres.title,
    tone: pres.chipTone,
    testId: pres.testId,
    openSaveFlow: pres.openSaveFlow,
  };
}
