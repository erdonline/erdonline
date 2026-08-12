import React, {useEffect, useState} from 'react';
import CodeEditor from "@/components/CodeEditor";
import useProjectStore from "@/store/project/useProjectStore";
import useVersionStore from "@/store/version/useVersionStore";
import shallow from "zustand/shallow";
import {ModuleEntity} from "@/store/tab/useTabStore";
import {getCurrentVersionData} from "@/utils/dbversionutils";
import * as Save from "@/utils/save";
import {message, Spin, Tooltip, Typography} from "antd";
import {QuestionCircleOutlined} from "@ant-design/icons";
import {SNAPSHOT_DB} from "@/utils/versionConstants";
import {fetchTableDdl} from "@/utils/ddlExportApi";
import type {VersionDiffChange} from "@/utils/versionDiffApi";
import { designIntl } from '@/pages/design/locales/intl';

const {Paragraph} = Typography;

export type TableCodeShowProps = {
  dbCode: string;
  templateCode: string;
  moduleEntity: ModuleEntity;
};

const TableCodeShow: React.FC<TableCodeShowProps> = (props) => {
  const {dbCode, templateCode} = props;
  const {dataSource, dataTable} = useProjectStore(state => ({
    dataTable: state.project?.projectJSON?.modules[state.currentModuleIndex || 0]?.entities[state.currentEntityIndex || 0],
    dataSource: state.project?.projectJSON,
  }), shallow);

  const height = document.body.clientHeight;
  const tempHeight = height;
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const filterChangesForTable = (changes: VersionDiffChange[]): VersionDiffChange[] => {
    if (!dataTable) {
      return [];
    }
    return changes.filter((c) => {
      const title = c.name.split('.')[0];
      return (templateCode === 'createFieldTemplate'
        && c.type === 'field'
        && c.opt === 'add'
        && title === dataTable.title) ||
        (templateCode === 'updateFieldTemplate'
          && c.type === 'field'
          && c.opt === 'update'
          && title === dataTable.title) ||
        (templateCode === 'deleteFieldTemplate'
          && c.type === 'field'
          && c.opt === 'delete'
          && title === dataTable.title) ||
        (templateCode === 'deleteIndexTemplate'
          && c.type === 'index'
          && c.opt === 'delete'
          && title === dataTable.title) ||
        (templateCode === 'rebuildTableTemplate'
          && c.type === 'field'
          && title === dataTable.title);
    });
  };

  useEffect(() => {
    if (!dataTable || dataTable.fields.length <= 0 || !dataSource) {
      setResult('');
      return;
    }
    const db =
      useVersionStore.getState().dispatch.getCurrentDBData() || SNAPSHOT_DB;
    let cancelled = false;
    setLoading(true);

    Save.hisProjectLoad(db).then(async (r: unknown) => {
      if (cancelled) {
        return;
      }
      const resp = r as { code?: number; data?: unknown };
      if (resp && resp.code === 200) {
        getCurrentVersionData(dataSource, resp.data, async (c: VersionDiffChange[], version: { projectJSON?: Record<string, unknown> }) => {
          if (cancelled) {
            return;
          }
          const oldDs = version?.projectJSON || {};
          const tempChanges = filterChangesForTable(c || []);
          try {
            const {sql} = await fetchTableDdl({
              projectJSON: dataSource as Record<string, unknown>,
              dialectCode: dbCode,
              templateKey: templateCode,
              entityTitle: dataTable.title,
              baselineProjectJSON: oldDs,
              changes: tempChanges,
              dbKey: db.key,
            });
            if (!cancelled) {
              setResult(sql);
            }
          } catch (err: unknown) {
            if (!cancelled) {
              setResult('');
              const reason = err instanceof Error
                ? err.message
                : designIntl('design.table.code.error.ddlFailed');
              message.warning(
                designIntl('design.table.code.warn.ddlPreview', {reason}),
              );
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        });
      } else {
        setResult('');
        setLoading(false);
        message.warning(designIntl('design.table.code.warn.versionFailed'));
      }
    }).catch(() => {
      if (cancelled) {
        return;
      }
      setResult('');
      setLoading(false);
      message.warning(designIntl('design.table.code.warn.versionFailed'));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 差异跟模板/表/模型走；旧 DataSource 随版本回调注入
  }, [templateCode, dataSource, dataTable, dbCode]);

  const isFullScript =
    templateCode === 'createTableTemplate' ||
    templateCode === 'deleteTableTemplate' ||
    templateCode === 'createIndexTemplate';

  return (<>
    <Spin spinning={loading}>
    <Paragraph className="erd-meta-ddl-hint" copyable={{text: result}}>
      {isFullScript ? (
        designIntl('design.table.code.hint.fullScript')
      ) : (
        <Tooltip
          placement="top"
          title={designIntl('design.table.code.tooltip.diffScript')}
        >
          <QuestionCircleOutlined/> {designIntl('design.table.code.hint.diffScript')}
        </Tooltip>
      )}
    </Paragraph>

    {/* 供 E2E / 复制外断言 DDL；Ace 渲染不必解析 */}
    <pre data-testid={`meta-ddl-sql-${templateCode}`} hidden>
      {result}
    </pre>
    <CodeEditor
      mode='mysql'
      height={`${tempHeight * 0.55}px`}
      value={result}
    />
    </Spin>
  </>);
}

export default React.memo(TableCodeShow)
