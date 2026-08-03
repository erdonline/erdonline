import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './command-palette.scss';

export type CommandItem = {
  id: string;
  title: string;
  hint?: string;
  run: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
};

const optionDomId = (id: string) => `erd-cmd-opt-${id}`;

/**
 * 画布命令面板（ADR-0005 设计器域自研，不用 antd Modal）
 * Cmd/Ctrl+K 打开；↑↓ 选择，Enter 执行，Esc 关闭并归还焦点；Tab 困在输入框。
 */
const CommandPalette: React.FC<Props> = ({ open, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  /** 执行命令关闭时不抢回焦点（由 run 接手画布） */
  const closedByRunRef = useRef(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return commands;
    }
    return commands.filter(c => c.title.toLowerCase().includes(q) || (c.hint || '').toLowerCase().includes(q));
  }, [commands, query]);

  const hasQuery = query.trim().length > 0;
  const activeItem = filtered[active];

  const dismiss = useCallback(() => {
    closedByRunRef.current = false;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      closedByRunRef.current = false;
      prevFocusRef.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setActive(0);
      // 下一帧聚焦，避免被 RF 画布抢走
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    if (closedByRunRef.current) {
      return;
    }
    const prev = prevFocusRef.current;
    prevFocusRef.current = null;
    requestAnimationFrame(() => {
      if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
        prev.focus();
      }
    });
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  // 活动项滚入可视区（↑↓ 长列表不丢选）
  useEffect(() => {
    if (!open || !activeItem) {
      return;
    }
    const el = listRef.current?.querySelector<HTMLElement>(`#${optionDomId(activeItem.id)}`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, active, activeItem]);

  // Esc 全局关闭；Tab 困在输入（选项走 ↑↓，与其它 dialog trap 同阶）
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        dismiss();
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, dismiss]);

  if (!open) {
    return null;
  }

  const run = (item: CommandItem) => {
    closedByRunRef.current = true;
    onClose();
    // 关闭后再执行，避免面板残留焦点干扰后续画布操作
    requestAnimationFrame(() => item.run());
  };

  return (
    <div className="erd-cmd-overlay" onMouseDown={dismiss}>
      <div
        className="erd-cmd-panel"
        onMouseDown={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
      >
        <input
          ref={inputRef}
          className="erd-cmd-input"
          data-testid="cmd-palette-input"
          aria-label="命令搜索"
          role="combobox"
          aria-expanded="true"
          aria-controls="erd-cmd-list"
          aria-autocomplete="list"
          aria-activedescendant={activeItem ? optionDomId(activeItem.id) : undefined}
          placeholder="输入命令或表名…（定位、建表、布局）"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive(i => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const item = filtered[active];
              if (item) {
                run(item);
              }
            }
          }}
        />
        <ul
          ref={listRef}
          id="erd-cmd-list"
          className="erd-cmd-list"
          role="listbox"
          aria-label="命令列表"
        >
          {filtered.length === 0 && (
            <li className="erd-cmd-empty" role="presentation" aria-live="polite">
              <span className="erd-cmd-empty__title">
                {hasQuery ? '无匹配结果' : '暂无命令'}
              </span>
              <span className="erd-cmd-empty__hint">
                {hasQuery ? '试试表名、定位、建表或布局 · Esc 关闭' : 'Esc 关闭'}
              </span>
            </li>
          )}
          {filtered.map((c, i) => (
            <li
              key={c.id}
              id={optionDomId(c.id)}
              role="option"
              aria-selected={i === active}
              data-testid={`cmd-item-${c.id}`}
              className={`erd-cmd-item${i === active ? ' active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(c)}
            >
              <span className="erd-cmd-title">{c.title}</span>
              {c.hint && <span className="erd-cmd-hint">{c.hint}</span>}
            </li>
          ))}
        </ul>
        <div className="erd-cmd-footer">↑↓ 选择 · Enter 执行 · Esc 关闭 · Tab 困在搜索</div>
      </div>
    </div>
  );
};

export default CommandPalette;
