# ERD Online 文档站（Docusaurus）

消费仓库根目录 `docs/`（ADR-0003）。发版笔记目录 `docs/releases/` 映射为 blog。

```bash
cd website
yarn
yarn start    # http://localhost:3000
yarn build    # 产物 website/build
```

GitHub Pages：`baseUrl` 默认 `/erdonline/`，按实际仓库名调整 `docusaurus.config.js`。  
部署：合并到 `main` 后由 `docs-site.yml` 上传；首次需在仓库 Settings → Pages 启用 Actions。
