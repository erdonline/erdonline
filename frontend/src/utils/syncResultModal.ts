import { Modal } from 'antd';
import type { ReactNode } from 'react';

export type ShowSyncResultModalOptions = {
  ok?: boolean;
  content?: ReactNode;
};

/**
 * 版本同步到数据源结果（Modal.success / Modal.warn）
 * — keyboard Esc；autoFocusButton=ok 首焦「知道了」；focusTriggerAfterClose 归还「同步」触发器
 */
export function showSyncResultModal({
  ok,
  content,
}: ShowSyncResultModalOptions): void {
  const common = {
    keyboard: true as const,
    autoFocusButton: 'ok' as const,
    focusTriggerAfterClose: true,
    okText: '知道了',
    content,
  };
  if (ok) {
    Modal.success({
      title: '同步成功',
      ...common,
    });
    return;
  }
  Modal.warn({
    title: '同步失败',
    ...common,
  });
}
