import React, {useCallback, useEffect, useState} from 'react';
import {List, message} from 'antd';
import moment from 'moment';
import {POST_ERD} from '@/services/crud';
import type {ActivitiesType} from '@/pages/home/data.d';
import '../project-list.scss';

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
    <div className="project-list-page" data-testid="project-notice-page">
      <div
        className="project-list-page__toolbar"
        data-testid="project-list-toolbar"
      >
        <h2 className="project-list-page__title">公告</h2>
      </div>
      <List
        className="project-list-page__list"
        size="small"
        loading={loading}
        rowKey="id"
        dataSource={data}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={
                <div className="project-list-page__notice-row">
                  <a href={item?.url} target="_blank" rel="noreferrer">
                    {item?.title}
                  </a>
                  <span className="project-list-page__time" title={item.createTime}>
                    {moment(item.createTime).fromNow()}
                  </span>
                </div>
              }
            />
          </List.Item>
        )}
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
