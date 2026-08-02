import React from 'react';
import {Button, Typography} from 'antd';
import {history} from '@umijs/max';
import ErdEmptyDiagram from '@/components/ErdEmptyDiagram';

type ShareEmptyStateProps = {
  /** 一句话引导，如「该模块暂无表」 */
  message: string;
};

/**
 * 分享只读空态（ADR-0016）：ER 剪影 + 一句引导 + 激活漏斗主 CTA。
 * 与 AuthBrandShell / 设计器空态同视觉语言（--erd-* + ErdEmptyDiagram）。
 */
const ShareEmptyState: React.FC<ShareEmptyStateProps> = ({message}) => (
  <div className="share-page__empty" data-testid="share-empty-module">
    <ErdEmptyDiagram size="compact" />
    <Typography.Paragraph className="share-page__empty-msg">{message}</Typography.Paragraph>
    <Button type="primary" onClick={() => history.push('/demo')} aria-label="打开示例 demo">
      打开示例 demo
    </Button>
  </div>
);

export default ShareEmptyState;
