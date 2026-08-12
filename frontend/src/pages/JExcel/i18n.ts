import { getIntl } from '@umijs/max';

/** jspreadsheet `text` 键 → umi message id（ADR-0033：函数内取 locale） */
const JSPREADSHEET_TEXT_KEY_MAP = {
  noRecordsFound: 'design.jexcel.text.noRecordsFound',
  show: 'design.jexcel.text.show',
  search: 'design.jexcel.text.search',
  entries: 'design.jexcel.text.entries',
  columnName: 'design.jexcel.text.columnName',
  insertANewColumnBefore: 'design.jexcel.text.insertANewColumnBefore',
  insertANewColumnAfter: 'design.jexcel.text.insertANewColumnAfter',
  deleteSelectedColumns: 'design.jexcel.text.deleteSelectedColumns',
  renameThisColumn: 'design.jexcel.text.renameThisColumn',
  orderAscending: 'design.jexcel.text.orderAscending',
  orderDescending: 'design.jexcel.text.orderDescending',
  insertANewRowBefore: 'design.jexcel.text.insertANewRowBefore',
  insertANewRowAfter: 'design.jexcel.text.insertANewRowAfter',
  deleteSelectedRows: 'design.jexcel.text.deleteSelectedRows',
  editComments: 'design.jexcel.text.editComments',
  addComments: 'design.jexcel.text.addComments',
  comments: 'design.jexcel.text.comments',
  clearComments: 'design.jexcel.text.clearComments',
  copy: 'design.jexcel.text.copy',
  paste: 'design.jexcel.text.paste',
  saveAs: 'design.jexcel.text.saveAs',
  about: 'design.jexcel.text.about',
  areYouSureToDeleteTheSelectedRows: 'design.jexcel.text.areYouSureToDeleteTheSelectedRows',
  areYouSureToDeleteTheSelectedColumns: 'design.jexcel.text.areYouSureToDeleteTheSelectedColumns',
  thisActionWillDestroyAnyExistingMergedCellsAreYouSure:
    'design.jexcel.text.thisActionWillDestroyAnyExistingMergedCellsAreYouSure',
  thisActionWillClearYourSearchResultsAreYouSure:
    'design.jexcel.text.thisActionWillClearYourSearchResultsAreYouSure',
  thereIsAConflictWithAnotherMergedCell: 'design.jexcel.text.thereIsAConflictWithAnotherMergedCell',
  invalidMergeProperties: 'design.jexcel.text.invalidMergeProperties',
  cellAlreadyMerged: 'design.jexcel.text.cellAlreadyMerged',
  noCellsSelected: 'design.jexcel.text.noCellsSelected',
} as const;

/** ADR-0033: call inside functions only — never at module scope. */
export function jexcelIntl(
  id: string,
  values?: Record<string, string | number | boolean>,
) {
  return getIntl().formatMessage({ id }, values);
}

/** jspreadsheet 内嵌文案（含分页占位） */
export function buildJspreadsheetText(pageSize: number): Record<string, string> {
  const intl = getIntl();
  const text: Record<string, string> = {};
  for (const [jspKey, msgId] of Object.entries(JSPREADSHEET_TEXT_KEY_MAP)) {
    text[jspKey] = intl.formatMessage({ id: msgId });
  }
  text.showingPage = intl.formatMessage(
    { id: 'design.jexcel.text.showingPage' },
    { page: '{0}', pageSize: String(pageSize) },
  );
  return text;
}
