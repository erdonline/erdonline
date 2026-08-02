/**
 * 纯函数单测（不依赖已坏的 max test / PuppeteerEnvironment）。
 * 运行：cd frontend && npx tsx src/utils/dbml/toProjectJSON.test.ts
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  databaseToProjectJSON,
  dbmlToProjectJSON,
  mapDbmlDefault,
  mapDbmlTypeName,
} from './toProjectJSON';

function run(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log(`ok - ${name}`);
    });
}

function tryValidateSchema(data: unknown): void {
  const schemaDir = path.resolve(__dirname, '../../../../schema');
  const ajvPkg = path.join(schemaDir, 'node_modules', 'ajv', 'package.json');
  const schemaPath = path.join(schemaDir, 'projectjson.schema.json');
  if (!existsSync(ajvPkg) || !existsSync(schemaPath)) {
    // eslint-disable-next-line no-console
    console.log('skip - schema ajv not installed (optional)');
    return;
  }
  const require = createRequire(path.join(schemaDir, 'package.json'));
  const Ajv2020 = require('ajv/dist/2020.js');
  const addFormats = require('ajv-formats');
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const validate = ajv.compile(schema);
  const ok = validate(data);
  assert.equal(
    ok,
    true,
    `schema invalid: ${JSON.stringify(validate.errors, null, 2)}`,
  );
}

async function main() {
  await run('mapDbmlTypeName 覆盖常见物理类型', () => {
    assert.equal(mapDbmlTypeName('integer'), 'Integer');
    assert.equal(mapDbmlTypeName('bigint'), 'BigInt');
    assert.equal(mapDbmlTypeName('varchar(50)'), 'String');
    assert.equal(mapDbmlTypeName('uuid'), 'IdOrKey');
    assert.equal(mapDbmlTypeName('boolean'), 'YesNo');
    assert.equal(mapDbmlTypeName('timestamp'), 'DateTime');
  });

  await run('mapDbmlDefault：string/number/expression/boolean', () => {
    assert.equal(mapDbmlDefault({ type: 'string', value: 'pending' }), "'pending'");
    assert.equal(mapDbmlDefault({ type: 'string', value: "O'Brien" }), "'O''Brien'");
    assert.equal(mapDbmlDefault({ type: 'number', value: 1 }), '1');
    assert.equal(mapDbmlDefault({ type: 'expression', value: 'now()' }), 'now()');
    assert.equal(mapDbmlDefault({ type: 'boolean', value: true }), 'TRUE');
    assert.equal(mapDbmlDefault(undefined), undefined);
  });

  await run('databaseToProjectJSON：表/字段/note→chnname/Ref→n:1/Indexes→indexs', () => {
    const json = databaseToProjectJSON({
      name: 'shop_demo',
      note: '商店',
      schemas: [
        {
          tables: [
            {
              name: 'users',
              note: '用户表',
              fields: [
                {
                  name: 'id',
                  type: { type_name: 'integer' },
                  pk: true,
                  not_null: true,
                  note: '主键',
                },
                {
                  name: 'name',
                  type: { type_name: 'varchar' },
                  note: '姓名',
                  dbdefault: { type: 'string', value: 'guest' },
                },
                {
                  name: 'email',
                  type: { type_name: 'varchar' },
                },
                {
                  name: 'qty',
                  type: { type_name: 'integer' },
                  dbdefault: { type: 'number', value: 1 },
                },
                {
                  name: 'created_at',
                  type: { type_name: 'timestamp' },
                  dbdefault: { type: 'expression', value: 'now()' },
                },
              ],
              indexes: [
                {
                  name: 'idx_users_email',
                  unique: true,
                  columns: [{ type: 'column', value: 'email' }],
                },
                {
                  name: 'pk_skip',
                  pk: true,
                  columns: [{ type: 'column', value: 'id' }],
                },
                {
                  name: 'expr_skip',
                  columns: [{ type: 'expression', value: 'LOWER(email)' }],
                },
              ],
            },
            {
              name: 'posts',
              note: '帖子',
              fields: [
                { name: 'id', type: { type_name: 'integer' }, pk: true },
                { name: 'user_id', type: { type_name: 'integer' } },
              ],
            },
          ],
          refs: [
            {
              endpoints: [
                { tableName: 'users', fieldNames: ['id'], relation: '1' },
                { tableName: 'posts', fieldNames: ['user_id'], relation: '*' },
              ],
            },
          ],
        },
      ],
    });

    assert.equal(json.modules.length, 1);
    const mod = json.modules[0];
    assert.equal(mod.name, 'shop_demo');
    assert.equal(mod.chnname, '商店');
    assert.equal(mod.entities.length, 2);
    assert.equal(mod.entities[0].title, 'users');
    assert.equal(mod.entities[0].chnname, '用户表');
    assert.equal(mod.entities[0].fields[0].chnname, '主键');
    assert.equal(mod.entities[0].fields[0].type, 'Integer');
    assert.equal(mod.entities[0].fields[0].pk, true);
    assert.equal(mod.entities[0].fields[1].defaultValue, "'guest'");
    assert.equal(mod.entities[0].fields[3].defaultValue, '1');
    assert.equal(mod.entities[0].fields[4].defaultValue, 'now()');
    assert.deepEqual(mod.entities[0].indexs, [
      { name: 'idx_users_email', isUnique: true, fields: ['email'] },
    ]);
    assert.deepEqual(mod.entities[1].indexs, []);
    assert.equal(mod.associations.length, 1);
    assert.deepEqual(mod.associations[0], {
      relation: 'n:1',
      from: { entity: 'posts', field: 'user_id' },
      to: { entity: 'users', field: 'id' },
    });
    assert.equal(mod.graphCanvas.nodes.length, 2);
    // ADR-0016：dagre LR，外键侧 posts.x < 主键侧 users.x（旧网格 posts 在右列更大 x）
    const postsNode = mod.graphCanvas.nodes.find((n) => n.id === 'posts');
    const usersNode = mod.graphCanvas.nodes.find((n) => n.id === 'users');
    assert.ok(postsNode && usersNode);
    assert.ok(
      postsNode!.x < usersNode!.x,
      `期望 posts.x < users.x，得 ${postsNode!.x} / ${usersNode!.x}`,
    );
    assert.equal(
      mod.diagrams[0].groups?.length ?? 0,
      0,
      'users/posts 无前缀簇、单连通分量 → 不建议 Frame',
    );
    tryValidateSchema(json);
  });

  await run('databaseToProjectJSON：前缀表建议 Frame', () => {
    const json = databaseToProjectJSON({
      name: 'prefixed',
      note: '前缀',
      schemas: [
        {
          tables: [
            {
              name: 'sys_user',
              fields: [{ name: 'id', pk: true, type: { type_name: 'integer' } }],
            },
            {
              name: 'sys_role',
              fields: [{ name: 'id', pk: true, type: { type_name: 'integer' } }],
            },
            {
              name: 'biz_order',
              fields: [
                { name: 'id', pk: true, type: { type_name: 'integer' } },
                { name: 'user_id', type: { type_name: 'integer' } },
              ],
            },
            {
              name: 'biz_item',
              fields: [
                { name: 'id', pk: true, type: { type_name: 'integer' } },
                { name: 'order_id', type: { type_name: 'integer' } },
              ],
            },
          ],
          refs: [
            {
              endpoints: [
                { tableName: 'biz_order', fieldNames: ['user_id'], relation: '*' },
                { tableName: 'sys_user', fieldNames: ['id'], relation: '1' },
              ],
            },
            {
              endpoints: [
                { tableName: 'biz_item', fieldNames: ['order_id'], relation: '*' },
                { tableName: 'biz_order', fieldNames: ['id'], relation: '1' },
              ],
            },
          ],
        },
      ],
    });
    const groups = json.modules[0].diagrams[0].groups || [];
    assert.equal(groups.length, 2);
    const names = groups.map((g) => g.name).sort();
    assert.deepEqual(names, ['biz', 'sys']);
    const sys = groups.find((g) => g.name === 'sys')!;
    assert.deepEqual(sys.memberEntityIds.sort(), ['sys_role', 'sys_user']);
    assert.ok(sys.w > 0 && sys.h > 0);
  });

  await run('dbmlToProjectJSON：真实 @dbml/core 解析含 indexes + default', async () => {
    const dbml = `
Project erd_dbml {
  database_type: 'MySQL'
  Note: 'DBML导入'
}
Table users {
  id integer [pk, increment, not null, note: '主键']
  name varchar [default: 'guest', note: '姓名']
  email varchar
  qty integer [default: 1]
  created_at timestamp [default: \`now()\`]
  indexes {
    (email) [name: 'idx_users_email', unique]
    (name, email) [name: 'idx_users_name_email']
  }
  Note: '用户表'
}
Table posts {
  id integer [pk]
  user_id integer [ref: > users.id]
  title varchar
  Note: '帖子'
}
`;
    const json = await dbmlToProjectJSON(dbml);
    assert.equal(json.modules[0].name, 'erd_dbml');
    assert.equal(json.modules[0].chnname, 'DBML导入');
    assert.equal(json.modules[0].entities.length, 2);
    assert.ok(json.modules[0].associations.length >= 1);
    const assoc = json.modules[0].associations[0];
    assert.equal(assoc.from.entity, 'posts');
    assert.equal(assoc.to.entity, 'users');
    const users = json.modules[0].entities.find((e) => e.title === 'users');
    assert.ok(users);
    assert.equal(users!.fields.find((f) => f.name === 'name')?.defaultValue, "'guest'");
    assert.equal(users!.fields.find((f) => f.name === 'qty')?.defaultValue, '1');
    assert.equal(users!.fields.find((f) => f.name === 'created_at')?.defaultValue, 'now()');
    assert.deepEqual(users!.indexs, [
      { name: 'idx_users_email', isUnique: true, fields: ['email'] },
      { name: 'idx_users_name_email', isUnique: false, fields: ['name', 'email'] },
    ]);
    tryValidateSchema(json);
  });

  await run('空内容抛错', async () => {
    await assert.rejects(() => dbmlToProjectJSON('   '), /空/);
  });

  // eslint-disable-next-line no-console
  console.log('toProjectJSON.test.ts: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
