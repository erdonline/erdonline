import React, {Ref, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {getDataByTemplate, getDemoTemplateData} from "@/utils/json2code";
import {ProForm, DrawerForm, ProFormRadio} from "@ant-design/pro-components";
import CodeEditor from "@/components/CodeEditor";
import {RadioChangeEvent} from "antd/lib/radio/interface";
import {Button, Col, Row} from "antd";
import _ from "lodash";


export type PreviewDatabaseProps = {
  onRef: Ref<any>;
  selectTab: string;
  template: any;
  setSelectTab: (a: any) => void;
  onTemplateEditorChange: (e: any, value: any, tab: any) => void;
};

const PreviewDatabase: React.FC<PreviewDatabaseProps> = (props) => {

  const {selectTab, template, setSelectTab, onTemplateEditorChange} = props;
  const [result, setResult] = useState('');

  const templateValue = _.get(template, [selectTab], '');
  const height = document.body.clientHeight;
  const tempHeight = height - 25;
  const formRef = useRef();
  const demoTemplateData = getDemoTemplateData(selectTab);

  useEffect(() => {
    setResult(demoTemplateData?getDataByTemplate(JSON.parse(demoTemplateData), templateValue):'');
  }, [selectTab]);


  const reSetResult = () => {
    setResult(demoTemplateData?getDataByTemplate(JSON.parse(demoTemplateData), templateValue):''
    );
  }
  useImperativeHandle(props.onRef, () => ({
    // changeVal 就是暴露给父组件的方法
    reSetResult: () => {
      reSetResult();
    }
  }));

  return (<>
    <DrawerForm
      title="预览编辑"
      formRef={formRef}
      trigger={
        <Button key="preview">预览编辑</Button>
      }
      drawerProps={{
        destroyOnClose: true,
        placement: "top",
        height: tempHeight * 0.8,
      }}
      submitter={{
        // 配置按钮文本
        searchConfig: {
          resetText: '取消',
          submitText: '预览',
        },
        submitButtonProps: {
          onClick: () => {
            reSetResult()
          }
        },

      }}
    >
      <ProForm.Group>
        <ProFormRadio.Group
          name="radio"
          radioType="button"
          initialValue={props.selectTab}
          fieldProps={{
            onChange: (e: RadioChangeEvent) => {
              setSelectTab(e.target.value);
              reSetResult();
            }
          }}
          options={[
            {
              label: '创建表',
              value: 'createTableTemplate',
            },
            {
              label: '表注释',
              value: 'updateTableComment',
            },
            {
              label: '删除表',
              value: 'deleteTableTemplate',
            },
            {
              label: '重建表',
              value: 'rebuildTableTemplate',
            },
            {
              label: '添加字段',
              value: 'createFieldTemplate',
            },
            {
              label: '修改字段',
              value: 'updateFieldTemplate',
            },
            {
              label: '删除字段',
              value: 'deleteFieldTemplate',
            },
            {
              label: '创建索引',
              value: 'createIndexTemplate',
            },
            {
              label: '删除索引',
              value: 'deleteIndexTemplate',
            },
            {
              label: '创建主键',
              value: 'createPkTemplate',
            },
            {
              label: '删除主键',
              value: 'deletePkTemplate',
            },
          ]}
        />
      </ProForm.Group>
      <Row gutter={16}>
        <Col span={6}>参考数据</Col>
        <Col span={12}>模板代码编辑</Col>
        <Col span={6}>预览</Col>
        <Col span={6}>
          <CodeEditor
            mode='json'
            height={`${tempHeight * 0.5}px`}
            value={demoTemplateData}
          />
        </Col>
        <Col span={12}>
          <CodeEditor
            mode='mysql'
            height={`${tempHeight * 0.5}px`}
            value={templateValue}
            onChange={(value: string, event?: any) => {
              onTemplateEditorChange(event, value, selectTab);
            }}
          />
        </Col>
        <Col span={6}>
          <CodeEditor
            mode='mysql'
            height={`${tempHeight * 0.5}px`}
            value={result}
          />
        </Col>
      </Row>
    </DrawerForm>
  </>);
}

export default PreviewDatabase
