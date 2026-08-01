import {ProFormInstance, ProFormSelect, StepsForm} from '@ant-design/pro-components';
import React, {useRef, useState, useEffect} from 'react';
import {Button as AntButton, Spin, Form, message} from 'antd';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import ReverseTable from "@/components/TableTransfer/ReverseTable";
import { DataSourceSelect } from "@/components/DataSourceSelect";
import { dbReverseMeta } from '@/utils/save';
import _ from 'lodash';

export type DatabaseReverseProps = {};

type ReverseMeta = {
  dialectId?: string;
  supportsSchema?: boolean;
  schemas?: string[];
};

const ReverseDatabase: React.FC<DatabaseReverseProps> = () => {
  const {projectDispatch, profileSliceState} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
    profileSliceState: state.profileSliceState || {},
  }), shallow);

  const [selectedDb, setSelectedDb] = useState<any>(null);
  const [selectedDbValue, setSelectedDbValue] = useState<any>(null);
  const [reverseMeta, setReverseMeta] = useState<ReverseMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  const formRef = useRef<ProFormInstance>();

  const {flag, status, loading} = profileSliceState;

  useEffect(() => {
    if (selectedDbValue) {
      formRef.current?.setFieldsValue({ currentDB: selectedDbValue.value });
    }
  }, [selectedDbValue]);

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      if (!selectedDb?.properties) {
        setReverseMeta(null);
        formRef.current?.setFieldsValue({ schema: undefined });
        return;
      }
      setMetaLoading(true);
      try {
        const dbConfig = _.omit(selectedDb.properties, ['driver_class_name']);
        const res = await dbReverseMeta({
          ...dbConfig,
          driverClassName: selectedDb.properties['driver_class_name'],
        });
        if (cancelled) {
          return;
        }
        if (res && res.code === 200) {
          const meta = res.data as ReverseMeta;
          setReverseMeta(meta);
          const schemas = meta?.schemas || [];
          const defaultSchema = schemas.includes('public')
            ? 'public'
            : schemas.includes('dbo')
              ? 'dbo'
              : schemas[0];
          formRef.current?.setFieldsValue({
            schema: meta?.supportsSchema ? defaultSchema : undefined,
          });
        } else {
          setReverseMeta(null);
          message.error('读取数据源 schema 失败：' + (res?.msg || '未知错误'));
        }
      } catch (e: any) {
        if (!cancelled) {
          setReverseMeta(null);
          message.error('读取数据源 schema 失败：' + (e?.message || e));
        }
      } finally {
        if (!cancelled) {
          setMetaLoading(false);
        }
      }
    };
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, [selectedDb]);

  return (<>
    <span>解析已有数据源<span style={{color: "red"}}>（含非主键索引）</span></span>
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
          projectDispatch.dbReverseParse(
            selectedDb,
            fieldsValue?.dataFormat,
            reverseMeta?.supportsSchema ? fieldsValue?.schema : undefined,
          );
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
            style={{ width: '328px' }}
          />
        </Form.Item>
        {reverseMeta?.supportsSchema ? (
          <ProFormSelect
            name="schema"
            label="Schema"
            width={328}
            rules={[{required: true, message: '请选择 Schema'}]}
            options={(reverseMeta.schemas || []).map((name) => ({label: name, value: name}))}
            fieldProps={{ loading: metaLoading }}
            extra={reverseMeta.dialectId ? `方言：${reverseMeta.dialectId}` : undefined}
          />
        ) : null}
        <ProFormSelect
          name="dataFormat"
          label="逻辑名格式"
          width={328}
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
  </>);
}

export default React.memo(ReverseDatabase)
