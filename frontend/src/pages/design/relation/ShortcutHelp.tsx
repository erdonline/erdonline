import React, { useEffect, useMemo } from 'react';
import { designIntl } from '@/pages/design/locales/intl';
import './shortcut-help.scss';

export type ShortcutRow = {
  keys: string;
  desc: string;
};

function buildDefaultShortcuts(): ShortcutRow[] {
  return [
    { keys: '⌘/Ctrl+K · ⌘/Ctrl+F', desc: designIntl('design.relation.shortcut.cmdPalette') },
    { keys: '⌘/Ctrl+1 · 2 · 3 · 4', desc: designIntl('design.relation.shortcut.tableDesign') },
    { keys: '⌘/Ctrl+Z', desc: designIntl('design.relation.shortcut.undo') },
    { keys: '⌘/Ctrl+⇧Z', desc: designIntl('design.relation.shortcut.redo') },
    { keys: 'Delete · Backspace', desc: designIntl('design.relation.shortcut.delete') },
    { keys: 'Tab · ⇧Tab', desc: designIntl('design.relation.shortcut.tabNav') },
    { keys: '↓ ↑ ← → · Enter', desc: designIntl('design.relation.shortcut.treeNav') },
    { keys: 'Enter', desc: designIntl('design.relation.shortcut.enter') },
    { keys: 'Esc', desc: designIntl('design.relation.shortcut.esc') },
    { keys: designIntl('design.relation.shortcut.multiSelectKeys'), desc: designIntl('design.relation.shortcut.multiSelect') },
    { keys: '?', desc: designIntl('design.relation.shortcut.toggleHelp') },
  ];
}

type Props = {
  open: boolean;
  onClose: () => void;
  shortcuts?: ShortcutRow[];
};

const ShortcutHelp: React.FC<Props> = ({ open, onClose, shortcuts }) => {
  const rows = useMemo(
    () => shortcuts ?? buildDefaultShortcuts(),
    [shortcuts, open],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const title = designIntl('design.relation.shortcut.title');

  return (
    <div className="erd-help-overlay" onMouseDown={onClose}>
      <div
        className="erd-help-panel"
        onMouseDown={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid="shortcut-help"
      >
        <header className="erd-help-header">
          <h2 className="erd-help-title">{title}</h2>
          <button
            type="button"
            className="erd-help-close"
            onClick={onClose}
            aria-label={designIntl('design.relation.shortcut.closeAria')}
          >
            Esc
          </button>
        </header>
        <ul className="erd-help-list">
          {rows.map(row => (
            <li key={row.keys} className="erd-help-row">
              <kbd className="erd-help-keys">{row.keys}</kbd>
              <span className="erd-help-desc">{row.desc}</span>
            </li>
          ))}
        </ul>
        <footer className="erd-help-footer">
          {designIntl('design.relation.shortcut.footer')}
        </footer>
      </div>
    </div>
  );
};

export default ShortcutHelp;
