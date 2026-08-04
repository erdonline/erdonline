import useGlobalStore from '@/store/global/globalStore';
import { retryAutosave } from '@/store/project/useProjectStore';
import React from 'react';
import shallow from 'zustand/shallow';
import './index.less';

/** DesignLayout 顶栏：模型自动落盘状态（保存中 / 已落盘 / 保存失败可点重试） */
const SaveStatus: React.FC = () => {
  const { saved, saving } = useGlobalStore(
    (s) => ({ saved: s.saved, saving: s.saving }),
    shallow,
  );

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
        aria-label="自动保存失败，点击重试"
        title="改动仍在本地，点击重试保存到服务器"
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
