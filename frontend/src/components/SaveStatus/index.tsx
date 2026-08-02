import useGlobalStore from '@/store/global/globalStore';
import React from 'react';
import shallow from 'zustand/shallow';
import './index.less';

/** DesignLayout 顶栏：模型自动保存状态（保存中 / 已保存 / 未保存） */
const SaveStatus: React.FC = () => {
  const { saved, saving } = useGlobalStore(
    (s) => ({ saved: s.saved, saving: s.saving }),
    shallow,
  );
  const label = saving ? '保存中…' : saved ? '已保存' : '未保存';
  const tone = saving ? 'saving' : saved ? 'saved' : 'dirty';
  return (
    <span
      className={`erd-save-status erd-save-status--${tone}`}
      data-testid="save-status"
      aria-label={`自动保存：${label}`}
      title="模型变更会自动保存到服务器"
    >
      {label}
    </span>
  );
};

export default SaveStatus;
