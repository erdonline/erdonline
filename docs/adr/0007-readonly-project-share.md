# ADR-0007：项目只读分享链接

- 状态：已接受（2026-08-02）
- 决策者：项目维护者

## 背景

路线图 P3「只读分享链接」服务旅程「分享传播」；需无需登录即可查看模型，抬升试用与回访。

## 决策

1. 表 `project_share`：`token` 唯一；`enabled` / 可选 `expire_time`
2. API：`POST /share/create`（登录+创建人）；`GET /share/{token}`（匿名，返回 `readonly` + projectJSON）；`POST /share/revoke`
3. Security：`/share/**` 加入 ignore-urls（匿名仅安全读；写仍需登录）
4. 本切片不含前端只读页；下一刀接 `/share/:token` 只读关系图

## 后果

- 正面：可 curl 验证的竖切；token 可吊销
- 代价：当前暴露完整 projectJSON（含数据源配置风险）— 后续应脱敏 profile.dbs 密码
