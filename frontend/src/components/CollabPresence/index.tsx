import useProjectStore from '@/store/project/useProjectStore';
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
  const label =
    onlineUsers && onlineUsers.length > 0
      ? `在线 ${onlineUsers.length}：${onlineUsers.join('、')}`
      : '连接协作中…';
  return (
    <span
      data-testid="collab-presence"
      aria-label={label}
      style={{
        maxWidth: 280,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 13,
        color: 'rgba(0,0,0,0.65)',
      }}
      title={label}
    >
      {label}
    </span>
  );
};

export default CollabPresence;
