import React, { useEffect } from 'react';
import './shortcut-help.scss';

export type ShortcutRow = {
  keys: string;
  desc: string;
};

const DEFAULT_SHORTCUTS: ShortcutRow[] = [
  { keys: '⌘/Ctrl+K · ⌘/Ctrl+F', desc: '命令面板（搜表定位、建表、布局）' },
  { keys: '⌘/Ctrl+1 · 2 · 3', desc: '表设计：字段 / 索引 / 元数据应用' },
  { keys: '⌘/Ctrl+Z', desc: '撤销' },
  { keys: '⌘/Ctrl+⇧Z', desc: '重做' },
  { keys: 'Delete · Backspace', desc: '删除选中表 / 边 / 字段（二次确认）' },
  { keys: 'Tab · ⇧Tab', desc: '字段编辑：下一 / 上一列或行；末行 Tab 新建' },
  { keys: 'Enter', desc: '提交内联编辑' },
  { keys: 'Esc', desc: '取消编辑 / 关闭本卡与命令面板' },
  { keys: 'Shift + 点选', desc: '多选表' },
  { keys: '?', desc: '打开 / 关闭本速查卡' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  shortcuts?: ShortcutRow[];
};

/**
 * 画布快捷键速查（ADR-0005 设计器域自研，不用 antd Modal）
 * `?` 打开；Esc / 再按 `?` / 点遮罩关闭。
 */
const ShortcutHelp: React.FC<Props> = ({ open, onClose, shortcuts = DEFAULT_SHORTCUTS }) => {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="erd-help-overlay" onMouseDown={onClose}>
      <div
        className="erd-help-panel"
        onMouseDown={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="快捷键"
        data-testid="shortcut-help"
      >
        <header className="erd-help-header">
          <h2 className="erd-help-title">快捷键</h2>
          <button
            type="button"
            className="erd-help-close"
            onClick={onClose}
            aria-label="关闭快捷键"
          >
            Esc
          </button>
        </header>
        <ul className="erd-help-list">
          {shortcuts.map(row => (
            <li key={row.keys} className="erd-help-row">
              <kbd className="erd-help-keys">{row.keys}</kbd>
              <span className="erd-help-desc">{row.desc}</span>
            </li>
          ))}
        </ul>
        <footer className="erd-help-footer">输入框内不拦截 · Esc 关闭</footer>
      </div>
    </div>
  );
};

export default ShortcutHelp;
