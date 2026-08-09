import React, {useEffect, useState} from 'react';
import {Helmet, Link, useIntl} from '@umijs/max';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import * as cache from '@/utils/cache';
import {APP_VERSION_LABEL} from '@/constants/appVersion';

const GITHUB_URL = 'https://github.com/erdonline/erdonline';
const ISSUES_URL = 'https://github.com/erdonline/erdonline/issues';
const DOCS_URL = 'https://erdonline.github.io/erdonline/';
const ROADMAP_URL = `${DOCS_URL}docs/roadmap`;

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
};

const LandingChrome: React.FC<LandingChromeProps> = ({
  children,
  variant = 'hero',
  testId = 'landing-page',
}) => {
  const intl = useIntl();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(cache.getItem('Authorization')));
  }, []);

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
        className="erd-skip-nav"
        aria-label={intl.formatMessage({id: 'common.skipNav'})}
        data-testid="landing-skip-nav"
      >
        <a
          href="#landing-main-cta"
          className="erd-skip-link"
          data-testid="landing-skip-cta"
          onClick={(e) => {
            e.preventDefault();
            focusSkipTarget('landing-main-cta');
          }}
        >
          {intl.formatMessage({ id: 'common.skipMainAction' })}
        </a>
      </nav>
      <header className="landingNav">
        <a
          className="landingNavBrand landingBrand"
          href="/"
          aria-label={intl.formatMessage({ id: 'landing.nav.brandAria' })}
        >
          <img src="/logo.svg" alt="" width={28} height={28} />
          ERD Online
        </a>
        <nav
          className="landingNavLinks"
          aria-label={intl.formatMessage({ id: 'landing.nav.mainAria' })}
        >
          <a href="/#pillars">{intl.formatMessage({ id: 'landing.nav.pillars' })}</a>
          <Link
            to="/catalog"
            data-testid="landing-nav-catalog"
            aria-label={intl.formatMessage({ id: 'landing.nav.catalogAria' })}
          >
            {intl.formatMessage({ id: 'landing.nav.catalog' })}
          </Link>
          <Link
            to="/compare"
            aria-label={intl.formatMessage({ id: 'landing.nav.compareAria' })}
          >
            {intl.formatMessage({ id: 'landing.nav.compare' })}
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <LocaleSwitcher variant="chrome" className="landingNavLocale" />
          {authed ? (
            <Link
              className="landingBtnGhost landingNavCta"
              to="/home"
              aria-label={intl.formatMessage({ id: 'landing.nav.enterWorkspaceAria' })}
            >
              {intl.formatMessage({ id: 'landing.nav.enterWorkspace' })}
            </Link>
          ) : (
            <Link
              className="landingBtnGhost landingNavCta"
              to="/login"
              aria-label={intl.formatMessage({ id: 'landing.nav.loginAria' })}
            >
              {intl.formatMessage({ id: 'landing.nav.login' })}
            </Link>
          )}
        </nav>
      </header>

      {children}

      <footer className="landingFooter">
        <span className="landingBrand">ERD Online · MIT · {APP_VERSION_LABEL}</span>
        <nav aria-label={intl.formatMessage({ id: 'landing.footer.navAria' })}>
          <a href={DOCS_URL} target="_blank" rel="noreferrer">
            {intl.formatMessage({ id: 'landing.footer.docs' })}
          </a>
          <a href={ROADMAP_URL} target="_blank" rel="noreferrer">
            {intl.formatMessage({ id: 'landing.footer.roadmap' })}
          </a>
          <Link to="/compare">{intl.formatMessage({ id: 'landing.footer.compare' })}</Link>
          <Link to="/catalog">{intl.formatMessage({ id: 'landing.footer.catalog' })}</Link>
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

export {DOCS_URL, GITHUB_URL, ISSUES_URL, ROADMAP_URL};
export default LandingChrome;
