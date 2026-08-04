import React, { useMemo } from 'react';
import { Empty, Space, Tag, Typography } from 'antd';
import './version-diff-panel.scss';
import {
  CHANGE_OPT,
  changeSummaryTags,
  countChanges,
} from '@/utils/dualLayerTokens';
import {
  fieldOf,
  tableOf,
  type VersionDiffItem,
} from './formatVersionDiffMarkdown';

export type { VersionDiffItem } from './formatVersionDiffMarkdown';
export { formatVersionDiffMarkdown } from './formatVersionDiffMarkdown';

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

export type VersionDiffPanelProps = {
  messages: VersionDiffItem[];
  /** 右侧脚本非空但无结构化变更时的提示（全量脚本） */
  hasScript?: boolean;
  /** 摘要行上下文说明，默认「A 层版本 diff」 */
  summaryHint?: string;
};

/**
 * 版本模型 diff 可视化：按表分组，增绿 / 删红 / 改黄。
 * 数据来自 useVersionStore.constructorMessage（与 DDL 同源）。
 */
const VersionDiffPanel: React.FC<VersionDiffPanelProps> = ({
  messages,
  hasScript,
  summaryHint = 'A 层版本 diff',
}) => {
  const { groups, summary } = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
    const counts = countChanges(list);
    const map = new Map<string, VersionDiffItem[]>();
    list.forEach((m) => {
      const key = tableOf(m);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(m);
    });
    const groups = Array.from(map.entries()).map(([table, items]) => ({
      table,
      items: [...items].sort((a, b) => {
        const oa = a.opt === 'delete' ? 0 : a.opt === 'add' ? 1 : 2;
        const ob = b.opt === 'delete' ? 0 : b.opt === 'add' ? 1 : 2;
        return oa - ob || String(a.type).localeCompare(String(b.type));
      }),
    }));
    return { groups, summary: counts };
  }, [messages]);

  if (!messages?.length) {
    return (
      <div className="version-diff-panel" data-testid="version-diff-panel">
        <Empty
          data-testid="version-diff-empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={hasScript ? '当前脚本为全量脚本（无增量变更条目）' : '当前版本无变化'}
        />
      </div>
    );
  }

  return (
    <div className="version-diff-panel" data-testid="version-diff-panel">
      <Space size={4} wrap className="version-diff-summary" data-testid="version-diff-summary">
        {changeSummaryTags(summary).map(({ opt, text }) => (
          <Tag key={opt} color={CHANGE_OPT[opt].color}>
            {text}
          </Tag>
        ))}
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          共 {messages.length} 项 · {groups.length} 张表 · {summaryHint}
        </Typography.Text>
      </Space>
      <ul className="version-diff-tree">
        {groups.map(({ table, items }) => (
          <li key={table} className="version-diff-table">
            <div className="version-diff-table-title">
              <span className="version-diff-table-name">{table}</span>
              <Tag>{items.length}</Tag>
            </div>
            <ul className="version-diff-items">
              {items.map((item, idx) => {
                const meta = CHANGE_OPT[item.opt as keyof typeof CHANGE_OPT] ?? {
                  color: 'default' as const,
                  label: item.opt,
                };
                const typeLabel = TYPE_LABEL[item.type] || item.type;
                const leaf = fieldOf(item);
                return (
                  <li
                    key={`${item.opt}-${item.type}-${item.name}-${idx}`}
                    className={`version-diff-item version-diff-item--${item.opt}`}
                    data-testid={`version-diff-item-${item.opt}`}
                  >
                    <Tag color={meta.color} className="version-diff-opt">
                      {meta.label}
                    </Tag>
                    <span className="version-diff-type">{typeLabel}</span>
                    <span className="version-diff-name">
                      {item.type === 'entity' ? table : leaf || item.name}
                    </span>
                    {item.changeData ? (
                      <span className="version-diff-detail" title={String(item.changeData)}>
                        {String(item.changeData)}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(VersionDiffPanel);
