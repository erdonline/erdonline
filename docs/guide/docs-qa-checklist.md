# 文档站验收清单（维护者）

:::info 读者
给维护者验证「用户文档是否够用」。终端用户请从 [从这里开始](./intro.md) 阅读。
:::

## A. 机器验收

```bash
cd website && yarn build
cd website && yarn serve
# 默认 http://localhost:3000/
```

确认：

1. Navbar「文档」进入 **从这里开始**（`/docs/guide/intro`）
2. 侧栏「贡献与工程」**默认折叠**
3. 搜索能命中「DBML」「逆向」「自托管」等指南标题；blog 索引可搜到
4. Footer 含：从这里开始、Demo、对照、GitHub、发版笔记
5. 右上角语言切换 **简体中文 / English**；英文下 guide **与** deployment / data-format / security-model / 贡献区 / ADR 均为英文（非中文回退）
6. 生产构建加载百度统计（`hm.baidu.com`）；站内 SPA 跳转仍有 `_trackPageview`

## B. 用户旅程（约 15 分钟）

| # | 任务 | 通过标准 |
|---|---|---|
| 1 | 30 秒内知道下一步点哪 | intro / what-is，无需翻 ADR |
| 2 | 按「存版与 diff」从 Demo 走通 | 文中写明只读 Demo → **复制到我的项目**；能看到 diff |
| 3 | 读「导入 DBML」 | 有成功态 + ≥2 条排障 |
| 4 | 读「五分钟自托管」 | 命令可复制；链到完整 deployment |
| 5 | 找横评 | 侧栏或 intro 到 `/compare` |
| 6 | 误入 roadmap / vision | 页顶 callout 指回指南 |

## C. 精致门槛

- 任一 guide 首屏无「验证点 / 选题包 / UTM / 北极星」
- 从 intro 出发 3 次点击内到达：试用、迁入、自托管
- 陌生人截图观感：像产品手册，而不是内部 wiki
