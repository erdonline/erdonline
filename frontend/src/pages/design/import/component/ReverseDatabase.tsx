import React, {useEffect, useState} from 'react';
import {Button as AntButton, Form, message, Select, Spin, Steps} from 'antd';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import ReverseTable from '@/components/TableTransfer/ReverseTable';
import {DataSourceSelect} from '@/components/DataSourceSelect';
import {dbReverseMeta} from '@/utils/save';
import _ from 'lodash';

export type DatabaseReverseProps = {};

type ReverseMeta = {
  dialectId?: string;
  supportsSchema?: boolean;
  schemas?: string[];
};

type Step1Values = {
  currentDB?: string;
  schema?: string;
  dataFormat: string;
};

const ReverseDatabase: React.FC<DatabaseReverseProps> = () => {
  const {projectDispatch, profileSliceState} = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      profileSliceState: state.profileSliceState || {},
    }),
    shallow,
  );

  const [selectedDb, setSelectedDb] = useState<any>(null);
  const [selectedDbValue, setSelectedDbValue] = useState<any>(null);
  const [reverseMeta, setReverseMeta] = useState<ReverseMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form1] = Form.useForm<Step1Values>();

  const {flag, status, loading} = profileSliceState;

  useEffect(() => {
    if (selectedDbValue) {
      form1.setFieldsValue({currentDB: selectedDbValue.value});
    }
  }, [selectedDbValue, form1]);

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      if (!selectedDb?.properties) {
        setReverseMeta(null);
        form1.setFieldsValue({schema: undefined});
        return;
      }
      setMetaLoading(true);
      try {
        const dbConfig = _.omit(selectedDb.properties, ['driver_class_name']);
        const res = await dbReverseMeta({
          ...dbConfig,
          driverClassName: selectedDb.properties['driver_class_name'],
          ...(selectedDb.key ? {dataSourceId: selectedDb.key} : {}),
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
          form1.setFieldsValue({
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
    void loadMeta();
    return () => {
      cancelled = true;
    };
  }, [selectedDb, form1]);

  const goNext = async () => {
    const fieldsValue = await form1.validateFields();
    projectDispatch.dbReverseParse(
      selectedDb,
      fieldsValue?.dataFormat,
      reverseMeta?.supportsSchema ? fieldsValue?.schema : undefined,
    );
    setStep(1);
  };

  return (
    <>
      <span>
        解析已有数据源<span style={{color: 'red'}}>（含非主键索引）</span>
      </span>
      <Steps
        current={step}
        size="small"
        style={{marginTop: 16, marginBottom: 24}}
        items={[{title: '选择数据源'}, {title: '解析数据源'}]}
      />
      {step === 0 && (
        <Form
          form={form1}
          layout="vertical"
          initialValues={{dataFormat: 'DEFAULT'}}
          requiredMark
        >
          <Form.Item
            label="数据源"
            name="currentDB"
            rules={[{required: true, message: '请选择数据源'}]}
          >
            <DataSourceSelect
              value={selectedDbValue}
              onChange={(value) => {
                setSelectedDbValue(value);
              }}
              onDbChange={(db) => {
                setSelectedDb(db);
              }}
              style={{width: '328px'}}
            />
          </Form.Item>
          {reverseMeta?.supportsSchema ? (
            <Form.Item
              name="schema"
              label="Schema"
              rules={[{required: true, message: '请选择 Schema'}]}
              extra={reverseMeta.dialectId ? `方言：${reverseMeta.dialectId}` : undefined}
            >
              <Select
                style={{width: 328}}
                loading={metaLoading}
                aria-label="Schema"
                options={(reverseMeta.schemas || []).map((name) => ({
                  label: name,
                  value: name,
                }))}
              />
            </Form.Item>
          ) : null}
          <Form.Item
            name="dataFormat"
            label="逻辑名格式"
            rules={[{required: true, message: '请选择逻辑名格式'}]}
          >
            <Select
              style={{width: 328}}
              aria-label="逻辑名格式"
              options={[
                {label: '不处理', value: 'DEFAULT'},
                {label: '全大写', value: 'UPPERCASE'},
                {label: '全小写', value: 'LOWCASE'},
              ]}
            />
          </Form.Item>
          <AntButton type="primary" aria-label="下一步" onClick={() => void goNext()}>
            下一步 {'>'}
          </AntButton>
        </Form>
      )}
      {step === 1 && (
        <>
          <Spin tip="正在解析数据源，请稍后。。。(请勿关闭当前弹窗！)" spinning={loading}>
            {!flag && (status === 'SUCCESS' ? <ReverseTable /> : '解析失败')}
          </Spin>
          <div style={{marginTop: 16}}>
            <AntButton aria-label="上一步" onClick={() => setStep(0)} style={{marginRight: 8}}>
              {'<'} 上一步
            </AntButton>
            <AntButton
              type="primary"
              aria-label="提交"
              onClick={() => projectDispatch.getSelectedEntity()}
            >
              提交
            </AntButton>
          </div>
        </>
      )}
    </>
  );
};

export default React.memo(ReverseDatabase);
