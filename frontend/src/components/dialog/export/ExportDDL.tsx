import React, {useContext, useEffect, useRef} from 'react';
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


export type ExportDDLProps = {};

const ExportDDL: React.FC<ExportDDLProps> = (props) => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch, dbs, data} = useProjectStore(state => ({
    data: state.exportSliceState?.data || '',
    projectDispatch: state.dispatch,
    dbs: state.project.projectJSON?.profile?.dbs || [],
  }), shallow);


  useEffect(() => {
    projectDispatch.setExportData();

  });

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
              <AntButton type="primary" onClick={() => props.onSubmit?.()}>
                下一步
              </AntButton>
            );
          }


          return [
            <AntButton key="gotoTwo" onClick={() => props.onPre?.()}>
              上一步
            </AntButton>,
            <AntButton type="primary" key="goToTree" onClick={() => props.onSubmit?.()}>
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
              render: (props, doms) => {
                // @ts-ignore
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
          initialValue={projectDispatch.getCurrentDBName()}
          request={async () => dbs.map((db: any) => {
            return {label: db.name, value: db.key}
          })}
          fieldProps={{
            onChange: (value: any, option: any) => {
              projectDispatch.onDBChange(value);
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
            filterTreeNode: true,
            labelInValue: true,
            multiple: true,
            showArrow: true,
            maxTagCount: 10,
            treeCheckable: true,
            dropdownStyle: {maxHeight: 400, overflow: 'auto'},
            treeNodeFilterProp: 'title',
            fieldNames: {
              label: 'title',
            },
            onChange: (value: any, labelList: any, extra: any) => {
              const selectTable = value.map((m: any) => {
                return m.label;
              });
              projectDispatch.onSelectTableChange(selectTable);
              //`${d.name}/${c.title}`
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
