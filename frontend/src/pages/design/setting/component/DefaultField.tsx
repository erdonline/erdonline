import React from 'react';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {message} from "antd";
import JExcel from "@/pages/JExcel";
import './setting-common.scss';


export type DefaultFieldProps = {};

// Empty validator
export const emptyValidator = (value: any, callback: any) => {
  if (!value || value.length === 0) {
    message.error("当前编辑项不允许为空");
    callback(false);
  } else {
    callback(true);
  }
};

export const column1 = [
  {
    title: '中文名*',
    name: 'chnname',
    type: 'text',
    width: '100',
  }, {
    title: '英文名*',
    name: 'name',
    type: 'text',
    width: '100'
  },];

export const column2 = [
  {
    title: '类型(code)',
    name: 'type',
    type: 'text',
    width: '100',
    readOnly: true
  }, {
    title: '数据源类型',
    name: 'dataType',
    type: 'text',
    width: '130',
    readOnly: true
  }, {
    title: '说明',
    name: 'remark',
    type: 'text',
    width: '100',
  }, {
    title: '主键',
    name: 'pk',
    type: 'checkbox',
    width: '50',
  }, {
    title: '非空',
    name: 'notNull',
    type: 'checkbox',
    width: '50',
  }, {
    title: '自增',
    name: 'autoIncrement',
    type: 'checkbox',
    width: '50',
  }, {
    title: '在关系图中隐藏',
    name: 'relationNoShow',
    type: 'checkbox',
    width: '120',
  }, {
    title: '默认值',
    name: 'defaultValue',
    type: 'text',
    width: '100',
  }, {
    title: 'UI建议',
    name: 'uiHint',
    type: 'dropdown',
    width: '100',
    source: ['Text', 'Number', 'Money', 'Select', 'Radio', 'CheckBox', 'Email', 'URL', 'DatePicker', 'TextArea', 'AddressPicker'],
  }];

const DefaultField: React.FC<DefaultFieldProps> = (props) => {
  const {datatype, projectDispatch} = useProjectStore(state => ({
    datatype: state.project?.projectJSON?.dataTypeDomains?.datatype,
    database: state.project?.projectJSON?.dataTypeDomains?.database,
    projectDispatch: state.dispatch,
  }), shallow);

  const allDataTypeName = datatype?.map((t: any) => {
    return t.name;
  })

  const rawDefaultFields = useProjectStore(
    (s) => s.project?.projectJSON?.profile?.defaultFields,
    shallow,
  );
  const data = (projectDispatch.getDefaultFields() || []).filter(
    (f: any) => f != null && typeof f === 'object',
  );
  // 原始 profile 有字段但映射结果为空时，回退展示原始行，避免空白表
  const sheetData =
    data.length > 0
      ? data
      : (Array.isArray(rawDefaultFields?.[0])
          ? (rawDefaultFields as any[]).flat()
          : rawDefaultFields || []
        ).filter((f: any) => f != null && typeof f === 'object');

  const afterChange = (payload: any) => {
    // 禁止空表写回冲掉已有默认字段（JExcel 空态 onchange / 过滤后 []）
    if (
      (!payload || payload.length === 0) &&
      (rawDefaultFields?.length || sheetData.length)
    ) {
      return;
    }
    projectDispatch.updateDefaultFields(payload);
  }

  const columns = [
    ...column1, {
      title: '类型*',
      name: 'typeName',
      type: 'dropdown',
      source: allDataTypeName,
      width: '150',
    },
    ...column2
  ];

  // key：项目字段就绪后再挂载表格，避免空 init 后不再刷新
  const sheetKey = `df-${sheetData.length}-${sheetData[0]?.name || 'empty'}`;

  return (
    <div
      className="setting-common-page"
      data-testid="default-field-page"
      data-field-count={sheetData.length}
    >
      <h2 className="setting-common-page__title">默认字段设置</h2>
      <p className="setting-common-page__hint">新建表时自动带入下列字段；编辑后即时保存</p>
      <div className="setting-common-page__sheet">
        <JExcel
          key={sheetKey}
          data={sheetData}
          columns={columns}
          saveData={afterChange}
          notEmptyColumn={['chnname', 'name', 'typeName']}
        />
      </div>
    </div>
  )
}

export default React.memo(DefaultField)
