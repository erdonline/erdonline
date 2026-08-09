import useGlobalStore from '@/store/global/globalStore';
import { retryAutosave } from '@/store/project/useProjectStore';
import { showProjectSaveConflictModal } from '@/components/dialog/project/ProjectSaveConflictModal';
import useVersionStore from '@/store/version/useVersionStore';
import {
  resolveVersionDirtyState,
  versionDirtyCopy,
} from '@/utils/versionDirtyStatus';
import { hasBaseline } from '@/utils/versionBaseline';
import { intlFormat } from '@/utils/messageFormat';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';
import { useSchemaProbe } from '@/hooks/useSchemaProbe';
import { history, useIntl } from '@umijs/max';
import React, { useEffect, useRef } from 'react';
import shallow from 'zustand/shallow';
import { Tooltip } from 'antd';
import useProjectStore from '@/store/project/useProjectStore';

type DotTone = 'ok' | 'warn' | 'err' | 'idle';

type CapsuleProps = {
  testId: string;
  labelTestId?: string;
  label: string;
  dotTone: DotTone;
  title?: string;
  ariaLabel: string;
  interactive?: boolean;
  onClick?: () => void;
  extraAttrs?: Record<string, string>;
  legacyMirror?: React.ReactNode;
  children?: React.ReactNode;
};

const InstrumentCapsule: React.FC<CapsuleProps> = ({
  testId,
  labelTestId,
  label,
  dotTone,
  title,
  ariaLabel,
  interactive,
  onClick,
  extraAttrs,
  legacyMirror,
  children,
}) => {
  const className = [
    'erd-instrument__capsule',
    interactive ? 'erd-instrument__capsule--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <span className={`erd-instrument__dot erd-instrument__dot--${dotTone}`} aria-hidden="true" />
      <span className="erd-instrument__label" data-testid={labelTestId}>
        {label}
      </span>
      {children}
      {legacyMirror}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={className}
        data-testid={testId}
        title={title}
        aria-label={ariaLabel}
        aria-live="polite"
        onClick={onClick}
        {...(extraAttrs ?? {})}
      >
        {body}
      </button>
    );
  }

  return (
    <span
      className={className}
      data-testid={testId}
      role="status"
      title={title}
      aria-label={ariaLabel}
      aria-live="polite"
      {...(extraAttrs ?? {})}
    >
      {body}
    </span>
  );
};

function resolveProjectId(): string {
  return (
    cache.getItem(CONSTANT.PROJECT_ID) ||
    new URLSearchParams(window.location.search).get('projectId') ||
    ''
  );
}

