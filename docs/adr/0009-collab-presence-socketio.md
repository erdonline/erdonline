# ADR-0009：协作 Presence 走后端 SocketIO + 短票

- 状态：已接受（2026-08-02）
- 决策者：项目维护者

## 背景

P3b「协作光标/presence」依赖实时房间；前端曾连 `localhost:3000` 独立 Node，与后端 `netty-socketio:9092` 脱节。JWT 全量 authorities 塞进 handshake query 会因 URL 过长导致 400/断连。

## 决策

1. Presence 唯一通道：后端 SocketIO，namespace `/project/erd`，事件 `martin:event:joinRoom` / `leaveRoom`
2. 握手鉴权：`POST /auth/socket-ticket`（需登录）签发 Redis 短票（TTL 2min，载荷 `userId`+`username`）；query 带 `ticket` + `projectId`
3. 禁止把超长 JWT 放进 Socket handshake；长度 >512 直接拒绝并提示改用短票
4. **项目成员**：握手与 `JOIN_ROOM` 均校验当前用户 ∈ `project_user`（R-AUTH-05）；非成员 `connect_error`；cursor/sync 仅成功入房后可广播
5. 在线名单 + 协作光标（`martin:event:cursor`）+ **模型增量**（`martin:event:sync`，jsondiffpatch delta，作用域 `projectJSON`）
6. 客户端协议：`socket.io-client@2.x`（对齐 netty-socketio 1.7 / Engine.IO 3）
7. Sync：本地防抖广播；远端 patch 用 timestamp 去重并抑制回声；不经 `:3000`

## 后果

- 正面：同房可见名单/光标/模型增量；鉴权可部署；非成员无法旁听/注入房间事件
- 断线：namespace `DisconnectListener` 与显式 `leaveRoom` 同路径摘名；同用户多连接时仅最后一连接离开才从名单移除
- 已知限制：无 OT/CRDT，冲突时后写覆盖；大 delta 未分片
- 冲突提示：远端 sync 成功时 toast（本地 dirty 用 warning）；patch 失败 error
- 后续：光标 idle 超时
