import { useEffect } from 'react';
import useGlobalStore from '@/store/global/globalStore';
import useProjectStore from '@/store/project/useProjectStore';
import { writeProjectDraft } from '@/utils/projectLocalDraft';

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

      writeProjectDraft(project, project.updateTime as string | undefined);

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [projectId]);
}
