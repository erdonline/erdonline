import React, {useEffect, useMemo, useState} from 'react';
import {Button as AntButton, Form, message, Select, Steps} from 'antd';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import ReverseParseStep from '@/components/TableTransfer/ReverseParseStep';
import {DataSourceSelect} from '@/components/DataSourceSelect';
import {dbReverseMeta} from '@/utils/save';
import { designIntl } from '@/pages/design/locales/intl';
import _ from 'lodash-es';
import '../../secondary-pane.scss';

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
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [form1] = Form.useForm<Step1Values>();

  const {status} = profileSliceState;

  const nameFormatOptions = useMemo(
    () => [
      { label: designIntl('design.import.reverseDb.nameFormat.default'), value: 'DEFAULT' },
      { label: designIntl('design.import.reverseDb.nameFormat.upper'), value: 'UPPERCASE' },
      { label: designIntl('design.import.reverseDb.nameFormat.lower'), value: 'LOWCASE' },
    ],
    [],
  );

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
          message.error(
            designIntl('design.import.reverseDb.error.readSchema', {
              reason: res?.msg || designIntl('design.import.reverseDb.error.unknown'),
            }),
          );
        }
      } catch (e: any) {
        if (!cancelled) {
          setReverseMeta(null);
          message.error(
            designIntl('design.import.reverseDb.error.readSchema', {
              reason: e?.message || String(e),
            }),
          );
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
    <div className="erd-secondary-pane erd-secondary-pane--import" data-testid="import-reverse-page">
      <div className="erd-secondary-pane__content">
        <h2 className="erd-secondary-pane__title">{designIntl('design.import.reverseDb.title')}</h2>
        <p className="erd-secondary-pane__hint">
          {designIntl('design.import.reverseDb.hint')}
          <span className="erd-secondary-pane__em">{designIntl('design.import.reverseDb.hintIndex')}</span>
        </p>
        <Steps
          current={step}
          size="small"
          className="erd-secondary-pane__steps"
          items={[
            {title: designIntl('design.import.reverseDb.step.select')},
            {title: designIntl('design.import.reverseDb.step.parse')},
          ]}
        />
        {step === 0 && (
          <Form
            form={form1}
            layout="vertical"
            size="small"
            className="erd-secondary-pane__form"
            initialValues={{dataFormat: 'DEFAULT'}}
            requiredMark
          >
            <Form.Item
              label={designIntl('design.common.datasource')}
              name="currentDB"
              rules={[{required: true, message: designIntl('design.common.selectDatasource')}]}
            >
              <DataSourceSelect
                value={selectedDbValue}
                onChange={(value) => {
                  setSelectedDbValue(value);
                }}
                onDbChange={(db) => {
                  setSelectedDb(db);
                }}
                style={{width: '100%'}}
              />
            </Form.Item>
            {reverseMeta?.supportsSchema ? (
              <Form.Item
                name="schema"
                label="Schema"
                rules={[{required: true, message: designIntl('design.import.reverseDb.schema.required')}]}
                extra={
                  reverseMeta.dialectId
                    ? designIntl('design.import.reverseDb.dialect.extra', { dialect: reverseMeta.dialectId })
                    : undefined
                }
              >
                <Select
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
              label={designIntl('design.import.reverseDb.nameFormat.label')}
              rules={[{required: true, message: designIntl('design.import.reverseDb.nameFormat.required')}]}
            >
              <Select
                aria-label={designIntl('design.import.reverseDb.nameFormat.label')}
                options={nameFormatOptions}
              />
            </Form.Item>
            <AntButton
              type="primary"
              aria-label={designIntl('design.import.reverseDb.nextAria')}
              onClick={() => void goNext()}
            >
              {designIntl('design.common.next')} {'>'}
            </AntButton>
          </Form>
        )}
        {step === 1 && (
          <>
            <ReverseParseStep />
            <div className="erd-secondary-pane__actions">
              <AntButton aria-label={designIntl('design.import.reverseDb.prevAria')} onClick={() => setStep(0)}>
                {'<'} {designIntl('design.common.prev')}
              </AntButton>
              {status === 'SUCCESS' ? (
                <AntButton
                  type="primary"
                  aria-label={designIntl('design.import.reverseDb.submitAria')}
                  loading={submitting}
                  onClick={() => {
                    void (async () => {
                      setSubmitting(true);
                      try {
                        await projectDispatch.getSelectedEntity();
                      } finally {
                        setSubmitting(false);
                      }
                    })();
                  }}
                >
                  {designIntl('design.common.submit')}
                </AntButton>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(ReverseDatabase);
