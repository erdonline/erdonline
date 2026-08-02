import React, {useEffect, useState} from 'react';
import {Link} from '@umijs/max';
import * as cache from '@/utils/cache';
import './index.less';

const GITHUB_URL = 'https://github.com/erdonline/erdonline';
const DOCS_URL = 'https://erdonline.github.io/erdonline/';

const LandingPage: React.FC = () => {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(cache.getItem('Authorization')));
  }, []);

  return (
    <div className="landing" data-testid="landing-page">
      <header className="landingNav">
        <a className="landingNavBrand landingBrand" href="/" aria-label="ERD Online 首页">
          <img src="/logo.svg" alt="" width={28} height={28} />
          ERD Online
        </a>
        <nav className="landingNavLinks" aria-label="落地页导航">
          <a href="#pillars">卖点</a>
          <a href="#compare">对比</a>
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

      <section className="landingHero" aria-label="产品介绍">
        <div className="landingHeroVisual">
          <img
            src="/landing-hero.jpg"
            alt="ERD Online 设计器关系图画布"
            width={1600}
            height={1000}
            fetchPriority="high"
          />
          <div className="landingHeroScrim" aria-hidden="true" />
        </div>
        <div className="landingHeroInner">
          <p className="landingHeroBrand landingBrand">ERD Online</p>
          <h1 className="landingHeroTitle">
            数据库设计的 Git + Figma，AI 时代的开源事实源
          </h1>
          <p className="landingHeroLead">
            版本、协作、开放格式——人和 AI agent 共用同一份数据结构。30 秒免注册试用。
          </p>
          <div className="landingCtas">
            <Link className="landingBtnPrimary" to="/demo" aria-label="在线试用 demo">
              在线试用（免注册）
            </Link>
            {authed ? (
              <Link className="landingBtnGhost" to="/home" aria-label="进入工作台">
                进入工作台
              </Link>
            ) : (
              <>
                <Link className="landingBtnGhost" to="/register" aria-label="注册">
                  注册
                </Link>
                <Link className="landingBtnText" to="/login" aria-label="去登录">
                  已有账号？登录
                </Link>
              </>
            )}
            <a
              className="landingBtnText"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub 仓库"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="landingSection" id="pillars" aria-labelledby="pillars-title">
        <h2 id="pillars-title">三件事，构成壁垒</h2>
        <p className="landingSectionLead">
          不做对话黑盒噱头；把版本、协作与开放事实源做到 agent 也能用。
        </p>
        <div className="landingPillars">
          <article className="landingPillar">
            <span className="landingPillarMark" aria-hidden="true" />
            <h3>版本</h3>
            <p>每次保存自动生成版本，diff 可见，随时回滚——像 Git 对待代码一样对待 schema。</p>
          </article>
          <article className="landingPillar">
            <span className="landingPillarMark" aria-hidden="true" />
            <h3>协作</h3>
            <p>多人同图实时编辑与 presence，评审与审批流把变更收进可审计的版本。</p>
          </article>
          <article className="landingPillar">
            <span className="landingPillarMark" aria-hidden="true" />
            <h3>开放</h3>
            <p>
              projectJSON 公开格式；API / MCP 按路线图推进，agent 直接消费同一份事实源。
            </p>
          </article>
        </div>
      </section>

      <section className="landingBand">
        <div className="landingSection" id="demo" aria-labelledby="demo-title">
          <h2 id="demo-title">30 秒动线</h2>
          <p className="landingSectionLead">
            打开在线 demo，看到真实关系图，再决定是否注册或自部署。
          </p>
          <div className="landingCtas">
            <Link className="landingBtnPrimary" to="/demo" aria-label="打开演示">
              打开演示
            </Link>
            <a
              className="landingBtnGhost"
              href={`${DOCS_URL}`}
              target="_blank"
              rel="noreferrer"
              aria-label="自部署指南"
            >
              自部署指南
            </a>
          </div>
        </div>
      </section>

      <section className="landingSection" id="compare" aria-labelledby="compare-title">
        <h2 id="compare-title">诚实对照</h2>
        <p className="landingSectionLead">
          极简画图工具已够用时不必换；需要版本、协作与开源事实源时再来。
        </p>
        <table className="landingCompare">
          <thead>
            <tr>
              <th scope="col">能力</th>
              <th scope="col">ERD Online</th>
              <th scope="col">dbdiagram</th>
              <th scope="col">dbml 生态</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>实时协作</td>
              <td className="landingYes">有</td>
              <td className="landingNo">无 / 弱</td>
              <td className="landingNo">视工具</td>
            </tr>
            <tr>
              <td>版本与 diff</td>
              <td className="landingYes">有</td>
              <td className="landingNo">弱</td>
              <td className="landingNo">靠 Git 外挂</td>
            </tr>
            <tr>
              <td>开源自部署</td>
              <td className="landingYes">MIT</td>
              <td className="landingNo">闭源 SaaS</td>
              <td className="landingYes">格式开源</td>
            </tr>
            <tr>
              <td>Agent / API 事实源</td>
              <td className="landingYes">路线图中</td>
              <td className="landingNo">无</td>
              <td className="landingNo">文本为主</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer className="landingFooter">
        <span className="landingBrand">ERD Online · MIT</span>
        <nav aria-label="页脚链接">
          <a href={DOCS_URL} target="_blank" rel="noreferrer">
            文档
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            Roadmap
          </a>
          <a href={`${GITHUB_URL}/discussions`} target="_blank" rel="noreferrer">
            社区
          </a>
          <Link to="/login">登录</Link>
        </nav>
      </footer>
    </div>
  );
};

export default LandingPage;
