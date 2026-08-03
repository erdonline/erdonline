/**
 * projectJSON → DBML + round-trip 单测。
 * 运行：cd frontend && yarn test:unit:dbml
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  formatDefaultAttr,
  formatIndexColumn,
  mapLogicalTypeToDbml,
  projectJSONToDbml,
} from './fromProjectJSON';
import { dbmlToProjectJSON } from './toProjectJSON';

function run(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log(`ok - ${name}`);
    });
}

async function main() {
  await run('mapLogicalTypeToDbml 反查常见逻辑类型', () => {
    assert.equal(mapLogicalTypeToDbml('Integer'), 'integer');
    assert.equal(mapLogicalTypeToDbml('BigInt'), 'bigint');
    assert.equal(mapLogicalTypeToDbml('String'), 'varchar');
    assert.equal(mapLogicalTypeToDbml('IdOrKey'), 'uuid');
    assert.equal(mapLogicalTypeToDbml('YesNo'), 'boolean');
    assert.equal(mapLogicalTypeToDbml('DateTime'), 'timestamp');
    assert.equal(mapLogicalTypeToDbml('Unknown'), 'varchar');
  });

  await run('formatDefaultAttr：string/number/expression', () => {
    assert.equal(formatDefaultAttr("'guest'"), "default: 'guest'");
    assert.equal(formatDefaultAttr('1'), 'default: 1');
    assert.equal(formatDefaultAttr('now()'), 'default: `now()`');
    assert.equal(formatDefaultAttr('CURRENT_TIMESTAMP'), 'default: `CURRENT_TIMESTAMP`');
    assert.equal(formatDefaultAttr(''), null);
  });

  await run('formatIndexColumn：列名 vs 表达式', () => {
    assert.equal(formatIndexColumn('email'), 'email');
    assert.equal(formatIndexColumn('LOWER(email)'), '`LOWER(email)`');
    assert.equal(formatIndexColumn('`LOWER(email)`'), '`LOWER(email)`');
    assert.equal(formatIndexColumn('"weird col"'), '"weird col"');
  });

  await run('projectJSONToDbml：index.filter → note filter: 约定', () => {
    const dbml = projectJSONToDbml({
      modules: [
        {
          name: 'm',
          chnname: '',
          entities: [
            {
              title: 'users',
              name: 'users',
              chnname: '',
              fields: [
                {
                  name: 'email',
                  chnname: '',
                  type: 'String',
                  pk: false,
                  notNull: false,
                  autoIncrement: false,
                },
              ],
              indexs: [
                {
                  name: 'idx_active',
                  isUnique: true,
                  fields: ['email'],
                  filter: '(deleted_at IS NULL)',
                },
              ],
            },
          ],
          associations: [],
          graphCanvas: { nodes: [], edges: [] },
        },
      ],
    });
    assert.match(
      dbml,
      /\(email\) \[name: 'idx_active', unique, note: 'filter: \(deleted_at IS NULL\)'\]/,
    );
  });

  await run('projectJSONToDbml：表/字段/chnname→note/Ref/indexs', () => {
    const dbml = projectJSONToDbml({
      modules: [
        {
          name: 'shop_demo',
          chnname: '商店',
          entities: [
            {
              title: 'users',
              name: 'users',
              chnname: '用户表',
              fields: [
                {
                  name: 'id',
                  chnname: '主键',
                  type: 'Integer',
                  pk: true,
                  notNull: true,
                  autoIncrement: true,
                },
                {
                  name: 'name',
                  chnname: '姓名',
                  type: 'String',
                  pk: false,
                  notNull: false,
                  autoIncrement: false,
                  defaultValue: "'guest'",
                },
                {
                  name: 'email',
                  chnname: '',
                  type: 'String',
                  pk: false,
                  notNull: false,
                  autoIncrement: false,
                },
                {
                  name: 'qty',
                  chnname: '',
                  type: 'Integer',
                  pk: false,
                  notNull: false,
                  autoIncrement: false,
                  defaultValue: '1',
                },
                {
                  name: 'created_at',
                  chnname: '',
                  type: 'DateTime',
                  pk: false,
                  notNull: false,
                  autoIncrement: false,
                  defaultValue: 'now()',
                },
              ],
              indexs: [
                {
                  name: 'idx_users_email',
                  isUnique: true,
                  fields: ['email'],
                },
                {
                  name: 'idx_users_name_email',
                  isUnique: false,
                  fields: ['name', 'email'],
                },
                {
                  name: 'idx_users_email_lower',
                  isUnique: true,
                  fields: ['LOWER(email)'],
                },
                {
                  name: 'idx_users_mixed',
                  isUnique: false,
                  fields: ['email', 'LOWER(email)'],
                },
              ],
            },
            {
              title: 'posts',
              name: 'posts',
              chnname: '帖子',
              fields: [
                {
                  name: 'id',
                  chnname: '',
                  type: 'Integer',
                  pk: true,
                  notNull: true,
                  autoIncrement: false,
                },
                {
                  name: 'user_id',
                  chnname: '',
                  type: 'Integer',
                  pk: false,
                  notNull: false,
                  autoIncrement: false,
                },
              ],
              indexs: [],
            },
          ],
          associations: [
            {
              relation: '1:n',
              from: { entity: 'posts', field: 'user_id' },
              to: { entity: 'users', field: 'id' },
            },
          ],
          graphCanvas: { nodes: [], edges: [] },
        },
      ],
    });

    assert.match(dbml, /Project shop_demo/);
    assert.match(dbml, /Note: '商店'/);
    assert.match(dbml, /Table users/);
    assert.match(dbml, /id integer \[pk, increment, not null, note: '主键'\]/);
    assert.match(
      dbml,
      /name varchar \[default: 'guest', note: '姓名'\]/,
    );
    assert.match(dbml, /qty integer \[default: 1\]/);
    assert.match(dbml, /created_at timestamp \[default: `now\(\)`\]/);
    assert.match(dbml, /Note: '用户表'/);
    assert.match(dbml, /indexes \{/);
    assert.match(
      dbml,
      /\(email\) \[name: 'idx_users_email', unique\]/,
    );
    assert.match(
      dbml,
      /\(name, email\) \[name: 'idx_users_name_email'\]/,
    );
    assert.match(
      dbml,
      /\(`LOWER\(email\)`\) \[name: 'idx_users_email_lower', unique\]/,
    );
    assert.match(
      dbml,
      /\(email, `LOWER\(email\)`\) \[name: 'idx_users_mixed'\]/,
    );
    assert.match(dbml, /Ref: posts\.user_id > users\.id/);
  });

  await run('空模块抛错', () => {
    assert.throws(
      () => projectJSONToDbml({ modules: [] }),
      /没有任何模型/,
    );
    assert.throws(
      () =>
        projectJSONToDbml({
          modules: [
            {
              name: 'empty',
              chnname: '',
              entities: [],
              associations: [],
              graphCanvas: { nodes: [], edges: [] },
            },
          ],
        }),
      /没有表/,
    );
  });

  await run('projectJSONToDbml：Enum 块 + 字段类型引用枚举 code', () => {
    const dbml = projectJSONToDbml({
      dataTypeDomains: {
        datatype: [
          {
            name: 'order_status',
            code: 'order_status',
            kind: 'enum',
            values: [
              { name: 'pending', chnname: '待处理' },
              { name: 'paid' },
            ],
          },
        ],
      },
      modules: [
        {
          name: 'shop',
          chnname: '',
          entities: [
            {
              title: 'orders',
              name: 'orders',
              chnname: '订单',
              fields: [
                {
                  name: 'id',
                  chnname: '',
                  type: 'Integer',
                  pk: true,
                  notNull: true,
                  autoIncrement: false,
                },
                {
                  name: 'status',
                  chnname: '订单状态',
                  type: 'order_status',
                  pk: false,
                  notNull: true,
                  autoIncrement: false,
                  defaultValue: "'pending'",
                },
              ],
              indexs: [],
            },
          ],
          associations: [],
          graphCanvas: { nodes: [], edges: [] },
        },
      ],
    });
    assert.match(dbml, /Enum order_status \{/);
    assert.match(dbml, /pending \[note: '待处理'\]/);
    assert.match(dbml, /paid/);
    assert.match(
      dbml,
      /status order_status \[not null, default: 'pending', note: '订单状态'\]/,
    );
  });

  await run('round-trip：fixture 导入→导出→再导入，实体/FK/indexs/default 稳定', async () => {
    const fixture = path.resolve(
      __dirname,
      '../../../tests/fixtures/minimal.dbml',
    );
    const text = readFileSync(fixture, 'utf8');
    const first = await dbmlToProjectJSON(text);
    const exported = projectJSONToDbml(first);
    const second = await dbmlToProjectJSON(exported);

    const e1 = first.modules[0].entities;
    const e2 = second.modules[0].entities;
    assert.equal(e2.length, e1.length);
    assert.deepEqual(
      e2.map((e) => e.title).sort(),
      e1.map((e) => e.title).sort(),
    );
    assert.equal(first.modules[0].name, second.modules[0].name);

    for (const ent of e1) {
      const peer = e2.find((e) => e.title === ent.title);
      assert.ok(peer, `missing entity ${ent.title}`);
      assert.equal(peer!.chnname, ent.chnname);
      assert.deepEqual(
        peer!.fields.map((f) => ({
          name: f.name,
          chnname: f.chnname,
          type: f.type,
          pk: f.pk,
          notNull: f.notNull,
          autoIncrement: f.autoIncrement,
          defaultValue: f.defaultValue || '',
        })),
        ent.fields.map((f) => ({
          name: f.name,
          chnname: f.chnname,
          type: f.type,
          pk: f.pk,
          notNull: f.notNull,
          autoIncrement: f.autoIncrement,
          defaultValue: f.defaultValue || '',
        })),
      );
      assert.deepEqual(peer!.indexs, ent.indexs);
    }

    const users = e1.find((e) => e.title === 'users');
    assert.ok(users);
    assert.equal(users!.fields.find((f) => f.name === 'name')?.defaultValue, "'guest'");
    assert.deepEqual(users!.indexs, [
      { name: 'idx_users_name', isUnique: false, fields: ['name'] },
    ]);
    assert.match(exported, /idx_users_name/);
    assert.match(exported, /default: 'guest'/);

    const a1 = first.modules[0].associations;
    const a2 = second.modules[0].associations;
    assert.equal(a2.length, a1.length);
    assert.deepEqual(
      a2.map((a) => ({
        relation: a.relation,
        from: a.from,
        to: a.to,
      })),
      a1.map((a) => ({
        relation: a.relation,
        from: a.from,
        to: a.to,
      })),
    );
  });

  await run('round-trip：enum fixture 导入→导出→再导入，枚举/字段 type/value note 稳定', async () => {
    const fixture = path.resolve(
      __dirname,
      '../../../tests/fixtures/enum.dbml',
    );
    const text = readFileSync(fixture, 'utf8');
    const first = await dbmlToProjectJSON(text);
    const exported = projectJSONToDbml(first);
    const second = await dbmlToProjectJSON(exported);

    assert.match(exported, /Enum order_status \{/);
    assert.match(exported, /pending \[note: '待处理'\]/);

    const d1 = first.dataTypeDomains.datatype;
    const d2 = second.dataTypeDomains.datatype;
    assert.equal(d2.length, d1.length);
    assert.deepEqual(
      d2.map((d) => ({
        code: d.code,
        kind: d.kind,
        values: d.values,
      })),
      d1.map((d) => ({
        code: d.code,
        kind: d.kind,
        values: d.values,
      })),
    );

    const f1 = first.modules[0].entities[0].fields.find((f) => f.name === 'status');
    const f2 = second.modules[0].entities[0].fields.find((f) => f.name === 'status');
    assert.equal(f1?.type, 'order_status');
    assert.equal(f2?.type, 'order_status');
    assert.equal(f2?.defaultValue, f1?.defaultValue);
    assert.equal(f2?.chnname, f1?.chnname);
  });

  await run('round-trip：expression-index fixture 导入→导出→再导入，表达式索引稳定', async () => {
    const fixture = path.resolve(
      __dirname,
      '../../../tests/fixtures/expression-index.dbml',
    );
    const text = readFileSync(fixture, 'utf8');
    const first = await dbmlToProjectJSON(text);
    const exported = projectJSONToDbml(first);
    const second = await dbmlToProjectJSON(exported);

    const users1 = first.modules[0].entities.find((e) => e.title === 'users');
    const users2 = second.modules[0].entities.find((e) => e.title === 'users');
    assert.ok(users1 && users2);
    assert.deepEqual(users1!.indexs, [
      {
        name: 'idx_users_email_lower',
        isUnique: true,
        fields: ['LOWER(email)'],
      },
      {
        name: 'idx_users_mixed',
        isUnique: false,
        fields: ['email', 'LOWER(email)'],
      },
    ]);
    assert.deepEqual(users2!.indexs, users1!.indexs);
    assert.match(exported, /`LOWER\(email\)`/);
    assert.match(exported, /idx_users_email_lower/);
  });

  await run('round-trip：index.filter ↔ note filter: 约定', async () => {
    const first = {
      modules: [
        {
          name: 'm',
          chnname: '',
          entities: [
            {
              title: 'users',
              name: 'users',
              chnname: '',
              fields: [
                {
                  name: 'email',
                  chnname: '',
                  type: 'String',
                  pk: false,
                  notNull: false,
                  autoIncrement: false,
                },
              ],
              indexs: [
                {
                  name: 'idx_active',
                  isUnique: true,
                  fields: ['email'],
                  filter: '(deleted_at IS NULL)',
                },
              ],
            },
          ],
          associations: [],
          graphCanvas: { nodes: [], edges: [] },
        },
      ],
    };
    const exported = projectJSONToDbml(first);
    const second = await dbmlToProjectJSON(exported);
    const ix = second.modules[0].entities[0].indexs[0];
    assert.equal(ix.name, 'idx_active');
    assert.equal(ix.isUnique, true);
    assert.deepEqual(ix.fields, ['email']);
    assert.equal(ix.filter, '(deleted_at IS NULL)');
    assert.match(exported, /note: 'filter: \(deleted_at IS NULL\)'/);
  });

  // eslint-disable-next-line no-console
  console.log('fromProjectJSON.test.ts: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
