import {Card, Descriptions, Table, Typography} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import React from 'react';
import _ from 'lodash';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';

export type TableListItem = {
  key: number | string;
  title: string;
  chnname: string;
};

export type ReverseTableProps = {};

const ReverseTable: React.FC<ReverseTableProps> = () => {
  const {projectDispatch, profileSliceState} = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      profileSliceState: state.profileSliceState || {},
    }),
    shallow,
  );
  const {data, exists} = profileSliceState;
  const module = _.get(data, 'module', '');

  const columns: ColumnsType<TableListItem> = [
    {
      title: '表名「英文名」',
      width: 150,
      dataIndex: 'title',
      fixed: 'left',
      ellipsis: true,
      render: (_, entity) => {
        return (
          <Typography.Text
            copyable
            style={{color: exists.includes(entity.title) ? 'red' : undefined}}
          >
            {entity.title}
          </Typography.Text>
        );
      },
    },
    {
      title: '注释「中文名」',
      width: 150,
      dataIndex: 'chnname',
      align: 'left',
      ellipsis: true,
    },
  ];

  const tableListDataSource: TableListItem[] = [];

  module?.entities?.forEach((t: {title: string; chnname: string}) => {
    tableListDataSource.push({
      key: t.title,
      title: t.title,
      chnname: t.chnname,
    });
  });

  return (
    <>
      <Card size="small" style={{marginBottom: 16}}>
        <Descriptions size="small" column={3}>
          <Descriptions.Item label="数据源">
            {projectDispatch.getCurrentDBName()}
          </Descriptions.Item>
          <Descriptions.Item label="解析表">{module?.entities?.length}</Descriptions.Item>
          <Descriptions.Item
            label="存量表"
            labelStyle={{color: 'red'}}
            contentStyle={{color: 'red'}}
          >
            {exists.length}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Table<TableListItem>
        columns={columns}
        rowSelection={{
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          onChange: (selectedRowKeys) => {
            projectDispatch.saveSelectedRowKeys(selectedRowKeys);
          },
        }}
        pagination={{
          pageSize: 10,
        }}
        dataSource={tableListDataSource}
        rowKey="key"
        size="small"
      />
    </>
  );
};

export default React.memo(ReverseTable);
