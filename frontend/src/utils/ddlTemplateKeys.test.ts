import assert from 'node:assert/strict';
import {
  buildSaveDatabaseDialectPayload,
  listDdlTemplateDialectCodes,
  PRODUCT_SQL_DIALECT_CODES,
} from './ddlTemplateKeys';

function run(name: string, fn: () => void) {
  try {
    fn();
    // eslint-disable-next-line no-console
    console.log(`ok - ${name}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`not ok - ${name}`);
    throw e;
  }
}

run('listDdlTemplateDialectCodes：仅 MYSQL 行时也返回 P0 四库', () => {
  const codes = listDdlTemplateDialectCodes([{ code: 'MYSQL', defaultDatabase: true }]);
  assert.equal(codes.length, PRODUCT_SQL_DIALECT_CODES.length);
  assert.deepEqual(codes, [...PRODUCT_SQL_DIALECT_CODES]);
});

run('listDdlTemplateDialectCodes：排除 JAVA', () => {
  const codes = listDdlTemplateDialectCodes([
    { code: 'MYSQL' },
    { code: 'JAVA' },
  ]);
  assert.equal(codes.includes('JAVA'), false);
  assert.ok(codes.length >= 3);
});

run('buildSaveDatabaseDialectPayload：仅落盘已编辑键', () => {
  const payload = buildSaveDatabaseDialectPayload({
    code: 'MYSQL',
    stored: { code: 'MYSQL', createTableTemplate: 'CUSTOM' },
    overrides: { updateFieldTemplate: 'ALTER ...' },
    meta: { fileShow: true },
  });
  assert.equal(payload.createTableTemplate, 'CUSTOM');
  assert.equal(payload.updateFieldTemplate, 'ALTER ...');
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'deleteTableTemplate'), false);
});

run('buildSaveDatabaseDialectPayload：清空 custom 不写空键', () => {
  const payload = buildSaveDatabaseDialectPayload({
    code: 'MYSQL',
    stored: { code: 'MYSQL', createTableTemplate: 'CUSTOM' },
    overrides: { createTableTemplate: '   ' },
    meta: { fileShow: true },
  });
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'createTableTemplate'), false);
});
