# ADR-0009: Collaboration presence via backend SocketIO + short ticket

- Status: Accepted (2026-08-02)
- Decision makers: Project maintainers

## Context

P3b "collaboration cursor/presence" needs real-time rooms; frontend once connected to standalone Node at `localhost:3000`, disconnected from backend `netty-socketio:9092`. Putting full JWT authorities in handshake query causes URL too long → 400/disconnect.

## Decision

1. Presence single channel: backend SocketIO, namespace `/project/erd`, events `martin:event:joinRoom` / `leaveRoom`
2. Handshake auth: `POST /auth/socket-ticket` (login required) issues Redis short ticket (TTL 2min, payload `userId`+`username`); query carries `ticket` + `projectId`
3. Forbid oversized JWT in Socket handshake; length >512 rejected with prompt to use short ticket
4. **Project members**: handshake and `JOIN_ROOM` both verify current user ∈ `project_user` (R-AUTH-05); non-members get `connect_error`; cursor/sync broadcast only after successful room join
5. Online roster + collaboration cursor (`martin:event:cursor`) + **model delta** (`martin:event:sync`, jsondiffpatch delta, scope `projectJSON`)
6. Client protocol: `socket.io-client@2.x` (aligned with netty-socketio 1.7 / Engine.IO 3)
7. Sync: local debounced broadcast; remote patch deduped by timestamp and echo suppressed; not via `:3000`

## Consequences

- Positive: same room sees roster/cursor/model delta; auth deployable; non-members cannot listen/inject room events
- Disconnect: namespace `DisconnectListener` and explicit `leaveRoom` same path remove name; multi-connection same user only removes from roster when last connection leaves
- Known limits: no OT/CRDT, last-write-wins on conflict; large delta not chunked
- Conflict hint: toast on remote sync success (warning if local dirty); error on patch failure
- Follow-up: cursor idle timeout
