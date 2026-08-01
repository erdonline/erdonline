// netty-socketio 1.7 ↔ Engine.IO 3 / Socket.IO 2；勿用 socket.io-client@4
// eslint-disable-next-line @typescript-eslint/no-var-requires
const io = require('socket.io-client');
import request from '@/utils/request';

/** 与后端 WebsocketConstants 对齐 */
export const JOIN_ROOM = 'martin:event:joinRoom';
export const LEAVE_ROOM = 'martin:event:leaveRoom';
export const CURSOR = 'martin:event:cursor';
export const EVENT_ERROR = 'martin:event:error';

const SOCKET_URL =
  typeof SOCKETIO_URL !== 'undefined' && SOCKETIO_URL
    ? SOCKETIO_URL
    : 'http://localhost:9092';

type TicketResp = {
  code?: number;
  data?: { ticket: string; username: string; expiresIn?: number };
};

export type CursorPayload = {
  username: string;
  x: number;
  y: number;
};

export type PresenceHandlers = {
  onRoster: (users: string[], actor?: string) => void;
  onCursor?: (cursor: CursorPayload) => void;
};

/**
 * 连接后端 netty-socketio（namespace /project/erd）。
 * 鉴权用短票，禁止把超长 JWT 塞进 query。
 */
export async function connectPresence(
  projectId: string,
  handlers: PresenceHandlers | ((users: string[], actor?: string) => void),
): Promise<any> {
  const onRoster = typeof handlers === 'function' ? handlers : handlers.onRoster;
  const onCursor = typeof handlers === 'function' ? undefined : handlers.onCursor;

  const r = (await request.post('/auth/socket-ticket', { data: {} })) as TicketResp;
  const ticket = r?.data?.ticket;
  const username = r?.data?.username;
  if (!ticket || !username) {
    throw new Error('socket-ticket 签发失败');
  }

  const socket = io(`${SOCKET_URL}/project/erd`, {
    transports: ['websocket', 'polling'],
    query: { ticket, username, projectId },
    forceNew: true,
    reconnection: true,
    timeout: 8000,
  });

  const applyRoster = (payload: any) => {
    const raw = payload?.onlineUser ?? payload?.onlineUsers ?? [];
    const list = (Array.isArray(raw) ? raw : []).map(String).filter(Boolean);
    onRoster(list, payload?.username ? String(payload.username) : undefined);
  };

  socket.on('connect', () => {
    socket.emit(JOIN_ROOM, {});
  });
  socket.on(JOIN_ROOM, applyRoster);
  socket.on(LEAVE_ROOM, applyRoster);
  if (onCursor) {
    socket.on(CURSOR, (payload: any) => {
      const u = payload?.username;
      const x = Number(payload?.x);
      const y = Number(payload?.y);
      if (!u || Number.isNaN(x) || Number.isNaN(y)) return;
      onCursor({ username: String(u), x, y });
    });
  }
  socket.on(EVENT_ERROR, (msg: unknown) => {
    // eslint-disable-next-line no-console
    console.warn('[presence]', msg);
  });

  return socket;
}

export function emitCursor(socket: any, x: number, y: number) {
  if (!socket?.connected) return;
  socket.emit(CURSOR, { x, y });
}

export function disconnectPresence(socket: any, _username?: string) {
  if (!socket) return;
  try {
    socket.emit(LEAVE_ROOM, {});
    socket.close();
  } catch {
    /* ignore */
  }
}

/** 稳定色：同用户同色 */
export function cursorColor(username: string): string {
  let h = 0;
  for (let i = 0; i < username.length; i++) {
    h = (h * 31 + username.charCodeAt(i)) >>> 0;
  }
  return `hsl(${h % 360} 70% 42%)`;
}
