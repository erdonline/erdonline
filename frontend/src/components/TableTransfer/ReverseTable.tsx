import {Descriptions, Form, Input, Select, Table, Typography} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import React, {useEffect, useMemo} from 'react';
import {useIntl} from '@umijs/max';
import _ from 'lodash-es';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import {
  REVERSE_NEW_MODULE,
  sortReverseEntitiesForDisplay,
} from '@/utils/reverseImportUtils';
import '@/pages/design/secondary-pane.scss';

export type TableListItem = {
  key: number | string;
  title: string;
  chnname: string;
};

export type ReverseTableProps = {};

const ReverseTable: React.FC<ReverseTableProps> = () => {
  const intl = useIntl();
  const {projectDispatch, profileSliceState, projectModules} = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      profileSliceState: state.profileSliceState || {},
      projectModules: state.project?.projectJSON?.modules || [],
    }),
    shallow,
  );
  const {data, exists, keys, reverseImportTarget} = profileSliceState;
  const parsedModule = _.get(data, 'module', {});
  const parsedCode = parsedModule.code || '';
  const parsedName = parsedModule.name || parsedCode;

  const targetModuleCode = reverseImportTarget?.moduleCode || parsedCode;
  const targetModuleChnname = reverseImportTarget?.moduleChnname || parsedName;
  const useExistingModule = reverseImportTarget?.useExistingModule ?? false;

  useEffect(() => {
    if (!reverseImportTarget && parsedCode) {
      projectDispatch.setReverseImportTarget({
        moduleCode: parsedCode,
        moduleChnname: parsedName,
        useExistingModule: false,
      });
    }
  }, [parsedCode, parsedName, projectDispatch, reverseImportTarget]);

  const sortedEntities = useMemo(
    () => sortReverseEntitiesForDisplay(parsedModule.entities || [], exists || []),
    [parsedModule.entities, exists],
  );

  const tableListDataSource: TableListItem[] = sortedEntities.map((t: {title: string; chnname: string}) => ({
    key: t.title,
    title: t.title,
    chnname: t.chnname,
  }));

  const selectedRowKeys = (keys || []).map((k: {title: string}) => k.title);
  const allRowKeys = tableListDataSource.map((row) => row.key);

  const moduleOptions = useMemo(() => {
    const existing = (projectModules as Array<{name: string; chnname?: string}>).map((m) => ({
      label: m.chnname || m.name,
      value: m.name,
    }));
    return [
      {
        label: intl.formatMessage({ id: 'reverseTable.newModuleOption' }, { name: parsedName }),
        value: REVERSE_NEW_MODULE,
      },
      ...existing,
    ];
  }, [parsedName, projectModules, intl]);

  const moduleSelectValue = useExistingModule ? targetModuleCode : REVERSE_NEW_MODULE;

  const columns: ColumnsType<TableListItem> = [
    {
      title: intl.formatMessage({ id: 'reverseTable.colTitle' }),
      width: 150,
      dataIndex: 'title',
      fixed: 'left',
      ellipsis: true,
      render: (_, entity) => {
        return (
          <Typography.Text
            copyable
            className={exists.includes(entity.title) ? 'erd-secondary-pane__dup' : undefined}
          >
            {entity.title}
          </Typography.Text>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'reverseTable.colChnname' }),
      width: 150,
      dataIndex: 'chnname',
      align: 'left',
      ellipsis: true,
    },
  ];

  return (
    <div data-testid="reverse-entity-list">
      <Form layout="vertical" size="small" className="erd-secondary-pane__form">
        <Form.Item label={intl.formatMessage({ id: 'reverseTable.targetModuleLabel' })} required>
          <Select
            aria-label={intl.formatMessage({ id: 'reverseTable.targetModuleAria' })}
            data-testid="reverse-target-module"
            value={moduleSelectValue}
            options={moduleOptions}
            onChange={(value: string) => {
              if (value === REVERSE_NEW_MODULE) {
                projectDispatch.setReverseImportTarget({
                  moduleCode: parsedCode,
                  moduleChnname: parsedName,
                  useExistingModule: false,
                });
                return;
              }
              const picked = (projectModules as Array<{name: string; chnname?: string}>).find(
                (m) => m.name === value,
              );
              projectDispatch.setReverseImportTarget({
                moduleCode: value,
                moduleChnname: picked?.chnname || picked?.name || value,
                useExistingModule: true,
              });
            }}
          />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: 'reverseTable.moduleNameLabel' })} required>
          <Input
            aria-label={intl.formatMessage({ id: 'reverseTable.moduleNameAria' })}
            data-testid="reverse-target-module-name"
            value={targetModuleChnname}
            disabled={useExistingModule}
            onChange={(e) => {
              projectDispatch.setReverseImportTarget({
                moduleCode: targetModuleCode,
                moduleChnname: e.target.value,
                useExistingModule: false,
              });
            }}
          />
        </Form.Item>
      </Form>
      <div className="erd-secondary-pane__meta">
        <Descriptions size="small" column={3}>
          <Descriptions.Item label={intl.formatMessage({ id: 'reverseTable.dataSourceLabel' })}>
            {projectDispatch.getCurrentDBName()}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: 'reverseTable.parsedTablesLabel' })}>
            {parsedModule?.entities?.length}
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({ id: 'reverseTable.existingTablesLabel' })}
            labelStyle={{color: 'var(--erd-brand)'}}
            contentStyle={{color: 'var(--erd-brand)'}}
          >
            {exists.length}
          </Descriptions.Item>
        </Descriptions>
      </div>
      <div className="erd-secondary-pane__table">
        <Table<TableListItem>
          columns={columns}
          rowSelection={{
            selectedRowKeys,
            onChange: (nextKeys) => {
              projectDispatch.saveSelectedRowKeys(nextKeys);
            },
            selections: [
              {
                key: 'select-all',
                text: intl.formatMessage({ id: 'reverseTable.selectAll' }),
                onSelect: () => {
                  projectDispatch.saveSelectedRowKeys(allRowKeys);
                },
              },
              {
                key: 'select-invert',
                text: intl.formatMessage({ id: 'reverseTable.selectInvert' }),
                onSelect: () => {
                  const selected = new Set(selectedRowKeys);
                  const inverted = allRowKeys.filter((k) => !selected.has(k));
                  projectDispatch.saveSelectedRowKeys(inverted);
                },
              },
              {
                key: 'select-none',
                text: intl.formatMessage({ id: 'reverseTable.selectNone' }),
                onSelect: () => {
                  projectDispatch.saveSelectedRowKeys([]);
                },
              },
            ],
          }}
          pagination={{
            pageSize: 10,
          }}
          dataSource={tableListDataSource}
          rowKey="key"
          size="small"
        />
      </div>
    </div>
  );
};

export default React.memo(ReverseTable);
