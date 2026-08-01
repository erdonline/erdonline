import React, {useContext, useEffect, useRef, useState} from 'react';
import { Button } from "antd";
import {MyIcon} from "@/components/Menu";
import {
  ModalForm,
  ProFormCheckbox,
  ProFormDependency,
  ProFormInstance,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTreeSelect,
  StepsForm
} from "@ant-design/pro-components";
import CodeEditor from "@/components/CodeEditor";
import {Button as AntButton} from "antd";
import _ from 'lodash';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {RadioChangeEvent} from "antd/lib/radio/interface";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";

/** ADR-0008：列表来自 /ncnb/dataSources，不读 profile.dbs */
type ExportDbOption = {
  key: string;
  name: string;
  select?: string;
};

const ExportDDL: React.FC = () => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch, data} = useProjectStore(state => ({
    data: state.exportSliceState?.data || '',
    projectDispatch: state.dispatch,
  }), shallow);
  const [dbs, setDbs] = useState<ExportDbOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = (await projectDispatch.refreshDataSources()) as ExportDbOption[];
      if (cancelled) {
        return;
      }
      setDbs(list || []);
      const current = projectDispatch.getCurrentDBData() as ExportDbOption | undefined;
      const picked = current || list?.[0];
      if (picked?.select) {
        projectDispatch.onDBChange(picked.select);
      }
      projectDispatch.setExportData();
    })();
    return () => {
      cancelled = true;
    };
  }, [projectDispatch]);

  const currentDb = projectDispatch.getCurrentDBData() as ExportDbOption | undefined;
  const formRef = useRef<ProFormInstance>();
  return (<>


    <StepsForm
      formRef={formRef}
      onFinish={async () => {
        projectDispatch.exportSQL();
      }}

      formProps={{
        validateMessages: {
          required: '此项为必填项',
        },
      }}
      submitter={{
        render: (props) => {
          if (props.step === 0) {
            return (
              <AntButton
                type="primary"
                aria-label="下一步"
                onClick={() => props.onSubmit?.()}
              >
                下一步
              </AntButton>
            );
          }


          return [
            <AntButton
              key="gotoTwo"
              aria-label="上一步"
              onClick={() => props.onPre?.()}
            >
              上一步
            </AntButton>,
            <AntButton
              type="primary"
              key="goToTree"
              aria-label="导出"
              onClick={() => props.onSubmit?.()}
            >
              导出
            </AntButton>,
          ];
        },
      }}
      stepsFormRender={(dom, submitter) => {
        return (
          <ModalForm
            title={<span>SQL导出配置</span>}
            trigger={
              <Button
                key="DDL"
                type="text"
                size="small"
                block
                icon={<MyIcon type="icon-DDL"/>}
                style={{ textAlign: 'left' }}
                aria-label="导出DDL"
                onClick={() => closeProjectMenu()}
              >导出DDL</Button>
            }
            // 完全自定义整个区域
            submitter={{
              // 完全自定义整个区域
              render: () => {
                return _.concat(submitter, []);
              },
            }}
          >
            {dom}
          </ModalForm>
        );
      }}
    >
      <StepsForm.StepForm
        name="database"
        title="选择数据源及导出的表"
        onFinish={async () => {
          return true;
        }}
      >
        <ProFormSelect
          name="currentDB"
          label="数据源"
          width="md"
          rules={[{required: true}]}
          initialValue={currentDb?.key}
          params={{dbs}}
          request={async () => dbs.map((db) => ({
            label: db.name,
            value: db.key,
          }))}
          fieldProps={{
            'aria-label': '数据源',
            onChange: (value: string) => {
              const db = dbs.find((d) => d.key === value);
              // json2code 需要方言码（MYSQL…），不是 dataSource id
              projectDispatch.onDBChange(db?.select || value);
            }
          }}
        />
        <ProFormTreeSelect
          name="name"
          label="导出数据表"
          width="md"
          placeholder="点击选择要导出的表"
          allowClear
          rules={[{required: true}]}
          request={async () => {
            const initAllKeys = projectDispatch.initAllKeys();
            return initAllKeys || [];
          }}
          // tree-select args
          fieldProps={{
            'aria-label': '导出数据表',
            'data-testid': 'export-ddl-tables',
            filterTreeNode: true,
            labelInValue: true,
            multiple: true,
            showArrow: true,
            maxTagCount: 10,
            treeCheckable: true,
            treeDefaultExpandAll: true,
            dropdownStyle: {maxHeight: 400, overflow: 'auto'},
            treeNodeFilterProp: 'title',
            fieldNames: {
              label: 'title',
            },
            onChange: (value: any) => {
              const selectTable = value.map((m: any) => {
                return m.label;
              });
              projectDispatch.onSelectTableChange(selectTable);
            }
          }}
        />
      </StepsForm.StepForm>
      <StepsForm.StepForm
        name="db1"
        title="导出配置"
        onFinish={async () => {
          return true;
        }}
      >
        <ProFormRadio.Group
          key="exportType"
          name="exportType"
          label="导出内容"
          initialValue="all"
          options={[
            {
              label: '全部',
              value: 'all',
            },
            {
              label: '自定义',
              value: 'customer',
            },
          ]}
          fieldProps={{
            onChange: (e: RadioChangeEvent) => {
              projectDispatch.onExportTypeChange(e.target.value);
            }
          }}
        />
        <ProFormDependency name={['exportType']}>
          {({exportType}) => {
            if (exportType === 'customer') {
              return (
                <ProFormCheckbox.Group
                  key="customer"
                  name="customer"
                  label="自定义导出内容"
                  options={[{
                    label: '删表语句',
                    value: 'deleteTable',
                  }, {
                    label: '建表语句',
                    value: 'createTable',
                  }, {
                    label: '建索引语句',
                    value: 'createIndex',
                  }, {
                    label: '表注释语句',
                    value: 'updateComment',
                  },
                  ]}
                  fieldProps={{
                    onChange: (checkedValue: any) => {
                      projectDispatch.onCustomTypeChange(checkedValue);
                    }
                  }}
                />
              );
            }
            return <></>;
          }}
        </ProFormDependency>

        <ProFormText
          label="预览"
        >
          <CodeEditor
            mode='mysql'
            value={data}
          />
        </ProFormText>
      </StepsForm.StepForm>

    </StepsForm>
  </>);
};

export default React.memo(ExportDDL)
