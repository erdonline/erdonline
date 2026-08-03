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

const DefaultField: React.FC<DefaultFieldProps> = () => {
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
      message.error('默认字段保存失败');
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
      title: '类型*',
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
