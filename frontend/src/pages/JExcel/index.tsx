// @ts-nocheck
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import jspreadsheet, {CellValue} from "jspreadsheet-ce";

import _ from 'lodash';
import "jspreadsheet-ce/dist/jspreadsheet.css";
import "jspreadsheet-ce/dist/jspreadsheet.datatables.css";
import "jsuites/dist/jsuites.css"

import "./index.less"
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {List, message, Modal, Tag} from "antd";
import {ExclamationCircleOutlined} from "@ant-design/icons";
import {confirmDestructive} from "@/utils/destructiveConfirm";
import { useIntl } from "@@/exports";
import { buildJspreadsheetText } from "./i18n";

export type JExcelProps = {
  data: any,
  columns: any,
  saveData: any,
  notEmptyColumn: string[],
  /** 表设计字段签：在「末尾增加一行」后注入「从字段库写入」 */
  onFieldLibraryClick?: () => void,
};

export type JExcelHandle = {
  getSelectedRowIndices: () => number[];
};

/** 空单元格：含索引签 fields[] / 多选「;」串，禁把 [] 当已填导致半成品漏检 */
const isEmptyCell = (v: unknown): boolean => {
  if (v === undefined || v === null || v === '') return true;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return true;
    // jspreadsheet multiple dropdown 空串形态：";" / ";;"
    if (t.split(';').every((p) => !p.trim())) return true;
    return false;
  }
  if (Array.isArray(v)) {
    return v.length === 0 || v.every((x) => isEmptyCell(x));
  }
  return false;
};

/** 全空草稿行：可静默丢弃；半成品行禁止静默过滤写回（会丢已有字段/索引） */
const isCompletelyBlankRow = (row: Record<string, unknown>) => {
  if (!row || typeof row !== 'object') return true;
  return Object.keys(row).every((k) => {
    const v = row[k];
    if (typeof v === 'boolean') return v === false;
    return isEmptyCell(v);
  });
};

