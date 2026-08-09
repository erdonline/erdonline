import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Empty,
  Select,
  Space,
  Tabs,
  message,
} from 'antd';
import _ from 'lodash';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import CodeEditor from '@/components/CodeEditor';
import { fetchPreviewDdlTemplate } from '@/utils/ddlExportApi';
import {
  DDL_TEMPLATE_KEYS,
  DDL_TEMPLATE_LABELS,
  type DdlTemplateKey,
  editorModeForDialect,
  isSqlDialect,
} from '@/utils/ddlTemplateKeys';
import './setting-common.scss';
import './database-templates.scss';

type DatabaseRow = {
  code?: string;
  defaultDatabase?: boolean;
  fileShow?: boolean;
  templateSyntax?: string;
} & Partial<Record<DdlTemplateKey, string>>;

export type DatabaseTemplatesEditorProps = {
  /** Modal 内略缩编辑器高度 */
  compact?: boolean;
};

const PREVIEW_DEBOUNCE_MS = 400;
const EDITOR_HEIGHT_COMPACT = '280px';
const EDITOR_HEIGHT_FULL = '360px';

const DatabaseTemplatesEditor: React.FC<DatabaseTemplatesEditorProps> = ({
  compact = false,
}) => {
  const { projectDispatch, projectJSON, database } = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      projectJSON: state.project?.projectJSON as Record<string, unknown> | undefined,
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
  const [previewSql, setPreviewSql] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewSeqRef = useRef(0);

  const activeCode = selectedCode ?? sqlDialects[0]?.code;
  const storedRow = useMemo(
    () => sqlDialects.find((d) => d.code === activeCode),
    [sqlDialects, activeCode],
  );

  const workingRow = draft ?? storedRow ?? null;
  const editorHeight = compact ? EDITOR_HEIGHT_COMPACT : EDITOR_HEIGHT_FULL;

  useEffect(() => {
    if (!activeCode) {
      return;
    }
    const stillValid = sqlDialects.some((d) => d.code === activeCode);
    if (!stillValid && sqlDialects[0]?.code) {
      setSelectedCode(sqlDialects[0].code);
      setDraft(null);
    }
  }, [sqlDialects, activeCode]);

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

  const handleFieldChange = (patch: Partial<DatabaseRow>) => {
    setDraft((prev) => ({ ...(prev ?? storedRow ?? {}), ...patch }));
  };

  const handleTemplateTextChange = (value: string) => {
    handleFieldChange({ [templateKey]: value });
  };

  const handleSave = async () => {
    if (!workingRow?.code) {
      message.error('请选择库方言');
      return false;
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
      return ok;
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

  const refreshPreview = useMemo(
    () =>
      _.debounce(
        async (
          dialectCode: string | undefined,
          key: DdlTemplateKey,
          row: DatabaseRow | null,
          pj: Record<string, unknown> | undefined,
        ) => {
          if (!dialectCode || !row) {
            setPreviewSql('');
            setPreviewError(null);
            setPreviewLoading(false);
            return;
          }
          const seq = ++previewSeqRef.current;
          setPreviewLoading(true);
          setPreviewError(null);
          try {
            const { sql } = await fetchPreviewDdlTemplate({
              projectJSON: pj,
              dialectCode,
              templateKey: key,
              databaseRow: row as Record<string, unknown>,
            });
            if (seq !== previewSeqRef.current) {
              return;
            }
            setPreviewSql(sql);
          } catch (err) {
            if (seq !== previewSeqRef.current) {
              return;
            }
            setPreviewSql('');
            setPreviewError(err instanceof Error ? err.message : '预览失败');
          } finally {
            if (seq === previewSeqRef.current) {
              setPreviewLoading(false);
            }
          }
        },
        PREVIEW_DEBOUNCE_MS,
      ),
    [],
  );

  useEffect(() => {
    refreshPreview(activeCode, templateKey, workingRow, projectJSON);
    return () => {
      refreshPreview.cancel();
    };
  }, [activeCode, templateKey, workingRow, projectJSON, refreshPreview, templateValue]);

  useEffect(
    () => () => {
      refreshPreview.cancel();
    },
    [refreshPreview],
  );

  const templateTabItems = useMemo(
    () =>
      DDL_TEMPLATE_KEYS.map((key) => ({
        key,
        label: DDL_TEMPLATE_LABELS[key],
      })),
    [],
  );

  if (sqlDialects.length === 0) {
    return (
      <div data-testid="database-templates-empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="当前项目尚无 SQL 库方言（database[]）"
        />
      </div>
    );
  }

  return (
    <div className="database-templates-editor" data-testid="database-templates-editor">
      <p className="setting-common-page__hint" style={{ marginBottom: 0 }}>
        编辑各库方言 DDL 模板；保存后版本对比、导出与元数据应用均由后端 Freemarker 渲染。右侧预览基于样例表
        T_SAMPLE 实时渲染当前草稿（无需先保存）。
      </p>

      <div className="database-templates-editor__toolbar setting-common-page__toolbar">
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

      <Tabs
        aria-label="DDL 模板类型"
        data-testid="database-templates-tab"
        className="database-templates-editor__tabs"
        size="small"
        type="card"
        activeKey={templateKey}
        items={templateTabItems}
        onChange={(key) => setTemplateKey(key as DdlTemplateKey)}
      />

      <div className="database-templates-editor__panes">
        <div
          className="database-templates-editor__pane"
          data-testid={`database-templates-editor-${templateKey}`}
        >
          <p className="database-templates-editor__pane-label">模板源码</p>
          <CodeEditor
            mode={editorMode}
            height={editorHeight}
            value={templateValue}
            onChange={(value: string) => handleTemplateTextChange(value)}
          />
        </div>

        <div
          className="database-templates-editor__pane"
          data-testid="database-templates-preview"
        >
          <p className="database-templates-editor__pane-label">渲染预览</p>
          <p className="database-templates-editor__pane-hint">
            样例：T_SAMPLE / EMAIL 等；切换方言或模板类型后自动刷新
          </p>
          {previewLoading ? (
            <div
              className="database-templates-editor__preview-loading"
              data-testid="database-templates-preview-loading"
            >
              正在渲染预览…
            </div>
          ) : null}
          {previewError ? (
            <div
              className="database-templates-editor__preview-error"
              data-testid="database-templates-preview-error"
            >
              {previewError}
            </div>
          ) : null}
          <div data-testid="database-templates-preview-sql">
            <CodeEditor
              mode={editorMode}
              height={editorHeight}
              readOnly
              value={previewLoading && !previewSql ? '' : previewSql}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DatabaseTemplatesEditor);
