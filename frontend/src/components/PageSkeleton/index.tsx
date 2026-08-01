import React from 'react';
import { Skeleton, Space } from 'antd';

export type PageSkeletonProps = {
  /** 内容区行数，默认 4 */
  rows?: number;
  /** 是否显示头像占位（列表页用） */
  avatar?: boolean;
};

/**
 * CRUD / 布局页统一加载骨架（原则：骨架屏而非裸转圈）。
 * 按钮级异步仍可用 Button loading / Spin。
 */
const PageSkeleton: React.FC<PageSkeletonProps> = ({ rows = 4, avatar = false }) => (
  <div
    data-testid="page-skeleton"
    role="status"
    aria-busy="true"
    aria-label="页面加载中"
    style={{ padding: 24 }}
  >
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {avatar ? (
        <>
          <Skeleton avatar active paragraph={{ rows: 1 }} />
          <Skeleton avatar active paragraph={{ rows: 1 }} />
          <Skeleton avatar active paragraph={{ rows: 1 }} />
        </>
      ) : (
        <Skeleton active paragraph={{ rows }} title={{ width: '40%' }} />
      )}
    </Space>
  </div>
);

export default React.memo(PageSkeleton);
