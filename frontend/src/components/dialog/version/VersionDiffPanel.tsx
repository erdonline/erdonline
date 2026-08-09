import React, { useMemo } from 'react';
import { Empty, Space, Tag, Typography } from 'antd';
import './version-diff-panel.scss';
import {
  CHANGE_OPT,
  changeSummaryTags,
  countChanges,
} from '@/utils/dualLayerTokens';
import { intlFormat, appFormat, type MessageFormatFn } from '@/utils/messageFormat';
import { useIntl } from '@@/exports';
import {
  fieldOf,
  tableOf,
  type VersionDiffItem,
} from './formatVersionDiffMarkdown';

export type { VersionDiffItem } from './formatVersionDiffMarkdown';
export { formatVersionDiffMarkdown } from './formatVersionDiffMarkdown';

const DIFF_TYPE_KEYS = [
  'entity',
  'field',
  'index',
  'association',
  'diagram',
  'profile',
  'datatype',
  'module',
] as const;

export type VersionDiffPanelProps = {
  messages: VersionDiffItem[];
  /** 右侧脚本非空但无结构化变更时的提示（全量脚本） */
  hasScript?: boolean;
  /** 后端 diff 失败：禁止展示 stale 数据 */
  loadError?: string | null;
  /** 摘要行上下文 i18n key，默认 versionModal.diff.summaryHintDefault */
  summaryHintId?: string;
  /** 为 false 时摘要由父级（如 CompareVersion 双栏工具行）渲染，便于与右列对齐 */
  showSummary?: boolean;
  /** 静态 Modal 等无 IntlProvider 场景传入 */
  format?: MessageFormatFn;
};

export type VersionDiffSummaryProps = {
  messages: VersionDiffItem[];
  summaryHintId?: string;
  format?: MessageFormatFn;
};

const VersionDiffSummaryInner: React.FC<
  VersionDiffSummaryProps & { format: MessageFormatFn }
> = ({ messages, summaryHintId = 'versionModal.diff.summaryHintDefault', format }) => {
  const summaryHint = format(summaryHintId);

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
    const groups = Array.from(map.entries()).map(([table, items]) => ({ table, items }));
    return { groups, summary: counts };
  }, [messages]);

  if (!messages?.length) {
    return null;
  }

  return (
    <Space size={4} wrap className="version-diff-summary" data-testid="version-diff-summary">
      {changeSummaryTags(summary, format).map(({ opt, text }) => (
        <Tag key={opt} color={CHANGE_OPT[opt].color}>
          {text}
        </Tag>
      ))}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {format('versionModal.diff.summary', {
          count: messages.length,
          tables: groups.length,
          hint: summaryHint,
        })}
      </Typography.Text>
    </Space>
  );
};

const VersionDiffPanelInner: React.FC<
  VersionDiffPanelProps & { format: MessageFormatFn }
> = ({
  messages,
  hasScript,
  loadError,
  summaryHintId = 'versionModal.diff.summaryHintDefault',
  showSummary = true,
  format,
}) => {
  const typeLabel = (type: string) => {
    const key = `versionModal.diff.type.${type}`;
    if ((DIFF_TYPE_KEYS as readonly string[]).includes(type)) {
      return format(key);
    }
    return type;
  };

  const changeLabel = (opt: string) => {
    if (opt === 'add' || opt === 'delete' || opt === 'update') {
      return format(`versionModal.diff.change.${opt}`);
    }
    return opt;
  };

  const { groups } = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
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
    return { groups };
  }, [messages]);

  if (loadError) {
    return (
      <div className="version-diff-panel" data-testid="version-diff-panel">
        <Empty
          data-testid="version-diff-load-error-empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={format('versionModal.diff.loadErrorEmpty')}
        />
      </div>
    );
  }

  if (!messages?.length) {
    return (
      <div className="version-diff-panel" data-testid="version-diff-panel">
        <Empty
          data-testid="version-diff-empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            hasScript
              ? format('versionModal.diff.emptyFullScript')
              : format('versionModal.diff.emptyNoChanges')
          }
        />
      </div>
    );
  }

  return (
    <div className="version-diff-panel" data-testid="version-diff-panel">
      {showSummary ? (
        <VersionDiffSummaryInner
          messages={messages}
          summaryHintId={summaryHintId}
          format={format}
        />
      ) : null}
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
                const leaf = fieldOf(item);
                return (
                  <li
                    key={`${item.opt}-${item.type}-${item.name}-${idx}`}
                    className={`version-diff-item version-diff-item--${item.opt}`}
                    data-testid={`version-diff-item-${item.opt}`}
                  >
                    <Tag color={meta.color} className="version-diff-opt">
                      {changeLabel(item.opt)}
                    </Tag>
                    <span className="version-diff-type">{typeLabel(item.type)}</span>
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

/**
 * 版本模型 diff 可视化：按表分组，增绿 / 删红 / 改黄。
 * 数据来自后端 VersionDiffEngine（/ncnb/hisProject/diff）；SQL 仅按变更条目模板渲染。
 */
const VersionDiffPanelWithIntl: React.FC<Omit<VersionDiffPanelProps, 'format'>> = (props) => {
  const intl = useIntl();
  return <VersionDiffPanelInner {...props} format={intlFormat(intl)} />;
};

const VersionDiffSummaryWithIntl: React.FC<Omit<VersionDiffSummaryProps, 'format'>> = (props) => {
  const intl = useIntl();
  return <VersionDiffSummaryInner {...props} format={intlFormat(intl)} />;
};

const VersionDiffPanel: React.FC<VersionDiffPanelProps> = ({ format, ...props }) => {
  if (format) {
    return <VersionDiffPanelInner {...props} format={format} />;
  }
  return <VersionDiffPanelWithIntl {...props} />;
};

export const VersionDiffSummary: React.FC<VersionDiffSummaryProps> = ({ format, ...props }) => {
  if (format) {
    return <VersionDiffSummaryInner {...props} format={format} />;
  }
  return <VersionDiffSummaryWithIntl {...props} />;
};

/** 静态 Modal（无 IntlProvider）专用 */
export function VersionDiffPanelStatic(
  props: Omit<VersionDiffPanelProps, 'format'>,
): React.ReactElement {
  return <VersionDiffPanelInner {...props} format={appFormat()} />;
}

export default React.memo(VersionDiffPanel);
