import React from 'react';
import { Modal } from 'antd';
import { getIntl } from '@umijs/max';

/**
 * 导入跳过/冲突提示（Modal.warning）
 * — keyboard Esc；autoFocusButton=ok 首焦「知道了」；focusTriggerAfterClose 归还触发器
 */
export function showImportSkipWarning(messages: string[]): void {
  Modal.warning({
    title: getIntl().formatMessage({ id: 'utils.importSkip.title' }),
    keyboard: true,
    autoFocusButton: 'ok',
    focusTriggerAfterClose: true,
    okText: getIntl().formatMessage({ id: 'utils.modal.gotIt' }),
    content: (
      <>
        {messages.map((m) => (
          <p key={m}>{m}</p>
        ))}
      </>
    ),
  });
}
