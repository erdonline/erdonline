import React, {useContext, useEffect, useRef, useState} from 'react';
import {Button, Form, message, Modal, Select, Steps} from 'antd';
import {useIntl} from '@umijs/max';
import type {RefSelectProps} from 'antd/es/select';
import { DatabaseOutlined } from '@ant-design/icons';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import _ from 'lodash';
import ReverseParseStep from '@/components/TableTransfer/ReverseParseStep';
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
  const intl = useIntl();
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
  const dbSelectRef = useRef<RefSelectProps>(null);

  const {status} = profileSliceState;
  const dataSourceAria = intl.formatMessage({ id: 'exportModal.dataSourceAria' });

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
          message.error(
            intl.formatMessage(
              { id: 'importModal.reverse.schemaFailed' },
              { msg: res?.msg || intl.formatMessage({ id: 'importModal.reverse.schemaFailedUnknown' }) },
            ),
          );
        }
      } catch (e: any) {
        if (!cancelled) {
          setReverseMeta(null);
          message.error(
            intl.formatMessage(
              { id: 'importModal.reverse.schemaFailed' },
              { msg: e?.message || String(e) },
            ),
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
  }, [currentDbName, dbs, open, form1, intl]);

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
          icon={<DatabaseOutlined />}
          style={{textAlign: 'left'}}
          aria-label={intl.formatMessage({ id: 'importModal.reverse.triggerAria' })}
          onClick={openModal}
        >
          {intl.formatMessage({ id: 'importModal.reverse.trigger' })}
        </Button>
      )}
      <Modal
        title={
          <span>
            {intl.formatMessage({ id: 'importModal.reverse.title' })}
            <span style={{color: '#888', fontSize: 12}}>
              {intl.formatMessage({ id: 'importModal.reverse.indexHint' })}
            </span>
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
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          const tryFocus = (attempt = 0) => {
            const input = document.querySelector<HTMLInputElement>(
              '.erd-io-modal-root [data-testid="reverse-db-select"]',
            );
            if (input) {
              dbSelectRef.current?.focus();
              return;
            }
            if (attempt >= 20) {
              return;
            }
            window.setTimeout(() => tryFocus(attempt + 1), 50);
          };
          window.setTimeout(() => tryFocus(), 0);
        }}
        footer={
          step === 0
            ? [
                <Button key="next" type="primary" aria-label={intl.formatMessage({ id: 'exportModal.nextAria' })} onClick={() => void goNext()}>
                  {intl.formatMessage({ id: 'importModal.reverse.nextWithArrow' })}
                </Button>,
              ]
            : [
                <Button key="prev" aria-label={intl.formatMessage({ id: 'exportModal.prevAria' })} onClick={() => setStep(0)}>
                  {intl.formatMessage({ id: 'importModal.reverse.prevWithArrow' })}
                </Button>,
                ...(status === 'SUCCESS'
                  ? [
                      <Button
                        key="submit"
                        type="primary"
                        aria-label={intl.formatMessage({ id: 'importModal.reverse.submitAria' })}
                        loading={submitting}
                        onClick={() => void handleSubmit()}
                      >
                        {intl.formatMessage({ id: 'importModal.reverse.submitWithCheck' })}
                      </Button>,
                    ]
                  : []),
              ]
        }
      >
        <Steps
          current={step}
          size="small"
          className="erd-io-modal__steps"
          items={[
            { title: intl.formatMessage({ id: 'importModal.reverse.step1' }) },
            { title: intl.formatMessage({ id: 'importModal.reverse.step2' }) },
          ]}
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
              label={intl.formatMessage({ id: 'importModal.reverse.dataSourceLabel' })}
              rules={[{required: true, message: intl.formatMessage({ id: 'exportModal.required' })}]}
            >
              <Select
                ref={dbSelectRef}
                style={{maxWidth: 328}}
                aria-label={dataSourceAria}
                data-testid="reverse-db-select"
                options={dbs.map((db: any) => ({label: db.name, value: db.name}))}
                onChange={(value: string) => setCurrentDbName(value)}
              />
            </Form.Item>
            {reverseMeta?.supportsSchema ? (
              <Form.Item
                name="schema"
                label={intl.formatMessage({ id: 'importModal.reverse.schemaLabel' })}
                rules={[{required: true, message: intl.formatMessage({ id: 'importModal.reverse.schemaRequired' })}]}
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
              label={intl.formatMessage({ id: 'importModal.reverse.logicNameLabel' })}
              rules={[{required: true, message: intl.formatMessage({ id: 'exportModal.required' })}]}
            >
              <Select
                style={{maxWidth: 328}}
                aria-label={intl.formatMessage({ id: 'importModal.reverse.logicNameLabel' })}
                options={[
                  {label: intl.formatMessage({ id: 'importModal.reverse.logicDefault' }), value: 'DEFAULT'},
                  {label: intl.formatMessage({ id: 'importModal.reverse.logicUpper' }), value: 'UPPERCASE'},
                  {label: intl.formatMessage({ id: 'importModal.reverse.logicLower' }), value: 'LOWCASE'},
                ]}
              />
            </Form.Item>
          </Form>
        )}
        {step === 1 && <ReverseParseStep />}
      </Modal>
    </>
  );
};

export default React.memo(ReverseDatabase);
