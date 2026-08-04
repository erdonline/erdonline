/**
 * 落库失败时的本地草稿（localStorage，按 projectId 隔离）。
 * ADR-0022 切片 7：诚实持久化 — 失败态不得仅留内存。
 */

const DRAFT_KEY_PREFIX = 'erd:project-draft:';

export type ProjectLocalDraft = {
  projectId: string;
  projectJSON: unknown;
  /** 写入草稿时 project.updateTime（乐观锁 CAS） */
  updateTime?: string;
  /** 草稿写入时刻（ISO） */
  savedAt: string;
  /** 最近一次成功从服务器加载时的 updateTime */
  serverUpdateTime?: string;
};

export function draftStorageKey(projectId: string): string {
  return `${DRAFT_KEY_PREFIX}${projectId}`;
}

function stableProjectJson(projectJSON: unknown): string {
  try {
    return JSON.stringify(projectJSON ?? null);
  } catch {
    return '';
  }
}

/** 草稿 projectJSON 与服务器模型是否不同 */
export function draftDiffersFromServer(
  draft: ProjectLocalDraft | null | undefined,
  serverProject: { projectJSON?: unknown } | null | undefined,
): boolean {
  if (!draft?.projectJSON) {
    return false;
  }
  return stableProjectJson(draft.projectJSON) !== stableProjectJson(serverProject?.projectJSON);
}

export function readProjectDraft(projectId: string | null | undefined): ProjectLocalDraft | null {
  if (!projectId) {
    return null;
  }
  try {
    const raw =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(draftStorageKey(projectId))
        : null;
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ProjectLocalDraft;
    if (!parsed?.projectId || parsed.projectJSON === undefined) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeProjectDraft(
  project: {
    id?: string;
    projectJSON?: unknown;
    updateTime?: string;
  } | null | undefined,
  serverUpdateTime?: string,
): ProjectLocalDraft | null {
  const projectId = project?.id;
  if (!projectId || !project?.projectJSON) {
    return null;
  }
  const draft: ProjectLocalDraft = {
    projectId,
    projectJSON: JSON.parse(JSON.stringify(project.projectJSON)),
    updateTime: project.updateTime,
    savedAt: new Date().toISOString(),
    serverUpdateTime,
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(draftStorageKey(projectId), JSON.stringify(draft));
    }
  } catch {
    // quota / private mode — 尽力而为
  }
  return draft;
}

export function clearProjectDraft(projectId: string | null | undefined): void {
  if (!projectId) {
    return;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(draftStorageKey(projectId));
    }
  } catch {
    // ignore
  }
}

/** 有草稿且与服务器模型不同 → 可恢复 */
export function hasRecoverableDraft(
  projectId: string | null | undefined,
  serverProject: { projectJSON?: unknown } | null | undefined,
): boolean {
  const draft = readProjectDraft(projectId);
  return draftDiffersFromServer(draft, serverProject);
}
