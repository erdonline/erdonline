# ERD Online 文档站（Docusaurus）

消费仓库根目录 `docs/`（ADR-0003）。面向终端用户的使用指南在 `docs/guide/`；英文译本在 `i18n/en/docusaurus-plugin-content-docs/current/guide/`。

```bash
cd website
yarn
yarn start    # http://localhost:3000/
yarn build && yarn serve   # 验证本地搜索（构建后才有完整索引）
yarn docusaurus write-translations --locale en   # 刷新 UI 文案骨架（勿覆盖已译 guide）
```

语言：默认 `zh-Hans`，另有 `en`（Navbar 语言切换）。访问统计：与产品同百度站点 ID，SPA 路由经 `src/clientModules/baiduAnalytics.js` 上报。

`baseUrl` / `url` 默认即产品域 `https://doc.erdonline.com` + `/`：

```bash
DOCUSAURUS_URL=https://doc.erdonline.com DOCUSAURUS_BASE_URL=/ yarn build
```

部署：合并到 `main` 后由 `docs-site.yml` 推送 **Cloudflare Pages**（项目 `erdonline-docs`，自定义域 **https://doc.erdonline.com**）。不要启用 GitHub Pages。  
首次配置（Token / Variable `CLOUDFLARE_PAGES_DEPLOY` / Pages Direct Upload）：见 [docs/deployment.md#cf-pages-setup](../docs/deployment.md#cf-pages-setup)。
