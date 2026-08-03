import React from 'react';
import {Typography} from 'antd';
import ErdEmptyDiagram from '@/components/ErdEmptyDiagram';
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
  subtitle = '开源数据库建模：版本与协作，像 Git + Figma',
  children,
  footer,
  skipLabel = '跳到表单',
  skipTargetId = 'auth-form-anchor',
}) => {
  return (
    <div className="auth-shell" data-testid="auth-brand-shell">
      <nav className="erd-skip-nav" aria-label="跳过导航" data-testid="auth-skip-nav">
        <a
          href={`#${skipTargetId}`}
          className="erd-skip-link"
          data-testid="auth-skip-form"
          onClick={(e) => {
            e.preventDefault();
            focusSkipTarget(skipTargetId);
          }}
        >
          {skipLabel}
        </a>
      </nav>
      <aside className="auth-shell__brand" data-testid="auth-brand-panel" aria-label="产品介绍">
        <a className="auth-shell__brand-logo" href="/" aria-label="ERD Online 首页">
          <img src="/logo.svg" alt="" width={36} height={36} />
          <span className="auth-shell__brand-name">ERD Online</span>
        </a>
        <Typography.Title level={2} className="auth-shell__brand-title">
          数据库设计的 Git + Figma
        </Typography.Title>
        <Typography.Paragraph className="auth-shell__brand-lead">
          免登录打开示例模型，再决定是否注册。版本与协作是壁垒，画布体验是门面。
        </Typography.Paragraph>
        <div className="auth-shell__brand-thumb" aria-hidden="true">
          <ErdEmptyDiagram size="hero" />
        </div>
        <a className="auth-shell__brand-cta" href="/demo" aria-label="打开演示">
          打开演示
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
              {subtitle}
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
