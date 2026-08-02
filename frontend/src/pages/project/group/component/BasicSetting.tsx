import React from "react";
import {ProForm, ProFormSelect, ProFormText, ProFormTextArea} from '@ant-design/pro-components';
import {Divider, message, Space, Typography} from "antd";
import {GET} from "@/services/crud";
import {useSearchParams} from "@@/exports";
import _ from "lodash";
import RemoveGroupProject from "@/pages/project/group/component/RemoveGroupProject";
import {updateGroupProject} from "@/services/group-project";
import {Access, useAccess} from "@@/plugin-access";


const {Title, Text} = Typography;


export type BasicSettingProps = {};
const BasicSetting: React.FC<BasicSettingProps> = (props) => {
  const access = useAccess();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || '';
  return (<>
    <ProForm
      submitter={{
        // 完全自定义整个区域
        render: (props, dom) => {
          return access.canErdProjectGroupEdit ? dom : null;
        },
      }}
      onFinish={async (values) => {
        try {
          const r = await updateGroupProject({
            id: projectId,
            projectName: values.projectName,
            description: values.description,
            tags: _.join(values.tags, ','),
          });
          if (r?.code === 200) {
            message.success('修改成功');
            return;
          }
          // 业务码非 200：全局拦截器已 toast msg；此处兜底无 msg 的静默失败
          if (!r?.msg) {
            message.error('修改失败');
          }
        } catch {
          // HTTP/网络：request errorHandler 已 toast
        }
      }}
      params={{id: '100'}}
      formKey="base-form-use-demo"
      dateFormatter={(value, valueType) => {
        return value.format('YYYY/MM/DD HH:mm:ss');
      }}
      request={async () => {
        const result = await GET('/ncnb/project/group/get/' + projectId, {});
        const data = result?.data;
        if (!data) return {};
        const tags = data.tags;
        return {
          ...data,
          tags:
            typeof tags === 'string'
              ? tags
                  .split(/[,;]/)
                  .map((t: string) => t.trim())
                  .filter(Boolean)
              : tags,
        };
      }}
      autoFocusFirstInput
    >
      <Title level={4}>基本设置</Title>
      <ProFormText width="md"
                   name="projectName"
                   label="项目名"
                   placeholder="请输入项目名"
                   fieldProps={{
                     bordered: access.canErdProjectGroupEdit,
                     disabled: !access.canErdProjectGroupEdit,
                   }}
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
                     disabled={!access.canErdProjectGroupEdit}
                     bordered={access.canErdProjectGroupEdit}
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
                       tokenSeparators: [",", ";"]
                     }}
      />
      <ProFormTextArea
        width="md"
        name="description"
        label="项目描述"
        placeholder="请输入项目描述"
        fieldProps={{
          bordered: access.canErdProjectGroupEdit,
          disabled: !access.canErdProjectGroupEdit,
        }}
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
      <ProFormText width="md"
                   name="createTime"
                   label="创建时间"
                   fieldProps={{
                     bordered: false,
                     disabled: true,

                   }}
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
      <ProFormText width="md"
                   name="updateTime"
                   label="最后修改时间"
                   placeholder=""
                   fieldProps={{
                     bordered: false,
                     disabled: true,
                   }}
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
    </ProForm>


    <Divider/>
    <Access
      accessible={access.canErdProjectGroupDel}
      fallback={<></>}
    >
      <Space direction="vertical">
        <Title level={4}>删除项目</Title>
        <Text type="secondary">删除项目全部模型，此操作无法恢复</Text>
        <RemoveGroupProject projectId={projectId}/>
      </Space>
    </Access>
  </>);
};
export default React.memo(BasicSetting)
