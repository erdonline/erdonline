import assert from 'node:assert/strict';
import { preferDataSourceIdPayload, resolveConnectorDataSourceId } from './connectorPayload';
import { SNAPSHOT_DB_KEY } from './versionConstants';

assert.equal(resolveConnectorDataSourceId({ dataSourceId: 'ds-1' }), 'ds-1');
assert.equal(resolveConnectorDataSourceId({ dbKey: 'ds-2' }), 'ds-2');
assert.equal(resolveConnectorDataSourceId({ key: 'ds-3' }), 'ds-3');
assert.equal(resolveConnectorDataSourceId({ id: 'ds-4' }), 'ds-4');
assert.equal(resolveConnectorDataSourceId({ dataSourceId: '  ' }), undefined);
assert.equal(resolveConnectorDataSourceId({ dbKey: SNAPSHOT_DB_KEY }), undefined);
assert.equal(resolveConnectorDataSourceId({ dataSourceId: 'null' }), undefined);

const withId = preferDataSourceIdPayload({
  dbKey: 'ds-a',
  url: 'jdbc:mysql://evil/x',
  username: 'u',
  password: 'p',
  driverClassName: 'com.mysql.cj.jdbc.Driver',
  sql: 'select 1',
  flag: 'DEFAULT',
});
assert.equal(withId.dataSourceId, 'ds-a');
assert.equal(withId.sql, 'select 1');
assert.equal(withId.flag, 'DEFAULT');
assert.equal('url' in withId, false);
assert.equal('username' in withId, false);
assert.equal('password' in withId, false);
assert.equal('driverClassName' in withId, false);

const raw = preferDataSourceIdPayload({
  url: 'jdbc:mysql://127.0.0.1:3306/x',
  username: 'root',
  password: 'secret',
  driverClassName: 'com.mysql.cj.jdbc.Driver',
});
assert.equal(raw.dataSourceId, undefined);
assert.equal(raw.password, 'secret');
assert.equal(raw.url, 'jdbc:mysql://127.0.0.1:3306/x');

console.log('connectorPayload.test.ts: ok');
