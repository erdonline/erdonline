import React from 'react';
import {ProForm, ModalForm, ProFormText} from '@ant-design/pro-components';
import useProjectStore from "@/store/project/useProjectStore";
import useTabStore, {TabGroup} from "@/store/tab/useTabStore";
import shallow from "zustand/shallow";
import {Button, message} from "antd";
import {PlusOutlined} from "@ant-design/icons";

export type AddEntityProps = {
  moduleDisable: boolean;
};

const AddEntity: React.FC<AddEntityProps> = (props) => {
  const {projectDispatch, currentModule} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
    currentModule: state.currentModule,
  }), shallow);
  const tabDispatch = useTabStore(state => state.dispatch);

  return (<>
    <ModalForm
      title="新建表"
      trigger={
        <Button icon={<PlusOutlined />}
                type="text"
                size={"small"}
                data-testid="add-entity-trigger"
                disabled={props.moduleDisable}>新建表</Button>
      }
      onFinish={async (values: any) => {
        if (!currentModule) {
          message.error('请先选择模型');
          return false;
        }
        projectDispatch.addEntity({
          title: values.title,
          chnname: values.chnname || '',
          moduleName: currentModule,
        });
        // 建表后直开关系图，跳过「双击表→再切关系图」两步
        tabDispatch.addTab({
          group: TabGroup.MODEL,
          module: currentModule,
          entity: `关系图-${currentModule}`,
        });
        return true;
      }}
    >
      <ProForm.Group>
        <ProFormText width="md"
                     name="title"
                     label="表名「英文名」"
                     placeholder="请输入表名，如 T_USER"
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
        <ProFormText
          width="md"
          name="chnname"
          label="中文名称"
          placeholder="可选，便于阅读"
          formItemProps={{
            rules: [
              {
                max: 100,
                message: '不能大于 100 个字符',
              },
            ],
          }}
        />
      </ProForm.Group>
    </ModalForm>
  </>);
}

export default React.memo(AddEntity)
