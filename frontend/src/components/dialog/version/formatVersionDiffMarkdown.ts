import { getIntl } from '@umijs/max';

export type VersionDiffItem = {
  message: string;
  opt: 'add' | 'delete' | 'update' | string;
  type: 'entity' | 'field' | 'index' | string;
  name?: string;
  changeData?: string;
};

const OPT_KEY: Record<string, string> = {
  add: 'versionModal.diff.change.add',
  delete: 'versionModal.diff.change.delete',
  update: 'versionModal.diff.change.update',
};

const TYPE_KEY: Record<string, string> = {
  entity: 'versionModal.diff.type.entity',
  field: 'versionModal.diff.type.field',
  index: 'versionModal.diff.type.index',
  association: 'versionModal.diff.type.association',
  diagram: 'versionModal.diff.type.diagram',
  profile: 'versionModal.diff.type.profile',
  datatype: 'versionModal.diff.type.datatype',
  module: 'versionModal.diff.type.module',
};

export function tableOf(item: VersionDiffItem): string {
  const intl = getIntl();
  if (item.type === 'entity') {
    return item.name || intl.formatMessage({ id: 'versionDiffMarkdown.unknownTable' });
  }
  if (item.type === 'profile' || item.type === 'datatype' || item.type === 'module') {
    if (item.type === 'profile') {
      return intl.formatMessage({ id: 'versionDiffMarkdown.profileLabel' });
    }
    if (item.type === 'datatype') {
      return intl.formatMessage({ id: 'versionDiffMarkdown.datatypeLabel' });
    }
    return intl.formatMessage({ id: 'versionDiffMarkdown.moduleLabel' });
  }
  const n = item.name || '';
  const i = n.indexOf('.');
  return i > 0 ? n.slice(0, i) : n || intl.formatMessage({ id: 'versionDiffMarkdown.unknownTable' });
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
  const intl = getIntl();
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
  const title =
    opts.title ||
    (range
      ? intl.formatMessage({ id: 'versionDiffMarkdown.titleWithRange' }, { range })
      : intl.formatMessage({ id: 'versionDiffMarkdown.titleDefault' }));

  const lines: string[] = [`# ${title}`, ''];
  if (range) {
    lines.push(`- ${intl.formatMessage({ id: 'versionDiffMarkdown.rangeLabel' })}\`${range}\``);
  }
  lines.push(
    `- ${intl.formatMessage(
      { id: 'versionDiffMarkdown.summary' },
      {
        add: counts.add,
        delete: counts.delete,
        update: counts.update,
        total: list.length,
        tables: map.size,
      },
    )}`,
    '',
  );

  if (list.length === 0) {
    lines.push(
      `## ${intl.formatMessage({ id: 'versionDiffMarkdown.sectionChanges' })}`,
      '',
      intl.formatMessage({ id: 'versionDiffMarkdown.emptyChanges' }),
      '',
    );
  } else {
    lines.push(`## ${intl.formatMessage({ id: 'versionDiffMarkdown.sectionChanges' })}`, '');
    Array.from(map.entries()).forEach(([table, items]) => {
      lines.push(`### ${table}`, '');
      items.forEach((item) => {
        const optLabel = OPT_KEY[item.opt]
          ? intl.formatMessage({ id: OPT_KEY[item.opt] })
          : item.opt;
        const typeLabel = TYPE_KEY[item.type]
          ? intl.formatMessage({ id: TYPE_KEY[item.type] })
          : item.type;
        const leaf = item.type === 'entity' ? table : fieldOf(item) || item.name || '';
        const detail = item.changeData ? ` — ${String(item.changeData)}` : '';
        lines.push(`- **[${optLabel}]** ${typeLabel} \`${leaf}\`${detail}`);
      });
      lines.push('');
    });
  }

  const sql = opts.sql != null ? String(opts.sql).trim() : '';
  if (sql) {
    lines.push(
      `## ${intl.formatMessage({ id: 'versionDiffMarkdown.sectionSql' })}`,
      '',
      '```sql',
      sql,
      '```',
      '',
    );
  }

  return lines.join('\n');
}
