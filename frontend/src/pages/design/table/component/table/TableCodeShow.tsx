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
              const reason = err instanceof Error ? err.message : 'DDL 生成失败';
              message.warning(`表 DDL 预览失败：${reason}`);
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
        message.warning('拉取版本失败，无法生成差异脚本');
      }
    }).catch(() => {
      if (cancelled) {
        return;
      }
      setResult('');
      setLoading(false);
      message.warning('拉取版本失败，无法生成差异脚本');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 差异跟模板/表/模型走；旧 DataSource 随版本回调注入
  }, [templateCode, dataSource, dataTable, dbCode]);

  return (<>
    <Spin spinning={loading}>
    <Paragraph className="erd-meta-ddl-hint" copyable={{text: result}}>    {
      (templateCode === 'createTableTemplate' ||
        templateCode === 'deleteTableTemplate' ||
        templateCode === 'createIndexTemplate') ? '该脚本为全量脚本' :
        <Tooltip placement="top" title='差异化脚本:
        1、根据最后一个版本的元数据，计算和当前模型的差异，然后按模板渲染；
        2、未同步版本时这里为空;
        3、当前项未产生变化，这里为空;
        '>
          <QuestionCircleOutlined/> 该脚本为差异化脚本
        </Tooltip>
    }

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
