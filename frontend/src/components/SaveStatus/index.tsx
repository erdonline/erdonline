import useGlobalStore from '@/store/global/globalStore';
import { retryAutosave } from '@/store/project/useProjectStore';
import { showProjectSaveConflictModal } from '@/components/dialog/project/ProjectSaveConflictModal';
import { useIntl } from '@umijs/max';
import React from 'react';
import shallow from 'zustand/shallow';
import './index.less';

/** DesignLayout 顶栏：模型自动落盘状态（保存中 / 已落盘 / 保存失败可点重试） */
const SaveStatus: React.FC = () => {
  const intl = useIntl();
  const { saved, saving, saveConflict } = useGlobalStore(
    (s) => ({ saved: s.saved, saving: s.saving, saveConflict: s.saveConflict }),
    shallow,
  );

  const chipTone = saving ? 'pending' : saved ? 'success' : 'warn';

  if (saveConflict) {
    const conflictLabel = intl.formatMessage({ id: 'designer.saveStatus.conflict' });
    return (
      <button
        type="button"
        className="erd-status-chip erd-status-chip--warn erd-status-chip--interactive"
        data-testid="save-status"
        aria-live="polite"
        aria-label={conflictLabel}
        title={intl.formatMessage({ id: 'designer.saveStatus.conflictTitle' })}
        onClick={() => showProjectSaveConflictModal()}
      >
        {conflictLabel}
      </button>
    );
  }

  const failed = !saving && !saved;
  const label = saving
    ? intl.formatMessage({ id: 'designer.saveStatus.saving' })
    : saved
      ? intl.formatMessage({ id: 'designer.saveStatus.saved' })
      : intl.formatMessage({ id: 'designer.saveStatus.failed' });
  const className = `erd-status-chip erd-status-chip--${chipTone}${
    failed ? ' erd-status-chip--interactive' : ''
  }`;

  if (failed) {
    return (
      <button
        type="button"
        className={className}
        data-testid="save-status"
        aria-live="polite"
        aria-label={intl.formatMessage({ id: 'designer.saveStatus.failedAria' })}
        title={intl.formatMessage({ id: 'designer.saveStatus.failedTitle' })}
        onClick={() => retryAutosave()}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      className={className}
      data-testid="save-status"
      role="status"
      aria-live="polite"
      aria-label={intl.formatMessage({ id: 'designer.saveStatus.autoSaveAria' }, { label })}
      title={intl.formatMessage({ id: 'designer.saveStatus.autoSaveTitle' })}
    >
      {label}
    </span>
  );
};

export default SaveStatus;
