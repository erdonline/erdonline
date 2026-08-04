import { message } from 'antd';
import { history } from '@@/core/history';
import * as Save from '@/utils/save';
import useGlobalStore from '@/store/global/globalStore';
import useProjectStore from '@/store/project/useProjectStore';
import { clearProjectDraft } from '@/utils/projectLocalDraft';
import { showProjectSaveConflictModal } from '@/components/dialog/project/ProjectSaveConflictModal';

export { showProjectSaveConflictModal };

/** 与后端 ApiErrorCode.PROJECT_SAVE_CONFLICT 对齐 */
export const PROJECT_SAVE_CONFLICT_CODE = 409;

export type SaveProjectResponse = {
  code?: number;
  msg?: string;
  message?: string;
  data?: { updateTime?: string; saved?: boolean } | boolean;
};

export function isProjectSaveConflict(res: SaveProjectResponse | null | undefined): boolean {
  return res?.code === PROJECT_SAVE_CONFLICT_CODE;
}

/** 成功落库后把服务端新 updateTime 写回 project，供下次 CAS */
export function mergeSaveRevision<T extends Record<string, unknown>>(
  project: T,
  res: SaveProjectResponse,
): T {
  const data = res?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return project;
  }
  const updateTime = (data as { updateTime?: string }).updateTime;
  if (!updateTime) {
    return project;
  }
  return { ...project, updateTime };
}

export async function reloadProjectFromServer(): Promise<void> {
  const projectId = useProjectStore.getState().project?.id as string | undefined;
  if (!projectId) {
    message.error('未打开项目');
    return;
  }
  clearProjectDraft(projectId);
  await useProjectStore.getState().fetch(projectId);
  useGlobalStore.getState().dispatch.setSaveConflict(false);
  useGlobalStore.getState().dispatch.setSaved(true);
  useGlobalStore.getState().dispatch.setSaving(false);
  message.info('已加载服务器上的最新项目');
}

export async function forkLocalProjectAsCopy(): Promise<void> {
  const project = useProjectStore.getState().project as Record<string, unknown> | undefined;
  if (!project?.projectJSON) {
    message.error('没有可另存的本地模型');
    return;
  }
  const baseName =
    typeof project.projectName === 'string' && project.projectName.trim()
      ? project.projectName.trim()
      : '未命名项目';
  try {
    const res = (await Save.addProject({
      projectName: `${baseName} (副本)`,
      description: project.description,
      tags: project.tags,
      projectJSON: project.projectJSON,
      configJSON: project.configJSON,
    })) as { code?: number; data?: string; msg?: string };
    if (res?.code !== 200 || !res.data) {
      message.error(res?.msg || '另存为新项目失败');
      return;
    }
    useGlobalStore.getState().dispatch.setSaveConflict(false);
    message.success('已另存为新项目');
    history.push(`/design/table/relation?projectId=${encodeURIComponent(res.data)}`);
  } catch {
    message.error('另存为新项目失败');
  }
}

export function handleSaveResponseSideEffects(
  project: Record<string, unknown>,
  res: SaveProjectResponse,
  patchProject: (next: Record<string, unknown>) => void,
): boolean {
  if (isProjectSaveConflict(res)) {
    showProjectSaveConflictModal();
    return false;
  }
  if (res?.code === 200) {
    patchProject(mergeSaveRevision(project, res));
    clearProjectDraft(project.id as string | undefined);
    useGlobalStore.getState().dispatch.setSaveConflict(false);
    return true;
  }
  return false;
}
