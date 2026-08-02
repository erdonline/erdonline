# ERD Online 文档站（Docusaurus）

消费仓库根目录 `docs/`（ADR-0003）。发版笔记目录 `docs/releases/` 映射为 blog。

```bash
cd website
yarn
yarn start    # http://localhost:3000/erdonline/
yarn build && yarn serve   # 验证本地搜索（构建后才有完整索引）
```

`baseUrl` / `url` 可由环境变量覆盖（默认 GH Pages：`/erdonline/`）：

```bash
DOCUSAURUS_URL=https://erdonline-docs.pages.dev DOCUSAURUS_BASE_URL=/ yarn build
```

部署：合并到 `main` 后由 `docs-site.yml` 推送 **GitHub Pages**（回退）与 **Cloudflare Pages**（项目 `erdonline-docs`）。  
首次配置（Token / Variable `CLOUDFLARE_PAGES_DEPLOY` / Pages Direct Upload）：见 [docs/deployment.md#cf-pages-setup](../docs/deployment.md#cf-pages-setup)。
