import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Empty,
  Radio,
  Select,
  Space,
  message,
} from 'antd';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import CodeEditor from '@/components/CodeEditor';
import {
  DDL_TEMPLATE_KEYS,
  DDL_TEMPLATE_LABELS,
  type DdlTemplateKey,
  editorModeForDialect,
  isSqlDialect,
} from '@/utils/ddlTemplateKeys';
import './setting-common.scss';

type DatabaseRow = {
  code?: string;
  defaultDatabase?: boolean;
  fileShow?: boolean;
  templateSyntax?: string;
} & Partial<Record<DdlTemplateKey, string>>;

const DatabaseTemplates: React.FC = () => {
  const { projectDispatch, database } = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      database: (state.project?.projectJSON?.dataTypeDomains?.database ||
        []) as DatabaseRow[],
    }),
    shallow,
  );

  const sqlDialects = useMemo(
    () => database.filter((row) => isSqlDialect(row.code)),
    [database],
  );

  const [selectedCode, setSelectedCode] = useState<string | undefined>(
    () => sqlDialects.find((d) => d.defaultDatabase)?.code ?? sqlDialects[0]?.code,
  );
  const [templateKey, setTemplateKey] = useState<DdlTemplateKey>('createTableTemplate');
  const [draft, setDraft] = useState<DatabaseRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeCode = selectedCode ?? sqlDialects[0]?.code;
  const storedRow = useMemo(
    () => sqlDialects.find((d) => d.code === activeCode),
    [sqlDialects, activeCode],
  );

  const workingRow = draft ?? storedRow ?? null;

  useEffect(() => {
    if (draft == null && storedRow) {
      setDraft({ ...storedRow });
    }
  }, [storedRow, draft]);

  const syncDraftFromStore = useCallback(
    (code: string | undefined) => {
      if (!code) {
        setDraft(null);
        return;
      }
      const row = sqlDialects.find((d) => d.code === code);
      setDraft(row ? { ...row } : null);
    },
    [sqlDialects],
  );

  const handleDialectChange = (code: string) => {
    setSelectedCode(code);
    syncDraftFromStore(code);
  };

  const handleTemplateChange = (key: DdlTemplateKey) => {
    setTemplateKey(key);
  };

  const handleFieldChange = (patch: Partial<DatabaseRow>) => {
    setDraft((prev) => ({ ...(prev ?? storedRow ?? {}), ...patch }));
  };

  const handleTemplateTextChange = (value: string) => {
    handleFieldChange({ [templateKey]: value });
  };

  const handleSave = async () => {
    if (!workingRow?.code) {
      message.error('请选择库方言');
      return;
    }
    setSubmitting(true);
    try {
      const ok = await projectDispatch.updateDatabaseDialect(
        workingRow.code,
        workingRow,
        { persist: true },
      );
      if (ok) {
        setDraft(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetDraft = () => {
    syncDraftFromStore(activeCode);
    message.info('已还原为上次保存内容');
  };

  const templateValue = String(workingRow?.[templateKey] ?? '');
  const editorMode = editorModeForDialect(workingRow?.code ?? 'MYSQL');
  const dirty =
    draft != null &&
    storedRow != null &&
    JSON.stringify(draft) !== JSON.stringify(storedRow);

  return (
    <div className="setting-common-page" data-testid="database-templates-page">
      <h2 className="setting-common-page__title">DDL 模板</h2>
      <p className="setting-common-page__hint">
        编辑 projectJSON 中各库方言的 DDL 模板；保存后版本对比、导出与元数据应用均由后端 Freemarker 渲染。自定义模板优先于 classpath 官方种子
      </p>

      {sqlDialects.length === 0 ? (
        <div className="setting-common-page__empty" data-testid="database-templates-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="当前项目尚无 SQL 库方言（database[]）"
          />
        </div>
      ) : (
        <>
          <div className="setting-common-page__toolbar">
            <Space wrap size={12}>
              <Select
                aria-label="选择库方言"
                data-testid="database-templates-dialect"
                style={{ minWidth: 180 }}
                value={activeCode}
                options={sqlDialects.map((d) => ({
                  label: d.code,
                  value: d.code,
                }))}
                onChange={handleDialectChange}
              />
              <Checkbox
                data-testid="database-templates-default-db"
                checked={!!workingRow?.defaultDatabase}
                onChange={(e) =>
                  handleFieldChange({ defaultDatabase: e.target.checked })
                }
              >
                设为默认库
              </Checkbox>
              <Checkbox
                data-testid="database-templates-file-show"
                checked={workingRow?.fileShow !== false}
                onChange={(e) => handleFieldChange({ fileShow: e.target.checked })}
              >
                生成至文档
              </Checkbox>
              <Button
                type="primary"
                size="small"
                aria-label="保存 DDL 模板"
                data-testid="database-templates-save"
                loading={submitting}
                disabled={!dirty}
                onClick={() => {
                  void handleSave();
                }}
              >
                保存
              </Button>
              <Button
                size="small"
                aria-label="还原未保存修改"
                data-testid="database-templates-reset"
                disabled={!dirty}
                onClick={handleResetDraft}
              >
                还原
              </Button>
            </Space>
          </div>

          <Radio.Group
            aria-label="DDL 模板类型"
            data-testid="database-templates-tab"
            optionType="button"
            buttonStyle="solid"
            size="small"
            value={templateKey}
            style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}
            options={DDL_TEMPLATE_KEYS.map((key) => ({
              label: DDL_TEMPLATE_LABELS[key],
              value: key,
            }))}
            onChange={(e) => handleTemplateChange(e.target.value as DdlTemplateKey)}
          />

          <div data-testid={`database-templates-editor-${templateKey}`}>
            <CodeEditor
              mode={editorMode}
              height="420px"
              value={templateValue}
              onChange={(value: string) => handleTemplateTextChange(value)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(DatabaseTemplates);
