import {ProForm, ModalForm, ProFormInstance, ProFormSelect, StepsForm} from '@ant-design/pro-components';
import React, {useRef, useState, useEffect} from 'react';
import {Button as AntButton, Spin, message} from 'antd';
import { Button } from "antd";
import {MyIcon} from "@/components/Menu";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import _ from 'lodash';
import ReverseTable from "@/components/TableTransfer/ReverseTable";
import { fetchDatabaseConfigs } from '@/utils/databaseUtils';
import { dbReverseMeta } from '@/utils/save';

export type DatabaseReverseProps = {};

type ReverseMeta = {
  dialectId?: string;
  supportsSchema?: boolean;
  schemas?: string[];
};

const ReverseDatabase: React.FC<DatabaseReverseProps> = () => {
  const { projectDispatch, profileSliceState } = useProjectStore(state => ({
    projectDispatch: state.dispatch,
    profileSliceState: state.profileSliceState || {},
  }), shallow);

  const [dbs, setDbs] = useState([]);
  const [reverseMeta, setReverseMeta] = useState<ReverseMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [currentDbName, setCurrentDbName] = useState<string | undefined>();

  useEffect(() => {
    const fetchDatabases = async () => {
      const databases = await fetchDatabaseConfigs();
      setDbs(databases);
      const initialName = projectDispatch.getCurrentDBName();
      if (initialName) {
        setCurrentDbName(initialName);
      }
    };
    fetchDatabases();
  }, []);

  const formRef = useRef<ProFormInstance>();

  const {flag, status, loading} = profileSliceState;

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      const db: any = dbs.find((d: any) => d.name === currentDbName);
      if (!db?.properties) {
        setReverseMeta(null);
        return;
      }
      setMetaLoading(true);
      try {
        const dbConfig = _.omit(db.properties, ['driver_class_name']);
        const res = await dbReverseMeta({
          ...dbConfig,
          driverClassName: db.properties['driver_class_name'],
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
  }, [currentDbName, dbs]);


  return (<>
    <ModalForm
      title={<span>解析已有数据源<span style={{color: "#888", fontSize: 12}}>（含非主键索引）</span></span>}
      trigger={
        <Button
          key="reverse"
          type="text"
          size="small"
          block
          icon={<MyIcon type="icon-line-height"/>}
          style={{ textAlign: 'left' }}
        >数据源逆向解析</Button>
      }
      onFinish={async () => {
        return projectDispatch.getSelectedEntity();
      }}
    >
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
              ];
            }

            return [
              <AntButton type="primary" key="gotoTwo" onClick={() => props.onPre?.()}>
                {'<'} 上一步
              </AntButton>,
              <AntButton type="primary" key="goToTree" onClick={() => props.onSubmit?.()}>
                提交 √
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
            const db = dbs.filter((d: any) => d.name === fieldsValue?.currentDB)[0];
            projectDispatch.dbReverseParse(
              db,
              fieldsValue?.dataFormat,
              reverseMeta?.supportsSchema ? fieldsValue?.schema : undefined,
            );
            return true;
          }}
        >
          <ProFormSelect
            name="currentDB"
            label="请选择需要解析的数据源："
            width="md"
            rules={[{required: true}]}
            initialValue={projectDispatch.getCurrentDBName()}
            fieldProps={{
              onChange: (value: string) => setCurrentDbName(value),
            }}
            request={async () => dbs.map((db: any) => {
              return {label: db.name, value: db.name}
            })}
          />
          {reverseMeta?.supportsSchema ? (
            <ProFormSelect
              name="schema"
              label="Schema："
              width="md"
              rules={[{required: true, message: '请选择 Schema'}]}
              options={(reverseMeta.schemas || []).map((name) => ({label: name, value: name}))}
              fieldProps={{ loading: metaLoading }}
            />
          ) : null}
          <ProFormSelect
            name="dataFormat"
            label="逻辑名格式："
            width="md"
            rules={[{required: true}]}
            initialValue={"DEFAULT"}
            request={async () => [
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
            <ProForm.Group>
              {
                !flag && (status === 'SUCCESS' ?
                  <ReverseTable/>
                  : '解析失败')
              }
            </ProForm.Group>
          </Spin>
        </StepsForm.StepForm>

      </StepsForm>
    </ModalForm>
  </>);
}

export default React.memo(ReverseDatabase)
