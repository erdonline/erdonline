import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  FIELD_TYPE_GROUP_ENUM,
  FIELD_TYPE_GROUP_LOGIC,
  flatTypeNamesPreferEnum,
  formatFieldTypeLabel,
  jexcelTypeDropdownSource,
  partitionFieldTypes,
} from './fieldTypeOptions';

describe('fieldTypeOptions', () => {
  const sample = [
    { code: 'Integer', name: '整数' },
    { code: 'color_t', name: '颜色', kind: 'enum' as const },
    { code: 'Status', name: '状态', kind: 'enum' as const },
  ];

  it('partitionFieldTypes splits enum vs logic and keeps legacy codes', () => {
    const { logic, enums, byCode } = partitionFieldTypes(sample);
    assert.equal(enums.length, 2);
    assert.ok(enums.every((e) => e.kind === 'enum'));
    assert.ok(logic.some((l) => l.code === 'Integer'));
    assert.ok(logic.some((l) => l.code === 'String')); // legacy
    assert.equal(byCode.get('color_t')?.kind, 'enum');
  });

  it('formatFieldTypeLabel shows code · name when distinct', () => {
    assert.equal(
      formatFieldTypeLabel({ code: 'Integer', name: '整数', kind: 'logic' }),
      'Integer · 整数',
    );
    assert.equal(
      formatFieldTypeLabel({ code: 'String', name: 'String', kind: 'logic' }),
      'String',
    );
  });

  it('jexcelTypeDropdownSource uses name id and group labels', () => {
    const src = jexcelTypeDropdownSource(sample);
    const enumItems = src.filter((i) => i.group === FIELD_TYPE_GROUP_ENUM);
    const logicItems = src.filter((i) => i.group === FIELD_TYPE_GROUP_LOGIC);
    assert.deepEqual(
      enumItems.map((i) => i.id),
      ['颜色', '状态'],
    );
    assert.ok(logicItems.some((i) => i.id === '整数'));
    assert.ok(logicItems.every((i) => i.group === FIELD_TYPE_GROUP_LOGIC));
  });

  it('flatTypeNamesPreferEnum puts enums first', () => {
    assert.deepEqual(flatTypeNamesPreferEnum(sample).slice(0, 2), [
      '颜色',
      '状态',
    ]);
  });
});
