# ADR-0009：协作 Presence 走后端 SocketIO + 短票

- 状态：已接受（2026-08-02）
- 决策者：项目维护者

## 背景

P3b「协作光标/presence」依赖实时房间；前端曾连 `localhost:3000` 独立 Node，与后端 `netty-socketio:9092` 脱节。JWT 全量 authorities 塞进 handshake query 会因 URL 过长导致 400/断连。

## 决策

1. Presence 唯一通道：后端 SocketIO，namespace `/project/erd`，事件 `martin:event:joinRoom` / `leaveRoom`
2. 握手鉴权：`POST /auth/socket-ticket`（需登录）签发 Redis 短票（TTL 2min）；query 只带 `ticket` + `projectId`（username 由短票解析）
3. 禁止把超长 JWT 放进 Socket handshake；长度 >512 直接拒绝并提示改用短票
4. 在线名单 + **协作光标**（`martin:event:cursor`，flow 坐标 x/y，广播给同房他人）；模型增量 sync 另切
5. 客户端协议：`socket.io-client@2.x`（对齐 netty-socketio 1.7 / Engine.IO 3）

## 后果

- 正面：设计器可显示房间在线用户与远程光标；鉴权可部署
- 断线：namespace `DisconnectListener` 与显式 `leaveRoom` 同路径摘名；同用户多连接时仅最后一连接离开才从名单移除
- 后续：模型增量 sync；团队项目权限校验进房；光标 idle 超时隐藏
