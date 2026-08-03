import React, {useEffect, useState} from 'react';
import {
  Button as AntButton,
  Checkbox,
  Form,
  Radio,
  Steps,
  TreeSelect,
} from "antd";
import CodeEditor from "@/components/CodeEditor";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {RadioChangeEvent} from "antd/lib/radio/interface";
import { DataSourceSelect } from "@/components/DataSourceSelect";
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
  const {projectDispatch, data} = useProjectStore(state => ({
    data: state.exportSliceState?.data || '',
    projectDispatch: state.dispatch,
  }), shallow);

  const [selectedDbValue, setSelectedDbValue] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [treeData, setTreeData] = useState<any[]>([]);
  const [form1] = Form.useForm<Step1Values>();
  const [form2] = Form.useForm<Step2Values>();

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
      <h2 className="erd-secondary-pane__title">导出 DDL</h2>
      <p className="erd-secondary-pane__hint">选择数据源与表后导出 SQL；步骤条与设置页同密</p>
      <Steps
        current={step}
        size="small"
        className="erd-secondary-pane__steps"
        items={[
          { title: '选择数据源及导出的表' },
          { title: '导出配置' },
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
                projectDispatch.onDBChange(db.key);
              }}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="导出数据表"
            rules={[{ required: true, message: '此项为必填项' }]}
          >
            <TreeSelect
              style={{ width: '100%' }}
              placeholder="点击选择要导出的表"
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
            下一步
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
            <CodeEditor
              height={'50vh'}
              width={'70vw'}
              mode='mysql'
              value={data}
            />
          </Form.Item>
          <div className="erd-secondary-pane__actions">
            <AntButton key="gotoTwo" onClick={() => setStep(0)}>
              上一步
            </AntButton>
            <AntButton
              type="primary"
              key="goToTree"
              loading={exporting}
              onClick={() => void handleExport()}
            >
              导出
            </AntButton>
          </div>
        </Form>
      )}
    </div>
  );
};

export default React.memo(ExportDDL)
