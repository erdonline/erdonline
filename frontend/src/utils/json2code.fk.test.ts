/**
 * FK DDL 导出单测（ON DELETE/UPDATE + 约束名）。
 * 运行：cd frontend && npx --yes tsx src/utils/json2code.fk.test.ts
 */
import assert from 'node:assert/strict';
import {
  dialectSupportsForeignKey,
  getAllDataSQLByFilter,
  groupAssociationsForFk,
  normalizeFkRuleForSql,
  rebuildForeignKeyDdl,
  renderCreateForeignKeySql,
  suggestFkConstraintName,
} from './json2code';

function run(name: string, fn: () => void) {
  fn();
  // eslint-disable-next-line no-console
  console.log(`ok - ${name}`);
}

run('dialectSupportsForeignKey：P0 四库是，JAVA 否', () => {
  assert.equal(dialectSupportsForeignKey('MYSQL'), true);
  assert.equal(dialectSupportsForeignKey('PostgreSQL'), true);
  assert.equal(dialectSupportsForeignKey('SQLServer'), true);
  assert.equal(dialectSupportsForeignKey('ORACLE'), true);
  assert.equal(dialectSupportsForeignKey('JAVA'), false);
});

run('normalizeFkRuleForSql', () => {
  assert.equal(normalizeFkRuleForSql('cascade'), 'CASCADE');
  assert.equal(normalizeFkRuleForSql('set  null'), 'SET NULL');
  assert.equal(normalizeFkRuleForSql(''), undefined);
  assert.equal(normalizeFkRuleForSql('BOGUS'), undefined);
});

run('suggestFkConstraintName 截断与清洗', () => {
  assert.equal(suggestFkConstraintName('t_order', ['user_id']), 'fk_t_order_user_id');
  assert.ok(suggestFkConstraintName('a.b', ['x-y']).includes('fk_'));
});

run('groupAssociationsForFk：同名复合聚合', () => {
  const groups = groupAssociationsForFk([
    {
      from: { entity: 'order_item', field: 'order_id' },
      to: { entity: 'orders', field: 'id' },
      constraintName: 'fk_oi_order',
      deleteRule: 'CASCADE',
    },
    {
      from: { entity: 'order_item', field: 'shop_id' },
      to: { entity: 'orders', field: 'shop_id' },
      constraintName: 'fk_oi_order',
      updateRule: 'RESTRICT',
    },
    {
      from: { entity: 'posts', field: 'user_id' },
      to: { entity: 'users', field: 'id' },
    },
  ]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].fromFields, ['order_id', 'shop_id']);
  assert.deepEqual(groups[0].toFields, ['id', 'shop_id']);
  assert.equal(groups[0].deleteRule, 'CASCADE');
  assert.equal(groups[0].updateRule, 'RESTRICT');
  assert.equal(groups[1].fromEntity, 'posts');
});

run('rebuildForeignKeyDdl：MySQL 反引号 + ON DELETE/UPDATE', () => {
  const sql = rebuildForeignKeyDdl(
    {
      constraintName: 'fk_order_user',
      fromEntity: 't_order',
      toEntity: 't_user',
      fromFields: ['user_id'],
      toFields: ['id'],
      deleteRule: 'CASCADE',
      updateRule: 'RESTRICT',
    },
    'MYSQL',
  );
  assert.equal(
    sql,
    'ALTER TABLE `t_order` ADD CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
  );
});

run('rebuildForeignKeyDdl：PG 双引号', () => {
  const sql = rebuildForeignKeyDdl(
    {
      fromEntity: 't_order',
      toEntity: 't_user',
      fromFields: ['user_id'],
      toFields: ['id'],
      deleteRule: 'SET NULL',
    },
    'PostgreSQL',
  );
  assert.match(sql, /^ALTER TABLE "t_order" ADD CONSTRAINT "fk_t_order_user_id"/);
  assert.ok(sql.includes('ON DELETE SET NULL'));
  assert.doesNotMatch(sql, /ON UPDATE/);
});

