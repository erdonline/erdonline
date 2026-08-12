import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Spin,
  Steps,
  TreeSelect,
} from "antd";
import { useIntl } from '@umijs/max';
import type {RefSelectProps} from 'antd/es/select';
import { CodeOutlined } from '@ant-design/icons';
import CodeEditor from "@/components/CodeEditor";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import type { RadioChangeEvent } from "antd/lib/radio/interface";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";
import type { MenuDialogControl } from "@/components/Menu/menuDialog";
import '../io-modal.scss';

/** ADR-0008：列表来自 /ncnb/dataSources，不读 profile.dbs */
type ExportDbOption = {
  key: string;
  name: string;
  select?: string;
};

type Step1Values = {
  currentDB: string;
  name: { label: string; value: string }[];
};

type Step2Values = {
  exportType: string;
  customer?: string[];
};

const ExportDDL: React.FC<MenuDialogControl> = ({
  hideTrigger,
  open: openProp,
  onOpenChange,
}) => {
  const intl = useIntl();
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch, data, exportDdlLoading} = useProjectStore(state => ({
    data: state.exportSliceState?.data || '',
    exportDdlLoading: state.exportSliceState?.exportDdlLoading,
    projectDispatch: state.dispatch,
  }), shallow);
  const [dbs, setDbs] = useState<ExportDbOption[]>([]);
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) {
      setInnerOpen(v);
    }
    onOpenChange?.(v);
  };
  const [step, setStep] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [treeData, setTreeData] = useState<any[]>([]);
  const [form1] = Form.useForm<Step1Values>();
  const [form2] = Form.useForm<Step2Values>();
  const dbSelectRef = useRef<RefSelectProps>(null);

  const currentDb = projectDispatch.getCurrentDBData() as ExportDbOption | undefined;

  const dbOptions = useMemo(
    () => dbs.map((db) => ({ label: db.name, value: db.key })),
    [dbs],
  );

  const dataSourceAria = intl.formatMessage({ id: 'exportModal.dataSourceAria' });

  const openModal = () => {
    closeProjectMenu();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep(0);
    setExportType('all');
    form2.setFieldsValue({ exportType: 'all', customer: undefined });
  }, [open, form2]);

  useEffect(() => {
    if (!open) {
      return;
    }
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
      form1.setFieldsValue({
        currentDB: picked?.key,
        name: undefined,
      });
      setTreeData(projectDispatch.initAllKeys() || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, projectDispatch, form1]);

  const goNext = async () => {
    await form1.validateFields();
    setStep(1);
  };

  const handleExport = async () => {
    await form2.validateFields();
    setExporting(true);
    try {
      const ok = await projectDispatch.exportSQL();
      if (ok) {
        setOpen(false);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {hideTrigger ? null : (
        <Button
          key="DDL"
          type="text"
          size="small"
          block
          icon={<CodeOutlined />}
          style={{ textAlign: 'left' }}
          aria-label={intl.formatMessage({ id: 'exportModal.ddl.triggerAria' })}
          onClick={openModal}
        >
          {intl.formatMessage({ id: 'exportModal.ddl.trigger' })}
        </Button>
      )}
      <Modal
        title={intl.formatMessage({ id: 'exportModal.ddl.title' })}
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
              '.erd-io-modal-root [data-testid="export-ddl-db-select"]',
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
                  {intl.formatMessage({ id: 'exportModal.next' })}
                </Button>,
              ]
            : [
                <Button key="prev" aria-label={intl.formatMessage({ id: 'exportModal.prevAria' })} onClick={() => setStep(0)}>
                  {intl.formatMessage({ id: 'exportModal.prev' })}
                </Button>,
                <Button
                  key="export"
                  type="primary"
                  aria-label={intl.formatMessage({ id: 'exportModal.exportAria' })}
                  loading={exporting}
                  onClick={() => void handleExport()}
                >
                  {intl.formatMessage({ id: 'exportModal.export' })}
                </Button>,
              ]
        }
      >
        <Steps
          current={step}
          size="small"
          className="erd-io-modal__steps"
          items={[
            { title: intl.formatMessage({ id: 'exportModal.step1' }) },
            { title: intl.formatMessage({ id: 'exportModal.step2' }) },
          ]}
        />
        {step === 0 && (
          <Form form={form1} layout="vertical" size="small" requiredMark>
            <Form.Item
              name="currentDB"
              label={intl.formatMessage({ id: 'exportModal.dataSourceLabel' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'exportModal.required' }) }]}
              initialValue={currentDb?.key}
            >
              <Select
                ref={dbSelectRef}
                aria-label={dataSourceAria}
                data-testid="export-ddl-db-select"
                options={dbOptions}
                onChange={(value: string) => {
                  const db = dbs.find((d) => d.key === value);
                  projectDispatch.onDBChange(db?.select || value);
                }}
              />
            </Form.Item>
            <Form.Item
              name="name"
              label={intl.formatMessage({ id: 'exportModal.tablesLabel' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'exportModal.required' }) }]}
            >
              <TreeSelect
                aria-label={intl.formatMessage({ id: 'exportModal.tablesAria' })}
                data-testid="export-ddl-tables"
                placeholder={intl.formatMessage({ id: 'exportModal.tablesPlaceholder' })}
                allowClear
                treeData={treeData}
                filterTreeNode
                labelInValue
                multiple
                showArrow
                maxTagCount={10}
                treeCheckable
                treeDefaultExpandAll
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                treeNodeFilterProp="title"
                fieldNames={{ label: 'title' }}
                onChange={(value) => {
                  const selectTable = (value || []).map((m: { label: string }) => m.label);
                  projectDispatch.onSelectTableChange(selectTable);
                }}
              />
            </Form.Item>
          </Form>
        )}
        {step === 1 && (
          <Form
            form={form2}
            layout="vertical"
            size="small"
            initialValues={{ exportType: 'all' }}
          >
            <Form.Item name="exportType" label={intl.formatMessage({ id: 'exportModal.contentLabel' })}>
              <Radio.Group
                onChange={(e: RadioChangeEvent) => {
                  setExportType(e.target.value);
                  projectDispatch.onExportTypeChange(e.target.value);
                }}
                options={[
                  { label: intl.formatMessage({ id: 'exportModal.contentAll' }), value: 'all' },
                  { label: intl.formatMessage({ id: 'exportModal.contentCustom' }), value: 'customer' },
                ]}
              />
            </Form.Item>
            {exportType === 'customer' && (
              <Form.Item name="customer" label={intl.formatMessage({ id: 'exportModal.customContentLabel' })}>
                <Checkbox.Group
                  options={[
                    { label: intl.formatMessage({ id: 'exportModal.deleteTable' }), value: 'deleteTable' },
                    { label: intl.formatMessage({ id: 'exportModal.createTable' }), value: 'createTable' },
                    { label: intl.formatMessage({ id: 'exportModal.createIndex' }), value: 'createIndex' },
                    { label: intl.formatMessage({ id: 'exportModal.createTrigger' }), value: 'createTrigger' },
                    { label: intl.formatMessage({ id: 'exportModal.createForeignKey' }), value: 'createForeignKey' },
                    { label: intl.formatMessage({ id: 'exportModal.updateComment' }), value: 'updateComment' },
                  ]}
                  onChange={(checkedValue) => {
                    projectDispatch.onCustomTypeChange(checkedValue as unknown as string);
                  }}
                />
              </Form.Item>
            )}
            <Form.Item label={intl.formatMessage({ id: 'exportModal.previewLabel' })}>
              <Input style={{ display: 'none' }} />
              <Spin spinning={Boolean(exportDdlLoading)}>
                <CodeEditor mode="mysql" value={data} />
              </Spin>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
};

export default React.memo(ExportDDL)
