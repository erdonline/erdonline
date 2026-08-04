import React, { useMemo } from 'react';
import { Empty, Space, Tag, Typography } from 'antd';
import './version-diff-panel.scss';
import {
  fieldOf,
  tableOf,
  type VersionDiffItem,
} from './formatVersionDiffMarkdown';

export type { VersionDiffItem } from './formatVersionDiffMarkdown';
export { formatVersionDiffMarkdown } from './formatVersionDiffMarkdown';

const OPT_META: Record<string, { color: string; label: string }> = {
  add: { color: 'success', label: '新增' },
  delete: { color: 'error', label: '删除' },
  update: { color: 'warning', label: '修改' },
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

export type VersionDiffPanelProps = {
  messages: VersionDiffItem[];
  /** 右侧脚本非空但无结构化变更时的提示（全量脚本） */
  hasScript?: boolean;
};

/**
 * 版本模型 diff 可视化：按表分组，增绿 / 删红 / 改黄。
 * 数据来自 useVersionStore.constructorMessage（与 DDL 同源）。
 */
const VersionDiffPanel: React.FC<VersionDiffPanelProps> = ({ messages, hasScript }) => {
  const { groups, summary } = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
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
        {summary.add > 0 && <Tag color="success">+{summary.add} 新增</Tag>}
        {summary.delete > 0 && <Tag color="error">-{summary.delete} 删除</Tag>}
        {summary.update > 0 && <Tag color="warning">~{summary.update} 修改</Tag>}
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          共 {messages.length} 项 · {groups.length} 张表
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
                const meta = OPT_META[item.opt] || { color: 'default', label: item.opt };
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
