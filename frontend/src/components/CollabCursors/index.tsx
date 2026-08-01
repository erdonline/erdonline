import { cursorColor } from '@/services/collabPresence';
import useProjectStore from '@/store/project/useProjectStore';
import { useStore } from 'reactflow';
import React, { useMemo } from 'react';
import shallow from 'zustand/shallow';

/**
 * 远程协作光标（flow 坐标 → 屏幕，随视口变换）。reactflow@11：用 transform 手算。
 */
const CollabCursors: React.FC = () => {
  const remoteCursors = useProjectStore((s) => s.remoteCursors, shallow);
  const [tx, ty, zoom] = useStore((s) => s.transform);

  const markers = useMemo(() => {
    return Object.entries(remoteCursors || {}).map(([user, c]) => ({
      user,
      ...c,
      left: c.x * zoom + tx,
      top: c.y * zoom + ty,
    }));
  }, [remoteCursors, tx, ty, zoom]);

  if (!markers.length) return null;

  return (
    <div
      data-testid="collab-cursors"
      aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden' }}
    >
      {markers.map((m) => {
        const color = cursorColor(m.user);
        return (
          <div
            key={m.user}
            data-testid={`collab-cursor-${m.user}`}
            style={{
              position: 'absolute',
              left: m.left,
              top: m.top,
              transform: 'translate(-2px, -2px)',
              pointerEvents: 'none',
            }}
          >
            <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden>
              <path
                d="M1 1 L1 17 L5.5 13.5 L8.5 19 L11 17.5 L8 12 L14 12 Z"
                fill={color}
                stroke="#fff"
                strokeWidth="1"
              />
            </svg>
            <span
              style={{
                marginLeft: 4,
                padding: '0 4px',
                borderRadius: 2,
                background: color,
                color: '#fff',
                fontSize: 11,
                whiteSpace: 'nowrap',
              }}
            >
              {m.user}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CollabCursors;
