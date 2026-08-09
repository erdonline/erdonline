/**
 * 增量 DDL：模型变更条目 → SQL 对齐（QRTZ 类批量建表 + 外键）。
 * 运行：cd frontend && npx --yes tsx src/utils/json2code.changes.test.ts
 */
import assert from 'node:assert/strict';
import { getCodeByChanges } from './json2code';

function run(name: string, fn: () => void) {
  fn();
  // eslint-disable-next-line no-console
  console.log(`ok - ${name}`);
}

const mysqlTemplate = {
  code: 'MYSQL',
  defaultDatabase: false,
  createTableTemplate:
    'CREATE TABLE `{{=it.entity.title}}`(`id` INT);{{=it.separator}}',
};

const pgDefault = {
  code: 'PostgreSQL',
  defaultDatabase: true,
  createTableTemplate: 'CREATE TABLE "{{=it.entity.title}}"();{{=it.separator}}',
};

function qrtzSource(extraEntities: string[] = []) {
  const base = ['QRTZ_BLOB_TRIGGERS', 'QRTZ_CALENDARS', 'QRTZ_CRON_TRIGGERS'];
  const titles = [...base, ...extraEntities];
  return {
    profile: { sqlConfig: '/*SQL@Run*/' },
    dataTypeDomains: {
      datatype: [{ code: 'String', apply: { MYSQL: { type: 'VARCHAR(32)' } } }],
      database: [pgDefault, mysqlTemplate],
    },
    modules: [
      {
        name: 'qrtz',
        entities: titles.map((title) => ({
          title,
          name: 'qrtz',
          fields: [{ name: 'id', type: 'String' }],
        })),
        associations: [
          {
            relation: 'n:1',
            from: { entity: 'QRTZ_CRON_TRIGGERS', field: 'trigger_name' },
            to: { entity: 'QRTZ_TRIGGERS', field: 'trigger_name' },
            constraintName: 'fk_cron_trigger',
          },
        ],
      },
    ],
  };
}

run('N 张新增表 → SQL 含 N 条 CREATE TABLE', () => {
  const tables = Array.from({ length: 5 }, (_, i) => `QRTZ_T_${i}`);
  const source = qrtzSource(tables);
  const changes = [
    ...['QRTZ_BLOB_TRIGGERS', 'QRTZ_CALENDARS', 'QRTZ_CRON_TRIGGERS', ...tables].map(
      (name) => ({ type: 'entity', name, opt: 'add' }),
    ),
  ];
  const sql = getCodeByChanges(source, changes, 'MYSQL', { modules: [] });
  for (const name of ['QRTZ_BLOB_TRIGGERS', 'QRTZ_CALENDARS', 'QRTZ_CRON_TRIGGERS', ...tables]) {
    assert.match(sql, new RegExp(`CREATE TABLE \`${name}\``), `missing CREATE for ${name}`);
  }
});

run('所选方言 MYSQL 非 defaultDatabase 仍用 MYSQL 建表模板', () => {
  const source = qrtzSource();
  const changes = [{ type: 'entity', name: 'QRTZ_BLOB_TRIGGERS', opt: 'add' }];
  const sql = getCodeByChanges(source, changes, 'MYSQL', { modules: [] });
  assert.match(sql, /CREATE TABLE `QRTZ_BLOB_TRIGGERS`/);
  assert.doesNotMatch(sql, /CREATE TABLE "QRTZ_BLOB_TRIGGERS"/);
});

run('association add → SQL 含 ADD CONSTRAINT 外键', () => {
  const source = qrtzSource();
  const changes = [
    { type: 'entity', name: 'QRTZ_CRON_TRIGGERS', opt: 'add' },
    { type: 'association', name: 'qrtz.fk_cron_trigger', opt: 'add' },
  ];
  const sql = getCodeByChanges(source, changes, 'MYSQL', { modules: [] });
  assert.match(sql, /CREATE TABLE `QRTZ_CRON_TRIGGERS`/);
  assert.match(sql, /ADD CONSTRAINT `fk_cron_trigger` FOREIGN KEY/);
});

// eslint-disable-next-line no-console
console.log('all changes-sql alignment tests passed');
