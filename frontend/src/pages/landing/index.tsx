import React, {useEffect, useState} from 'react';
import {Link, useIntl} from '@umijs/max';
import * as cache from '@/utils/cache';
import LandingChrome, {DOCS_URL} from './LandingChrome';
import './index.less';

const LandingPage: React.FC = () => {
  const intl = useIntl();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(cache.getItem('Authorization')));
  }, []);

  const t = (id: string) => intl.formatMessage({ id });

  return (
    <LandingChrome variant="hero" testId="landing-page">
      <section className="landingHero" aria-label={t('landing.hero.aria')}>
        <div className="landingHeroVisual">
          <img
            src="/landing-hero.jpg"
            alt={t('landing.hero.imageAlt')}
            width={1600}
            height={1000}
            // React 17 DOM: camelCase fetchPriority leaks a warning; use lowercase attr
            {...{fetchpriority: 'high' as const}}
          />
          <div className="landingHeroScrim" aria-hidden="true" />
        </div>
        <div className="landingHeroInner">
          <p className="landingHeroBrand landingBrand">ERD Online</p>
          <h1 className="landingHeroTitle">{t('landing.hero.title')}</h1>
          <p className="landingHeroLead">{t('landing.hero.lead')}</p>
          <div
            className="landingCtas"
            id="landing-main-cta"
            tabIndex={-1}
            data-testid="landing-main-cta"
          >
            {authed ? (
              <>
                <Link
                  className="landingBtnPrimary"
                  to="/home"
                  aria-label={t('landing.hero.cta.enterWorkspaceAria')}
                >
                  {t('landing.hero.cta.enterWorkspace')}
                </Link>
                <Link
                  className="landingBtnGhost"
                  to="/demo"
                  aria-label={t('landing.hero.cta.openDemoAria')}
                >
                  {t('landing.hero.cta.openDemo')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  className="landingBtnPrimary"
                  to="/demo"
                  aria-label={t('landing.hero.cta.tryOnlineAria')}
                >
                  {t('landing.hero.cta.tryOnline')}
                </Link>
                <Link
                  className="landingBtnGhost"
                  to="/register"
                  aria-label={t('landing.hero.cta.registerAria')}
                >
                  {t('landing.hero.cta.register')}
                </Link>
                <Link
                  className="landingBtnText"
                  to="/login"
                  aria-label={t('landing.hero.cta.loginExistingAria')}
                >
                  {t('landing.hero.cta.loginExisting')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="landingSection" id="pillars" aria-labelledby="pillars-title">
        <h2 id="pillars-title">{t('landing.pillars.title')}</h2>
        <p className="landingSectionLead">{t('landing.pillars.lead')}</p>
        <div className="landingPillars">
          <article className="landingPillar">
            <span className="landingPillarMark" aria-hidden="true" />
            <h3>{t('landing.pillars.version.title')}</h3>
            <p>{t('landing.pillars.version.body')}</p>
          </article>
          <article className="landingPillar">
            <span className="landingPillarMark" aria-hidden="true" />
            <h3>{t('landing.pillars.collab.title')}</h3>
            <p>{t('landing.pillars.collab.body')}</p>
          </article>
          <article className="landingPillar">
            <span className="landingPillarMark" aria-hidden="true" />
            <h3>{t('landing.pillars.open.title')}</h3>
            <p>{t('landing.pillars.open.body')}</p>
          </article>
        </div>
      </section>

      <section className="landingBand">
        <div className="landingSection" id="demo" aria-labelledby="demo-title">
          <h2 id="demo-title">{t('landing.demo.title')}</h2>
          <p className="landingSectionLead">{t('landing.demo.lead')}</p>
          <div className="landingCtas">
            <Link
              className="landingBtnPrimary"
              to="/demo"
              aria-label={t('landing.hero.cta.openDemoAria')}
            >
              {t('landing.hero.cta.openDemo')}
            </Link>
            <a
              className="landingBtnGhost"
              href={`${DOCS_URL}`}
              target="_blank"
              rel="noreferrer"
              aria-label={t('landing.demo.cta.selfHostAria')}
            >
              {t('landing.demo.cta.selfHost')}
            </a>
          </div>
        </div>
      </section>

      <section className="landingSection" id="compare" aria-labelledby="compare-title">
        <h2 id="compare-title">{t('landing.compare.title')}</h2>
        <p className="landingSectionLead">{t('landing.compare.lead')}</p>
        <table className="landingCompare">
          <thead>
            <tr>
              <th scope="col">{t('landing.compare.col.capability')}</th>
              <th scope="col">{t('landing.compare.col.erd')}</th>
              <th scope="col">{t('landing.compare.col.dbdiagram')}</th>
              <th scope="col">{t('landing.compare.col.dbml')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('landing.compare.row.collab')}</td>
              <td className="landingYes">{t('landing.compare.cell.yes')}</td>
              <td className="landingNo">{t('landing.compare.cell.noWeak')}</td>
              <td className="landingNo">{t('landing.compare.cell.varies')}</td>
            </tr>
            <tr>
              <td>{t('landing.compare.row.version')}</td>
              <td className="landingYes">{t('landing.compare.cell.yes')}</td>
              <td className="landingNo">{t('landing.compare.cell.weak')}</td>
              <td className="landingNo">{t('landing.compare.cell.gitExternal')}</td>
            </tr>
            <tr>
              <td>{t('landing.compare.row.opensource')}</td>
              <td className="landingYes">{t('landing.compare.cell.mit')}</td>
              <td className="landingNo">{t('landing.compare.cell.closedSaas')}</td>
              <td className="landingYes">{t('landing.compare.cell.formatOpen')}</td>
            </tr>
            <tr>
              <td>{t('landing.compare.row.agent')}</td>
              <td className="landingYes">{t('landing.compare.cell.roadmap')}</td>
              <td className="landingNo">{t('landing.compare.cell.no')}</td>
              <td className="landingNo">{t('landing.compare.cell.textOnly')}</td>
            </tr>
          </tbody>
        </table>
        <div className="landingCtas landingCompareMore">
          <Link
            className="landingBtnGhost"
            to="/compare"
            aria-label={t('landing.compare.cta.fullAria')}
          >
            {t('landing.compare.cta.full')}
          </Link>
        </div>
      </section>
    </LandingChrome>
  );
};

export default LandingPage;
