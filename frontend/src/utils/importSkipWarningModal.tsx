import React from 'react';
import { Modal } from 'antd';

/**
 * 导入跳过/冲突提示（Modal.warning）
 * — keyboard Esc；autoFocusButton=ok 首焦「知道了」；focusTriggerAfterClose 归还触发器
 */
export function showImportSkipWarning(messages: string[]): void {
  Modal.warning({
    title: '重要提示',
    keyboard: true,
    autoFocusButton: 'ok',
    focusTriggerAfterClose: true,
    okText: '知道了',
    content: (
      <>
        {messages.map((m) => (
          <p key={m}>{m}</p>
        ))}
      </>
    ),
  });
}
