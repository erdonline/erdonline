import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={`hero hero--primary ${styles.heroBanner}`}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/vision">
            阅读愿景
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/development"
            style={{ marginLeft: 12 }}
          >
            本地开发
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <Layout title="首页" description="数据库设计的 Git + Figma">
      <HomepageHeader />
      <main className="container margin-vert--lg">
        <p>
          文档单一事实源在仓库 <code>docs/</code>；本站由 Docusaurus 消费（见 ADR-0003）。
          应用内试用：部署后访问 <code>/demo</code>。
        </p>
      </main>
    </Layout>
  );
}
