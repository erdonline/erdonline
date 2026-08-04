/**
 * A 层基线不变量（ADR-0022）：
 * 基线来自独立的「最新版本」查询，禁止被版本列表分页污染；无基线时脏 = 全部未提交。
 * 运行：cd frontend && npx tsx src/utils/versionBaseline.test.ts
 */
import assert from 'node:assert/strict';
import {
  baselineProjectJSON,
  buildLatestVersionQuery,
  hasBaseline,
  resolveBaselineDbKey,
} from './versionBaseline';
import { SNAPSHOT_DB_KEY } from './versionConstants';

// 1. 查询体：只取 1 条，create_time 主序（version 是字符串，字典序会把 9.0.0 排在 10.0.0 后）
const query = buildLatestVersionQuery('db-1', 'p-1');
assert.equal(query.size, 1);
assert.equal(query.current, 1);
assert.deepEqual(query.orders, [
  { column: 'createTime', asc: false },
  { column: 'version', asc: false },
]);
assert.equal(query.dbKey, 'db-1');
assert.equal(query.projectId, 'p-1');

// 2. dbKey 解析：显式 > 已标记默认 > profile 默认 > 快照通道
assert.equal(
  resolveBaselineDbKey({
    explicitKey: 'explicit',
    dbs: [{ key: 'marked', defaultDB: true }],
    profileDefaultId: 'profile',
  }),
  'explicit',
);
assert.equal(
  resolveBaselineDbKey({
    dbs: [{ key: 'other' }, { key: 'marked', defaultDB: true }],
    profileDefaultId: 'profile',
  }),
  'marked',
);
// 打开项目时 dbs 还没加载：必须退回 profile 默认数据源，而不是错查快照通道
assert.equal(resolveBaselineDbKey({ dbs: [], profileDefaultId: 'profile' }), 'profile');
assert.equal(resolveBaselineDbKey({}), SNAPSHOT_DB_KEY);

// 3. 无基线 ≠ 无差异：基线模型为空，当前模型整体算未提交
const emptyBaseline = { modules: [], profile: {}, dataTypeDomains: {} };
assert.deepEqual(baselineProjectJSON(null), emptyBaseline);
assert.deepEqual(baselineProjectJSON({ version: '1.0.0', projectJSON: null }), emptyBaseline);
assert.equal(hasBaseline(null), false);
assert.equal(hasBaseline({ id: 'v1' }), true);
assert.equal(hasBaseline({ version: '1.0.0' }), true);

// 4. 有基线：modules + profile + dataTypeDomains，与列表页码无关
const baseline = {
  id: 'v9',
  version: '9.0.0',
  projectJSON: {
    modules: [{ name: 'm1' }],
    profile: { tableLimit: 100 },
    dataTypeDomains: { datatype: [] },
  },
};
assert.deepEqual(baselineProjectJSON(baseline), {
  modules: [{ name: 'm1' }],
  profile: { tableLimit: 100 },
  dataTypeDomains: { datatype: [] },
});

console.log('versionBaseline.test.ts OK');
