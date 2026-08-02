import React, {useCallback, useEffect, useState} from 'react';
import {List, Typography, message} from 'antd';
import {POST_ERD} from '@/services/crud';
import {renderActivities} from '@/pages/home';
import type {ActivitiesType} from '@/pages/home/data.d';

export type NoticeProps = {};

const Index: React.FC<NoticeProps> = () => {
  const [data, setData] = useState<ActivitiesType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async (current: number, size: number) => {
    setLoading(true);
    try {
      const result = await POST_ERD('/syst/sysAnnouncement', {
        current,
        pageSize: size,
        size,
        orders: [
          {
            column: 'createTime',
            asc: false,
          },
        ],
      });
      if (result?.code !== 200) {
        message.error(result?.msg || '加载公告失败');
        setData([]);
        setTotal(0);
        return;
      }
      setData(result?.data?.records ?? []);
      setTotal(result?.data?.total ?? 0);
    } catch {
      message.error('加载公告失败');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize);
  }, [load, page, pageSize]);

  return (
    <div data-testid="project-notice-page">
      <Typography.Title level={4} style={{marginTop: 0}}>
        公告
      </Typography.Title>
      <List
        loading={loading}
        dataSource={data}
        renderItem={(item) => renderActivities(item)}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, size) => {
            setPage(p);
            setPageSize(size);
          },
        }}
      />
    </div>
  );
};

export default React.memo(Index);
