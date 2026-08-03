/**
 * getDataTypeTree 图标 fill 走 erdColors.brand（禁裸 #DE2910）。
 * 设置页 `/design/table/setting/dataType` 挂载 CRUD；本单测锁 token 同源。
 * 运行：cd frontend && npx tsx src/store/project/dataTypeDomainsSlice.test.ts
 */
import assert from 'node:assert/strict';
import type { ReactElement } from 'react';
import type { GetState, SetState } from 'zustand';
import type { ProjectState } from '@/store/project/useProjectStore';
import { erdColors } from '@/theme/tokens';

// slice → cache.js 读 localStorage；Node 无 DOM 时先垫一层
const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  get length() {
    return mem.size;
  },
  key: () => null,
} as Storage;

function iconFill(node: unknown): string {
  const el = node as ReactElement<{ fill?: string }>;
  return String(el?.props?.fill || '').toLowerCase();
}

async function main() {
  const { default: DataTypeDomainsSlice } = await import('./dataTypeDomainsSlice');

  const set = (() => {}) as SetState<ProjectState>;
  const get = (() =>
    ({
      project: {
        projectJSON: {
          dataTypeDomains: {
            datatype: [{ code: 'string', name: '字符串' }],
            database: [{ code: 'MYSQL' }],
          },
        },
      },
    }) as ProjectState) as GetState<ProjectState>;

  const slice = DataTypeDomainsSlice(set, get);
  const tree = slice.getDataTypeTree() as Array<{
    icon: unknown;
    children?: Array<{ icon: unknown }>;
  }>;

  const fills = [
    iconFill(tree[0].icon),
    iconFill(tree[1].icon),
    iconFill(tree[0].children?.[0]?.icon),
    iconFill(tree[1].children?.[0]?.icon),
  ];
  const brand = erdColors.brand.toLowerCase();
  for (const fill of fills) {
    assert.equal(fill, brand);
  }
  // eslint-disable-next-line no-console
  console.log('ok - getDataTypeTree 全部图标 fill ≡ erdColors.brand');
  // eslint-disable-next-line no-console
  console.log('dataTypeDomainsSlice.test.ts: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
