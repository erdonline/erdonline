// @ts-nocheck
import React, {useEffect, useRef} from "react";
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

export type JExcelProps = {
  data: any,
  columns: any,
  saveData: any,
  notEmptyColumn: string[],
};

const isEmptyCell = (v: unknown) => v === undefined || v === null || v === '';

/** 全空草稿行：可静默丢弃；半成品行禁止静默过滤写回（会丢已有字段） */
const isCompletelyBlankRow = (row: Record<string, unknown>) => {
  if (!row || typeof row !== 'object') return true;
  return Object.keys(row).every((k) => {
    const v = row[k];
    if (typeof v === 'boolean') return v === false;
    return isEmptyCell(v);
  });
};

const JExcel: React.FC<JExcelProps> = (props) => {
  const {syncing, setSyncing, datatype, database,projectName} = useProjectStore(state => ({
    syncing: state.syncing,
    setSyncing: state.dispatch.setSyncing,
    projectName: state.project.projectName,
    datatype: state.project?.projectJSON?.dataTypeDomains?.datatype,
    database: state.project?.projectJSON?.dataTypeDomains?.database,
  }), shallow);


  const {data, columns, saveData, notEmptyColumn} = props;
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
      // 半成品：中止整次写回，保留 store 上次完整快照；禁静默 discard 导致丢字段
      if (incomplete > 0) {
        message.warning({
          content: '有行未填完必填项，未保存以免丢数据；请补全后再继续（Enter/Tab 落盘）',
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

  const introduces = [
    {
      title: '复制',
      description: 'Windows：Ctrl + C              |             Mac：command + C',
    },
    {
      title: '粘贴',
      description: 'Windows：Ctrl + V              |             Mac：command + V',
    },
    {
      title: '剪切',
      description: 'Windows：Ctrl + X              |             Mac：command + X',
    },
    {
      title: '撤销',
      description: 'Windows：Ctrl + Z              |            Mac：command + Z',
    },
    {
      title: '重做',
      description: 'Windows：Ctrl + Shit + Z              |            Mac：command + Shit + Z',
    },

  ];

  const pagination = 10;

  const options = {
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
    toolbar: [
      {
        type: 'i',
        content: 'undo',
        tooltip: '撤销',
        onclick: function () {
          jRef?.current?.jexcel.undo();
        }
      },
      {
        type: 'i',
        content: 'redo',
        tooltip: '重做',
        onclick: function () {
          // @ts-ignore
          jRef?.current?.jexcel.redo();
        }
      },
      {
        type: 'i',
        content: 'add',
        tooltip: '末尾增加一行',
        onclick: function () {
          // @ts-ignore
          jRef?.current?.jexcel.insertRow();
        }
      },
      {
        type: 'i',
        content: 'remove',
        tooltip: '删除选中行',
        id: 'jexcel-toolbar-remove',
        onclick: function () {
          const selectedRows = jRef?.current?.jexcel.getSelectedRows();
          if (!selectedRows || !selectedRows.length) {
            message.warning('未选中行');
            return;
          }
          Modal.confirm({
            title: '确定删除选定行吗?',
            content: '此操作不可逆，请谨慎操作。',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
              jRef?.current?.jexcel.deleteRow();
            },
          });
        }
      },
      {
        type: 'i',
        content: 'publish',
        tooltip: '在此前插入行',
        onclick: function () {
          const selectedRows = jRef?.current?.jexcel.getSelectedRows();

          if (!selectedRows || !selectedRows[0]?.dataset) {
            message.warning('未选中行');
            return;
          }
          jRef?.current?.jexcel.insertRow(1, parseInt(selectedRows[0].dataset.y), 1);

        }
      },
      {
        type: 'i',
        content: 'get_app',
        tooltip: '在此后插入行',
        onclick: function () {
          const selectedRows = jRef?.current?.jexcel.getSelectedRows();

          if (!selectedRows || !selectedRows[selectedRows.length - 1]?.dataset) {
            message.warning('未选中行');
            return;
          }
          // @ts-ignore
          jRef?.current?.jexcel.insertRow(1, parseInt(selectedRows[selectedRows.length - 1].dataset.y));
        }
      },

      {
        type: 'i',
        content: 'help_outline',
        tooltip: '快捷操作',
        onclick: function () {
          Modal.info({
            title: "快捷操作",
            width: 500,
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
                小彩蛋： 您还不知道吧！<br/>
                这个列表可以像excel一样操作；<br/>
                能从excel里面粘贴数据；<br/>
                还能将元��据导出到excel；<br/>
                像excel一样，在列表点击右键，开启不一样的体验！<br/>
              </Tag>
            </>
          });
        }
      },
    ],
    text: {
      "noRecordsFound": "未找到",
      "showingPage": `第 {0} 页中的 ${pagination} 条`,
      "show": "显示 ",
      "search": "搜索",
      "entries": " 条目",
      "columnName": "列标题",
      "insertANewColumnBefore": "在此前插入列",
      "insertANewColumnAfter": "在此后插入列",
      "deleteSelectedColumns": "删除选定列",
      "renameThisColumn": "重命名列",
      "orderAscending": "升序",
      "orderDescending": "降序",
      "insertANewRowBefore": "在此前插入行",
      "insertANewRowAfter": "在此后插入行",
      "deleteSelectedRows": "删除选定行",
      "editComments": "编辑批注",
      "addComments": "插入批注",
      "comments": "批注",
      "clearComments": "删除批注",
      "copy": "复制...",
      "paste": "粘贴...",
      "saveAs": "保存为...",
      "about": "关于",
      "areYouSureToDeleteTheSelectedRows": "确定删除选定行?",
      "areYouSureToDeleteTheSelectedColumns": "确定删除选定列?",
      "thisActionWillDestroyAnyExistingMergedCellsAreYouSure": "这一操作会破坏所有现存的合并单元格，确认操作？",
      "thisActionWillClearYourSearchResultsAreYouSure": "这一操作会清空搜索结果，确认操作？",
      "thereIsAConflictWithAnotherMergedCell": "与其他合并单元格有冲突",
      "invalidMergeProperties": "无效的合并属性",
      "cellAlreadyMerged": "单元格已合并",
      "noCellsSelected": "未选定单元格"
    },
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
      //只有类��一列变化时，才更新后两列
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
  };

  useEffect(() => {
    if (!jRef.current) {
      return;
    }
    if (!jRef.current.jspreadsheet) {
      jspreadsheet(jRef.current, options);
    }
    // jspreadsheet 工具栏是 material `<i>`：补 role/aria，供 getByRole + 破坏性确认闭环
    const host = jRef.current as HTMLElement;
    const removeBtn = host.querySelector(
      '#jexcel-toolbar-remove',
    );
    if (removeBtn) {
      removeBtn.setAttribute('role', 'button');
      removeBtn.setAttribute('aria-label', '删除选中行');
      removeBtn.setAttribute('data-testid', 'jexcel-toolbar-remove');
      if (!removeBtn.hasAttribute('tabindex')) {
        removeBtn.setAttribute('tabindex', '0');
      }
    }
    // 编辑格 Escape：取消单元格编辑，勿冒泡到设计器其它快捷键
    if (!(host as any).__erdEscTrap) {
      (host as any).__erdEscTrap = true;
      host.addEventListener(
        'keydown',
        (e: KeyboardEvent) => {
          if (e.key !== 'Escape') return;
          const editing = host.querySelector('.jexcel_textarea, textarea.jexcel_textarea, .editor');
          if (editing || host.contains(document.activeElement)) {
            e.stopPropagation();
          }
        },
        true,
      );
    }
  }, [options]);

  return (

    <div ref={jRef} data-testid="jexcel-root"/>
  );
}

export default React.memo(JExcel);
