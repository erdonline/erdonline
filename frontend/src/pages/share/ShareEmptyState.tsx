import React from 'react';
import {Button} from 'antd';
import {history} from '@umijs/max';
import ErdEmptyDiagram from '@/components/ErdEmptyDiagram';

type ShareEmptyStateProps = {
  /** 一句话主标题，如「该模块暂无表」 */
  message: string;
};

/**
 * 分享只读空态（ADR-0016）：ER 剪影 + 主标题 + 一句 hint + 唯一主 CTA。
 * 与设计器画布空态同视觉语言（--erd-* + ErdEmptyDiagram）；禁第二实心钮抢焦点。
 */
const ShareEmptyState: React.FC<ShareEmptyStateProps> = ({message}) => (
  <div className="share-page__empty" data-testid="share-empty-module">
    <ErdEmptyDiagram size="compact" />
    <h2 className="share-page__empty-title">{message}</h2>
    <p className="share-page__empty-hint">打开示例可立即体验关系图建模</p>
    <Button type="primary" onClick={() => history.push('/demo')} aria-label="打开示例 demo">
      打开示例 demo
    </Button>
  </div>
);

export default ShareEmptyState;
