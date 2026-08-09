import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {GET} from "@/services/crud";
import PassApproval from "@/components/dialog/approval/PassApproval";
import RefuseApproval from "@/components/dialog/approval/RefuseApproval";
import {Button, Space, Table, Tag, Typography} from "antd";
import type {ColumnsType, TablePaginationConfig} from "antd/es/table";
import { useIntl } from '@@/exports';
import {showSqlDetailModal} from "@/utils/sqlDetailModal";
import "../approval-workorder.less";

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

export type ApprovalProps = {};
const Approval: React.FC<ApprovalProps> = () => {
  const intl = useIntl();
  const statusMap = useMemo(
    () =>
      ({
        0: {
          text: intl.formatMessage({ id: 'versionOrder.status.pending' }),
          color: 'processing',
        },
        1: {
          text: intl.formatMessage({ id: 'versionOrder.status.approved' }),
          color: 'success',
        },
        2: {
          text: intl.formatMessage({ id: 'versionOrder.status.revoked' }),
          color: 'error',
        },
        3: {
          text: intl.formatMessage({ id: 'versionOrder.status.rejected' }),
          color: 'error',
        },
        4: {
          text: intl.formatMessage({ id: 'versionOrder.status.reReview' }),
          color: 'processing',
        },
      }) as Record<number, { text: string; color: string }>,
    [intl],
  );

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
      const result = await GET('/ncnb/approval/approve', {
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
      title: intl.formatMessage({ id: 'versionOrder.column.subject' }),
      dataIndex: 'approveRemark',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Typography.Text copyable ellipsis={{tooltip: text}}>
          {text}
        </Typography.Text>
      ),
    },
    {
      title: intl.formatMessage({ id: 'versionOrder.column.status' }),
      width: 80,
      dataIndex: 'approveStatus',
      filters: Object.entries(statusMap).map(([value, meta]) => ({
        text: meta.text,
        value: Number(value),
      })),
      onFilter: (value, record) => Number(record.approveStatus) === Number(value),
      render: (status: number | string) => {
        const meta = statusMap[Number(status)] || {text: String(status), color: 'default'};
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: intl.formatMessage({ id: 'versionOrder.column.feedback' }),
      width: 150,
      dataIndex: 'approveResult',
      ellipsis: true,
    },
    {
      title: intl.formatMessage({ id: 'versionOrder.column.approvedAt' }),
      width: 140,
      dataIndex: 'approveTime',
    },
    {
      title: intl.formatMessage({ id: 'versionOrder.column.createdAt' }),
      dataIndex: 'createTime',
      width: 140,
    },
    {
      title: intl.formatMessage({ id: 'versionOrder.column.actions' }),
      key: 'option',
      fixed: 'right',
      width: 200,
      render: (_text, record) => (
        <Space size={4}>
          {(Number(record.approveStatus) === 0 || Number(record.approveStatus) === 4) && (
            <>
              <PassApproval id={record.id} actionRef={actionRef}/>
              <RefuseApproval id={record.id} actionRef={actionRef}/>
            </>
          )}
          <Button
            type="link"
            size="small"
            aria-label={intl.formatMessage({ id: 'versionOrder.action.viewSqlAria' })}
            data-testid="approval-view-sql"
            onClick={() =>
              showSqlDetailModal({
                sql: record.approveSql,
                width: tempWidth * 0.5,
                editorHeight: `${tempHeight * 0.5}px`,
              })
            }
          >
            {intl.formatMessage({ id: 'versionOrder.action.viewSql' })}
          </Button>
        </Space>
      ),
    },
  ];

  const onTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  return (
    <div className="approval-workorder-page" data-testid="approval-page">
      <div className="approval-workorder-page__toolbar" data-testid="approval-toolbar">
        <h2 className="approval-workorder-page__title" data-testid="page-title-approvals">
          {intl.formatMessage({ id: 'versionOrder.title.approvals' })}
        </h2>
      </div>
      <Table<ApprovalItem>
        className="approval-workorder-page__table"
        size="small"
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
          emptyText: intl.formatMessage({ id: 'versionOrder.empty.approvals' }),
        }}
        scroll={{x: true}}
      />
    </div>
  );
};

export default React.memo(Approval)