const JExcel = forwardRef<JExcelHandle, JExcelProps>((props, ref) => {
  const intl = useIntl();
  const {syncing, setSyncing, datatype, database,projectName} = useProjectStore(state => ({
    syncing: state.syncing,
    setSyncing: state.dispatch.setSyncing,
    projectName: state.project.projectName,
    datatype: state.project?.projectJSON?.dataTypeDomains?.datatype,
    database: state.project?.projectJSON?.dataTypeDomains?.database,
  }), shallow);


  const {data, columns, saveData, notEmptyColumn, onFieldLibraryClick} = props;
  const onFieldLibraryClickRef = useRef(onFieldLibraryClick);
  onFieldLibraryClickRef.current = onFieldLibraryClick;

  useImperativeHandle(ref, () => ({
    getSelectedRowIndices: () => {
      const selectedRows = jRef?.current?.jexcel?.getSelectedRows?.();
      if (!selectedRows?.length) {
        return [];
      }
      return selectedRows
        .map((row: HTMLElement) => parseInt(row?.dataset?.y ?? '', 10))
        .filter((y: number) => Number.isInteger(y) && y >= 0);
    },
  }), []);
  const saveValidData = (excelData: any) => {
    //正在同步远程数据
    if (syncing) {
      return;
    }
    if (!excelData || excelData.length === 0) {
      return;
    }
    let rows = excelData;
    if (notEmptyColumn?.length) {
      const valid = [];
      let incomplete = 0;
      for (const row of excelData) {
        if (isCompletelyBlankRow(row)) {
          continue;
        }
        const missingRequired = notEmptyColumn.some((f) => isEmptyCell(row[f]));
        if (missingRequired) {
          incomplete += 1;
          continue;
        }
        valid.push(row);
      }
      // 半成品：中止整次写回，保留 store 上次完整快照；禁静默 discard 导致丢字段/索引
      if (incomplete > 0) {
        message.warning({
          content: intl.formatMessage({ id: 'design.jexcel.incompleteRow' }),
          key: 'jexcel-incomplete',
          duration: 3,
        });
        return;
      }
      rows = valid;
    }
    // 过滤后为空时不写回，避免冲掉已有默认字段/元数据
    if (!rows || rows.length === 0) {
      return;
    }
    saveData(rows);
  }


  const jRef = useRef(null);

  const pagination = 10;

  const introduces = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: 'design.jexcel.shortcuts.copy' }),
        description: intl.formatMessage({ id: 'design.jexcel.shortcuts.copyDesc' }),
      },
      {
        title: intl.formatMessage({ id: 'design.jexcel.shortcuts.paste' }),
        description: intl.formatMessage({ id: 'design.jexcel.shortcuts.pasteDesc' }),
      },
      {
        title: intl.formatMessage({ id: 'design.jexcel.shortcuts.cut' }),
        description: intl.formatMessage({ id: 'design.jexcel.shortcuts.cutDesc' }),
      },
      {
        title: intl.formatMessage({ id: 'design.jexcel.shortcuts.undo' }),
        description: intl.formatMessage({ id: 'design.jexcel.shortcuts.undoDesc' }),
      },
      {
        title: intl.formatMessage({ id: 'design.jexcel.shortcuts.redo' }),
        description: intl.formatMessage({ id: 'design.jexcel.shortcuts.redoDesc' }),
      },
    ],
    [intl],
  );

  const toolbar = useMemo(
    () => [
      {
        type: 'i',
        content: 'undo',
        tooltip: intl.formatMessage({ id: 'design.jexcel.toolbar.undo' }),
        onclick: function () {
          jRef?.current?.jexcel.undo();
        }
      },
      {
        type: 'i',
        content: 'redo',
        tooltip: intl.formatMessage({ id: 'design.jexcel.toolbar.redo' }),
        onclick: function () {
          // @ts-ignore
          jRef?.current?.jexcel.redo();
        }
      },
      {
        type: 'i',
        content: 'add',
        id: 'jexcel-toolbar-add-row',
        tooltip: intl.formatMessage({ id: 'design.jexcel.toolbar.addRow' }),
        onclick: function () {
          // @ts-ignore
          jRef?.current?.jexcel.insertRow();
        }
      },
      {
        type: 'i',
        content: 'remove',
        tooltip: intl.formatMessage({ id: 'design.jexcel.toolbar.removeRow' }),
        id: 'jexcel-toolbar-remove',
        onclick: function () {
          const selectedRows = jRef?.current?.jexcel.getSelectedRows();
          if (!selectedRows || !selectedRows.length) {
            message.warning(intl.formatMessage({ id: 'design.jexcel.noRowSelected' }));
            return;
          }
          confirmDestructive({
            title: intl.formatMessage({ id: 'design.jexcel.confirmDeleteRow.title' }),
            content: intl.formatMessage({ id: 'design.common.destructive.content' }),
            okText: intl.formatMessage({ id: 'design.common.delete' }),
            okType: 'danger',
            cancelText: intl.formatMessage({ id: 'design.common.cancel' }),
            onOk() {
              jRef?.current?.jexcel.deleteRow();
            },
          });
        }
      },
      {
        type: 'i',
        content: 'publish',
        tooltip: intl.formatMessage({ id: 'design.jexcel.toolbar.insertBefore' }),
        onclick: function () {
          const selectedRows = jRef?.current?.jexcel.getSelectedRows();

          if (!selectedRows || !selectedRows[0]?.dataset) {
            message.warning(intl.formatMessage({ id: 'design.jexcel.noRowSelected' }));
            return;
          }
          jRef?.current?.jexcel.insertRow(1, parseInt(selectedRows[0].dataset.y), 1);

        }
      },
      {
        type: 'i',
        content: 'get_app',
        tooltip: intl.formatMessage({ id: 'design.jexcel.toolbar.insertAfter' }),
        onclick: function () {
          const selectedRows = jRef?.current?.jexcel.getSelectedRows();

          if (!selectedRows || !selectedRows[selectedRows.length - 1]?.dataset) {
            message.warning(intl.formatMessage({ id: 'design.jexcel.noRowSelected' }));
            return;
          }
          // @ts-ignore
          jRef?.current?.jexcel.insertRow(1, parseInt(selectedRows[selectedRows.length - 1].dataset.y));
        }
      },

      {
        type: 'i',
        content: 'help_outline',
        tooltip: intl.formatMessage({ id: 'design.jexcel.toolbar.shortcuts' }),
        id: 'jexcel-toolbar-help',
        onclick: function () {
          Modal.info({
            title: intl.formatMessage({ id: 'design.jexcel.toolbar.shortcuts' }),
            width: 500,
            keyboard: true,
            autoFocusButton: 'ok',
            focusTriggerAfterClose: true,
            okText: intl.formatMessage({ id: 'utils.modal.gotIt' }),
            content: <>
              <List
                itemLayout="horizontal"
                dataSource={introduces}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<a>{item.title}</a>}
                      description={item.description}
                    />
                  </List.Item>
                )}
              />
              <Tag icon={<ExclamationCircleOutlined />} color="warning">
                {intl.formatMessage({ id: 'design.jexcel.easterEgg' })}
              </Tag>
            </>
          });
        }
      },
    ],
    [intl, introduces],
  );

  const options = useMemo(() => ({
    data,
    columns,
    csvFileName: projectName,
    allowExport: true,
    loadingSpin: true,
    minDimensions: [1, 1],
    csvHeaders: true,
    columnDrag: false,
    columnResize: true,
    search: false,
    toolbar,
    text: buildJspreadsheetText(pagination),
    about: false,
    onchange: (instance: HTMLElement,
               cell: HTMLTableCellElement,
               /** (e.g.) "0", "1" ... */
               columnIndex: string,
               /** (e.g.) "0", "1" ... */
               rowIndex: string,
               value: CellValue,) => {
      const rowData = jRef?.current?.jexcel.getRowData(rowIndex);
      const d = _.find(datatype, {'name': value});
      const defaultDatabaseCode = _.find(database, {"defaultDatabase": true}).code || database[0].code;
      const code = _.get(d, 'code');
      const path = `apply.${defaultDatabaseCode}.type`;
      const type = _.get(d, path);
      //只有类型一列变化时，才更新后两列
      if (d && defaultDatabaseCode && code && type && Number(columnIndex) == 2) {
        jRef?.current?.jexcel?.setValueFromCoords(Number(columnIndex) + 1, rowIndex, code, true);
        jRef?.current?.jexcel?.setValueFromCoords(Number(columnIndex) + 2, rowIndex, type, true);
      }
      saveValidData(jRef?.current?.jexcel.getJson());

    },
    oninsertrow: () => {
      // saveValidData(jRef?.current?.jexcel.getJson())
    },
    ondeleterow: () => {
      saveValidData(jRef?.current?.jexcel.getJson())
    },
    onmoverow: () => {
      saveValidData(jRef?.current?.jexcel.getJson())
    },
    onpaste: () => {
      saveValidData(jRef?.current?.jexcel.getJson())
    },
    onundo: () => {
      saveValidData(jRef?.current?.jexcel.getJson())
    },
    onredo: () => {
      saveValidData(jRef?.current?.jexcel.getJson())
    },
  }), [data, columns, projectName, toolbar, datatype, database, intl]);

  useEffect(() => {
    if (!jRef.current) {
      return;
    }
    if (!jRef.current.jspreadsheet) {
      jspreadsheet(jRef.current, options);
    }
    // jspreadsheet 工具栏是裸 material `<i>`：统一补 a11y，禁只修 remove 留下死 affordance
    const host = jRef.current as HTMLElement;
    if (!(host as any).__erdToolbarA11y) {
      (host as any).__erdToolbarA11y = true;
      const toolbar = host.querySelector('.jexcel_toolbar') as HTMLElement | null;
      if (toolbar) {
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', intl.formatMessage({ id: 'design.jexcel.aria.toolbar' }));
        toolbar.setAttribute('data-testid', 'jexcel-toolbar');
      }
      host.querySelectorAll('.jexcel_toolbar_item').forEach((el) => {
        const item = el as HTMLElement;
        const label =
          item.getAttribute('title') ||
          item.getAttribute('aria-label') ||
          item.textContent?.trim() ||
          intl.formatMessage({ id: 'design.jexcel.aria.toolbarAction' });
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', label);
        item.setAttribute('tabindex', '0');
        if (item.id === 'jexcel-toolbar-remove') {
          item.setAttribute('data-testid', 'jexcel-toolbar-remove');
        }
        if (item.id === 'jexcel-toolbar-help') {
          item.setAttribute('data-testid', 'jexcel-toolbar-help');
        }
        item.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          item.click();
        });
      });
      // 网格入口：容器可 Tab 到达；Enter 选中 A1 后交原生方向键/Tab；勿拦 Tab（无 trap）
      const grid =
        (host.querySelector('.jexcel_content') as HTMLElement | null) || host;
      grid.setAttribute('data-testid', 'jexcel-grid');
      grid.setAttribute('tabindex', '0');
      grid.setAttribute('aria-label', intl.formatMessage({ id: 'design.jexcel.aria.grid' }));
      grid.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key !== 'Enter') return;
        if (e.target !== grid) return;
        e.preventDefault();
        const js = (jRef.current as any)?.jexcel;
        if (js?.updateSelectionFromCoords) {
          js.updateSelectionFromCoords(0, 0, 0, 0);
        }
      });
    }
    // Escape：退出单元格编辑 → 焦点回 `jexcel-grid`；勿冒泡关签/画布快捷键
    if (!(host as any).__erdEscTrap) {
      (host as any).__erdEscTrap = true;
      host.addEventListener(
        'keydown',
        (e: KeyboardEvent) => {
          if (e.key !== 'Escape') return;
          // textarea 节点常驻 DOM；仅以 jspreadsheet.edition 判编辑态
          if (!host.contains(document.activeElement)) return;
          e.stopPropagation();
          const js = (jRef.current as any)?.jexcel;
          const editing = Array.isArray(js?.edition) && !!js.edition[0];
          if (editing && typeof js.closeEditor === 'function') {
            // 原生 keyCode=27 亦会 close；显式走 false=丢弃草稿，随后归还网格焦点
            try {
              js.closeEditor(js.edition[0], false);
            } catch {
              /* edition 竞态时忽略 */
            }
            const grid =
              (host.querySelector('[data-testid="jexcel-grid"]') as HTMLElement | null) ||
              (host.querySelector('.jexcel_content') as HTMLElement | null) ||
              host;
            // 等原生 closeEditor 卸 textarea 后再 focus，避免焦点落在 tabIndex=-1 的隐藏输入
            requestAnimationFrame(() => {
              grid.focus({ preventScroll: true });
            });
          }
        },
        true,
      );
    }
  }, [options, intl]);

  useEffect(() => {
    const host = jRef.current as HTMLElement | null;
    if (!host || !onFieldLibraryClick) {
      return undefined;
    }

    const fieldLibraryLabel = intl.formatMessage({ id: 'design.jexcel.fieldLibrary.insert' });

    const injectFieldLibraryBtn = () => {
      const toolbar = host.querySelector('.jexcel_toolbar') as HTMLElement | null;
      if (!toolbar) {
        return false;
      }
      if (toolbar.querySelector('[data-testid="field-library-insert-open"]')) {
        const existing = toolbar.querySelector(
          '[data-testid="field-library-insert-open"]',
        ) as HTMLButtonElement | null;
        if (existing) {
          existing.setAttribute('aria-label', fieldLibraryLabel);
          existing.textContent = fieldLibraryLabel;
        }
        return true;
      }

      const addBtn = toolbar.querySelector('#jexcel-toolbar-add-row');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'erd-jexcel-toolbar-text-btn';
      btn.setAttribute('data-testid', 'field-library-insert-open');
      btn.setAttribute('aria-label', fieldLibraryLabel);
      btn.textContent = fieldLibraryLabel;
      const open = () => onFieldLibraryClickRef.current?.();
      btn.addEventListener('click', open);
      btn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') {
          return;
        }
        e.preventDefault();
        open();
      });

      if (addBtn?.nextSibling) {
        toolbar.insertBefore(btn, addBtn.nextSibling);
      } else if (addBtn) {
        addBtn.after(btn);
      } else {
        toolbar.appendChild(btn);
      }
      return true;
    };

    if (injectFieldLibraryBtn()) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      if (injectFieldLibraryBtn()) {
        window.clearInterval(timer);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [onFieldLibraryClick, intl]);

  return (

    <div ref={jRef} data-testid="jexcel-root"/>
  );
});

JExcel.displayName = 'JExcel';

export default React.memo(JExcel);
