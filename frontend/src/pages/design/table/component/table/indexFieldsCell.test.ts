import assert from 'node:assert/strict';
import { formatIndexFieldsCell, parseIndexFieldsCell } from './indexFieldsCell';

assert.equal(formatIndexFieldsCell(undefined), '');
assert.equal(formatIndexFieldsCell([]), '');
assert.equal(formatIndexFieldsCell(['id']), 'id');
assert.equal(formatIndexFieldsCell(['id', 'LOWER(email)']), 'id;LOWER(email)');
assert.equal(formatIndexFieldsCell('  LOWER(id)  '), 'LOWER(id)');

assert.deepEqual(parseIndexFieldsCell(undefined), []);
assert.deepEqual(parseIndexFieldsCell(''), []);
assert.deepEqual(parseIndexFieldsCell(';'), []);
assert.deepEqual(parseIndexFieldsCell('id'), ['id']);
assert.deepEqual(parseIndexFieldsCell('id;LOWER(email)'), ['id', 'LOWER(email)']);
assert.deepEqual(parseIndexFieldsCell('  id ; LOWER(email) ; '), ['id', 'LOWER(email)']);
assert.deepEqual(parseIndexFieldsCell(['id', ' LOWER(email) ']), ['id', 'LOWER(email)']);

console.log('indexFieldsCell.test.ts ok');
