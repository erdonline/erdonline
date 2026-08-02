import React, {useCallback, useEffect, useRef, useState} from "react";
import {Modal, Space, Table, Tag, Typography} from 'antd';
import type {ColumnsType, TablePaginationConfig} from "antd/es/table";
import {GET} from "@/services/crud";
import CancelApproval from "@/components/dialog/approval/CancelApproval";
import RepeatApproval from "@/components/dialog/approval/RepeatApproval";
import CodeEditor from "@/components/CodeEditor";

type ApprovalItem = {
  id: string;
  projectName: string;
  approveStatus: number;
  approveRemark: string;
  approveSql: string;
  approveResult: string;
  approveTime: string;
  createTime: string;
};

const STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: {text: '待审批', color: 'processing'},
  1: {text: '通过', color: 'success'},
  2: {text: '撤销', color: 'error'},
  3: {text: '拒绝', color: 'error'},
  4: {text: '复批', color: 'processing'},
};

const MyOrder: React.FC = () => {
  const [data, setData] = useState<ApprovalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageRef = useRef({page: 1, pageSize: 10});

  const tempHeight = document.body.clientHeight - 25;
  const tempWidth = document.body.clientWidth - 25;

  const loadData = useCallback(async (nextPage?: number, nextSize?: number) => {
    const p = nextPage ?? pageRef.current.page;
    const size = nextSize ?? pageRef.current.pageSize;
    setLoading(true);
    try {
      const result = await GET('/ncnb/approval/promote', {
        current: p,
        pageSize: size,
        size,
      });
      if (result?.code === 200) {
        setData(result?.data?.records || []);
        setTotal(result?.data?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const actionRef = useRef<{ reload?: (resetPage?: boolean) => void }>({
    reload: () => {
      void loadData();
    },
  });
  actionRef.current.reload = () => {
    void loadData();
  };

  useEffect(() => {
    pageRef.current = {page, pageSize};
    void loadData(page, pageSize);
  }, [page, pageSize, loadData]);

  const columns: ColumnsType<ApprovalItem> = [
    {
      title: '#',
      width: 48,
      render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: '项目事项',
      width: 200,
      dataIndex: 'approveRemark',
      ellipsis: true,
      render: (text: string) => (
        <Typography.Text copyable ellipsis={{tooltip: text}}>
          {text}
        </Typography.Text>
      ),
    },
    {
      title: '审批状态',
      width: 80,
      dataIndex: 'approveStatus',
      filters: Object.entries(STATUS_MAP).map(([value, meta]) => ({
        text: meta.text,
        value: Number(value),
      })),
      // API 常以字符串返回 status；与旧 ProTable `==` 行为对齐
      onFilter: (value, record) => Number(record.approveStatus) === Number(value),
      render: (status: number | string) => {
        const meta = STATUS_MAP[Number(status)] || {text: String(status), color: 'default'};
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: '审批反馈',
      width: 150,
      dataIndex: 'approveResult',
      ellipsis: true,
    },
    {
      title: '审批时间',
      width: 140,
      dataIndex: 'approveTime',
    },
    {
      title: '发起时间',
      width: 140,
      dataIndex: 'createTime',
    },
    {
      title: '操作',
      width: 200,
      key: 'option',
      fixed: 'right',
      render: (_text, record) => (
        <Space>
          {Number(record.approveStatus) === 0 && (
            <CancelApproval id={record.id} actionRef={actionRef} key="cancel"/>
          )}
          {(Number(record.approveStatus) === 2 || Number(record.approveStatus) === 3) && (
            <RepeatApproval id={record.id} actionRef={actionRef} key="repeat"/>
          )}
          <a
            key="view"
            onClick={() =>
              Modal.info({
                title: 'sql明细',
                width: tempWidth * 0.5,
                content: (
                  <CodeEditor
                    mode="mysql"
                    height={`${tempHeight * 0.5}px`}
                    value={record.approveSql}
                  />
                ),
              })
            }
          >
            查看
          </a>
        </Space>
      ),
    },
  ];

  const onTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  return (
    <>
      <div style={{marginBottom: 16}}>
        <span data-testid="page-title-orders">我的工单</span>
      </div>
      <Table<ApprovalItem>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
        }}
        onChange={onTableChange}
        locale={{
          emptyText: '暂无工单。团队项目可在「版本管理」版本行点「提交工单」发起 SQL 审批。',
        }}
        scroll={{x: true}}
      />
    </>
  );
};

export default React.memo(MyOrder)