run('rebuildForeignKeyDdl：SQL Server 方括号', () => {
  const sql = rebuildForeignKeyDdl(
    {
      constraintName: 'fk_a',
      fromEntity: 't_order',
      toEntity: 't_user',
      fromFields: ['user_id'],
      toFields: ['id'],
      updateRule: 'NO ACTION',
    },
    'SQLServer',
  );
  assert.equal(
    sql,
    'ALTER TABLE [t_order] ADD CONSTRAINT [fk_a] FOREIGN KEY ([user_id]) REFERENCES [t_user] ([id]) ON UPDATE NO ACTION',
  );
});

run('rebuildForeignKeyDdl：Oracle 跳过 ON UPDATE', () => {
  const sql = rebuildForeignKeyDdl(
    {
      constraintName: 'FK_ORDER_USER',
      fromEntity: 'T_ORDER',
      toEntity: 'T_USER',
      fromFields: ['USER_ID'],
      toFields: ['ID'],
      deleteRule: 'CASCADE',
      updateRule: 'CASCADE',
    },
    'ORACLE',
  );
  assert.match(sql, /ON DELETE CASCADE/);
  assert.doesNotMatch(sql, /ON UPDATE/);
});

run('rebuildForeignKeyDdl：复合列', () => {
  const sql = rebuildForeignKeyDdl(
    {
      constraintName: 'fk_oi',
      fromEntity: 'order_item',
      toEntity: 'orders',
      fromFields: ['order_id', 'shop_id'],
      toFields: ['id', 'shop_id'],
      deleteRule: 'CASCADE',
    },
    'MYSQL',
  );
  assert.ok(sql.includes('FOREIGN KEY (`order_id`, `shop_id`)'));
  assert.ok(sql.includes('REFERENCES `orders` (`id`, `shop_id`)'));
});

run('renderCreateForeignKeySql：补分号 + separator；JAVA 跳过', () => {
  const sql = renderCreateForeignKeySql(
    {
      constraintName: 'fk_a',
      fromEntity: 'a',
      toEntity: 'b',
      fromFields: ['x'],
      toFields: ['y'],
    },
    '/*SQL@Run*/\n',
    'MYSQL',
  );
  assert.equal(
    sql,
    'ALTER TABLE `a` ADD CONSTRAINT `fk_a` FOREIGN KEY (`x`) REFERENCES `b` (`y`);/*SQL@Run*/\n',
  );
  assert.equal(
    renderCreateForeignKeySql(
      {
        fromEntity: 'a',
        toEntity: 'b',
        fromFields: ['x'],
        toFields: ['y'],
      },
      '',
      'JAVA',
    ),
    '',
  );
});

run('getAllDataSQLByFilter：createForeignKey 导出', () => {
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
          },
        ],
      },
      modules: [
        {
          name: 'm',
          entities: [
            { title: 't_user', name: 'm', fields: [{ name: 'id', type: 'String' }] },
            { title: 't_order', name: 'm', fields: [{ name: 'user_id', type: 'String' }] },
          ],
          associations: [
            {
              relation: 'n:1',
              from: { entity: 't_order', field: 'user_id' },
              to: { entity: 't_user', field: 'id' },
              constraintName: 'fk_order_user',
              deleteRule: 'CASCADE',
              updateRule: 'NO ACTION',
            },
          ],
        },
      ],
    },
    'MYSQL',
    ['createForeignKey'],
  );
  assert.match(
    sql,
    /ALTER TABLE `t_order` ADD CONSTRAINT `fk_order_user` FOREIGN KEY \(`user_id`\) REFERENCES `t_user` \(`id`\) ON DELETE CASCADE ON UPDATE NO ACTION/,
  );
  assert.ok(sql.includes('/*SQL@Run*/'));
  assert.doesNotMatch(sql, /ALTER TABLE `t_user` ADD CONSTRAINT/);
});

// eslint-disable-next-line no-console
console.log('all fk export tests passed');
