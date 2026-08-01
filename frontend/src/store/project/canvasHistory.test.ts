/**
 * 纯函数单测（不依赖已坏的 max test / PuppeteerEnvironment）。
 * 运行：cd frontend && npx tsx src/store/project/canvasHistory.test.ts
 */
import assert from 'node:assert/strict';
import {
  canvasHistorySize,
  redoModules,
  resetCanvasHistory,
  snapshotModules,
  undoModules,
} from './canvasHistory';

function run(name: string, fn: () => void) {
  resetCanvasHistory();
  fn();
  // eslint-disable-next-line no-console
  console.log(`ok - ${name}`);
}

run('undo 空栈返回 null', () => {
  assert.equal(undoModules([]), null);
  assert.deepEqual(canvasHistorySize(), { past: 0, future: 0 });
});

run('连续相同 snapshot 去重', () => {
  snapshotModules([{ n: 1 }]);
  snapshotModules([{ n: 1 }]);
  assert.equal(canvasHistorySize().past, 1);
});

run('undo 后 redo 可回到撤销前', () => {
  snapshotModules([{ n: 1 }]);
  snapshotModules([{ n: 2 }]);
  const undone = undoModules([{ n: 3 }]);
  assert.deepEqual(undone, [{ n: 2 }]);
  assert.equal(canvasHistorySize().future, 1);
  const redone = redoModules(undone);
  assert.deepEqual(redone, [{ n: 3 }]);
  assert.equal(canvasHistorySize().future, 0);
});

run('past 超过上限时截断', () => {
  for (let i = 0; i < 45; i += 1) {
    snapshotModules([{ i }]);
  }
  assert.equal(canvasHistorySize().past, 40);
});

// eslint-disable-next-line no-console
console.log('canvasHistory.test.ts: all passed');
