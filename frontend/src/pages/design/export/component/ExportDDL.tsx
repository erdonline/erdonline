import React, {useEffect, useRef, useState} from 'react';
import {
  ProFormCheckbox,
  ProFormDependency,
  ProFormInstance,
  ProFormRadio,
  ProFormText,
  ProFormTreeSelect,
  StepsForm
} from "@ant-design/pro-components";
import CodeEditor from "@/components/CodeEditor";
import {Button as AntButton, Form} from "antd";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {RadioChangeEvent} from "antd/lib/radio/interface";
import { DataSourceSelect } from "@/components/DataSourceSelect";

export type ExportDDLProps = {};

const ExportDDL: React.FC<ExportDDLProps> = (props) => {
  const {projectDispatch, data} = useProjectStore(state => ({
    data: state.exportSliceState?.data || '',
    projectDispatch: state.dispatch,
  }), shallow);

  const [selectedDb, setSelectedDb] = useState(null);
  const [selectedDbValue, setSelectedDbValue] = useState(null);

  useEffect(() => {
    projectDispatch.setExportData();
  }, [projectDispatch]);

  const formRef = useRef<ProFormInstance>();

  useEffect(() => {
    if (selectedDbValue) {
      formRef.current?.setFieldsValue({ currentDB: selectedDbValue.value });
    }
  }, [selectedDbValue]);

  return (<>
    <StepsForm
      formRef={formRef}
      onFinish={async () => {
        // false 时 StepsForm 不视为完成（失败可见）
        return projectDispatch.exportSQL();
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
    >
      <StepsForm.StepForm
        name="database"
        title="选择数据源及导出的表"
        onFinish={async () => {
          return true;
        }}
      >
        <Form.Item
          label="数据源"
          name="currentDB"
          rules={[{ required: true, message: '请选择数据源' }]}
        >
          <DataSourceSelect
            value={selectedDbValue}
            onChange={(value) => {
              setSelectedDbValue(value);
            }}
            onDbChange={(db) => {
              setSelectedDb(db);
              projectDispatch.onDBChange(db.key);
            }}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <ProFormTreeSelect
          name="name"
          label="导出数据表"
          placeholder="点击选择要导出的表"
          allowClear
          rules={[{required: true}]}
          request={async () => {
            const initAllKeys = projectDispatch.initAllKeys();
            return initAllKeys || [];
          }}
          fieldProps={{
            style: { width: '100%' },  // 设置宽度为100%
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
            height={'50vh'}
            width={'70vw'}
            mode='mysql'
            value={data}
          />
        </ProFormText>
      </StepsForm.StepForm>

    </StepsForm>
  </>);
};

export default React.memo(ExportDDL)
