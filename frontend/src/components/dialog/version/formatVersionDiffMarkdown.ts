export type VersionDiffItem = {
  message: string;
  opt: 'add' | 'delete' | 'update' | string;
  type: 'entity' | 'field' | 'index' | string;
  name?: string;
  changeData?: string;
};

const OPT_META: Record<string, { label: string }> = {
  add: { label: '新增' },
  delete: { label: '删除' },
  update: { label: '修改' },
};

const TYPE_LABEL: Record<string, string> = {
  entity: '表',
  field: '字段',
  index: '索引',
  association: '关联',
  diagram: '关系图',
  profile: '项目配置',
  datatype: '数据类型',
  module: '模块',
};

export function tableOf(item: VersionDiffItem): string {
  if (item.type === 'entity') {
    return item.name || '未知表';
  }
  if (item.type === 'profile' || item.type === 'datatype' || item.type === 'module') {
    return item.type === 'profile' ? '项目配置' : item.type === 'datatype' ? '数据类型' : '模块';
  }
  const n = item.name || '';
  const i = n.indexOf('.');
  return i > 0 ? n.slice(0, i) : n || '未知表';
}

export function fieldOf(item: VersionDiffItem): string {
  if (item.type === 'entity') {
    return '';
  }
  const n = item.name || '';
  const i = n.indexOf('.');
  return i >= 0 ? n.slice(i + 1) : n;
}

export type FormatVersionDiffMarkdownOpts = {
  messages: VersionDiffItem[];
  title?: string;
  fromVersion?: string;
  toVersion?: string;
  sql?: string;
};

/** 将结构化模型变更（+ 可选 SQL）格式化为 Markdown，供 diff 导出复用 File.save 管道 */
export function formatVersionDiffMarkdown(opts: FormatVersionDiffMarkdownOpts): string {
  const list = Array.isArray(opts.messages) ? opts.messages : [];
  const counts = { add: 0, delete: 0, update: 0 };
  const map = new Map<string, VersionDiffItem[]>();
  list.forEach((m) => {
    if (counts[m.opt as keyof typeof counts] !== undefined) {
      counts[m.opt as keyof typeof counts] += 1;
    }
    const key = tableOf(m);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(m);
  });

  const range =
    opts.fromVersion && opts.toVersion
      ? `${opts.fromVersion} → ${opts.toVersion}`
      : opts.toVersion || opts.fromVersion || '';
  const title = opts.title || (range ? `版本变更 ${range}` : '版本变更');

  const lines: string[] = [`# ${title}`, ''];
  if (range) {
    lines.push(`- 范围：\`${range}\``);
  }
  lines.push(
    `- 摘要：+${counts.add} 新增 · -${counts.delete} 删除 · ~${counts.update} 修改（共 ${list.length} 项 · ${map.size} 张表）`,
    '',
  );

  if (list.length === 0) {
    lines.push('## 模型变更', '', '_无结构化增量条目（可能为全量脚本）_', '');
  } else {
    lines.push('## 模型变更', '');
    Array.from(map.entries()).forEach(([table, items]) => {
      lines.push(`### ${table}`, '');
      items.forEach((item) => {
        const optLabel = OPT_META[item.opt]?.label || item.opt;
        const typeLabel = TYPE_LABEL[item.type] || item.type;
        const leaf = item.type === 'entity' ? table : fieldOf(item) || item.name || '';
        const detail = item.changeData ? ` — ${String(item.changeData)}` : '';
        lines.push(`- **[${optLabel}]** ${typeLabel} \`${leaf}\`${detail}`);
      });
      lines.push('');
    });
  }

  const sql = opts.sql != null ? String(opts.sql).trim() : '';
  if (sql) {
    lines.push('## 变化脚本', '', '```sql', sql, '```', '');
  }

  return lines.join('\n');
}
