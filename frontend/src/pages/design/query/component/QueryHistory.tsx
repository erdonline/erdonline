import {ProColumns, ProTable} from "@ant-design/pro-components";
import React, {useEffect} from "react";
import {GET, PAGE, POST} from "@/services/crud";
import {useSearchParams} from "@@/exports";
import * as cache from "@/utils/cache";
import {CONSTANT} from "@/utils/constant";

export type QueryHistoryProps = {
  queryId: string | number;
  key: string;
};

type QueryHistoryItem = {
  id: number | string;
  title: string;
  sqlInfo: string;
  dbName: string;
  createTime: string;
  creator: string;
  duration: number;
};


const QueryHistory: React.FC<QueryHistoryProps> = (props) => {
  useEffect(() => {
  }, [props.key])

  const columns: ProColumns<QueryHistoryItem>[] = [
    {
      title: '执行时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '执行人',
      dataIndex: 'creator',
      width: 120,
    },
    {
      title: '执行数据库',
      dataIndex: 'dbName',
      width: 150,
    },
    {
      title: '耗时(ms)',
      dataIndex: 'duration',
      width: 100,
    },
    {
      title: 'SQL',
      dataIndex: 'sqlInfo',
      copyable: true,
      ellipsis: true,
      width: 'auto',
    },
  ]

  const [searchParams] = useSearchParams();
  let projectId = searchParams.get("projectId") || '';
  if (!projectId || projectId === '') {
    projectId = cache.getItem(CONSTANT.PROJECT_ID) || '';
  }

  return (<>
    <ProTable
      size={'small'}
      scroll={{x: 1300, y: 200}}
      rowKey="id"
      request={
        async (params) => {
          const result = await POST('/ncnb/queryHistory', {
            ...params,
            size: params.pageSize,
            queryId: props.queryId,
            "orders": [
              {
                "column": "createTime",
                "asc": false
              }
            ]
          });
          return {
            data: result?.data?.records,
            total: result?.data?.total,
            success: result.code === 200
          }
        }
      }
      pagination={{
        pageSize: 10,
        showQuickJumper: true,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (total) => `共 ${total} 条记录`
      }}
      columns={columns}
      search={false}
      options={false}
      dateFormatter="string"
    />
  </>);
};

export default React.memo(QueryHistory)
