# ADR-0007：项目只读分享链接

- 状态：已接受（2026-08-02）
- 决策者：项目维护者

## 背景

路线图 P3「只读分享链接」服务旅程「分享传播」；需无需登录即可查看模型，抬升试用与回访。

## 决策

1. 表 `project_share`：`token` 唯一；`enabled` / 可选 `expire_time`
2. API：`POST /share/create`（登录+创建人）；`GET /share/{token}`（匿名，返回 `readonly` + projectJSON）；`POST /share/revoke`（登录+创建人）
3. Security：匿名 **仅 GET** `/share/*`（`ErdSecurityConfiguration`）；`create`/`revoke`/`fork` 需登录（不再用 `/share/**` 全方法放行）
4. 前端匿名页 `/s/:token`：表清单 + 只读 ReactFlow 关系图；设计器顶栏「分享」弹层（创建/复制/吊销）
5. 匿名响应脱敏：见 ADR-0008，分享 JSON **清空** `profile.dbs`（不再打码后仍带连接块）

## 后果

- 正面：可分享可打开；可吊销；密码不落匿名响应；画布只读不可连线/拖拽改模型
- 后续：分享过期策略 UI
- 延伸：`POST /share/{token}/fork` 登录复制为个人项目（P3a）
