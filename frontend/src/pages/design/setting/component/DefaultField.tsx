import { designIntl } from '@/pages/design/locales/intl';
import React, { useRef, useState } from 'react';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {message} from "antd";
import JExcel from "@/pages/JExcel";
import { jexcelTypeDropdownSource } from '@/utils/fieldTypeOptions';
import './setting-common.scss';


export type DefaultFieldProps = {};

// Empty validator


export const emptyValidator = (value: any, callback: any) => {
  if (!value || value.length === 0) {
    message.error(designIntl('design.setting.defaultField.error.empty'));
    callback(false);
  } else {
    callback(true);
  }
};

const DefaultField: React.FC<DefaultFieldProps> = () => {
  const column1 = [
    { title: designIntl('design.setting.defaultField.col.chnname'), name: 'chnname', type: 'text', width: '100' },
    { title: designIntl('design.setting.defaultField.col.name'), name: 'name', type: 'text', width: '100' },
  ];
  const column2 = [
    { title: designIntl('design.setting.defaultField.col.typeCode'), name: 'type', type: 'text', width: '100', readOnly: true },
    { title: designIntl('design.setting.defaultField.col.dataType'), name: 'dataType', type: 'text', width: '130', readOnly: true },
    { title: designIntl('design.setting.defaultField.col.remark'), name: 'remark', type: 'text', width: '100' },
    { title: designIntl('design.common.field.pk'), name: 'pk', type: 'checkbox', width: '50' },
    { title: designIntl('design.common.field.notNull'), name: 'notNull', type: 'checkbox', width: '50' },
    { title: designIntl('design.common.field.autoIncrement'), name: 'autoIncrement', type: 'checkbox', width: '50' },
    { title: designIntl('design.common.field.hideOnDiagram'), name: 'relationNoShow', type: 'checkbox', width: '120' },
    { title: designIntl('design.common.field.defaultValue'), name: 'defaultValue', type: 'text', width: '100' },
    { title: designIntl('design.setting.defaultField.col.uiHint'), name: 'uiHint', type: 'dropdown', width: '100', source: ['Text', 'Number', 'Money', 'Select', 'Radio', 'CheckBox', 'Email', 'URL', 'DatePicker', 'TextArea', 'AddressPicker'] },
  ];
  const {datatype, projectDispatch} = useProjectStore(state => ({
    datatype: state.project?.projectJSON?.dataTypeDomains?.datatype,
    database: state.project?.projectJSON?.dataTypeDomains?.database,
    projectDispatch: state.dispatch,
  }), shallow);

  const allDataTypeName = jexcelTypeDropdownSource(datatype);

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

  /** 落盘失败时重挂 JExcel（组件不吃 props.data），回滚到 store 快照 */
  const [sheetEpoch, setSheetEpoch] = useState(0);
  const [fieldSaving, setFieldSaving] = useState(false);
  const pendingRef = useRef<any[] | null>(null);
  const savingRef = useRef(false);

  /**
   * 禁止本地 mutate 即成功：队列最新 payload，仅 saveProject code===200 写 store；
   * 失败 toast（persistProjectNow）+ 重挂网格回滚草稿。
   */
  const flushPersist = async () => {
    if (savingRef.current) return;
    const payload = pendingRef.current;
    if (!payload) return;
    pendingRef.current = null;
    savingRef.current = true;
    setFieldSaving(true);
    try {
      const ok = await Promise.resolve(
        projectDispatch.updateDefaultFields(payload, { persist: true }),
      );
      if (!ok) {
        pendingRef.current = null;
        setSheetEpoch((e) => e + 1);
        return;
      }
    } catch {
      message.error(designIntl('design.setting.defaultField.error.saveFailed'));
      pendingRef.current = null;
      setSheetEpoch((e) => e + 1);
    } finally {
      savingRef.current = false;
      setFieldSaving(false);
      if (pendingRef.current) {
        void flushPersist();
      }
    }
  };

  const afterChange = (payload: any) => {
    // 禁止空表写回冲掉已有默认字段（JExcel 空态 onchange / 过滤后 []）
    if (
      (!payload || payload.length === 0) &&
      (rawDefaultFields?.length || sheetData.length)
    ) {
      return;
    }
    pendingRef.current = payload;
    void flushPersist();
  }

  const columns = [
    ...column1, {
      title: designIntl('design.setting.defaultField.col.typeRequired'),
      name: 'typeName',
      type: 'dropdown',
      source: allDataTypeName,
      width: '150',
    },
    ...column2
  ];

  // key：项目字段就绪后再挂载表格；epoch 失败回滚重挂
  const sheetKey = `df-${sheetEpoch}-${sheetData.length}-${sheetData[0]?.name || 'empty'}`;

  return (
    <div
      className="setting-common-page"
      data-testid="default-field-page"
      data-field-count={sheetData.length}
      aria-busy={fieldSaving || undefined}
    >
      <h2 className="setting-common-page__title">{designIntl('design.setting.defaultField.page.title')}</h2>
      <p className="setting-common-page__hint">{designIntl('design.setting.defaultField.page.hint')}</p>
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

export function getDefaultFieldColumns1() {
  return [
    { title: designIntl('design.setting.defaultField.col.chnname'), name: 'chnname', type: 'text', width: '100' },
    { title: designIntl('design.setting.defaultField.col.name'), name: 'name', type: 'text', width: '100' },
  ];
}
export function getDefaultFieldColumns2() {
  return [
    { title: designIntl('design.setting.defaultField.col.typeCode'), name: 'type', type: 'text', width: '100', readOnly: true },
    { title: designIntl('design.setting.defaultField.col.dataType'), name: 'dataType', type: 'text', width: '130', readOnly: true },
    { title: designIntl('design.setting.defaultField.col.remark'), name: 'remark', type: 'text', width: '100' },
    { title: designIntl('design.common.field.pk'), name: 'pk', type: 'checkbox', width: '50' },
    { title: designIntl('design.common.field.notNull'), name: 'notNull', type: 'checkbox', width: '50' },
    { title: designIntl('design.common.field.autoIncrement'), name: 'autoIncrement', type: 'checkbox', width: '50' },
    { title: designIntl('design.common.field.hideOnDiagram'), name: 'relationNoShow', type: 'checkbox', width: '120' },
    { title: designIntl('design.common.field.defaultValue'), name: 'defaultValue', type: 'text', width: '100' },
    { title: designIntl('design.setting.defaultField.col.uiHint'), name: 'uiHint', type: 'dropdown', width: '100', source: ['Text', 'Number', 'Money', 'Select', 'Radio', 'CheckBox', 'Email', 'URL', 'DatePicker', 'TextArea', 'AddressPicker'] },
  ];
}
