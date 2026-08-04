import { Modal, message } from 'antd';
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
  Modal.confirm({
    title: '发现未同步的本地草稿',
    content: `上次保存到服务器失败，${formatDraftTime(draft.savedAt)} 的改动仍在本机。要恢复草稿继续编辑，还是丢弃草稿并使用服务器上的模型？`,
    okText: '恢复草稿',
    cancelText: '丢弃草稿',
    closable: false,
    maskClosable: false,
    onOk: () => {
      recoveryModalOpen = false;
      applyDraftToStore(draft, serverProject);
      message.info('已恢复本地草稿，请核对后重试保存');
    },
    onCancel: () => {
      recoveryModalOpen = false;
      clearProjectDraft(projectId);
      message.info('已丢弃本地草稿');
    },
  });
}
