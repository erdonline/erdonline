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
import React from 'react';
import shallow from 'zustand/shallow';
import { Tooltip } from 'antd';

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

/** DesignLayout 顶栏 M2 状态仪表：autosave / version / live DB 三胶囊（ADR-0022 语义分离） */
const StatusInstrument: React.FC = () => {
  const intl = useIntl();
  const format = intlFormat(intl);

  const { saved, saving, saveConflict } = useGlobalStore(
    (s) => ({ saved: s.saved, saving: s.saving, saveConflict: s.saveConflict }),
    shallow,
  );

  const { baselineLoaded, versionBaseline, changes, versionDispatch } = useVersionStore(
    (s) => ({
      baselineLoaded: s.baselineLoaded,
      versionBaseline: s.versionBaseline,
      changes: s.changes,
      versionDispatch: s.dispatch,
    }),
    shallow,
  );

  const probe = useSchemaProbe();

  const dirtyState = resolveVersionDirtyState({
    baselineLoaded,
    versionBaseline,
    changes,
  });
  const versionCopy = versionDirtyCopy(dirtyState, changes, format);

  const goVersionPage = (openSave = false) => {
    const projectId =
      cache.getItem(CONSTANT.PROJECT_ID) ||
      new URLSearchParams(window.location.search).get('projectId') ||
      '';
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    history.push(`/design/table/version/all${q}${openSave ? '#save' : ''}`);
  };

  const handleVersionClick = () => {
    if (dirtyState === 'unknown') {
      versionDispatch.fetchVersionBaseline();
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

  const dbLabel = probe.loading
    ? intl.formatMessage({ id: 'designer.instrument.db.probing' })
    : probe.status === 'SYNCED'
      ? intl.formatMessage({ id: 'designer.instrument.db.synced' })
      : probe.status === 'AHEAD' || probe.status === 'BEHIND' || probe.status === 'DIVERGED'
        ? intl.formatMessage({ id: 'designer.instrument.db.mismatch' })
        : intl.formatMessage({ id: 'designer.instrument.db' });

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

  const dbInteractive =
    probe.probeAllowed && (probe.isUnknown ? Boolean(probe.unknownCopy) : !probe.probeDisabled);

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
