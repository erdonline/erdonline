import { useEffect } from 'react';
import useGlobalStore from '@/store/global/globalStore';
import useProjectStore from '@/store/project/useProjectStore';
import { draftDiffersFromServer, readProjectDraft, writeProjectDraft } from '@/utils/projectLocalDraft';

/**
 * 脏态 / 落库失败离开页面前：同步写本地草稿 + 浏览器原生离开确认。
 */
export function useProjectDraftGuard(projectId: string): void {
  useEffect(() => {
    if (!projectId) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const { saved, saving, needSave, saveConflict } = useGlobalStore.getState();
      const project = useProjectStore.getState().project;
      const shouldWarn =
        needSave &&
        !saveConflict &&
        !saving &&
        !saved &&
        project?.id &&
        project?.projectJSON;

      if (!shouldWarn) {
        return;
      }

      // 落库失败时 draft 已含 next 快照，store 未 apply — 勿用 stale store 覆盖
      const existing = readProjectDraft(project.id as string);
      if (
        existing
        && draftDiffersFromServer(existing, { projectJSON: project.projectJSON })
      ) {
        return;
      }

      writeProjectDraft(project, project.updateTime as string | undefined);

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [projectId]);
}