/** DesignLayout 顶栏状态仪表：autosave / version / live DB 三胶囊（ADR-0022 语义分离） */
const StatusInstrument: React.FC = () => {
  const intl = useIntl();
  const format = intlFormat(intl);

  const { saved, saving, saveConflict } = useGlobalStore(
    (s) => ({ saved: s.saved, saving: s.saving, saveConflict: s.saveConflict }),
    shallow,
  );

  const { baselineLoaded, versionBaseline, changes, workspaceDiffError, versionDispatch } = useVersionStore(
    (s) => ({
      baselineLoaded: s.baselineLoaded,
      versionBaseline: s.versionBaseline,
      changes: s.changes,
      workspaceDiffError: s.workspaceDiffError,
      versionDispatch: s.dispatch,
    }),
    shallow,
  );

  const projectId =
    useProjectStore((s) => s.project?.id) || resolveProjectId();
  const projectJsonReady = Boolean(useProjectStore((s) => s.project?.projectJSON));
  const probe = useSchemaProbe();

  /** A/B 层水合：先拉数据源进 version.dbs，再拉版本基线（禁空 dbs 假「无 JDBC」） */
  const hydratedProjectRef = useRef<string | null>(null);
  useEffect(() => {
    if (!projectId || !projectJsonReady) return;
    if (hydratedProjectRef.current === projectId) return;
    hydratedProjectRef.current = projectId;
    let cancelled = false;
    void (async () => {
      try {
        await useProjectStore.getState().dispatch.refreshDataSources();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('StatusInstrument: refreshDataSources failed', e);
      }
      if (cancelled) return;
      await versionDispatch.fetchVersionBaseline();
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, projectJsonReady, versionDispatch]);

  const dirtyState = resolveVersionDirtyState({
    baselineLoaded,
    versionBaseline,
    changes,
    workspaceDiffError,
  });
  const versionCopy = versionDirtyCopy(dirtyState, changes, format);

  const goVersionPage = (openSave = false) => {
    const id = resolveProjectId();
    const q = id ? `?projectId=${encodeURIComponent(id)}` : '';
    history.push(`/design/table/version/all${q}${openSave ? '#save' : ''}`);
  };

  const handleVersionClick = () => {
    if (dirtyState === 'unknown') {
      void versionDispatch.fetchVersionBaseline();
      return;
    }
    goVersionPage(versionCopy.openSaveFlow);
  };

  const syncedLabel = saveConflict
    ? intl.formatMessage({ id: 'designer.instrument.conflict' })
    : saving
      ? intl.formatMessage({ id: 'designer.instrument.saving' })
      : saved
        ? intl.formatMessage({ id: 'designer.instrument.synced' })
        : intl.formatMessage({ id: 'designer.instrument.error' });

  const syncedDot: DotTone = saveConflict ? 'warn' : saving ? 'idle' : saved ? 'ok' : 'err';
  const syncedInteractive = saveConflict || (!saving && !saved);
  const syncedTitle = saveConflict
    ? intl.formatMessage({ id: 'designer.saveStatus.conflictTitle' })
    : !saving && !saved
      ? intl.formatMessage({ id: 'designer.saveStatus.failedTitle' })
      : intl.formatMessage({ id: 'designer.saveStatus.autoSaveTitle' });
  const syncedAria = saveConflict
    ? syncedLabel
    : !saving && !saved
      ? intl.formatMessage({ id: 'designer.instrument.errorAria' })
      : intl.formatMessage({ id: 'designer.instrument.syncedAria' }, { label: syncedLabel });

  const handleSyncedClick = () => {
    if (saveConflict) {
      showProjectSaveConflictModal();
      return;
    }
    if (!saving && !saved) {
      retryAutosave();
    }
  };

  const versionLabel =
    dirtyState === 'clean' && hasBaseline(versionBaseline) && versionBaseline?.version
      ? intl.formatMessage(
          { id: 'designer.instrument.version.clean' },
          { version: versionBaseline.version },
        )
      : dirtyState === 'dirty'
        ? intl.formatMessage({ id: 'designer.instrument.version.dirty' })
        : dirtyState === 'no-baseline'
          ? intl.formatMessage({ id: 'designer.instrument.version.noBaseline' })
          : intl.formatMessage({ id: 'designer.instrument.version.unknown' });

  const versionDot: DotTone =
    versionCopy.tone === 'unknown' || versionCopy.tone === 'warn'
      ? 'idle'
      : versionCopy.tone === 'clean'
        ? 'ok'
        : 'warn';

  // B 层：未探测/未知一律「DB ·」；有 JDBC 时进页自动探一次水合（ADR-0022）
  const dbLabel = probe.loading
    ? intl.formatMessage({ id: 'designer.instrument.db.probing' })
    : probe.status === 'SYNCED'
      ? intl.formatMessage({ id: 'designer.instrument.db.synced' })
      : probe.status === 'AHEAD' || probe.status === 'BEHIND' || probe.status === 'DIVERGED'
        ? intl.formatMessage({ id: 'designer.instrument.db.mismatch' })
        : intl.formatMessage({ id: 'designer.instrument.db.unknown' });

  const dbDot: DotTone =
    probe.loading || probe.status === 'UNKNOWN'
      ? 'idle'
      : probe.status === 'SYNCED'
        ? 'ok'
        : 'warn';

  const handleDbClick = () => {
    if (probe.loading) return;
    if (probe.isUnknown && probe.unknownCopy) {
      probe.handleUnknownCta();
      return;
    }
    if (!probe.probeDisabled) {
      void probe.runProbe();
    }
  };

  // 未知态可点（选数据源 / 触发探测）；已有结果也可再点重探
  const dbInteractive =
    probe.probeAllowed && !probe.loading && (probe.isUnknown || !probe.probeDisabled);

  return (
    <div className="erd-instrument" data-testid="status-instrument">
      <InstrumentCapsule
        testId="instrument-synced"
        labelTestId="save-status"
        label={syncedLabel}
        dotTone={syncedDot}
        title={syncedTitle}
        ariaLabel={syncedAria}
        interactive={syncedInteractive}
        onClick={syncedInteractive ? handleSyncedClick : undefined}
      />
      <InstrumentCapsule
        testId="instrument-version"
        labelTestId={versionCopy.testId}
        label={versionLabel}
        dotTone={versionDot}
        title={versionCopy.title}
        ariaLabel={intl.formatMessage(
          { id: 'designer.instrument.versionAria' },
          { label: versionLabel },
        )}
        interactive
        onClick={handleVersionClick}
      />
      {probe.probeAllowed ? (
        <Tooltip title={probe.statusTooltip}>
          <InstrumentCapsule
            testId="instrument-db"
            label={dbLabel}
            dotTone={dbDot}
            title={probe.statusTooltip}
            ariaLabel={intl.formatMessage({ id: 'designer.instrument.dbAria' }, { label: dbLabel })}
            interactive={dbInteractive}
            onClick={dbInteractive ? handleDbClick : undefined}
            extraAttrs={{
              'data-probe-status': probe.status,
              'data-probe-reason': probe.displayResult.reason ?? '',
            }}
            legacyMirror={
              <>
                <span
                  data-testid="schema-probe-control"
                  className="schema-probe-control schema-probe-control--chrome"
                  hidden
                  aria-hidden="true"
                />
                <span
                  data-testid="schema-probe-status"
                  data-probe-status={probe.status}
                  data-probe-reason={probe.displayResult.reason ?? ''}
                  hidden
                  aria-hidden="true"
                />
                <span data-testid="schema-probe-btn" hidden aria-hidden="true" />
              </>
            }
          >
            {probe.isUnknown && probe.unknownCopy ? (
              <span
                className="erd-instrument__hidden-hint"
                data-testid="schema-probe-unknown-hint"
                aria-hidden="true"
                hidden
              >
                {probe.unknownCopy.title}
              </span>
            ) : null}
          </InstrumentCapsule>
        </Tooltip>
      ) : null}
    </div>
  );
};

export default StatusInstrument;
