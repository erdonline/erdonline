/**
 * 触发器 DDL 导出单测。
 * 运行：cd frontend && npx --yes tsx src/utils/json2code.trigger.test.ts
 */
import assert from 'node:assert/strict';
import {
  dialectSupportsTrigger,
  getAllDataSQLByFilter,
  rebuildTriggerDdl,
  renderCreateTriggerSql,
} from './json2code';

function run(name: string, fn: () => void) {
  fn();
  // eslint-disable-next-line no-console
  console.log(`ok - ${name}`);
}

run('dialectSupportsTrigger：P0 四库是，JAVA 否', () => {
  assert.equal(dialectSupportsTrigger('MYSQL'), true);
  assert.equal(dialectSupportsTrigger('MariaDB'), true);
  assert.equal(dialectSupportsTrigger('PostgreSQL'), true);
  assert.equal(dialectSupportsTrigger('sql_server'), true);
  assert.equal(dialectSupportsTrigger('ORACLE'), true);
  assert.equal(dialectSupportsTrigger('JAVA'), false);
  assert.equal(dialectSupportsTrigger(''), false);
});

run('rebuildTriggerDdl：MySQL 反引号', () => {
  const ddl = rebuildTriggerDdl(
    {
      name: 'trg_user_bu',
      timing: 'BEFORE',
      event: 'UPDATE',
      orientation: 'ROW',
      statement: 'SET NEW.updated_at = NOW()',
    },
    't_user',
    'MYSQL',
  );
  assert.equal(
    ddl,
    'CREATE TRIGGER `trg_user_bu` BEFORE UPDATE ON `t_user` FOR EACH ROW\nSET NEW.updated_at = NOW()',
  );
});

run('rebuildTriggerDdl：PG 双引号', () => {
  const ddl = rebuildTriggerDdl(
    {
      name: 'trg_user_bu',
      timing: 'BEFORE',
      event: 'UPDATE',
      orientation: 'ROW',
      statement: 'EXECUTE FUNCTION f()',
    },
    't_user',
    'PostgreSQL',
  );
  assert.match(ddl, /^CREATE TRIGGER "trg_user_bu" BEFORE UPDATE ON "t_user" FOR EACH ROW/);
  assert.ok(ddl.includes('EXECUTE FUNCTION f()'));
});

run('rebuildTriggerDdl：SQL Server 方括号 + AS', () => {
  const ddl = rebuildTriggerDdl(
    {
      name: 'trg_user_ad',
      timing: 'INSTEAD OF',
      event: 'DELETE',
      statement: 'BEGIN SET NOCOUNT ON; END',
    },
    't_user',
    'SQLServer',
  );
  assert.equal(
    ddl,
    'CREATE TRIGGER [trg_user_ad] ON [t_user] INSTEAD OF DELETE\nAS\nBEGIN SET NOCOUNT ON; END',
  );
});

run('rebuildTriggerDdl：Oracle CREATE OR REPLACE', () => {
  const ddl = rebuildTriggerDdl(
    {
      name: 'TRG_USER_BI',
      timing: 'BEFORE',
      event: 'INSERT',
      orientation: 'ROW',
      statement: 'BEGIN NULL; END;',
    },
    'T_USER',
    'ORACLE',
  );
  assert.match(
    ddl,
    /^CREATE OR REPLACE TRIGGER "TRG_USER_BI" BEFORE INSERT ON "T_USER" FOR EACH ROW/,
  );
});

run('rebuildTriggerDdl：标识符转义', () => {
  assert.ok(
    rebuildTriggerDdl({ name: 'a`b', statement: 'x' }, 't`bl', 'MYSQL').includes(
      'CREATE TRIGGER `a``b`',
    ),
  );
  assert.ok(
    rebuildTriggerDdl({ name: 'a"b', statement: 'x' }, 't"bl', 'PostgreSQL').includes(
      'CREATE TRIGGER "a""b"',
    ),
  );
  assert.ok(
    rebuildTriggerDdl({ name: 'a]b', statement: 'x' }, 't]bl', 'SQLServer').includes(
      'CREATE TRIGGER [a]]b]',
    ),
  );
});

