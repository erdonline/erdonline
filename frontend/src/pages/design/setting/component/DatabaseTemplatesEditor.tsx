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
import { useIntl } from '@@/exports';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import CodeEditor from '@/components/CodeEditor';
import {
  fetchDdlTemplateSources,
  fetchPreviewDdlTemplate,
} from '@/utils/ddlExportApi';
import {
  DDL_TEMPLATE_KEYS,
  type DdlTemplateKey,
  buildPreviewDatabaseRow,
  buildSaveDatabaseDialectPayload,
  editorModeForDialect,
  findDatabaseDialectRow,
  hasStoredTemplate,
  listDdlTemplateDialectCodes,
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
  const intl = useIntl();
  const { projectDispatch, projectJSON, database } = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      projectJSON: state.project?.projectJSON as Record<string, unknown> | undefined,
      database: (state.project?.projectJSON?.dataTypeDomains?.database ||
        []) as DatabaseRow[],
    }),
    shallow,
  );

  const dialectCodes = useMemo(
    () => listDdlTemplateDialectCodes(database),
    [database],
  );

  const [selectedCode, setSelectedCode] = useState<string | undefined>(() => {
    const defaultRow = findDatabaseDialectRow(
      database,
      database.find((d) => d.defaultDatabase)?.code,
    );
    return defaultRow?.code ?? dialectCodes[0];
  });
  const [templateKey, setTemplateKey] = useState<DdlTemplateKey>('createTableTemplate');
  const [metaDraft, setMetaDraft] = useState<{
    defaultDatabase?: boolean;
    fileShow?: boolean;
  }>({ fileShow: true });
  const [templateOverrides, setTemplateOverrides] = useState<
    Partial<Record<DdlTemplateKey, string>>
  >({});
  const [seedSources, setSeedSources] = useState<
    Partial<Record<DdlTemplateKey, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [previewSql, setPreviewSql] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewSeqRef = useRef(0);

  const activeCode = selectedCode ?? dialectCodes[0];
  const storedInProject = useMemo(
    () => findDatabaseDialectRow(database, activeCode),
    [database, activeCode],
  );

  const editorHeight = compact ? EDITOR_HEIGHT_COMPACT : EDITOR_HEIGHT_FULL;

  useEffect(() => {
    if (!activeCode) {
      return;
    }
    const stillValid = activeCode != null && dialectCodes.includes(activeCode);
    if (!stillValid && dialectCodes[0]) {
      setSelectedCode(dialectCodes[0]);
    }
  }, [dialectCodes, activeCode]);

  useEffect(() => {
    setTemplateOverrides({});
    setMetaDraft({
      defaultDatabase: storedInProject?.defaultDatabase,
      fileShow: storedInProject?.fileShow ?? true,
    });
  }, [activeCode, storedInProject]);

  useEffect(() => {
    if (!activeCode) {
      setSeedSources({});
      return;
    }
    let cancelled = false;
    void fetchDdlTemplateSources({ dialectCode: activeCode })
      .then((sources) => {
        if (!cancelled) {
          setSeedSources(sources);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSeedSources({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeCode]);

  const handleDialectChange = (code: string) => {
    setSelectedCode(code);
  };

  const handleMetaChange = (patch: Partial<{ defaultDatabase?: boolean; fileShow?: boolean }>) => {
    setMetaDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleTemplateTextChange = (value: string) => {
    setTemplateOverrides((prev) => ({ ...prev, [templateKey]: value }));
  };

  const previewRow = useMemo(
    () =>
      activeCode
        ? buildPreviewDatabaseRow({
            code: activeCode,
            stored: storedInProject ?? undefined,
            overrides: templateOverrides,
            meta: metaDraft,
          })
        : null,
    [activeCode, storedInProject, templateOverrides, metaDraft],
  );

  const dirty = useMemo(() => {
    const storedDefault = !!storedInProject?.defaultDatabase;
    const draftDefault = !!metaDraft.defaultDatabase;
    const storedFileShow = storedInProject?.fileShow ?? true;
    const draftFileShow = metaDraft.fileShow ?? true;
    if (storedDefault !== draftDefault || storedFileShow !== draftFileShow) {
      return true;
    }
    for (const key of DDL_TEMPLATE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(templateOverrides, key)) {
        continue;
      }
      const next = String(templateOverrides[key] ?? '').trim();
      const prev = hasStoredTemplate(storedInProject, key)
        ? String(storedInProject![key]).trim()
        : '';
      if (next !== prev) {
        return true;
      }
    }
    return false;
  }, [storedInProject, metaDraft, templateOverrides]);

  const handleSave = async () => {
    if (!activeCode) {
      message.error(intl.formatMessage({ id: 'databaseTemplates.error.noDialect' }));
      return false;
    }
    setSubmitting(true);
    try {
      const payload = buildSaveDatabaseDialectPayload({
        code: activeCode,
        stored: storedInProject ?? undefined,
        overrides: templateOverrides,
        meta: metaDraft,
      });
      const ok = await projectDispatch.updateDatabaseDialect(
        activeCode,
        payload,
        { persist: true },
      );
      if (ok) {
        setTemplateOverrides({});
      }
      return ok;
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetDraft = () => {
    setTemplateOverrides({});
    setMetaDraft({
      defaultDatabase: storedInProject?.defaultDatabase,
      fileShow: storedInProject?.fileShow ?? true,
    });
    message.info(intl.formatMessage({ id: 'databaseTemplates.reset.done' }));
  };

  const hasOverride = Object.prototype.hasOwnProperty.call(templateOverrides, templateKey);
  const storedCustomValue = storedInProject?.[templateKey];
  const editorValue = hasOverride
    ? (templateOverrides[templateKey] ?? '')
    : (storedCustomValue ?? '');
  const seedPlaceholder = seedSources[templateKey] ?? '';
  const isSeedPlaceholder =
    !hasStoredTemplate(storedInProject, templateKey) &&
    !hasOverride &&
    seedPlaceholder.length > 0;

  const editorMode = editorModeForDialect(activeCode ?? 'MYSQL');

  const refreshPreview = useMemo(
    () =>
      _.debounce(
        async (
          dialectCode: string | undefined,
          key: DdlTemplateKey,
          row: Record<string, unknown> | null,
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
              databaseRow: row,
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
            setPreviewError(
              err instanceof Error
                ? err.message
                : intl.formatMessage({ id: 'databaseTemplates.preview.failed' }),
            );
          } finally {
            if (seq === previewSeqRef.current) {
              setPreviewLoading(false);
            }
          }
        },
        PREVIEW_DEBOUNCE_MS,
      ),
    [intl],
  );

  useEffect(() => {
    refreshPreview(activeCode, templateKey, previewRow, projectJSON);
    return () => {
      refreshPreview.cancel();
    };
  }, [
    activeCode,
    templateKey,
    previewRow,
    projectJSON,
    refreshPreview,
    editorValue,
  ]);

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
        label: intl.formatMessage({ id: `databaseTemplates.template.${key}` }),
      })),
    [intl],
  );

  const dialectSelectOptions = useMemo(
    () =>
      dialectCodes.map((code) => ({
        label: code,
        value: code,
      })),
    [dialectCodes],
  );

  if (dialectCodes.length === 0) {
    return (
      <div data-testid="database-templates-empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={intl.formatMessage({ id: 'databaseTemplates.empty.noDialect' })}
        />
      </div>
    );
  }

  return (
    <div
      className="database-templates-editor"
      data-testid="database-templates-editor"
      data-dialect-option-count={dialectCodes.length}
    >
      <p className="setting-common-page__hint" style={{ marginBottom: 0 }}>
        {intl.formatMessage({ id: 'databaseTemplates.editor.hint' })}
      </p>

      <div className="database-templates-editor__toolbar setting-common-page__toolbar">
        <Space wrap size={12}>
          <Select
            aria-label={intl.formatMessage({ id: 'databaseTemplates.dialect.aria' })}
            data-testid="database-templates-dialect"
            style={{ minWidth: 180 }}
            value={activeCode}
            getPopupContainer={(trigger) =>
              trigger.parentElement ?? document.body
            }
            options={dialectSelectOptions}
            onChange={handleDialectChange}
          />
          {!storedInProject ? (
            <span
              className="database-templates-editor__dialect-hint"
              data-testid="database-templates-dialect-new"
            >
              {intl.formatMessage({ id: 'databaseTemplates.dialect.firstSave' })}
            </span>
          ) : null}
          <Checkbox
            data-testid="database-templates-default-db"
            checked={!!metaDraft.defaultDatabase}
            onChange={(e) =>
              handleMetaChange({ defaultDatabase: e.target.checked })
            }
          >
            {intl.formatMessage({ id: 'databaseTemplates.meta.defaultDb' })}
          </Checkbox>
          <Checkbox
            data-testid="database-templates-file-show"
            checked={metaDraft.fileShow !== false}
            onChange={(e) => handleMetaChange({ fileShow: e.target.checked })}
          >
            {intl.formatMessage({ id: 'databaseTemplates.meta.fileShow' })}
          </Checkbox>
          <Button
            type="primary"
            size="small"
            aria-label={intl.formatMessage({ id: 'databaseTemplates.save.aria' })}
            data-testid="database-templates-save"
            loading={submitting}
            disabled={!dirty}
            onClick={() => {
              void handleSave();
            }}
          >
            {intl.formatMessage({ id: 'databaseTemplates.save' })}
          </Button>
          <Button
            size="small"
            aria-label={intl.formatMessage({ id: 'databaseTemplates.reset.aria' })}
            data-testid="database-templates-reset"
            disabled={!dirty}
            onClick={handleResetDraft}
          >
            {intl.formatMessage({ id: 'databaseTemplates.reset' })}
          </Button>
        </Space>
      </div>

      <Tabs
        aria-label={intl.formatMessage({ id: 'databaseTemplates.tabs.aria' })}
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
          <p className="database-templates-editor__pane-label">
            {intl.formatMessage({ id: 'databaseTemplates.pane.source' })}
            {isSeedPlaceholder ? (
              <span
                className="database-templates-editor__seed-badge"
                data-testid="database-templates-seed-badge"
              >
                {intl.formatMessage({ id: 'databaseTemplates.pane.seedBadge' })}
              </span>
            ) : null}
          </p>
          <div
            className={
              isSeedPlaceholder
                ? 'database-templates-editor__seed-placeholder'
                : undefined
            }
            data-testid="database-templates-source-editor"
          >
            <CodeEditor
              mode={editorMode}
              height={editorHeight}
              value={editorValue}
              placeholder={isSeedPlaceholder ? seedPlaceholder : undefined}
              onChange={(value: string) => handleTemplateTextChange(value)}
            />
          </div>
        </div>

        <div
          className="database-templates-editor__pane"
          data-testid="database-templates-preview"
        >
          <p className="database-templates-editor__pane-label">
            {intl.formatMessage({ id: 'databaseTemplates.pane.preview' })}
          </p>
          <p className="database-templates-editor__pane-hint">
            {intl.formatMessage({ id: 'databaseTemplates.pane.previewHint' })}
          </p>
          {previewLoading ? (
            <div
              className="database-templates-editor__preview-loading"
              data-testid="database-templates-preview-loading"
            >
              {intl.formatMessage({ id: 'databaseTemplates.preview.loading' })}
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
