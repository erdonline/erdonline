import useGlobalStore from '@/store/global/globalStore';
import { retryAutosave } from '@/store/project/useProjectStore';
import { showProjectSaveConflictModal } from '@/utils/projectSaveConflict';
import React from 'react';
import shallow from 'zustand/shallow';
import './index.less';

/** DesignLayout 顶栏：模型自动落盘状态（保存中 / 已落盘 / 保存失败可点重试） */
const SaveStatus: React.FC = () => {
  const { saved, saving, saveConflict } = useGlobalStore(
    (s) => ({ saved: s.saved, saving: s.saving, saveConflict: s.saveConflict }),
    shallow,
  );

  if (saveConflict) {
    return (
      <button
        type="button"
        className="erd-save-status erd-save-status--dirty erd-save-status--retry"
        data-testid="save-status"
        aria-live="polite"
        aria-label="保存冲突，点击查看选项"
        title="项目已被他人更新，点击查看刷新或另存选项"
        onClick={() => showProjectSaveConflictModal()}
      >
        保存冲突，点击查看选项
      </button>
    );
  }

  const failed = !saving && !saved;
  const label = saving ? '保存中…' : saved ? '已落盘' : '保存失败，点击重试';
  const tone = saving ? 'saving' : saved ? 'saved' : 'dirty';
  const className = `erd-save-status erd-save-status--${tone}${
    failed ? ' erd-save-status--retry' : ''
  }`;

  if (failed) {
    return (
      <button
        type="button"
        className={className}
        data-testid="save-status"
        aria-live="polite"
        aria-label="自动保存失败，改动已存本地，点击重试"
        title="改动已保存到本地，点击重试同步到服务器"
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
      aria-label={`自动保存：${label}`}
      title="模型变更会自动保存到服务器"
    >
      {label}
    </span>
  );
};

export default SaveStatus;
