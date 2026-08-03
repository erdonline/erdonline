import React, { useEffect, useMemo, useRef, useState } from 'react';
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

/**
 * 画布命令面板（ADR-0005 设计器域自研，不用 antd Modal）
 * Cmd/Ctrl+K 打开；↑↓ 选择，Enter 执行，Esc 关闭。
 */
const CommandPalette: React.FC<Props> = ({ open, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return commands;
    }
    return commands.filter(c => c.title.toLowerCase().includes(q) || (c.hint || '').toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // 下一帧聚焦，避免被 RF 画布抢走
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) {
    return null;
  }

  const run = (item: CommandItem) => {
    onClose();
    // 关闭后再执行，避免面板残留焦点干扰后续画布操作
    requestAnimationFrame(() => item.run());
  };

  return (
    <div className="erd-cmd-overlay" onMouseDown={onClose}>
      <div
        className="erd-cmd-panel"
        onMouseDown={e => e.stopPropagation()}
        role="dialog"
        aria-label="命令面板"
      >
        <input
          ref={inputRef}
          className="erd-cmd-input"
          data-testid="cmd-palette-input"
          aria-label="命令搜索"
          placeholder="输入命令或表名…（定位、建表、布局）"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            } else if (e.key === 'ArrowDown') {
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
        <ul className="erd-cmd-list" role="listbox" aria-label="命令列表">
          {filtered.length === 0 && (
            <li className="erd-cmd-empty" aria-live="polite">
              无匹配命令或表
            </li>
          )}
          {filtered.map((c, i) => (
            <li
              key={c.id}
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
        <div className="erd-cmd-footer">↑↓ 选择 · Enter 执行 · Esc 关闭</div>
      </div>
    </div>
  );
};

export default CommandPalette;
