import React from 'react';
import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const heroImg = `${useBaseUrl('/img/hero-1600.webp')}?v=20260830a`;
  const heroImgSmall = `${useBaseUrl('/img/hero-800.webp')}?v=20260830a`;
  return (
    <header className={styles.hero} aria-label="ERD Online">
      <div className={styles.heroAtmosphere} aria-hidden="true">
        <div className={styles.heroGrid} />
        <div className={styles.heroGlow} />
      </div>
      <div className={`container ${styles.heroStage}`}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>
            <span className={styles.kickerDot} aria-hidden="true" />
            <Translate id="home.kicker">Open source · MIT</Translate>
          </p>
          <p className={styles.brand}>ERD Online</p>
          <h1 className={styles.title}>
            <Translate id="home.headline">数据库设计的 Git + Figma</Translate>
          </h1>
          <p className={styles.lead}>
            <Translate id="home.tagline">
              开源数据库建模：存版本、看 diff、可自托管
            </Translate>
          </p>
          <div className={styles.ctas}>
            <Link className={styles.ctaPrimary} href="https://www.erdonline.com/demo">
              <Translate id="home.cta.demo">试用 Demo</Translate>
            </Link>
            <Link className={styles.ctaGhost} to="/docs/guide/intro">
              <Translate id="home.cta.start">从这里开始</Translate>
            </Link>
          </div>
        </div>
        <div className={styles.heroFrame}>
          <img
            className={styles.heroImg}
            src={heroImg}
            srcSet={`${heroImgSmall} 800w, ${heroImg} 1600w`}
            sizes="(max-width: 996px) 100vw, 800px"
            alt=""
            width={1600}
            height={1000}
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
          <div className={styles.heroFrameSheen} aria-hidden="true" />
          <div className={styles.heroFrameGlow} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

function PathRow({ index, title, body, to }) {
  return (
    <Link className={styles.pathRow} to={to}>
      <span className={styles.pathIndex} aria-hidden="true">
        {String(index).padStart(2, '0')}
      </span>
      <span className={styles.pathCopy}>
        <span className={styles.pathTitle}>{title}</span>
        <span className={styles.pathBody}>{body}</span>
      </span>
      <span className={styles.pathArrow} aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <Layout
      title={translate({ id: 'home.title', message: '文档首页' })}
      description={translate({
        id: 'home.description',
        message: 'ERD Online 使用文档：从试用 Demo 到自托管与 API',
      })}
      wrapperClassName={styles.homeWrap}
    >
      <HomepageHeader />
      <section className={styles.signal} aria-label="product signals">
        <div className="container">
          <div className={styles.signalGrid}>
            <div className={styles.signalItem}>
              <span className={styles.signalKey}>LICENSE</span>
              <span className={styles.signalVal}>MIT</span>
            </div>
            <div className={styles.signalItem}>
              <span className={styles.signalKey}>CORE LOOP</span>
              <span className={styles.signalVal}>version · diff</span>
            </div>
            <div className={styles.signalItem}>
              <span className={styles.signalKey}>DEPLOY</span>
              <span className={styles.signalVal}>docker compose</span>
            </div>
            <div className={styles.signalItem}>
              <span className={styles.signalKey}>AGENT</span>
              <span className={styles.signalVal}>API · MCP</span>
            </div>
          </div>
        </div>
      </section>
      <main className={styles.paths}>
        <div className="container">
          <p className={styles.pathsLead}>
            <Translate id="home.lead">
              选一条路径即可。贡献者工程文档在侧栏「贡献与工程」（默认折叠），上手不必先读。
            </Translate>
          </p>
          <div className={styles.pathList}>
            <PathRow
              index={1}
              title={translate({ id: 'home.path.try.title', message: '先试用' })}
              body={translate({
                id: 'home.path.try.body',
                message: '打开 Demo → 复制到我的项目 → 改一列 → 保存版本看 diff',
              })}
              to="/docs/guide/save-version-and-diff"
            />
            <PathRow
              index={2}
              title={translate({ id: 'home.path.migrate.title', message: '迁入模型' })}
              body={translate({
                id: 'home.path.migrate.body',
                message: '导入 DBML，或从四类数据库逆向到画布',
              })}
              to="/docs/guide/import-dbml"
            />
            <PathRow
              index={3}
              title={translate({ id: 'home.path.host.title', message: '自托管' })}
              body={translate({
                id: 'home.path.host.body',
                message: 'docker compose 五分钟起栈；再接 API / MCP',
              })}
              to="/docs/guide/quick-self-host"
            />
          </div>
        </div>
      </main>
    </Layout>
  );
}
