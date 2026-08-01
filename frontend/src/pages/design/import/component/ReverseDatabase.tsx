import {ProFormInstance, ProFormSelect, StepsForm} from '@ant-design/pro-components';
import React, {useRef, useState, useEffect} from 'react';
import {Button as AntButton, Spin, Form} from 'antd';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import ReverseTable from "@/components/TableTransfer/ReverseTable";
import { DataSourceSelect } from "@/components/DataSourceSelect";
// 移除 fetchDatabaseConfigs 的导入，因为我们不再直接使用它

export type DatabaseReverseProps = {};

const ReverseDatabase: React.FC<DatabaseReverseProps> = (props) => {
  const {projectDispatch, profileSliceState} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
    profileSliceState: state.profileSliceState || {},
  }), shallow);

  const [selectedDb, setSelectedDb] = useState(null);
  const [selectedDbValue, setSelectedDbValue] = useState(null);

  const formRef = useRef<ProFormInstance>();

  const {flag, status, loading} = profileSliceState;

  useEffect(() => {
    if (selectedDbValue) {
      formRef.current?.setFieldsValue({ currentDB: selectedDbValue.value });
    }
  }, [selectedDbValue]);

  // 移除整个 useEffect 钩子
  // useEffect(() => {
  //   const fetchDatabases = async () => {
  //     const databases = await fetchDatabaseConfigs();
  //     setDbs(databases);
  //   };
  //   fetchDatabases();
  // }, []);

  return (<>
    {/*    <ModalForm
      title={<span>解析已有数据源<span style={{color: "red"}}>（暂时不支持索引解析生成）</span></span>}
      trigger={
        <Button
          key="reverse"
          icon={<MyIcon type="icon-line-height"/>}
          text="数据源逆向解析"
          minimal={true}
          small={true}
          fill={true}
          alignText={Alignment.LEFT}></Button>
      }
      onFinish={async () => {
        return projectDispatch.getSelectedEntity();
      }}
    >*/}
    <span>解析已有数据源<span style={{color: "red"}}>（暂时不支持索引解析生成）</span></span>
    <StepsForm
      formRef={formRef}
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
                下一步 {'>'}
              </AntButton>
            );
          }

          if (props.step === 1) {
            return [
              <AntButton type="primary" key="gotoTwo" onClick={() => props.onPre?.()}>
                {'<'} 上一步
              </AntButton>,
              <AntButton type="primary" key="goToTree" onClick={() => projectDispatch.getSelectedEntity()}>
                提交
              </AntButton>,
            ];
          }

          return [
            <AntButton type="primary" key="gotoTwo" onClick={() => props.onPre?.()}>
              {'<'} 上一步
            </AntButton>,
            <AntButton type="primary" key="goToTree" onClick={() => projectDispatch.getSelectedEntity()}>
              提交
            </AntButton>,
          ];
        },
      }}
    >
      <StepsForm.StepForm
        name="database"
        title="选择数据源"
        onFinish={async () => {
          const fieldsValue = formRef.current?.getFieldsValue();
          projectDispatch.dbReverseParse(selectedDb, fieldsValue?.dataFormat);
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
            }}
            style={{ width: '328px' }}  // 设置固定宽度
          />
        </Form.Item>
        <ProFormSelect
          name="dataFormat"
          label="逻辑名格式"
          width={328}  // 使用相同的宽度
          rules={[{required: true, message: '请选择逻辑名格式'}]}
          initialValue="DEFAULT"
          options={[
            {label: '不处理', value: 'DEFAULT'},
            {label: '全大写', value: 'UPPERCASE'},
            {label: '全小写', value: 'LOWCASE'},
          ]}
        />
      </StepsForm.StepForm>
      <StepsForm.StepForm
        name="parse"
        title="解析数据源"
        onFinish={async () => {
          return true;
        }}

      >
        <Spin tip="正在解析数据源，请稍后。。。(请勿关闭当前弹窗！)" spinning={loading}>

            {
              !flag && (status === 'SUCCESS' ?
                <ReverseTable/>
                : '解析失败')
            }

        </Spin>
      </StepsForm.StepForm>

    </StepsForm>
    {/*
    </ModalForm>
*/}
  </>);
}

export default React.memo(ReverseDatabase)
