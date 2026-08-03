/**
 * 过滤索引 DDL 回写单测。
 * 运行：cd frontend && npx --yes tsx src/utils/json2code.indexFilter.test.ts
 */
import assert from 'node:assert/strict';
import {
  dialectSupportsIndexFilter,
  formatIndexFilterPredicate,
  getAllDataSQLByFilter,
  pickDatabaseDialect,
  renderCreateIndexSql,
} from './json2code';

function run(name: string, fn: () => void) {
  fn();
  // eslint-disable-next-line no-console
  console.log(`ok - ${name}`);
}

run('dialectSupportsIndexFilter：PG / SQLServer 是，MySQL/Oracle 否', () => {
  assert.equal(dialectSupportsIndexFilter('PostgreSQL'), true);
  assert.equal(dialectSupportsIndexFilter('sql_server'), true);
  assert.equal(dialectSupportsIndexFilter('MSSQL'), true);
  assert.equal(dialectSupportsIndexFilter('MYSQL'), false);
  assert.equal(dialectSupportsIndexFilter('ORACLE'), false);
});

run('formatIndexFilterPredicate 去空白', () => {
  assert.equal(formatIndexFilterPredicate('  (x = 1)  '), '(x = 1)');
  assert.equal(formatIndexFilterPredicate(''), undefined);
  assert.equal(formatIndexFilterPredicate(null), undefined);
});

run('renderCreateIndexSql：PG 有 filter → CREATE … WHERE', () => {
  const sql = renderCreateIndexSql(
    'ALTER TABLE {{=it.entity.title}} ADD INDEX {{=it.index.name}}({{=it.func.join(...it.index.fields,\',\')}});{{=it.separator}}',
    {
      entity: { title: 't_user' },
      index: {
        name: 'idx_active',
        isUnique: false,
        fields: ['email'],
        filter: '(deleted_at IS NULL)',
      },
      separator: '/*SQL@Run*/\n',
    },
    'PostgreSQL',
  );
  assert.match(sql, /^CREATE INDEX idx_active ON t_user\(email\) WHERE \(deleted_at IS NULL\);/);
  assert.ok(sql.includes('/*SQL@Run*/'));
});

run('renderCreateIndexSql：UNIQUE + SQLServer filter', () => {
  const sql = renderCreateIndexSql(
    '',
    {
      entity: { title: 'orders' },
      index: {
        name: 'uk_open',
        isUnique: true,
        fields: ['code'],
        filter: '([status]=(1))',
      },
      separator: '',
    },
    'SQLServer',
  );
  assert.equal(
    sql,
    'CREATE UNIQUE INDEX uk_open ON orders(code) WHERE ([status]=(1));',
  );
});

run('renderCreateIndexSql：MySQL 有 filter 仍走模板（不写 WHERE）', () => {
  const sql = renderCreateIndexSql(
    'ALTER TABLE `{{=it.entity.title}}` ADD INDEX `{{=it.index.name}}`({{=it.func.join(...it.index.fields,\',\')}});',
    {
      entity: { title: 't_user' },
      index: {
        name: 'idx_active',
        fields: ['email'],
        filter: '(deleted_at IS NULL)',
      },
      separator: '',
    },
    'MYSQL',
  );
  assert.match(sql, /ALTER TABLE `t_user` ADD INDEX `idx_active`\(email\);/);
  assert.doesNotMatch(sql, /WHERE/i);
});

run('renderCreateIndexSql：无 filter 走模板', () => {
  const sql = renderCreateIndexSql(
    'CREATE INDEX {{=it.index.name}} ON {{=it.entity.title}}({{=it.func.join(it.index.fields,\',\')}});',
    {
      entity: { title: 't_user' },
      index: { name: 'idx_email', fields: ['email'] },
      separator: '',
    },
    'PostgreSQL',
  );
  assert.equal(sql, 'CREATE INDEX idx_email ON t_user(email);');
});

run('pickDatabaseDialect 按 code 命中', () => {
  const dbs = [
    { code: 'MYSQL', defaultDatabase: true },
    { code: 'PostgreSQL', defaultDatabase: false },
  ];
  assert.equal(pickDatabaseDialect(dbs, 'PostgreSQL')?.code, 'PostgreSQL');
  assert.equal(pickDatabaseDialect(dbs, undefined)?.code, 'MYSQL');
});

run('getAllDataSQLByFilter：导出 createIndex 含 WHERE（所选方言 PG）', () => {
  const sql = getAllDataSQLByFilter(
    {
      profile: { sqlConfig: '/*SQL@Run*/' },
      dataTypeDomains: {
        datatype: [],
        database: [
          {
            code: 'MYSQL',
            defaultDatabase: true,
            createIndexTemplate:
              'ALTER TABLE {{=it.entity.title}} ADD INDEX {{=it.index.name}}({{=it.func.join(...it.index.fields,\',\')}});{{=it.separator}}',
          },
          {
            code: 'PostgreSQL',
            defaultDatabase: false,
            createIndexTemplate:
              'CREATE INDEX {{=it.index.name}} ON {{=it.entity.title}}({{=it.func.join(it.index.fields,\',\')}});{{=it.separator}}',
          },
        ],
      },
      modules: [
        {
          name: 'm',
          entities: [
            {
              title: 't_user',
              name: 'm',
              fields: [{ name: 'email', type: 'String' }],
              indexs: [
                {
                  name: 'idx_partial',
                  isUnique: false,
                  fields: ['email'],
                  filter: '(deleted_at IS NULL)',
                },
              ],
            },
          ],
        },
      ],
    },
    'PostgreSQL',
    ['createIndex'],
  );
  assert.match(
    sql,
    /CREATE INDEX idx_partial ON t_user\(email\) WHERE \(deleted_at IS NULL\);/,
  );
});

// eslint-disable-next-line no-console
console.log('all passed');
