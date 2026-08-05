import React from 'react';
import {Button} from 'antd';
import {history, useIntl} from '@umijs/max';
import ErdEmptyDiagram from '@/components/ErdEmptyDiagram';

type ShareEmptyStateProps = {
  /** 一句话主标题，如「该模块暂无表」 */
  message: string;
};

/**
 * 分享只读空态（ADR-0016）：ER 剪影 + 主标题 + 一句 hint + 唯一主 CTA。
 * 与设计器画布空态同视觉语言（--erd-* + ErdEmptyDiagram）；禁第二实心钮抢焦点。
 */
const ShareEmptyState: React.FC<ShareEmptyStateProps> = ({message}) => {
  const intl = useIntl();
  return (
    <div className="share-page__empty" data-testid="share-empty-module">
      <ErdEmptyDiagram size="compact" />
      <h2 className="share-page__empty-title">{message}</h2>
      <p className="share-page__empty-hint">{intl.formatMessage({ id: 'share.empty.hint' })}</p>
      <Button
        type="primary"
        onClick={() => history.push('/demo')}
        aria-label={intl.formatMessage({ id: 'exception.cta.openDemo' })}
        data-testid="share-empty-demo-cta"
      >
        {intl.formatMessage({ id: 'exception.cta.openDemo' })}
      </Button>
    </div>
  );
};

export default ShareEmptyState;
