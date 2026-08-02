import React, {useEffect, useState} from 'react';
import {Link} from '@umijs/max';
import * as cache from '@/utils/cache';
import {APP_VERSION_LABEL} from '@/constants/appVersion';

const GITHUB_URL = 'https://github.com/erdonline/erdonline';
const DOCS_URL = 'https://erdonline.github.io/erdonline/';

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
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(cache.getItem('Authorization')));
  }, []);

  return (
    <div
      className={`landing${variant === 'subpage' ? ' landing--subpage' : ''}`}
      data-testid={testId}
    >
      <header className="landingNav">
        <a className="landingNavBrand landingBrand" href="/" aria-label="ERD Online 首页">
          <img src="/logo.svg" alt="" width={28} height={28} />
          ERD Online
        </a>
        <nav className="landingNavLinks" aria-label="落地页导航">
          <a href="/#pillars">卖点</a>
          <Link to="/compare" aria-label="竞品对照">
            对比
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          {authed ? (
            <Link className="landingBtnGhost landingNavCta" to="/home" aria-label="进入工作台">
              进入工作台
            </Link>
          ) : (
            <Link className="landingBtnGhost landingNavCta" to="/login" aria-label="登录">
              登录
            </Link>
          )}
        </nav>
      </header>

      {children}

      <footer className="landingFooter">
        <span className="landingBrand">ERD Online · MIT · {APP_VERSION_LABEL}</span>
        <nav aria-label="页脚链接">
          <a href={DOCS_URL} target="_blank" rel="noreferrer">
            文档
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            Roadmap
          </a>
          <Link to="/compare">对照</Link>
          <a href={`${GITHUB_URL}/discussions`} target="_blank" rel="noreferrer">
            社区
          </a>
          {authed ? <Link to="/home">进入工作台</Link> : <Link to="/login">登录</Link>}
        </nav>
      </footer>
    </div>
  );
};

export {DOCS_URL, GITHUB_URL};
export default LandingChrome;
