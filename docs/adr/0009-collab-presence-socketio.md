# ADR-0009：协作 Presence 走后端 SocketIO + 短票

- 状态：已接受（2026-08-02）
- 决策者：项目维护者

## 背景

P3b「协作光标/presence」依赖实时房间；前端曾连 `localhost:3000` 独立 Node，与后端 `netty-socketio:9092` 脱节。JWT 全量 authorities 塞进 handshake query 会因 URL 过长导致 400/断连。

## 决策

1. Presence 唯一通道：后端 SocketIO，namespace `/project/erd`，事件 `martin:event:joinRoom` / `leaveRoom`
2. 握手鉴权：`POST /auth/socket-ticket`（需登录）签发 Redis 短票（TTL 2min）；query 只带 `ticket` + `projectId`（username 由短票解析）
3. 禁止把超长 JWT 放进 Socket handshake；长度 >512 直接拒绝并提示改用短票
4. 本切片只做**在线名单**；画布光标与模型增量 sync 另切（不再依赖 `:3000`）
5. 客户端协议：`socket.io-client@2.x`（对齐 netty-socketio 1.7 / Engine.IO 3）

## 后果

- 正面：设计器可显示房间在线用户；鉴权可部署
- 后续：断线自动清名单；光标坐标广播；团队项目权限校验进房
