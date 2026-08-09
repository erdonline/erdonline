import CodeTab from '@/pages/design/table/component/tab/CodeTab';
import TableIndexEdit from '@/pages/design/table/component/table/TableIndexEdit';
import TableInfoEdit from '@/pages/design/table/component/table/TableInfoEdit';
import TableTriggerEdit from '@/pages/design/table/component/table/TableTriggerEdit';
import useTabStore, {DesignPane, ModuleEntity} from '@/store/tab/useTabStore';
import useProjectStore from '@/store/project/useProjectStore';
import {erdColors} from '@/theme/tokens';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {TableOutlined} from '@ant-design/icons';
import {useIntl} from '@@/exports';
import './TableTab.less';

const PANE_BY_DIGIT: DesignPane[] = ['field', 'index', 'code', 'trigger'];

const PANE_DEFS: { key: DesignPane; labelId: string }[] = [
  { key: 'field', labelId: 'designTable.tab.field' },
  { key: 'index', labelId: 'designTable.tab.index' },
  { key: 'code', labelId: 'designTable.tab.code' },
  { key: 'trigger', labelId: 'designTable.tab.trigger' },
];

export type TableTabProps = {
  moduleEntity: ModuleEntity;
};

const TableTab: React.FC<TableTabProps> = (props) => {
  const intl = useIntl();
  const {module, entity: entityName, designPane} = props.moduleEntity;
  const entity = useProjectStore(state =>
    state.project?.projectJSON?.modules
      ?.find((m: any) => m.name === module)
      ?.entities?.find((e: any) => (e.title || e.name) === entityName));
  const [activeKey, setActiveKey] = useState<DesignPane>(designPane || 'field');

  const paneLabels = useMemo(
    () =>
      PANE_DEFS.map(({ key, labelId }) => ({
        key,
        label: intl.formatMessage({ id: labelId }),
      })),
    [intl],
  );

  // 画布入口再次带 designPane 时同步；勿在 mount 立刻 consume（Strict Mode 双挂载会丢定位）
  useEffect(() => {
    if (designPane) setActiveKey(designPane);
  }, [designPane, module, entityName]);

  const activatePane = useCallback((pane: DesignPane) => {
    setActiveKey(pane);
    if (designPane) {
      useTabStore.getState().dispatch.consumeDesignPane({
        module,
        entity: entityName,
      });
    }
  }, [designPane, module, entityName]);

  const onPaneKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, pane: DesignPane) => {
      const idx = PANE_DEFS.findIndex((p) => p.key === pane);
      if (idx < 0) {
        return;
      }
      let nextIdx = idx;
      if (e.key === 'ArrowRight') {
        nextIdx = (idx + 1) % PANE_DEFS.length;
      } else if (e.key === 'ArrowLeft') {
        nextIdx = (idx - 1 + PANE_DEFS.length) % PANE_DEFS.length;
      } else if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = PANE_DEFS.length - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activatePane(pane);
        return;
      } else {
        return;
      }
      e.preventDefault();
      const nextKey = PANE_DEFS[nextIdx]?.key;
      if (!nextKey) {
        return;
      }
      document.getElementById(`tableNav-${nextKey}`)?.focus();
    },
    [activatePane],
  );

  // Cmd/Ctrl+1/2/3/4 → 字段 / 索引 / 元数据应用 / 触发器
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      const typing =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!el?.isContentEditable;
      if (typing || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) {
        return;
      }
      const digit =
        e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3' || e.code === 'Digit4'
          ? Number(e.code.replace('Digit', ''))
          : e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4'
            ? Number(e.key)
            : 0;
      if (digit < 1 || digit > PANE_BY_DIGIT.length) {
        return;
      }
      e.preventDefault();
      activatePane(PANE_BY_DIGIT[digit - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activatePane]);

  return (
    <div className="erd-table-design" data-testid="table-design">
      <div className="erd-table-design__chrome" data-testid="table-design-header">
        <div className="erd-table-design__identity">
          <TableOutlined style={{color: erdColors.warning}}/>
          <span className="erd-table-design__title">{entityName}</span>
          {entity?.chnname && (
            <span className="erd-table-design__chnname">{entity.chnname}</span>
          )}
        </div>
        <div className="erd-table-design__chrome-right">
          <span className="erd-table-design__module">{module}</span>
          <div
            id="tableNav"
            className="erd-table-design__pane-switcher"
            data-testid="table-design-tabs"
            role="tablist"
          >
            {paneLabels.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`tableNav-${key}`}
                aria-selected={activeKey === key}
                aria-controls={`tableNav-panel-${key}`}
                tabIndex={activeKey === key ? 0 : -1}
                className={
                  activeKey === key
                    ? 'erd-table-design__pane-btn is-active'
                    : 'erd-table-design__pane-btn'
                }
                onClick={() => activatePane(key)}
                onKeyDown={(e) => onPaneKeyDown(e, key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="erd-table-design__body">
        <div
          role="tabpanel"
          id={`tableNav-panel-${activeKey}`}
          aria-labelledby={`tableNav-${activeKey}`}
          className="erd-table-design__panel"
        >
          {activeKey === 'field' && (
            <TableInfoEdit
              moduleEntity={props.moduleEntity}
              onOpenIndex={() => activatePane('index')}
            />
          )}
          {activeKey === 'index' && (
            <TableIndexEdit moduleEntity={props.moduleEntity} />
          )}
          {activeKey === 'code' && (
            <CodeTab moduleEntity={props.moduleEntity} />
          )}
          {activeKey === 'trigger' && (
            <TableTriggerEdit moduleEntity={props.moduleEntity} />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TableTab);
