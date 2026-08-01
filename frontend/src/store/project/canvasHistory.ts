/**
 * 画布级 undo/redo 快照栈（ADR-0001 R2）
 *
 * 为何不用 immer patches：现有 wrapWithPatch 扁平化且双重包裹，无法按「一次用户操作」撤销。
 * 模块 JSON 快照对建模规模足够（免费版表数受限），实现简单、行为可预期。
 *
 * 用法：变更 modules 前调用 snapshot(modules)；undo/redo 返回要恢复的 modules 或 null。
 */

const MAX = 40;
let past: string[] = [];
let future: string[] = [];

export function resetCanvasHistory() {
  past = [];
  future = [];
}

/** 变更前调用：把当前 modules 压入 past，清空 future */
export function snapshotModules(modules: any) {
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

export function undoModules(currentModules: any): any[] | null {
  if (past.length === 0) {
    return null;
  }
  future.push(JSON.stringify(currentModules || []));
  return JSON.parse(past.pop() as string);
}

export function redoModules(currentModules: any): any[] | null {
  if (future.length === 0) {
    return null;
  }
  past.push(JSON.stringify(currentModules || []));
  return JSON.parse(future.pop() as string);
}

export function canvasHistorySize() {
  return { past: past.length, future: future.length };
}
