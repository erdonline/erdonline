import { message } from 'antd';
import * as Save from '@/utils/save';
import useGlobalStore from '@/store/global/globalStore';

/**
 * 自动保存 / 手动落盘共用防抖序号，避免模态「先 Save 再写 store」与 debounce 互踩。
 */

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let autosaveSeq = 0;

type ProjectLike = {
  type?: number;
  [key: string]: unknown;
};

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
  const seq = ++autosaveSeq;
  autosaveTimer = setTimeout(() => {
    void run(seq);
  }, delayMs);
}

export function isAutosaveCurrent(seq: number): boolean {
  return seq === autosaveSeq;
}

/** 立即 Save；仅 code===200 为 true；业务失败靠 request toast，无 msg 时用 fallback */
export async function persistProjectNow(
  project: ProjectLike | null | undefined,
  fallbackMsg = '保存失败',
): Promise<boolean> {
  if (!project || JSON.stringify(project) === '{}') {
    message.error('未打开项目');
    return false;
  }
  const seq = preemptAutosave();
  useGlobalStore.getState().dispatch.setSaving(true);
  try {
    const res: { code?: number; msg?: string; message?: string } =
      await Save.saveProject({
        ...project,
        type: project?.type ?? 1,
      });
    if (!isAutosaveCurrent(seq)) {
      return false;
    }
    if (res?.code === 200) {
      useGlobalStore.getState().dispatch.setSaved(true);
      useGlobalStore.getState().dispatch.setSaving(false);
      return true;
    }
    useGlobalStore.getState().dispatch.setSaving(false);
    useGlobalStore.getState().dispatch.setSaved(false);
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
    // HTTP/网络：errorHandler 已 toast
    return false;
  }
}
