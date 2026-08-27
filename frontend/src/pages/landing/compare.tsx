import React from 'react';
import {Link, useIntl} from '@umijs/max';
import {usePageSeo} from '@/hooks/usePageSeo';
import {useLocalePath} from '@/hooks/useLocalePath';
import {docsUrl} from '@/utils/docsUrl';
import LandingChrome from './LandingChrome';
import './index.less';

/**
 * 诚实对照子页：外键语义 / 协作 / 版本 / 开放 / 自部署（含 draw.io）。
 * 极简画图够用时不必换；需要版本与开源事实源时再来（vision）。
 */
const ComparePage: React.FC = () => {
  const intl = useIntl();
  const {lp} = useLocalePath();
  const t = (id: string) => intl.formatMessage({ id });
  usePageSeo('landing.compare.seo.title', 'landing.compare.seo.description');

  return (
    <LandingChrome variant="subpage" testId="compare-page">
      <main className="landingComparePage">
        <section className="landingSection landingCompareHero" aria-labelledby="compare-page-title">
          <p className="landingCompareEyebrow landingBrand">ERD Online</p>
          <h1 id="compare-page-title">{t('landing.compare.title')}</h1>
          <p className="landingSectionLead">{t('landing.comparePage.lead')}</p>
        </section>

        <section className="landingSection" aria-labelledby="compare-table-title">
          <h2 id="compare-table-title" className="visuallyHidden">
            {t('landing.comparePage.tableAria')}
          </h2>
          <table className="landingCompare">
            <thead>
              <tr>
                <th scope="col">{t('landing.compare.col.capability')}</th>
                <th scope="col">{t('landing.compare.col.erd')}</th>
                <th scope="col">{t('landing.compare.col.drawio')}</th>
                <th scope="col">{t('landing.compare.col.dbdiagram')}</th>
                <th scope="col">{t('landing.compare.col.dbml')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t('landing.compare.row.fk')}</td>
                <td className="landingYes">{t('landing.compare.cell.fkNative')}</td>
                <td className="landingNo">{t('landing.compare.cell.linesNotFk')}</td>
                <td className="landingYes">{t('landing.compare.cell.native')}</td>
                <td className="landingYes">{t('landing.compare.cell.native')}</td>
              </tr>
              <tr>
                <td>{t('landing.compare.row.collab')}</td>
                <td className="landingYes">{t('landing.compare.cell.collabDetail')}</td>
                <td className="landingNo">{t('landing.compare.cell.canvasCollab')}</td>
                <td className="landingNo">{t('landing.compare.cell.noWeak')}</td>
                <td className="landingNo">{t('landing.compare.cell.variesEditor')}</td>
              </tr>
              <tr>
                <td>{t('landing.compare.row.version')}</td>
                <td className="landingYes">{t('landing.compare.cell.versionDetail')}</td>
                <td className="landingNo">{t('landing.compare.cell.gitExternal')}</td>
                <td className="landingNo">{t('landing.compare.cell.weak')}</td>
                <td className="landingNo">{t('landing.compare.cell.gitExternal')}</td>
              </tr>
              <tr>
                <td>{t('landing.compare.row.approval')}</td>
                <td className="landingYes">{t('landing.compare.cell.approvalDetail')}</td>
                <td className="landingNo">{t('landing.compare.cell.no')}</td>
                <td className="landingNo">{t('landing.compare.cell.no')}</td>
                <td className="landingNo">{t('landing.compare.cell.no')}</td>
              </tr>
              <tr>
                <td>{t('landing.compare.row.share')}</td>
                <td className="landingYes">{t('landing.compare.cell.shareErd')}</td>
                <td className="landingYes">{t('landing.compare.cell.sharePublic')}</td>
                <td className="landingYes">{t('landing.compare.cell.sharePublic')}</td>
                <td className="landingNo">{t('landing.compare.cell.varies')}</td>
              </tr>
              <tr>
                <td>{t('landing.compare.row.opensource')}</td>
                <td className="landingYes">{t('landing.compare.cell.mitCompose')}</td>
                <td className="landingYes">{t('landing.compare.cell.apacheDraw')}</td>
                <td className="landingNo">{t('landing.compare.cell.closedSaas')}</td>
                <td className="landingYes">{t('landing.compare.cell.formatOpen')}</td>
              </tr>
              <tr>
                <td>{t('landing.compare.row.dbml')}</td>
                <td className="landingYes">{t('landing.compare.cell.dbmlBoth')}</td>
                <td className="landingNo">{t('landing.compare.cell.no')}</td>
                <td className="landingYes">{t('landing.compare.cell.native')}</td>
                <td className="landingYes">{t('landing.compare.cell.native')}</td>
              </tr>
              <tr>
                <td>{t('landing.compare.row.agent')}</td>
                <td className="landingYes">{t('landing.compare.cell.agentDetail')}</td>
                <td className="landingNo">{t('landing.compare.cell.noSchema')}</td>
                <td className="landingNo">{t('landing.compare.cell.no')}</td>
                <td className="landingNo">{t('landing.compare.cell.textOnly')}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="landingBand">
          <div className="landingSection" aria-labelledby="compare-cta-title">
            <h2 id="compare-cta-title">{t('landing.comparePage.cta.title')}</h2>
            <p className="landingSectionLead">{t('landing.comparePage.cta.lead')}</p>
            <div
              className="landingCtas"
              id="landing-main-cta"
              tabIndex={-1}
              data-testid="landing-main-cta"
            >
              <Link
                className="landingBtnPrimary"
                to={lp('/demo')}
                aria-label={t('landing.hero.cta.openDemoAria')}
              >
                {t('landing.hero.cta.openDemo')}
              </Link>
              <a
                className="landingBtnGhost"
                href={docsUrl(intl.locale)}
                target="_blank"
                rel="noreferrer"
                aria-label={t('landing.demo.cta.selfHostAria')}
              >
                {t('landing.demo.cta.selfHost')}
              </a>
              <Link
                className="landingBtnText"
                to={lp('/')}
                aria-label={t('landing.comparePage.cta.backHomeAria')}
              >
                {t('landing.comparePage.cta.backHome')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </LandingChrome>
  );
};

export default ComparePage;
