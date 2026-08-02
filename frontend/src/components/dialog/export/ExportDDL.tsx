import React, {useContext, useEffect, useMemo, useState} from 'react';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Steps,
  TreeSelect,
} from "antd";
import {MyIcon} from "@/components/Menu";
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
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch, data} = useProjectStore(state => ({
    data: state.exportSliceState?.data || '',
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

  const currentDb = projectDispatch.getCurrentDBData() as ExportDbOption | undefined;

  const dbOptions = useMemo(
    () => dbs.map((db) => ({ label: db.name, value: db.key })),
    [dbs],
  );

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
          icon={<MyIcon type="icon-DDL"/>}
          style={{ textAlign: 'left' }}
          aria-label="导出DDL"
          onClick={openModal}
        >
          导出DDL
        </Button>
      )}
      <Modal
        title="SQL导出配置"
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
                  下一步
                </Button>,
              ]
            : [
                <Button key="prev" aria-label="上一步" onClick={() => setStep(0)}>
                  上一步
                </Button>,
                <Button
                  key="export"
                  type="primary"
                  aria-label="导出"
                  loading={exporting}
                  onClick={() => void handleExport()}
                >
                  导出
                </Button>,
              ]
        }
      >
        <Steps
          current={step}
          size="small"
          className="erd-io-modal__steps"
          items={[
            { title: '选择数据源及导出的表' },
            { title: '导出配置' },
          ]}
        />
        {step === 0 && (
          <Form form={form1} layout="vertical" size="small" requiredMark>
            <Form.Item
              name="currentDB"
              label="数据源"
              rules={[{ required: true, message: '此项为必填项' }]}
              initialValue={currentDb?.key}
            >
              <Select
                aria-label="数据源"
                options={dbOptions}
                onChange={(value: string) => {
                  const db = dbs.find((d) => d.key === value);
                  projectDispatch.onDBChange(db?.select || value);
                }}
              />
            </Form.Item>
            <Form.Item
              name="name"
              label="导出数据表"
              rules={[{ required: true, message: '此项为必填项' }]}
            >
              <TreeSelect
                aria-label="导出数据表"
                data-testid="export-ddl-tables"
                placeholder="点击选择要导出的表"
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
            <Form.Item name="exportType" label="导出内容">
              <Radio.Group
                onChange={(e: RadioChangeEvent) => {
                  setExportType(e.target.value);
                  projectDispatch.onExportTypeChange(e.target.value);
                }}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '自定义', value: 'customer' },
                ]}
              />
            </Form.Item>
            {exportType === 'customer' && (
              <Form.Item name="customer" label="自定义导出内容">
                <Checkbox.Group
                  options={[
                    { label: '删表语句', value: 'deleteTable' },
                    { label: '建表语句', value: 'createTable' },
                    { label: '建索引语句', value: 'createIndex' },
                    { label: '表注释语句', value: 'updateComment' },
                  ]}
                  onChange={(checkedValue) => {
                    projectDispatch.onCustomTypeChange(checkedValue as unknown as string);
                  }}
                />
              </Form.Item>
            )}
            <Form.Item label="预览">
              <Input style={{ display: 'none' }} />
              <CodeEditor mode="mysql" value={data} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
};

export default React.memo(ExportDDL)
