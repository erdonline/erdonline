import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeApplyToProject,
  mergeEnumsIntoDomains,
  mergeFieldsIntoEntity,
  overwriteFieldsAtIndices,
} from './fieldLibraryMerge';

describe('fieldLibraryMerge', () => {
  it('mergeFieldsIntoEntity dedupes by name', () => {
    const existing = [{ name: 'id', chnname: '主键' }];
    const incoming = [
      { name: 'id', chnname: 'dup' },
      { name: 'gender', chnname: '性别' },
    ];
    const merged = mergeFieldsIntoEntity(existing, incoming);
    assert.equal(merged.length, 2);
    assert.equal(merged[1].name, 'gender');
  });

  it('mergeEnumsIntoDomains unions by code', () => {
    const existing = [{ code: 'IdOrKey', name: '标识' }];
    const incoming = [
      { code: 'Gender', name: '性别', kind: 'enum' as const },
      { code: 'IdOrKey', name: 'dup' },
    ];
    const merged = mergeEnumsIntoDomains(existing, incoming);
    assert.equal(merged.length, 2);
    assert.equal(merged[1].code, 'Gender');
  });

  it('computeApplyToProject counts additions', () => {
    const result = computeApplyToProject({
      existingFields: [{ name: 'id' }],
      existingDatatypes: [],
      applyResult: {
        dictId: 'dd-field-gender',
        fields: [{ name: 'gender', type: 'Gender' }],
        enums: [{ code: 'Gender', name: '性别', kind: 'enum' }],
      },
    });
    assert.equal(result.addedFieldCount, 1);
    assert.equal(result.addedEnumCount, 1);
    assert.equal(result.modifiedFieldCount, 0);
  });

  it('overwriteFieldsAtIndices replaces single selected row', () => {
    const existing = [
      { name: 'id', chnname: '主键' },
      { name: 'foo', chnname: '旧名' },
    ];
    const incoming = [{ name: 'gender', chnname: '性别', type: 'Gender' }];
    const { fields, modifiedFieldCount } = overwriteFieldsAtIndices(existing, incoming, [1]);
    assert.equal(modifiedFieldCount, 1);
    assert.equal(fields.length, 2);
    assert.equal(fields[1].name, 'gender');
    assert.equal(fields[1].chnname, '性别');
    assert.equal(fields[0].name, 'id');
  });

  it('overwriteFieldsAtIndices applies one template to multiple rows', () => {
    const existing = [
      { name: 'a', chnname: 'A' },
      { name: 'b', chnname: 'B' },
      { name: 'c', chnname: 'C' },
    ];
    const incoming = [{ name: 'gender', chnname: '性别' }];
    const { fields, modifiedFieldCount } = overwriteFieldsAtIndices(existing, incoming, [0, 2]);
    assert.equal(modifiedFieldCount, 2);
    assert.equal(fields[0].name, 'gender');
    assert.equal(fields[2].name, 'gender');
    assert.equal(fields[1].name, 'b');
  });

  it('computeApplyToProject overwrite mode uses selected indices', () => {
    const result = computeApplyToProject({
      existingFields: [{ name: 'id' }, { name: 'foo', chnname: '旧' }],
      existingDatatypes: [],
      mode: 'overwrite',
      selectedRowIndices: [1],
      applyResult: {
        dictId: 'dd-field-gender',
        fields: [{ name: 'gender', chnname: '性别' }],
      },
    });
    assert.equal(result.modifiedFieldCount, 1);
    assert.equal(result.addedFieldCount, 0);
    assert.equal(result.fields[1].name, 'gender');
  });
});
