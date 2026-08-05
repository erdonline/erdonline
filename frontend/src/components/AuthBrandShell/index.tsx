import React from 'react';
import {Typography} from 'antd';
import {useIntl} from '@umijs/max';
import ErdEmptyDiagram from '@/components/ErdEmptyDiagram';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import './index.less';

type AuthBrandShellProps = {
  /** 表单区标题，如「登录」「注册」 */
  title: string;
  /** 表单区副文案 */
  subtitle?: string;
  /** 表单与底部链接 */
  children: React.ReactNode;
  /** 表单下方文字链 */
  footer?: React.ReactNode;
  /** Skip 链文案；默认「跳到表单」；404/403/分享失效门用「跳到主操作」 */
  skipLabel?: string;
  /** Skip 落地锚点；默认表单区；门面 CTA 栈指 `exception-main-cta` */
  skipTargetId?: string;
};

const focusSkipTarget = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus({preventScroll: false});
  el.scrollIntoView({block: 'nearest'});
};

/**
 * 登录/注册品牌壳（W5）：左 40% 暗色品牌面板 + 右 Form。
 * 颜色只认 --erd-*；禁止 bg2 / #1677FF 硬编码。
 */
const AuthBrandShell: React.FC<AuthBrandShellProps> = ({
  title,
  subtitle,
  children,
  footer,
  skipLabel,
  skipTargetId = 'auth-form-anchor',
}) => {
  const intl = useIntl();
  const resolvedSubtitle =
    subtitle ?? intl.formatMessage({ id: 'auth.subtitle.default' });
  const resolvedSkipLabel =
    skipLabel ?? intl.formatMessage({ id: 'auth.skip.default' });
  return (
    <div className="auth-shell" data-testid="auth-brand-shell">
      <div className="auth-shell__locale">
        <LocaleSwitcher variant="auth" />
      </div>
      <nav
        className="erd-skip-nav"
        aria-label={intl.formatMessage({id: 'common.skipNav'})}
        data-testid="auth-skip-nav"
      >
        <a
          href={`#${skipTargetId}`}
          className="erd-skip-link"
          data-testid="auth-skip-form"
          onClick={(e) => {
            e.preventDefault();
            focusSkipTarget(skipTargetId);
          }}
        >
          {resolvedSkipLabel}
        </a>
      </nav>
      <aside
        className="auth-shell__brand"
        data-testid="auth-brand-panel"
        aria-label={intl.formatMessage({ id: 'auth.brand.panelAria' })}
      >
        <a
          className="auth-shell__brand-logo"
          href="/"
          aria-label={intl.formatMessage({ id: 'auth.brand.homeAria' })}
        >
          <img src="/logo.svg" alt="" width={36} height={36} />
          <span className="auth-shell__brand-name">ERD Online</span>
        </a>
        <Typography.Title level={2} className="auth-shell__brand-title">
          {intl.formatMessage({ id: 'auth.brand.title' })}
        </Typography.Title>
        <Typography.Paragraph className="auth-shell__brand-lead">
          {intl.formatMessage({ id: 'auth.brand.lead' })}
        </Typography.Paragraph>
        <div className="auth-shell__brand-thumb" aria-hidden="true">
          <ErdEmptyDiagram size="hero" />
        </div>
        <a
          className="auth-shell__brand-cta"
          href="/demo"
          aria-label={intl.formatMessage({ id: 'auth.brand.demoAria' })}
        >
          {intl.formatMessage({ id: 'auth.brand.cta' })}
        </a>
      </aside>

      <main className="auth-shell__form" data-testid="auth-form-panel">
        <div
          className="auth-shell__form-inner"
          id="auth-form-anchor"
          tabIndex={-1}
          data-testid="auth-form-anchor"
        >
          <div className="auth-shell__form-header" data-testid="auth-form-header">
            <img src="/logo.svg" alt="ERD Online" width={48} height={48} />
            <Typography.Title level={3} className="auth-shell__form-title">
              {title}
            </Typography.Title>
            <Typography.Paragraph type="secondary" className="auth-shell__form-desc">
              {resolvedSubtitle}
            </Typography.Paragraph>
          </div>
          {children}
          {footer ? <div className="auth-shell__form-links">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
};

export default AuthBrandShell;
