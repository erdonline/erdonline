import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeApplyToProject,
  mergeEnumsIntoDomains,
  mergeFieldsIntoEntity,
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
  });
});
