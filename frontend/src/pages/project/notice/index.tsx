import { ProList } from '@ant-design/pro-components';
import React from 'react';
import { message } from 'antd';
import { POST_ERD } from '@/services/crud';
import { renderActivities } from '@/pages/home';

export type NoticeProps = {};

const Index: React.FC<NoticeProps> = () => {
  return (
    <div data-testid="project-notice-page">
      <ProList<any>
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        renderItem={(item) => renderActivities(item)}
        metas={{
          title: {},
          createTime: {},
          type: {},
          avatar: {},
          content: {},
          actions: {},
        }}
        headerTitle="公告"
        request={async (params) => {
          try {
            const result = await POST_ERD('/syst/sysAnnouncement', {
              ...params,
              size: params.pageSize,
              orders: [
                {
                  column: 'createTime',
                  asc: false,
                },
              ],
            });
            if (result?.code !== 200) {
              message.error(result?.msg || '加载公告失败');
              return { data: [], total: 0, success: false };
            }
            return {
              data: result?.data?.records ?? [],
              total: result?.data?.total ?? 0,
              success: true,
            };
          } catch {
            message.error('加载公告失败');
            return { data: [], total: 0, success: false };
          }
        }}
      />
    </div>
  );
};

export default React.memo(Index);
