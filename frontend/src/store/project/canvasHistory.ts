/**
 * 画布级 undo/redo 快照栈（ADR-0001 R2）
 *
 * 为何不用 immer patches：现有 wrapWithPatch 扁平化且双重包裹，无法按「一次用户操作」撤销。
 * 模块 JSON 快照对建模规模足够（免费版表数受限），实现简单、行为可预期。
 *
 * 用法：变更 modules 前调用 snapshot(modules)；undo/redo 返回要恢复的 modules 或 null。
 */

/** projectJSON.modules 的序列化快照形态（结构由调用方解释） */
export type ModulesSnapshot = unknown[];

const MAX = 40;
let past: string[] = [];
let future: string[] = [];

function parseModules(json: string): ModulesSnapshot {
  const parsed: unknown = JSON.parse(json);
  return Array.isArray(parsed) ? parsed : [];
}

export function resetCanvasHistory() {
  past = [];
  future = [];
}

/** 变更前调用：把当前 modules 压入 past，清空 future */
export function snapshotModules(modules: ModulesSnapshot | null | undefined) {
  if (!modules) {
    return;
  }
  const json = JSON.stringify(modules);
  if (past[past.length - 1] === json) {
    return;
  }
  past.push(json);
  if (past.length > MAX) {
    past.shift();
  }
  future = [];
}

export function undoModules(
  currentModules: ModulesSnapshot | null | undefined,
): ModulesSnapshot | null {
  if (past.length === 0) {
    return null;
  }
  future.push(JSON.stringify(currentModules || []));
  return parseModules(past.pop() as string);
}

export function redoModules(
  currentModules: ModulesSnapshot | null | undefined,
): ModulesSnapshot | null {
  if (future.length === 0) {
    return null;
  }
  past.push(JSON.stringify(currentModules || []));
  return parseModules(future.pop() as string);
}

export function canvasHistorySize() {
  return { past: past.length, future: future.length };
}
