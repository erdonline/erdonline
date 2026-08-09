/**
 * 运行：npx tsx src/utils/reverseImportUtils.test.ts
 */
import assert from 'node:assert/strict';
import {
  REVERSE_NEW_MODULE,
  resolveReverseImportTarget,
  sortReverseEntitiesForDisplay,
} from './reverseImportUtils';

async function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`fail - ${name}`);
    throw e;
  }
}

async function main() {
  await run('sortReverseEntitiesForDisplay：未入库表排前', () => {
    const entities = [
      { title: 't_order', chnname: '订单' },
      { title: 't_user', chnname: '用户' },
      { title: 't_log', chnname: '日志' },
    ];
    const sorted = sortReverseEntitiesForDisplay(entities, ['t_user']);
    assert.deepEqual(
      sorted.map((e) => e.title),
      ['t_log', 't_order', 't_user'],
    );
  });

  await run('resolveReverseImportTarget：已有模块 / 新建回退', () => {
    const parsed = { code: 'DB_REVERSE_MYSQL', name: '逆向解析_MYSQL' };
    assert.deepEqual(resolveReverseImportTarget(parsed, {
      moduleCode: 'SHOP',
      moduleChnname: '商城',
      useExistingModule: true,
    }), {
      moduleCode: 'SHOP',
      moduleChnname: '商城',
      useExistingModule: true,
    });
    assert.deepEqual(resolveReverseImportTarget(parsed), {
      moduleCode: 'DB_REVERSE_MYSQL',
      moduleChnname: '逆向解析_MYSQL',
      useExistingModule: false,
    });
  });

  await run('REVERSE_NEW_MODULE 常量', () => {
    assert.equal(typeof REVERSE_NEW_MODULE, 'string');
  });

  console.log('reverseImportUtils.test: all passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
