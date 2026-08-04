/**
 * A 层 dirty 状态（工作区 ↔ 最新版本基线，ADR-0022）。
 * 供顶栏 chip 与版本页 toolbar 共用文案与变更摘要。
 */

import { hasBaseline, type BaselineRecord } from './versionBaseline';

export type VersionChangeItem = { opt?: string };

export type VersionDirtyState =
  | 'unknown'
  | 'no-baseline'
  | 'clean'
  | 'dirty';

export function summarizeChanges(changes: VersionChangeItem[]): string {
  const add = changes.filter((c) => c.opt === 'add').length;
  const del = changes.filter((c) => c.opt === 'delete').length;
  const upd = changes.filter((c) => c.opt === 'update').length;
  const parts: string[] = [];
  if (add > 0) parts.push(`+${add}`);
  if (del > 0) parts.push(`−${del}`);
  if (upd > 0) parts.push(`~${upd}`);
  return parts.join(' ');
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
): VersionDirtyCopy {
  switch (state) {
    case 'unknown':
      return {
        label: '基线未知',
        title: '尚未取到最新版本基线，点击重试；无法判断是否有未存版本',
        tone: 'unknown',
        testId: 'version-dirty-chip-unknown',
        openSaveFlow: false,
      };
    case 'no-baseline': {
      const summary = summarizeChanges(changes);
      const suffix = summary ? `（${summary}）` : '';
      return {
        label: `尚无版本${suffix}`,
        title: '该项目还没有任何版本；点击前往保存第一个版本',
        tone: 'warn',
        testId: 'version-dirty-chip-no-baseline',
        openSaveFlow: true,
      };
    }
    case 'dirty': {
      const summary = summarizeChanges(changes);
      const suffix = summary ? ` ${summary}` : '';
      return {
        label: `未存版本${suffix}`,
        title: '当前模型相对最新版本有改动，点击前往保存版本',
        tone: 'dirty',
        testId: 'version-dirty-chip-dirty',
        openSaveFlow: true,
      };
    }
    default:
      return {
        label: '与版本一致',
        title: '当前模型与最新保存版本一致；点击查看版本历史',
        tone: 'clean',
        testId: 'version-dirty-chip-clean',
        openSaveFlow: false,
      };
  }
}
