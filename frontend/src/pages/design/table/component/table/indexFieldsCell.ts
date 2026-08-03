/**
 * 索引签 `fields` 单元格：分号分隔的列名 / 表达式原样串 ↔ `indexs[].fields[]`。
 * 与历史 JExcel multiple-dropdown「;」约定兼容；不做表达式语法校验。
 */

export type IndexFieldsCell = string | string[] | undefined | null;

/** 展示：数组 join「;」；字符串原样（去首尾空白）。 */
export function formatIndexFieldsCell(fields: IndexFieldsCell): string {
  if (fields == null) return '';
  if (Array.isArray(fields)) {
    return fields
      .map((p) => String(p ?? '').trim())
      .filter(Boolean)
      .join(';');
  }
  return String(fields).trim();
}

/** 落盘：按「;」拆成非空 trim 片段（列名或表达式）。 */
export function parseIndexFieldsCell(raw: IndexFieldsCell): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((p) => String(p ?? '').trim()).filter(Boolean);
  }
  return String(raw)
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);
}
