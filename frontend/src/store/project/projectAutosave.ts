import { message } from 'antd';
import * as Save from '@/utils/save';
import useGlobalStore from '@/store/global/globalStore';
import useProjectStore from '@/store/project/useProjectStore';
import { storeFmt } from '@/store/storeIntl';
import {
  handleSaveResponseSideEffects,
  isProjectSaveConflict,
  type SaveProjectResponse,
} from '@/utils/projectSaveConflict';
import { clearProjectDraft, writeProjectDraft } from '@/utils/projectLocalDraft';

/**
 * 自动保存 / 手动落盘共用防抖序号，避免模态「先 Save 再写 store」与 debounce 互踩。
 */

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
/** 手动 persistProjectNow / ackManualPersist 世代 */
let autosaveSeq = 0;
/** debounced autosave 回调世代（与 autosaveSeq 分离，避免 schedule 踩掉进行中的手动落盘） */
let debounceSeq = 0;
/** persist 成功后的 store 回写会触发 subscribe；吞掉一次 echo autosave */
let suppressProjectAutosaveEcho = 0;

export function markProjectPersistEchoSuppress(): void {
  suppressProjectAutosaveEcho += 1;
}

export function consumeProjectAutosaveEcho(): boolean {
  if (suppressProjectAutosaveEcho <= 0) {
    return false;
  }
  suppressProjectAutosaveEcho -= 1;
  return true;
}

type ProjectLike = {
  type?: number;
  id?: string;
  updateTime?: string;
  [key: string]: unknown;
};

function patchProjectRevision(next: Record<string, unknown>): void {
  useProjectStore.setState({ project: next });
}

export function getAutosaveSeq(): number {
  return autosaveSeq;
}

/** 取消待发防抖并推进序号（手动落盘 / 顶栏重试前调用） */
export function preemptAutosave(): number {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  return ++autosaveSeq;
}

/** store 已写入且与刚成功的 Save 一致：吞掉 subscribe 触发的二次 debounce */
export function ackManualPersist(ok: boolean): void {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  ++autosaveSeq;
  useGlobalStore.getState().dispatch.setSaving(false);
  useGlobalStore.getState().dispatch.setSaved(ok);
  if (ok) {
    useGlobalStore.getState().dispatch.setSaveConflict(false);
    clearProjectDraft(useProjectStore.getState().project?.id as string | undefined);
  }
}

export function scheduleDebouncedPersist(
  run: (seq: number) => void | Promise<void>,
  delayMs = 600,
): void {
  useGlobalStore.getState().dispatch.setSaved(false);
  useGlobalStore.getState().dispatch.setSaving(true);
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }
  const seq = ++debounceSeq;
  autosaveTimer = setTimeout(() => {
    void run(seq);
  }, delayMs);
}

export function isAutosaveCurrent(seq: number): boolean {
  return seq === autosaveSeq;
}

export function isDebouncePersistCurrent(seq: number): boolean {
  return seq === debounceSeq;
}

/** debounced 回调或 preempt 手动/顶栏重试：任一序号仍有效即继续落盘 */
export function isPersistAutosaveCurrent(seq: number): boolean {
  return isDebouncePersistCurrent(seq) || isAutosaveCurrent(seq);
}

/** 立即 Save；仅 code===200 为 true；409 弹可行动冲突 Modal */
export async function persistProjectNow(
  project: ProjectLike | null | undefined,
  fallbackMsg = storeFmt('store.common.saveFailed'),
): Promise<boolean> {
  if (!project || JSON.stringify(project) === '{}') {
    message.error(storeFmt('store.common.projectNotOpen'));
    return false;
  }
  const seq = preemptAutosave();
  useGlobalStore.getState().dispatch.setSaving(true);
  try {
    const res = (await Save.saveProject({
      ...project,
      type: project?.type ?? 1,
    })) as SaveProjectResponse;
    if (isProjectSaveConflict(res)) {
      if (isAutosaveCurrent(seq)) {
        handleSaveResponseSideEffects(
          project as Record<string, unknown>,
          res,
          patchProjectRevision,
        );
      }
      return false;
    }
    if (res?.code === 200) {
      markProjectPersistEchoSuppress();
      handleSaveResponseSideEffects(
        project as Record<string, unknown>,
        res,
        patchProjectRevision,
      );
      if (!isAutosaveCurrent(seq)) {
        useGlobalStore.getState().dispatch.setSaving(false);
        return false;
      }
      clearProjectDraft(project.id);
      useGlobalStore.getState().dispatch.setSaved(true);
      useGlobalStore.getState().dispatch.setSaving(false);
      return true;
    }
    if (!isAutosaveCurrent(seq)) {
      return false;
    }
    useGlobalStore.getState().dispatch.setSaving(false);
    useGlobalStore.getState().dispatch.setSaved(false);
    writeProjectDraft(project, project.updateTime);
    if (!res?.msg && !res?.message) {
      message.error(fallbackMsg);
    }
    return false;
  } catch {
    if (!isAutosaveCurrent(seq)) {
      return false;
    }
    useGlobalStore.getState().dispatch.setSaving(false);
    useGlobalStore.getState().dispatch.setSaved(false);
    writeProjectDraft(project, project.updateTime);
    // HTTP/网络：errorHandler 已 toast
    return false;
  }
}
