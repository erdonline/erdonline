import React from 'react';
import TableCodeShow from "@/pages/design/table/component/table/TableCodeShow";
import {ModuleEntity} from "@/store/tab/useTabStore";
import {Tabs} from "antd";
import { designIntl } from '@/pages/design/locales/intl';

const {TabPane} = Tabs;

export type DbTabProps = {
  dbCode: string;
  moduleEntity: ModuleEntity
};

const TEMPLATE_TABS: Array<{ key: string; templateCode: string; labelId: string }> = [
  { key: 'createTableTemplate', templateCode: 'createTableTemplate', labelId: 'databaseTemplates.template.createTableTemplate' },
  { key: 'updateTableTemplate', templateCode: 'updateTableComment', labelId: 'databaseTemplates.template.updateTableComment' },
  { key: 'deleteTableTemplate', templateCode: 'deleteTableTemplate', labelId: 'databaseTemplates.template.deleteTableTemplate' },
  { key: 'createIndexTemplate', templateCode: 'createIndexTemplate', labelId: 'databaseTemplates.template.createIndexTemplate' },
  { key: 'rebuildTableTemplate', templateCode: 'rebuildTableTemplate', labelId: 'databaseTemplates.template.rebuildTableTemplate' },
  { key: 'createFieldTemplate', templateCode: 'createFieldTemplate', labelId: 'databaseTemplates.template.createFieldTemplate' },
  { key: 'updateFieldTemplate', templateCode: 'updateFieldTemplate', labelId: 'databaseTemplates.template.updateFieldTemplate' },
  { key: 'deleteFieldTemplate', templateCode: 'deleteFieldTemplate', labelId: 'databaseTemplates.template.deleteFieldTemplate' },
  { key: 'deleteIndexTemplate', templateCode: 'deleteIndexTemplate', labelId: 'databaseTemplates.template.deleteIndexTemplate' },
  { key: 'createPkTemplate', templateCode: 'createPkTemplate', labelId: 'databaseTemplates.template.createPkTemplate' },
  { key: 'deletePkTemplate', templateCode: 'deletePkTemplate', labelId: 'databaseTemplates.template.deletePkTemplate' },
];

const DbTab: React.FC<DbTabProps> = (props) => {
  const {dbCode, moduleEntity} = props;
  return (
    <Tabs
      id={`dbNav-${dbCode}`}
      size="small"
      className="erd-db-tab"
      data-testid={`table-db-tab-${dbCode}`}
    >
      {TEMPLATE_TABS.map(({ key, templateCode, labelId }) => (
        <TabPane key={key} tab={designIntl(labelId)}>
          <TableCodeShow dbCode={dbCode} templateCode={templateCode} moduleEntity={moduleEntity}/>
        </TabPane>
      ))}
    </Tabs>
  );
}

export default React.memo(DbTab)
