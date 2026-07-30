import {ProTable} from "@ant-design/pro-components";
import React from "react";

export type QueryResultProps = {
  tableResult: { 
    columns: any, 
    dataSource: any, 
    total: number,
    current: number,
    pageSize: number
  };
  onPageChange: (page: number, pageSize: number) => void;
};

const QueryResult: React.FC<QueryResultProps> = (props) => {

  const getColumns = () => {
    return props.tableResult.columns.map((k: any) => ({
      title: k,
      key: k,
      dataIndex: k,
      ellipsis: true,
      width: 150,
      render: (text: any) => text === null ? <span style={{fontWeight: '100'}}>{"<null>"}</span> : text
    }))
  }

  return (
    <ProTable
      size={'small'}
      scroll={{ x: 1300 ,y:200}}
      dataSource={props.tableResult.dataSource}
      rowKey="id"
      pagination={{
        current: props.tableResult.current,
        pageSize: props.tableResult.pageSize,
        total: props.tableResult.total,
        onChange: props.onPageChange,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      columns={getColumns()}
      search={false}
      options={false}
      dateFormatter="string"
    />
  );
};

export default React.memo(QueryResult)
