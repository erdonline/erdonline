import React, {useEffect, useState} from 'react';
import {Helmet, Link, useIntl} from '@umijs/max';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import {useLocalePath} from '@/hooks/useLocalePath';
import * as cache from '@/utils/cache';
import {APP_VERSION_LABEL} from '@/constants/appVersion';
import {docsUrl} from '@/utils/docsUrl';

const GITHUB_URL = 'https://github.com/erdonline/erdonline';
const ISSUES_URL = 'https://github.com/erdonline/erdonline/issues';

const focusSkipTarget = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus({preventScroll: false});
  el.scrollIntoView({block: 'nearest'});
};

export type LandingChromeProps = {
  children: React.ReactNode;
  /** 子页用相对顶栏；落地首页仍绝对叠在 hero 上 */
  variant?: 'hero' | 'subpage';
  testId?: string;
  /** Skip 目标地标 id；catalog 等子页指向主内容区 */
  skipTargetId?: string;
  /** 顶栏当前高亮项 */
  activeNav?: 'catalog' | 'compare';
};

const LandingChrome: React.FC<LandingChromeProps> = ({
  children,
  variant = 'hero',
  testId = 'landing-page',
  skipTargetId = 'landing-main-cta',
  activeNav,
}) => {
  const intl = useIntl();
  const {lp, basePath} = useLocalePath();
  const [authed, setAuthed] = useState(false);
  const docsHomeUrl = docsUrl(intl.locale);
  const roadmapUrl = docsUrl(intl.locale, 'docs/roadmap');

  useEffect(() => {
    setAuthed(Boolean(cache.getItem('Authorization')));
  }, []);

  const resolvedActiveNav =
    activeNav ??
    (basePath.startsWith('/catalog') ? 'catalog' : undefined) ??
    (basePath.startsWith('/compare') ? 'compare' : undefined);

  return (
    <div
      className={`landing${variant === 'subpage' ? ' landing--subpage' : ''}`}
      data-testid={testId}
    >
      <Helmet>
        <link
          rel="stylesheet"
          href="https://fonts.bunny.net/css?family=ibm-plex-sans:400,500,600,700|ibm-plex-mono:400,500&display=swap"
        />
      </Helmet>
      <nav
        className="erd-skip-nav visuallyHidden"
        aria-label={intl.formatMessage({id: 'common.skipNav'})}
        data-testid="landing-skip-nav"
      />
      <header className="landingNav">
        <div className="landingNavInner">
          <a
            href={`#${skipTargetId}`}
            className="erd-skip-link"
            data-testid="landing-skip-cta"
            onClick={(e) => {
              e.preventDefault();
              focusSkipTarget(skipTargetId);
            }}
          >
            {skipTargetId === 'landing-main-cta'
              ? intl.formatMessage({ id: 'common.skipMainAction' })
              : intl.formatMessage({ id: 'homeLayout.skip.main' })}
          </a>
          <a
            className="landingNavBrand landingBrand"
            href={lp('/')}
            aria-label={intl.formatMessage({ id: 'landing.nav.brandAria' })}
          >
            <img src="/logo.svg?v=20260828a" alt="" width={22} height={22} />
            ERD Online
          </a>
          <nav
            className="landingNavLinks"
            aria-label={intl.formatMessage({ id: 'landing.nav.mainAria' })}
          >
          <a
            href={`${lp('/')}#pillars`}
            data-testid="landing-nav-pillars"
            aria-label={intl.formatMessage({ id: 'landing.nav.pillarsAria' })}
          >
            {intl.formatMessage({ id: 'landing.nav.pillars' })}
          </a>
          <Link
            to={lp('/catalog')}
            className={resolvedActiveNav === 'catalog' ? 'landingNavLinkActive' : undefined}
            data-testid="landing-nav-catalog"
            aria-current={resolvedActiveNav === 'catalog' ? 'page' : undefined}
          >
            {intl.formatMessage({ id: 'landing.nav.catalog' })}
          </Link>
          <Link
            to={lp('/compare')}
            className={resolvedActiveNav === 'compare' ? 'landingNavLinkActive' : undefined}
            data-testid="landing-nav-compare"
            aria-current={resolvedActiveNav === 'compare' ? 'page' : undefined}
          >
            {intl.formatMessage({ id: 'landing.nav.compare' })}
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            data-testid="landing-nav-github"
            aria-label={intl.formatMessage({ id: 'landing.nav.githubAria' })}
          >
            {intl.formatMessage({ id: 'landing.nav.github' })}
          </a>
          <LocaleSwitcher variant="chrome" className="landingNavLocale" />
          {authed ? (
            <Link
              className="landingBtnPrimary landingNavCta"
              to="/home"
              data-testid="landing-nav-cta"
              aria-label={intl.formatMessage({ id: 'landing.nav.enterWorkspaceAria' })}
            >
              {intl.formatMessage({ id: 'landing.nav.enterWorkspace' })}
            </Link>
          ) : (
            <Link
              className="landingBtnPrimary landingNavCta"
              to="/login"
              data-testid="landing-nav-cta"
              aria-label={intl.formatMessage({ id: 'landing.nav.loginAria' })}
            >
              {intl.formatMessage({ id: 'landing.nav.login' })}
            </Link>
          )}
          </nav>
        </div>
      </header>

      {children}

      <footer className="landingFooter">
        <span className="landingBrand">ERD Online · MIT · {APP_VERSION_LABEL}</span>
        <nav aria-label={intl.formatMessage({ id: 'landing.footer.navAria' })}>
          <Link to={lp('/demo')}>{intl.formatMessage({ id: 'landing.footer.demo' })}</Link>
          <a href={docsHomeUrl} target="_blank" rel="noreferrer">
            {intl.formatMessage({ id: 'landing.footer.docs' })}
          </a>
          <a href={roadmapUrl} target="_blank" rel="noreferrer">
            {intl.formatMessage({ id: 'landing.footer.roadmap' })}
          </a>
          <Link to={lp('/compare')}>{intl.formatMessage({ id: 'landing.footer.compare' })}</Link>
          <Link to={lp('/catalog')}>{intl.formatMessage({ id: 'landing.footer.catalog' })}</Link>
          <a href={ISSUES_URL} target="_blank" rel="noreferrer">
            {intl.formatMessage({ id: 'landing.footer.community' })}
          </a>
          {authed ? (
            <Link to="/home">{intl.formatMessage({ id: 'landing.nav.enterWorkspace' })}</Link>
          ) : (
            <Link to="/login">{intl.formatMessage({ id: 'landing.nav.login' })}</Link>
          )}
        </nav>
      </footer>
    </div>
  );
};

export {GITHUB_URL, ISSUES_URL};
export default LandingChrome;
