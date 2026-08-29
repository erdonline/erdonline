import React, {useEffect, useState} from 'react';
import {Link, useIntl} from '@umijs/max';
import * as cache from '@/utils/cache';
import {usePageSeo} from '@/hooks/usePageSeo';
import {useLocalePath} from '@/hooks/useLocalePath';
import {track} from '@/utils/analytics';
import {docsUrl} from '@/utils/docsUrl';
import LandingChrome from './LandingChrome';
import './index.less';

const LandingPage: React.FC = () => {
  const intl = useIntl();
  const {lp} = useLocalePath();
  const [authed, setAuthed] = useState(false);
  usePageSeo('landing.seo.title', 'landing.seo.description');

  useEffect(() => {
    setAuthed(Boolean(cache.getItem('Authorization')));
    track('landing_view');
  }, []);

  const t = (id: string) => intl.formatMessage({ id });

  return (
    <LandingChrome variant="hero" testId="landing-page">
      <section className="landingHero" aria-label={t('landing.hero.aria')}>
        <div className="landingHeroAtmosphere" aria-hidden="true">
          <div className="landingHeroGrid" />
          <div className="landingHeroGlow" />
        </div>
        <div className="landingHeroStage">
          <div className="landingHeroCopy">
            <p className="landingHeroKicker">
              <span className="landingHeroKickerDot" aria-hidden="true" />
              {t('landing.hero.kicker')}
            </p>
            <p className="landingHeroBrand landingBrand">ERD Online</p>
            <h1 className="landingHeroTitle">{t('landing.hero.title')}</h1>
            <p className="landingHeroLead">{t('landing.hero.lead')}</p>
            <div
              className="landingCtas"
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
                    to={lp('/demo')}
                    aria-label={t('landing.hero.cta.openDemoAria')}
                  >
                    {t('landing.hero.cta.openDemo')}
                  </Link>
                  <Link
                    className="landingBtnGhost"
                    to={lp('/catalog')}
                    data-testid="landing-hero-catalog"
                    aria-label={t('landing.hero.cta.browseCatalogAria')}
                  >
                    {t('landing.hero.cta.browseCatalog')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    className="landingBtnPrimary"
                    to={lp('/demo')}
                    aria-label={t('landing.hero.cta.tryOnlineAria')}
                  >
                    {t('landing.hero.cta.tryOnline')}
                  </Link>
                  <Link
                    className="landingBtnGhost"
                    to={lp('/catalog')}
                    data-testid="landing-hero-catalog"
                    aria-label={t('landing.hero.cta.browseCatalogAria')}
                  >
                    {t('landing.hero.cta.browseCatalog')}
                  </Link>
                </>
              )}
            </div>
          </div>
          <img
            className="landingHeroShot"
            src="/landing-hero.webp"
            alt=""
            width={960}
            height={600}
            loading="eager"
            decoding="async"
            fetchpriority="high"
          />
        </div>
      </section>

      <section className="landingSection" id="pillars" aria-labelledby="pillars-title">
        <div className="landingSectionHead">
          <p className="landingSectionKicker">{t('landing.pillars.kicker')}</p>
          <h2 id="pillars-title" className="landingSectionTitle">
            {t('landing.pillars.title')}
          </h2>
          <p className="landingSectionLead">{t('landing.pillars.lead')}</p>
        </div>
        <div className="landingPillars" role="list">
          <article className="landingPillar" role="listitem">
            <span className="landingPillarIndex" aria-hidden="true">01</span>
            <span className="landingPillarMark" aria-hidden="true" />
            <h3>{t('landing.pillar.mcp.title')}</h3>
            <p>{t('landing.pillar.mcp.body')}</p>
            <Link
              className="landingPillarLink"
              to={lp('/compare')}
              aria-label={t('landing.pillar.mcp.linkAria')}
            >
              {t('landing.pillar.mcp.link')}
            </Link>
          </article>
          <article className="landingPillar" role="listitem">
            <span className="landingPillarIndex" aria-hidden="true">02</span>
            <span className="landingPillarMark" aria-hidden="true" />
            <h3>{t('landing.pillar.version.title')}</h3>
            <p>{t('landing.pillar.version.body')}</p>
            <Link
              className="landingPillarLink"
              to={lp('/compare')}
              aria-label={t('landing.pillar.version.linkAria')}
            >
              {t('landing.pillar.version.link')}
            </Link>
          </article>
          <article className="landingPillar" role="listitem">
            <span className="landingPillarIndex" aria-hidden="true">03</span>
            <span className="landingPillarMark" aria-hidden="true" />
            <h3>{t('landing.pillar.collab.title')}</h3>
            <p>{t('landing.pillar.collab.body')}</p>
            <Link
              className="landingPillarLink"
              to={lp('/compare')}
              aria-label={t('landing.pillar.collab.linkAria')}
            >
              {t('landing.pillar.collab.link')}
            </Link>
          </article>
        </div>
      </section>

      <section className="landingBand" aria-labelledby="compare-teaser-title">
        <div className="landingSection">
          <h2 id="compare-teaser-title">{t('landing.compareTeaser.title')}</h2>
          <p className="landingSectionLead">{t('landing.compareTeaser.lead')}</p>
          <div className="landingCtas">
            <Link
              className="landingBtnPrimary"
              to={lp('/compare')}
              aria-label={t('landing.compare.cta.primaryAria')}
            >
              {t('landing.compare.cta.primary')}
            </Link>
            <Link
              className="landingBtnGhost"
              to={lp('/compare')}
              aria-label={t('landing.compare.cta.fullAria')}
            >
              {t('landing.compare.cta.full')}
            </Link>
          </div>
        </div>
      </section>
    </LandingChrome>
  );
};

export default LandingPage;
