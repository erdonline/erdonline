import CodeTab from '@/pages/design/table/component/tab/CodeTab';
import TableIndexEdit from '@/pages/design/table/component/table/TableIndexEdit';
import TableInfoEdit from '@/pages/design/table/component/table/TableInfoEdit';
import TableTriggerEdit from '@/pages/design/table/component/table/TableTriggerEdit';
import useTabStore, {DesignPane, ModuleEntity} from '@/store/tab/useTabStore';
import useProjectStore from '@/store/project/useProjectStore';
import {erdColors} from '@/theme/tokens';
import React, {useCallback, useEffect, useState} from 'react';
import {Tabs} from 'antd';
import {TableOutlined} from '@ant-design/icons';
import {useIntl} from '@@/exports';
import './TableTab.less';

const {TabPane} = Tabs;

const PANE_BY_DIGIT: DesignPane[] = ['field', 'index', 'code', 'trigger'];

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
      <div className="erd-table-design__header" data-testid="table-design-header">
        <TableOutlined style={{color: erdColors.warning}}/>
        <span className="erd-table-design__title">{entityName}</span>
        {entity?.chnname && (
          <span className="erd-table-design__chnname">{entity.chnname}</span>
        )}
        <span className="erd-table-design__module">{module}</span>
      </div>
      <Tabs
        id="tableNav"
        activeKey={activeKey}
        onChange={(key) => activatePane(key as DesignPane)}
        size="small"
        tabBarGutter={2}
        className="erd-table-design__tabs"
        data-testid="table-design-tabs"
      >
        <TabPane key="field" tab={intl.formatMessage({id: 'designTable.tab.field'})}>
          <TableInfoEdit
            moduleEntity={props.moduleEntity}
            onOpenIndex={() => activatePane('index')}
          />
        </TabPane>
        <TabPane key="index" tab={intl.formatMessage({id: 'designTable.tab.index'})}>
          <TableIndexEdit moduleEntity={props.moduleEntity} />
        </TabPane>
        <TabPane key="code" tab={intl.formatMessage({id: 'designTable.tab.code'})}>
          <CodeTab moduleEntity={props.moduleEntity} />
        </TabPane>
        <TabPane key="trigger" tab={intl.formatMessage({id: 'designTable.tab.trigger'})}>
          <TableTriggerEdit moduleEntity={props.moduleEntity} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default React.memo(TableTab);
