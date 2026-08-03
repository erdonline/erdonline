import React from 'react';
import { Modal } from 'antd';
import CodeEditor from '@/components/CodeEditor';

export type ShowSqlDetailModalOptions = {
  sql: string;
  width?: number | string;
  editorHeight?: string;
};

/**
 * 审批 / 工单 SQL 明细（Modal.info）
 * — keyboard Esc；autoFocusButton=ok 首焦「知道了」；focusTriggerAfterClose 归还触发器
 */
export function showSqlDetailModal({
  sql,
  width,
  editorHeight,
}: ShowSqlDetailModalOptions): void {
  Modal.info({
    title: 'SQL明细',
    width,
    keyboard: true,
    autoFocusButton: 'ok',
    focusTriggerAfterClose: true,
    okText: '知道了',
    content: (
      <CodeEditor mode="mysql" height={editorHeight} value={sql} />
    ),
  });
}
