import React, { useMemo } from 'react';
import { Button, Checkbox, Form, Input, Select, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  FIELD_TYPE_GROUP_ENUM,
  FIELD_TYPE_GROUP_LOGIC,
  formatFieldTypeLabel,
  partitionFieldTypes,
  type DataTypeDomainRow,
} from '@/utils/fieldTypeOptions';
import type { DataDictField } from '@/services/data-dict';

export type FieldLibraryFieldsEditorProps = {
  datatype: DataTypeDomainRow[] | undefined | null;
};

export const emptyFieldRow = (): DataDictField => ({
  name: '',
  chnname: '',
  type: 'MiddleString',
  typeName: '字串',
  pk: false,
  notNull: false,
});

const FieldLibraryFieldsEditor: React.FC<FieldLibraryFieldsEditorProps> = ({
  datatype,
}) => {
  const form = Form.useFormInstance();

  const typeOptions = useMemo(() => {
    const { logic, enums, byCode } = partitionFieldTypes(datatype);
    if (!byCode.has('MiddleString')) {
      logic.push({ code: 'MiddleString', name: '字串', kind: 'logic' });
    }
    return [
      {
        label: FIELD_TYPE_GROUP_LOGIC,
        options: logic.map((opt) => ({
          value: opt.code,
          label: formatFieldTypeLabel(opt),
          typeName: opt.name,
        })),
      },
      ...(enums.length
        ? [
            {
              label: FIELD_TYPE_GROUP_ENUM,
              options: enums.map((opt) => ({
                value: opt.code,
                label: formatFieldTypeLabel(opt),
                typeName: opt.name,
              })),
            },
          ]
        : []),
    ];
  }, [datatype]);

  const typeNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of typeOptions) {
      for (const opt of group.options) {
        map.set(opt.value, opt.typeName || opt.value);
      }
    }
    return map;
  }, [typeOptions]);

  return (
    <Form.List name="fields">
      {(fields, { add, remove }) => (
        <div data-testid="field-library-fields-editor">
          {fields.map((field, index) => (
            <Space
              key={field.key}
              align="start"
              wrap
              style={{ display: 'flex', marginBottom: 8 }}
              data-testid={`field-library-form-field-row-${index}`}
            >
              <Form.Item
                {...field}
                name={[field.name, 'name']}
                rules={[{ required: true, message: '请输入英文名' }]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="英文名"
                  data-testid="field-library-form-field-name"
                  aria-label={`字段英文名 ${index + 1}`}
                  style={{ width: 120 }}
                />
              </Form.Item>
              <Form.Item
                {...field}
                name={[field.name, 'chnname']}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="中文名"
                  data-testid="field-library-form-field-chnname"
                  aria-label={`字段中文名 ${index + 1}`}
                  style={{ width: 120 }}
                />
              </Form.Item>
              <Form.Item
                {...field}
                name={[field.name, 'type']}
                rules={[{ required: true, message: '请选择类型' }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="类型"
                  options={typeOptions}
                  style={{ width: 180 }}
                  showSearch
                  optionFilterProp="label"
                  data-testid="field-library-form-field-type"
                  aria-label={`字段类型 ${index + 1}`}
                  onChange={(code: string) => {
                    form.setFieldValue(
                      ['fields', field.name, 'typeName'],
                      typeNameByCode.get(code) || code,
                    );
                  }}
                />
              </Form.Item>
              <Form.Item
                {...field}
                name={[field.name, 'typeName']}
                hidden
                style={{ marginBottom: 0 }}
              >
                <Input type="hidden" />
              </Form.Item>
              <Form.Item
                {...field}
                name={[field.name, 'notNull']}
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox aria-label={`字段非空 ${index + 1}`}>非空</Checkbox>
              </Form.Item>
              <Form.Item
                {...field}
                name={[field.name, 'pk']}
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox aria-label={`字段主键 ${index + 1}`}>主键</Checkbox>
              </Form.Item>
              {fields.length > 1 ? (
                <Button
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  aria-label={`删除字段行 ${index + 1}`}
                  data-testid="field-library-form-field-remove"
                  onClick={() => remove(field.name)}
                />
              ) : null}
            </Space>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            data-testid="field-library-form-field-add"
            aria-label="添加字段"
            onClick={() => add(emptyFieldRow())}
          >
            添加字段
          </Button>
        </div>
      )}
    </Form.List>
  );
};

export default React.memo(FieldLibraryFieldsEditor);
