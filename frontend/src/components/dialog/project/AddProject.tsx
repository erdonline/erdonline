import React from 'react';
import {ModalForm, ProFormSelect, ProFormText, ProFormTextArea} from '@ant-design/pro-components';
import defaultData from "@/utils/defaultData.json";
import {Button, message} from "antd";
import _ from "lodash";
import {addProject} from "@/services/project";
import {addGroupProject} from "@/services/group-project";

export type AddProjectProps = {
  fetchProjects: any;
  trigger: string;
};

const AddProject: React.FC<AddProjectProps> = (props) => {

  const emptyProject = {
    "projectName": "",
    "description": "",
    "tags": "",
    "projectJSON": {
      ...defaultData
    },
    "configJSON": {synchronous: {upgradeType: "increment"}},
  }

  return (<>
    <ModalForm
      title="新增项目"
      trigger={
        <Button type="primary" data-testid="project-create-trigger">新建</Button>
      }
      initialValues={{
        type: 1,
        tags: ['新建'],
      }}
      onFinish={async (values: any) => {
        const addFunction = values.type === 1 ? addProject : addGroupProject;
        const res: any = await addFunction({
          ...emptyProject,
          projectName: values.projectName,
          description: values.description,
          tags: _.join(values.tags, ',')
        });
        if (res?.code === 200) {
          message.success('创建成功');
          props.fetchProjects();
          return true;
        }
        if (!res?.msg && !res?.message) {
          message.error('创建失败');
        }
        return false;
      }}
    >
      <ProFormSelect
        width="md"
        name="type"
        label="项目类型"
        placeholder="请选择项目类型"
        options={[
          { label: '个人项目', value: 1 },
          { label: '团队项目', value: 2 },
        ]}
        rules={[{ required: true, message: '请选择项目类型' }]}
      />
      
      <ProFormText width="md"
                   name="projectName"
                   label="项目名"
                   placeholder="请输入项目名"
                   formItemProps={{
                     rules: [
                       {
                         required: true,
                         message: '不能为空',
                       },
                       {
                         max: 100,
                         message: '不能大于 100 个字符',
                       },
                     ],
                   }}
      />

      <ProFormSelect width="md"
                     name="tags"
                     label="标签"
                     placeholder="请输入项目标签,按回车分割"
                     formItemProps={{
                       rules: [
                         {
                           required: true,
                           message: '不能为空',
                         },
                       ],
                     }}
                     fieldProps={{
                       mode: "tags",
                       tokenSeparators: [','],
                       'data-testid': 'project-tags',
                     } as any}
      />

      <ProFormTextArea
        width="md"
        name="description"
        label="项目描述"
        placeholder="请输入项目描述"
        formItemProps={{
          rules: [
            {
              required: true,
              message: '不能为空',
            },
            {
              max: 100,
              message: '不能大于 100 个字符',
            },
          ],
        }}
      />
    </ModalForm>
  </>);
}

export default React.memo(AddProject)
