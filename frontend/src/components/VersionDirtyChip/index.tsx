import useVersionStore from '@/store/version/useVersionStore';
import {
  resolveVersionDirtyState,
  versionDirtyCopy,
} from '@/utils/versionDirtyStatus';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';
import { history } from '@@/core/history';
import React from 'react';
import shallow from 'zustand/shallow';
import './index.less';

/**
 * 设计器顶栏 A 层 dirty chip：工作区 ↔ 最新版本基线（ADR-0022）。
 * 与 SaveStatus（落盘/autosave）语义分离，不重复反馈。
 */
const VersionDirtyChip: React.FC = () => {
  const { baselineLoaded, versionBaseline, changes, versionDispatch } = useVersionStore(
    (s) => ({
      baselineLoaded: s.baselineLoaded,
      versionBaseline: s.versionBaseline,
      changes: s.changes,
      versionDispatch: s.dispatch,
    }),
    shallow,
  );

  const dirtyState = resolveVersionDirtyState({
    baselineLoaded,
    versionBaseline,
    changes,
  });
  const copy = versionDirtyCopy(dirtyState, changes);

  const goVersionPage = (openSave = false) => {
    const projectId =
      cache.getItem(CONSTANT.PROJECT_ID) ||
      new URLSearchParams(window.location.search).get('projectId') ||
      '';
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    history.push(`/design/table/version/all${q}${openSave ? '#save' : ''}`);
  };

  const handleClick = () => {
    if (dirtyState === 'unknown') {
      versionDispatch.fetchVersionBaseline();
      return;
    }
    goVersionPage(copy.openSaveFlow);
  };

  return (
    <button
      type="button"
      className={`erd-version-dirty-chip erd-version-dirty-chip--${copy.tone}`}
      data-testid={copy.testId}
      aria-live="polite"
      aria-label={`版本状态：${copy.label}`}
      title={copy.title}
      onClick={handleClick}
    >
      {copy.label}
    </button>
  );
};

export default VersionDirtyChip;
