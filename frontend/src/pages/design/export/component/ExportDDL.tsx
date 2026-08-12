import React, {useEffect, useMemo, useState} from 'react';
import {
  Button as AntButton,
  Checkbox,
  Form,
  Radio,
  Spin,
  Steps,
  TreeSelect,
} from "antd";
import CodeEditor from "@/components/CodeEditor";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {RadioChangeEvent} from "antd/lib/radio/interface";
import { DataSourceSelect } from "@/components/DataSourceSelect";
import { designIntl } from '@/pages/design/locales/intl';
import '../../secondary-pane.scss';

export type ExportDDLProps = {};

type Step1Values = {
  currentDB: unknown;
  name: { label: string; value: string }[];
};

type Step2Values = {
  exportType: string;
  customer?: string[];
};

const ExportDDL: React.FC<ExportDDLProps> = () => {
  const {projectDispatch, data, exportDdlLoading} = useProjectStore(state => ({
    data: state.exportSliceState?.data || '',
    exportDdlLoading: state.exportSliceState?.exportDdlLoading,
    projectDispatch: state.dispatch,
  }), shallow);

  const [selectedDbValue, setSelectedDbValue] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [treeData, setTreeData] = useState<any[]>([]);
  const [form1] = Form.useForm<Step1Values>();
  const [form2] = Form.useForm<Step2Values>();

  const exportContentOptions = useMemo(
    () => [
      { label: designIntl('design.export.ddl.content.dropTable'), value: 'deleteTable' },
      { label: designIntl('design.export.ddl.content.createTable'), value: 'createTable' },
      { label: designIntl('design.export.ddl.content.createIndex'), value: 'createIndex' },
      { label: designIntl('design.export.ddl.content.tableComment'), value: 'updateComment' },
    ],
    [],
  );

  useEffect(() => {
    projectDispatch.setExportData();
    setTreeData(projectDispatch.initAllKeys() || []);
  }, [projectDispatch]);

  useEffect(() => {
    if (selectedDbValue) {
      form1.setFieldsValue({ currentDB: selectedDbValue.value });
    }
  }, [selectedDbValue, form1]);

  const goNext = async () => {
    await form1.validateFields();
    setStep(1);
  };

  const handleExport = async () => {
    await form2.validateFields();
    setExporting(true);
    try {
      await projectDispatch.exportSQL();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="erd-secondary-pane" data-testid="export-ddl-page">
      <h2 className="erd-secondary-pane__title">{designIntl('design.export.ddl.title')}</h2>
      <p className="erd-secondary-pane__hint">{designIntl('design.export.ddl.hint')}</p>
      <Steps
        current={step}
        size="small"
        className="erd-secondary-pane__steps"
        items={[
          { title: designIntl('design.export.ddl.step.select') },
          { title: designIntl('design.export.ddl.step.config') },
        ]}
      />
      {step === 0 && (
        <Form
          form={form1}
          layout="vertical"
          size="small"
          className="erd-secondary-pane__form"
        >
          <Form.Item
            label={designIntl('design.common.datasource')}
            name="currentDB"
            rules={[{ required: true, message: designIntl('design.common.selectDatasource') }]}
          >
            <DataSourceSelect
              value={selectedDbValue}
              onChange={(value) => {
                setSelectedDbValue(value);
              }}
              onDbChange={(db) => {
                projectDispatch.onDBChange(db.key);
              }}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label={designIntl('design.export.ddl.tables.label')}
            rules={[{ required: true, message: designIntl('design.common.requiredField') }]}
          >
            <TreeSelect
              style={{ width: '100%' }}
              placeholder={designIntl('design.export.ddl.tables.placeholder')}
              allowClear
              treeData={treeData}
              filterTreeNode
              labelInValue
              multiple
              showArrow
              maxTagCount={10}
              treeCheckable
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              treeNodeFilterProp="title"
              fieldNames={{ label: 'title' }}
              onChange={(value) => {
                const selectTable = (value || []).map((m: { label: string }) => m.label);
                projectDispatch.onSelectTableChange(selectTable);
              }}
            />
          </Form.Item>
          <AntButton type="primary" onClick={() => void goNext()}>
            {designIntl('design.common.next')}
          </AntButton>
        </Form>
      )}
      {step === 1 && (
        <Form
          form={form2}
          layout="vertical"
          size="small"
          className="erd-secondary-pane__form"
          initialValues={{ exportType: 'all' }}
        >
          <Form.Item name="exportType" label={designIntl('design.export.ddl.content.label')}>
            <Radio.Group
              onChange={(e: RadioChangeEvent) => {
                setExportType(e.target.value);
                projectDispatch.onExportTypeChange(e.target.value);
              }}
              options={[
                { label: designIntl('design.common.all'), value: 'all' },
                { label: designIntl('design.common.custom'), value: 'customer' },
              ]}
            />
          </Form.Item>
          {exportType === 'customer' && (
            <Form.Item name="customer" label={designIntl('design.export.ddl.content.customLabel')}>
              <Checkbox.Group
                options={exportContentOptions}
                onChange={(checkedValue) => {
                  projectDispatch.onCustomTypeChange(checkedValue as unknown as string);
                }}
              />
            </Form.Item>
          )}
          <Form.Item label={designIntl('design.common.preview')}>
            <Spin spinning={Boolean(exportDdlLoading)}>
              <CodeEditor
                height={'50vh'}
                width={'70vw'}
                mode='mysql'
                value={data}
              />
            </Spin>
          </Form.Item>
          <div className="erd-secondary-pane__actions">
            <AntButton key="gotoTwo" onClick={() => setStep(0)}>
              {designIntl('design.common.prev')}
            </AntButton>
            <AntButton
              type="primary"
              key="goToTree"
              loading={exporting}
              onClick={() => void handleExport()}
            >
              {designIntl('design.export.ddl.action.export')}
            </AntButton>
          </div>
        </Form>
      )}
    </div>
  );
};

export default React.memo(ExportDDL)
