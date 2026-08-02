# ADR-0015：提高 Tomcat `max-http-header-size`（JWT 头溢出）

## 状态

Accepted — 2026-08-02

## 背景

登录 JWT 将 `authorities` 与 `role_ids` 全量写入 claim。e2e/admin 等权限较多的账号，`Authorization: Bearer …` 单头可达 ~8KB。Tomcat 默认 `max-http-header-size=8KB`，GET 偶发还能过，带 `Content-Type` 的 POST（创建/删除项目、团队 API）会被连接器直接以 **HTML 400** 拒绝，前端 `.json()` 失败或弹窗「新增项目」点确定无闭环。

## 决策

`application.yml` 将 Boot 3 属性 `server.max-http-request-header-size`（及 `server.tomcat.max-http-response-header-size`）设为 **64KB**，先恢复可写 API。勿用已失效的 `server.tomcat.max-http-header-size`。

## 后果

- 正：创建/删除/团队接口不再因头溢出返回 HTML 400
- 负：未缩小 JWT；权限继续膨胀仍可能逼近上限
- 后续（非本切片）：JWT 只带 roleIds，权限改 Redis/DB 加载（另开 ADR）

## 验证

`Authorization` 头 >8KB 时 `POST /ncnb/project/add` 返回 JSON `code=200`（或业务错误），而非 `text/html` 400。
