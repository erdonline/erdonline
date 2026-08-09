# ERD Online 文档站（Docusaurus）

消费仓库根目录 `docs/`（ADR-0003）。面向终端用户的使用指南在 `docs/guide/`；英文译本在 `i18n/en/docusaurus-plugin-content-docs/current/guide/`。

```bash
cd website
yarn
yarn start    # http://localhost:3000/erdonline/
yarn build && yarn serve   # 验证本地搜索（构建后才有完整索引）
yarn docusaurus write-translations --locale en   # 刷新 UI 文案骨架（勿覆盖已译 guide）
```

语言：默认 `zh-Hans`，另有 `en`（Navbar 语言切换）。访问统计：与产品同百度站点 ID，SPA 路由经 `src/clientModules/baiduAnalytics.js` 上报。

`baseUrl` / `url` 可由环境变量覆盖（默认 GH Pages：`/erdonline/`）：

```bash
DOCUSAURUS_URL=https://erdonline.github.io DOCUSAURUS_BASE_URL=/erdonline/ yarn build
# CF 镜像本地预览（运维）：DOCUSAURUS_URL=https://erdonline-docs.pages.dev DOCUSAURUS_BASE_URL=/ yarn build
```

部署：合并到 `main` 后由 `docs-site.yml` 推送 **GitHub Pages**（产品面主入口 `https://erdonline.github.io/erdonline/`）与 **Cloudflare Pages**（项目 `erdonline-docs`，运维镜像）。  
首次配置（Token / Variable `CLOUDFLARE_PAGES_DEPLOY` / Pages Direct Upload）：见 [docs/deployment.md#cf-pages-setup](../docs/deployment.md#cf-pages-setup)。
