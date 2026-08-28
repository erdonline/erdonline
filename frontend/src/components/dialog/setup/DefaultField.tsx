import React, {useRef, useState} from 'react';
import {getIntl, useIntl} from '@umijs/max';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {message} from "antd";
import {HotTable} from "@handsontable/react";
// @ts-ignore
import {CellChange, ChangeSource} from "handsontable";
import _ from 'lodash-es';
import { flatTypeNamesPreferEnum } from '@/utils/fieldTypeOptions';


export type DefaultFieldProps = {};

export function handsontableBeforeChange(hotTableComponent: React.MutableRefObject<null>, datatype: any, database: any) {
  return (changes: CellChange[], source: ChangeSource) => {
    if (changes) {
      changes.forEach((c: CellChange) => {
        const [row, prop, oldValue, newValue] = c;
        // @ts-ignore
        const {hotInstance} = hotTableComponent.current;
        if (prop === 'typeName' && oldValue !== newValue) {
          const d = _.find(datatype, {'name': newValue});
          const defaultDatabaseCode = _.find(database, {"defaultDatabase": true}).code || database[0].code;
          const path = `apply.${defaultDatabaseCode}.type`;
          hotInstance.setDataAtRowProp(row, 'type', _.get(d, 'code'));
          hotInstance.setDataAtRowProp(row, 'dataType', _.get(d, path));
        }
      });
    }
  };
}

export function handsontableAfterChange(hotSettings: {
  dropdownMenu: boolean; allowRemoveColumn: boolean; data: any; columns: ({ data: string; validator: (value: any, callback: any) => void } | { data: string; validator: (value: any, callback: any) => void } | { allowEmpty: boolean; data: string; allowInvalid: boolean; source: any; type: string } | { data: string; readOnly: boolean; type: string } | { data: string; readOnly: boolean; type: string } | { data: string; type: string } | { data: string; type: string } | { data: string; type: string } | { data: string; type: string } | { data: string; type: string } | { data: string; type: string } | { filter: boolean; trimDropdown: boolean; data: string; allowInvalid: boolean; source: string[]; type: string; strict: boolean; visibleRows: number })[]; allowInvalid: boolean; fixedRowsTop: number; language: string; className: string; manualRowMove: boolean; manualRowResize: boolean; colHeaders: string[]; mergeCells: boolean; height: number; columnSorting: boolean; rowHeaders: boolean; minRows: number; stretchH: string; manualColumnMove: boolean; allowInsertColumn: boolean; filters: boolean; autoWrapRow: boolean; customBorders: boolean; licenseKey: string; contextMenu: boolean; currentRowClassName: string; manualColumnResize: boolean; currentColClassName: string; copyPaste: boolean
}, afterChange: (payload: any) => void) {
  return (changes: CellChange[] | null, source: ChangeSource) => {
    // // @ts-ignore
    // const {hotInstance} = hotTableComponent.current;
    // hotInstance.selectRows(2)
    if (changes) {
      const payload = hotSettings.data;
      if (payload) {
        let payload1 = payload.filter((f: any) => f != null);
        afterChange(JSON.parse(JSON.stringify(payload1)));
      }
    }
  };
}

export function handsontableAfterRowMove(hotTableComponent: React.MutableRefObject<null>, hotSettings: {
  dropdownMenu: boolean; allowRemoveColumn: boolean; data: any; columns: ({ data: string; validator: (value: any, callback: any) => void } | { data: string; validator: (value: any, callback: any) => void } | { allowEmpty: boolean; data: string; allowInvalid: boolean; source: any; type: string } | { data: string; readOnly: boolean; type: string } | { data: string; readOnly: boolean; type: string } | { data: string; type: string } | { data: string; type: string } | { data: string; type: string } | { data: string; type: string } | { data: string; type: string } | { data: string; type: string } | { filter: boolean; trimDropdown: boolean; data: string; allowInvalid: boolean; source: string[]; type: string; strict: boolean; visibleRows: number })[]; allowInvalid: boolean; fixedRowsTop: number; language: string; className: string; manualRowMove: boolean; manualRowResize: boolean; colHeaders: string[]; mergeCells: boolean; height: number; columnSorting: boolean; rowHeaders: boolean; minRows: number; stretchH: string; manualColumnMove: boolean; allowInsertColumn: boolean; filters: boolean; autoWrapRow: boolean; customBorders: boolean; licenseKey: string; contextMenu: boolean; currentRowClassName: string; manualColumnResize: boolean; currentColClassName: string; copyPaste: boolean
}, afterChange: (payload: any) => void) {
  return (startRow: number, endRow: number) => {
    // @ts-ignore
    const {hotInstance} = hotTableComponent.current;
    const payload = hotSettings.data;
    const finalData: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    const {_arrayMap} = hotInstance.getPlugin('manualRowMove').rowsMapper;
    // eslint-disable-next-line no-plusplus
    for (let loop = 0; loop < hotSettings.data.length; loop++) {
      const data = hotSettings.data[_arrayMap[loop]];
      finalData.push(data);
    }
    // 延迟一会保存数据，避免页面渲染混乱
    setTimeout(() => {
      // eslint-disable-next-line no-underscore-dangle
      hotInstance.getPlugin('manualRowMove').rowsMapper._arrayMap = _.sortBy(_arrayMap);
      // eslint-disable-next-line no-underscore-dangle
      afterChange(finalData);
    }, 200);

  };
}

