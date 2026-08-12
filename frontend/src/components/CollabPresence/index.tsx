import useProjectStore from '@/store/project/useProjectStore';
import { erdColors } from '@/theme/tokens';
import { getIntl } from '@umijs/max';
import React from 'react';
import shallow from 'zustand/shallow';

/** 设计器顶栏：当前项目房间在线用户（P3b presence） */
const CollabPresence: React.FC = () => {
  const { onlineUsers, socket } = useProjectStore(
    (s) => ({ onlineUsers: s.onlineUsers, socket: s.socket }),
    shallow,
  );
  if (!socket && (!onlineUsers || onlineUsers.length === 0)) {
    return null;
  }
  const intl = getIntl();
  const label =
    onlineUsers && onlineUsers.length > 0
      ? intl.formatMessage(
          { id: 'collabPresence.online' },
          { count: onlineUsers.length, users: onlineUsers.join('、') },
        )
      : intl.formatMessage({ id: 'collabPresence.connecting' });
  return (
    <span
      data-testid="collab-presence"
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        maxWidth: 280,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 13,
        color: erdColors.ink600,
      }}
      title={label}
    >
      {label}
    </span>
  );
};

export default CollabPresence;
