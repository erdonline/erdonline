import React, {useContext, useEffect, useState} from 'react';
import {Button, Form, message, Modal, Select, Spin, Steps} from 'antd';
import {MyIcon} from '@/components/Menu';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import _ from 'lodash';
import ReverseTable from '@/components/TableTransfer/ReverseTable';
import {fetchDatabaseConfigs} from '@/utils/databaseUtils';
import {dbReverseMeta} from '@/utils/save';
import {ProjectMenuCloseContext} from '@/components/Menu/projectMenuClose';
import type {MenuDialogControl} from '@/components/Menu/menuDialog';
import '../io-modal.scss';

export type DatabaseReverseProps = MenuDialogControl;

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

const ReverseDatabase: React.FC<DatabaseReverseProps> = ({
  hideTrigger,
  open: openProp,
  onOpenChange,
}) => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch, profileSliceState} = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      profileSliceState: state.profileSliceState || {},
    }),
    shallow,
  );

  const [dbs, setDbs] = useState<any[]>([]);
  const [reverseMeta, setReverseMeta] = useState<ReverseMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [currentDbName, setCurrentDbName] = useState<string | undefined>();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) {
      setInnerOpen(v);
    }
    onOpenChange?.(v);
  };
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form1] = Form.useForm<Step1Values>();

  const {flag, status, loading} = profileSliceState;

  useEffect(() => {
    const fetchDatabases = async () => {
      const databases = await fetchDatabaseConfigs();
      setDbs(databases);
      const initialName = projectDispatch.getCurrentDBName();
      if (initialName) {
        setCurrentDbName(initialName);
      }
    };
    void fetchDatabases();
  }, [projectDispatch]);

  useEffect(() => {
    if (!open) {
      return;
    }
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
          ...(db.key ? {dataSourceId: db.key} : {}),
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
  }, [currentDbName, dbs, open, form1]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep(0);
    form1.setFieldsValue({
      currentDB: projectDispatch.getCurrentDBName(),
      dataFormat: 'DEFAULT',
    });
    setCurrentDbName(projectDispatch.getCurrentDBName());
  }, [open, form1, projectDispatch]);

  const openModal = () => {
    closeProjectMenu();
    setOpen(true);
  };

  const goNext = async () => {
    const fieldsValue = await form1.validateFields();
    const db = dbs.filter((d: any) => d.name === fieldsValue?.currentDB)[0];
    projectDispatch.dbReverseParse(
      db,
      fieldsValue?.dataFormat,
      reverseMeta?.supportsSchema ? fieldsValue?.schema : undefined,
    );
    setStep(1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const ok = await projectDispatch.getSelectedEntity();
      if (ok) {
        setOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {hideTrigger ? null : (
        <Button
          key="reverse"
          type="text"
          size="small"
          block
          icon={<MyIcon type="icon-line-height" />}
          style={{textAlign: 'left'}}
          aria-label="数据源逆向解析"
          onClick={openModal}
        >
          数据源逆向解析
        </Button>
      )}
      <Modal
        title={
          <span>
            解析已有数据源
            <span style={{color: '#888', fontSize: 12}}>（含非主键索引）</span>
          </span>
        }
        open={open}
        onCancel={() => setOpen(false)}
        destroyOnClose
        width={640}
        className="erd-io-modal"
        rootClassName="erd-io-modal-root"
        transitionName=""
        maskTransitionName=""
        footer={
          step === 0
            ? [
                <Button key="next" type="primary" aria-label="下一步" onClick={() => void goNext()}>
                  下一步 {'>'}
                </Button>,
              ]
            : [
                <Button key="prev" aria-label="上一步" onClick={() => setStep(0)}>
                  {'<'} 上一步
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  aria-label="提交"
                  loading={submitting}
                  onClick={() => void handleSubmit()}
                >
                  提交 √
                </Button>,
              ]
        }
      >
        <Steps
          current={step}
          size="small"
          className="erd-io-modal__steps"
          items={[{title: '选择数据源'}, {title: '解析数据源'}]}
        />
        {step === 0 && (
          <Form
            form={form1}
            layout="vertical"
            size="small"
            initialValues={{
              currentDB: projectDispatch.getCurrentDBName(),
              dataFormat: 'DEFAULT',
            }}
            requiredMark
          >
            <Form.Item
              name="currentDB"
              label="请选择需要解析的数据源："
              rules={[{required: true, message: '此项为必填项'}]}
            >
              <Select
                style={{maxWidth: 328}}
                aria-label="数据源"
                options={dbs.map((db: any) => ({label: db.name, value: db.name}))}
                onChange={(value: string) => setCurrentDbName(value)}
              />
            </Form.Item>
            {reverseMeta?.supportsSchema ? (
              <Form.Item
                name="schema"
                label="Schema："
                rules={[{required: true, message: '请选择 Schema'}]}
              >
                <Select
                  style={{maxWidth: 328}}
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
              label="逻辑名格式："
              rules={[{required: true, message: '此项为必填项'}]}
            >
              <Select
                style={{maxWidth: 328}}
                aria-label="逻辑名格式"
                options={[
                  {label: '不处理', value: 'DEFAULT'},
                  {label: '全大写', value: 'UPPERCASE'},
                  {label: '全小写', value: 'LOWCASE'},
                ]}
              />
            </Form.Item>
          </Form>
        )}
        {step === 1 && (
          <Spin tip="正在解析数据源，请稍后。。。(请勿关闭当前弹窗！)" spinning={loading}>
            {!flag && (status === 'SUCCESS' ? <ReverseTable /> : '解析失败')}
          </Spin>
        )}
      </Modal>
    </>
  );
};

export default React.memo(ReverseDatabase);
