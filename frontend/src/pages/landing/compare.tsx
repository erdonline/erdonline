import React from 'react';
import {Link} from '@umijs/max';
import LandingChrome, {DOCS_URL} from './LandingChrome';
import './index.less';

/**
 * 诚实对照子页：协作 / 版本 / 开放 / 自部署。
 * 极简画图够用时不必换；需要版本与开源事实源时再来（vision）。
 */
const ComparePage: React.FC = () => (
  <LandingChrome variant="subpage" testId="compare-page">
    <main className="landingComparePage">
      <section className="landingSection landingCompareHero" aria-labelledby="compare-page-title">
        <p className="landingCompareEyebrow landingBrand">ERD Online</p>
        <h1 id="compare-page-title">诚实对照</h1>
        <p className="landingSectionLead">
          极简画图工具已够用时不必换；需要版本、协作与开源事实源时再来。我们不复刻
          dbdiagram——打差异化。
        </p>
      </section>

      <section className="landingSection" aria-labelledby="compare-table-title">
        <h2 id="compare-table-title" className="visuallyHidden">
          能力对照表
        </h2>
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
              <td className="landingYes">多人同图 + presence</td>
              <td className="landingNo">无 / 弱</td>
              <td className="landingNo">视编辑器</td>
            </tr>
            <tr>
              <td>版本与 diff</td>
              <td className="landingYes">快照、diff、回滚</td>
              <td className="landingNo">弱</td>
              <td className="landingNo">靠 Git 外挂</td>
            </tr>
            <tr>
              <td>审批 / 变更审计</td>
              <td className="landingYes">工单 + SQL 审批</td>
              <td className="landingNo">无</td>
              <td className="landingNo">无</td>
            </tr>
            <tr>
              <td>只读分享</td>
              <td className="landingYes">token 链接 + fork</td>
              <td className="landingYes">公开分享</td>
              <td className="landingNo">视工具</td>
            </tr>
            <tr>
              <td>开源自部署</td>
              <td className="landingYes">MIT + compose</td>
              <td className="landingNo">闭源 SaaS</td>
              <td className="landingYes">格式开源</td>
            </tr>
            <tr>
              <td>DBML 互通</td>
              <td className="landingYes">导入 / 导出</td>
              <td className="landingYes">原生</td>
              <td className="landingYes">原生</td>
            </tr>
            <tr>
              <td>Agent / 事实源</td>
              <td className="landingYes">projectJSON schema；API/MCP 路线图</td>
              <td className="landingNo">无</td>
              <td className="landingNo">文本为主</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="landingBand">
        <div className="landingSection" aria-labelledby="compare-cta-title">
          <h2 id="compare-cta-title">先看图，再决定</h2>
          <p className="landingSectionLead">
            打开在线 demo 看真实关系图；或按文档自部署，数据留在你这边。
          </p>
          <div className="landingCtas">
            <Link className="landingBtnPrimary" to="/demo" aria-label="打开演示">
              打开演示
            </Link>
            <a
              className="landingBtnGhost"
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="自部署指南"
            >
              自部署指南
            </a>
            <Link className="landingBtnText" to="/" aria-label="返回产品首页">
              返回首页
            </Link>
          </div>
        </div>
      </section>
    </main>
  </LandingChrome>
);

export default ComparePage;
