import React from 'react';
import { Modal, message } from 'antd';
import { getIntl } from '@umijs/max';
import useGlobalStore from '@/store/global/globalStore';
import useProjectStore from '@/store/project/useProjectStore';
import {
  clearProjectDraft,
  draftDiffersFromServer,
  readProjectDraft,
  type ProjectLocalDraft,
} from '@/utils/projectLocalDraft';

let recoveryModalOpen = false;

function formatDraftTime(savedAt: string): string {
  try {
    const d = new Date(savedAt);
    if (Number.isNaN(d.getTime())) {
      return savedAt;
    }
    return d.toLocaleString();
  } catch {
    return savedAt;
  }
}

function applyDraftToStore(draft: ProjectLocalDraft, serverProject: Record<string, unknown>): void {
  useProjectStore.setState((state: { project: Record<string, unknown> }) => {
    state.project = {
      ...serverProject,
      projectJSON: JSON.parse(JSON.stringify(draft.projectJSON)),
      updateTime: draft.updateTime ?? serverProject.updateTime,
    };
  });
  useGlobalStore.getState().dispatch.setSaved(false);
  useGlobalStore.getState().dispatch.setSaving(false);
  useGlobalStore.getState().dispatch.setSaveConflict(false);
}

/** 再次进入设计器：草稿比服务器新/不同 → 恢复或丢弃 */
export function offerProjectDraftRecovery(
  projectId: string,
  serverProject: Record<string, unknown>,
): void {
  if (recoveryModalOpen) {
    return;
  }
  const draft = readProjectDraft(projectId);
  if (!draft || !draftDiffersFromServer(draft, serverProject)) {
    if (draft && !draftDiffersFromServer(draft, serverProject)) {
      clearProjectDraft(projectId);
    }
    return;
  }

  recoveryModalOpen = true;
  const draftMessage = getIntl().formatMessage(
    { id: 'utils.draftRecovery.content' },
    { savedAt: formatDraftTime(draft.savedAt) },
  );
  Modal.confirm({
    title: getIntl().formatMessage({ id: 'utils.draftRecovery.title' }),
    content: React.createElement(
      'span',
      { 'data-testid': 'project-draft-recovery-content' },
      draftMessage,
    ),
    okText: getIntl().formatMessage({ id: 'utils.draftRecovery.restore' }),
    cancelText: getIntl().formatMessage({ id: 'utils.draftRecovery.discard' }),
    closable: false,
    maskClosable: false,
    okButtonProps: { 'data-testid': 'project-draft-recovery-restore' } as React.ComponentProps<'button'>,
    cancelButtonProps: { 'data-testid': 'project-draft-recovery-discard' } as React.ComponentProps<'button'>,
    onOk: () => {
      recoveryModalOpen = false;
      applyDraftToStore(draft, serverProject);
      message.info(getIntl().formatMessage({ id: 'utils.draftRecovery.restored' }));
    },
    onCancel: () => {
      recoveryModalOpen = false;
      clearProjectDraft(projectId);
      message.info(getIntl().formatMessage({ id: 'utils.draftRecovery.discarded' }));
    },
  });
}
