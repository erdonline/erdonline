/**
 * projectJSON → DBML + round-trip 单测。
 * 运行：cd frontend && yarn test:unit:dbml
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  formatDefaultAttr,
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

  // eslint-disable-next-line no-console
  console.log('fromProjectJSON.test.ts: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