run('renderCreateTriggerSql：优先 ddl 原样 + 补分号', () => {
  const sql = renderCreateTriggerSql(
    {
      name: 'trg',
      ddl: 'CREATE TRIGGER `x` BEFORE INSERT ON `t` FOR EACH ROW\nSET NEW.a = 1',
    },
    't',
    '/*SQL@Run*/\n',
    'MYSQL',
  );
  assert.equal(
    sql,
    'CREATE TRIGGER `x` BEFORE INSERT ON `t` FOR EACH ROW\nSET NEW.a = 1;/*SQL@Run*/\n',
  );
});

run('renderCreateTriggerSql：无 ddl 时按方言重建', () => {
  const sql = renderCreateTriggerSql(
    {
      name: 'trg_bu',
      timing: 'BEFORE',
      event: 'UPDATE',
      orientation: 'ROW',
      statement: 'SET NEW.u = NOW()',
    },
    't_user',
    '',
    'MYSQL',
  );
  assert.equal(
    sql,
    'CREATE TRIGGER `trg_bu` BEFORE UPDATE ON `t_user` FOR EACH ROW\nSET NEW.u = NOW();',
  );
});

run('renderCreateTriggerSql：非支持方言跳过', () => {
  assert.equal(
    renderCreateTriggerSql(
      { name: 'trg', statement: 'x', ddl: 'CREATE TRIGGER ...' },
      't',
      '',
      'JAVA',
    ),
    '',
  );
});

run('getAllDataSQLByFilter：createTrigger 导出（所选方言 MySQL）', () => {
  const sql = getAllDataSQLByFilter(
    {
      profile: { sqlConfig: '/*SQL@Run*/' },
      dataTypeDomains: {
        datatype: [],
        database: [
          {
            code: 'MYSQL',
            defaultDatabase: true,
            createTableTemplate: 'CREATE TABLE `{{=it.entity.title}}`();{{=it.separator}}',
            createIndexTemplate: '',
          },
          {
            code: 'PostgreSQL',
            defaultDatabase: false,
            createTableTemplate: 'CREATE TABLE "{{=it.entity.title}}"();{{=it.separator}}',
            createIndexTemplate: '',
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
              fields: [{ name: 'id', type: 'String' }],
              triggers: [
                {
                  name: 'trg_user_bu',
                  timing: 'BEFORE',
                  event: 'UPDATE',
                  orientation: 'ROW',
                  statement: 'SET NEW.updated_at = NOW()',
                },
              ],
            },
          ],
        },
      ],
    },
    'MYSQL',
    ['createTrigger'],
  );
  assert.match(sql, /CREATE TRIGGER `trg_user_bu` BEFORE UPDATE ON `t_user` FOR EACH ROW/);
  assert.ok(sql.includes('SET NEW.updated_at = NOW()'));
  assert.ok(sql.includes('/*SQL@Run*/'));
});

run('getAllDataSQLByFilter：createTrigger 选 PG 方言双引号', () => {
  const sql = getAllDataSQLByFilter(
    {
      profile: { sqlConfig: '/*SQL@Run*/' },
      dataTypeDomains: {
        datatype: [],
        database: [
          { code: 'MYSQL', defaultDatabase: true },
          { code: 'PostgreSQL', defaultDatabase: false },
        ],
      },
      modules: [
        {
          name: 'm',
          entities: [
            {
              title: 't_user',
              name: 'm',
              fields: [],
              triggers: [
                {
                  name: 'trg_user_bu',
                  timing: 'BEFORE',
                  event: 'UPDATE',
                  orientation: 'ROW',
                  statement: 'EXECUTE FUNCTION f()',
                },
              ],
            },
          ],
        },
      ],
    },
    'PostgreSQL',
    ['createTrigger'],
  );
  assert.match(sql, /CREATE TRIGGER "trg_user_bu"/);
  assert.doesNotMatch(sql, /CREATE TRIGGER `/);
});

// eslint-disable-next-line no-console
console.log('all trigger export tests passed');