// Empty validator
export const emptyValidator = (value: any, callback: any) => {
  if (!value || value.length === 0) {
    message.error(getIntl().formatMessage({ id: 'setupModal.defaultField.emptyError' }));
    callback(false);
  } else {
    callback(true);
  }
};

export const column1 = [
  {
    data: 'chnname',
    validator: emptyValidator
  },
  {
    data: 'name',
    validator: emptyValidator
  }];

export const column2 = [{
  data: 'type',
  type: 'text',
  readOnly: true
},
  {
    data: 'dataType',
    type: 'text',
    readOnly: true
  },
  {
    data: 'remark',
    type: 'text'
  },
  {
    data: 'pk',
    type: 'checkbox',

  },
  {
    data: 'notNull',
    type: 'checkbox',
  },
  {
    data: 'autoIncrement',
    type: 'checkbox',
  },
  {
    data: 'defaultValue',
    type: 'text',
  },
  {
    data: 'relationNoShow',
    type: 'checkbox',
  },
  {
    data: 'uiHint',
    type: 'autocomplete', strict: true, filter: true,
    visibleRows: 10,
    trimDropdown: true,
    allowInvalid: false,
    source: ['Text', 'Number', 'Money', 'Select', 'Radio', 'CheckBox', 'Email', 'URL', 'DatePicker', 'TextArea', 'AddressPicker'],
  }];

const DefaultField: React.FC<DefaultFieldProps> = () => {
  const intl = useIntl();
  const {datatype, database, projectDispatch} = useProjectStore(state => ({
    datatype: state.project?.projectJSON?.dataTypeDomains?.datatype,
    database: state.project?.projectJSON?.dataTypeDomains?.database,
    projectDispatch: state.dispatch,
  }), shallow);

  const allDataTypeName = flatTypeNamesPreferEnum(datatype);

  const sheetRows = (projectDispatch.getDefaultFields() || []).filter((f: any) => f != null);
  const defaultJson = JSON.stringify(sheetRows);

  /** 落盘失败时重挂 HotTable，回滚到 store 快照 */
  const [sheetEpoch, setSheetEpoch] = useState(0);
  const [fieldSaving, setFieldSaving] = useState(false);
  const pendingRef = useRef<any[] | null>(null);
  const savingRef = useRef(false);

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
      message.error(intl.formatMessage({ id: 'setupModal.defaultField.saveFailed' }));
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
    if (!payload || payload.length === 0) {
      return;
    }
    pendingRef.current = payload;
    void flushPersist();
  }

  const hotTableComponent = useRef(null);

  const hotSettings = {
    data: JSON.parse(defaultJson),
    columns: [
      ...column1,
      {
        data: 'typeName',
        type: 'dropdown',
        source: allDataTypeName,
        allowInvalid: false,
        allowEmpty: false
      },
      ...column2
    ],
    allowInvalid: false,
    allowRemoveColumn: false,
    stretchH: "all",
    height: 300,
    fixedRowsTop: 0,
    columnSorting: true,
    autoWrapRow: true,
    manualRowResize: true,
    manualColumnResize: true,
    rowHeaders: true,
    colHeaders: [
      intl.formatMessage({ id: 'setupModal.defaultField.colName' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colLogicName' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colType' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colTypeCode' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colDbType' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colRemark' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colPk' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colNotNull' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colAutoInc' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colDefault' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colDiagram' }),
      intl.formatMessage({ id: 'setupModal.defaultField.colUiHint' }),
    ],
    manualRowMove: true,
    manualColumnMove: true,
    filters: true,
    dropdownMenu: true,
    mergeCells: false,
    copyPaste: true,
    language: "zh-CN",
    licenseKey: 'non-commercial-and-evaluation',
    className: "htCenter htMiddle",
    currentRowClassName: 'currentRow',
    currentColClassName: 'currentCol',
    customBorders: false,
    contextMenu: true,
    allowInsertColumn: false,
    minRows: 1
  };
  return (
    <div data-testid="default-field-dialog-sheet" aria-busy={fieldSaving || undefined}>
      <HotTable
        key={`df-hot-${sheetEpoch}-${sheetRows[0]?.name || 'empty'}`}
        ref={hotTableComponent}
        id={"data-sheet"}
        // @ts-ignore
        settings={hotSettings}
        beforeChange={handsontableBeforeChange(hotTableComponent, datatype, database)}
        afterChange={handsontableAfterChange(hotSettings, afterChange)}
        afterRowMove={handsontableAfterRowMove(hotTableComponent, hotSettings, afterChange)}
      />
    </div>
  )
}

export default React.memo(DefaultField)
