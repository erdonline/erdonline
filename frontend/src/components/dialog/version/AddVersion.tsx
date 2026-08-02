import React, {useMemo} from 'react';
import {ModalForm, ProFormText, ProFormTextArea} from "@ant-design/pro-components";
import useVersionStore from "@/store/version/useVersionStore";
import shallow from "zustand/shallow";
import {PlusOutlined} from '@ant-design/icons';
import {Button, message} from "antd";
import {suggestNextVersion} from "@/utils/versionConstants";

export type AddVersionProps = {
  trigger: string;
};

const AddVersion: React.FC<AddVersionProps> = (props) => {
  const {versions, versionDispatch} = useVersionStore(state => ({
    versions: state.versions,
    versionDispatch: state.dispatch,
  }), shallow);

  const initialVersion = useMemo(() => suggestNextVersion(versions), [versions]);

  return (
    <ModalForm
      title="新增版本"
      initialValues={{
        version: initialVersion,
        versionDesc: '模型快照',
        tag: '',
      }}
      modalProps={{ destroyOnClose: true }}
      onFinish={async (values: { version?: string; versionDesc?: string; tag?: string }) => {
        const tag = (values.tag || '').trim();
        if (tag && versions.some((v: { tag?: string }) => (v.tag || '').trim() === tag)) {
          message.error('该版本标签已经存在了');
          return false;
        }
        const ok = await versionDispatch.saveNewVersion({
          version: values.version,
          versionDesc: values.versionDesc,
          tag: tag || undefined,
        });
        return ok !== false;
      }}
      trigger={
        <Button
          key="artifact"
          type="primary"
          data-testid="add-version-btn"
        >
          <PlusOutlined/>新增版本
        </Button>
      }
    >
      <ProFormText
        width="md"
        name="version"
        label="版本号"
        placeholder="请输入版本号"
        formItemProps={{
          rules: [
            { required: true, message: '不能为空' },
            {
              pattern: /^([1-9]\d|[1-9])(\.([1-9]\d|\d)){2}$/,
              message: '版本号格式不对，正确示例：1.0.1',
            },
            { max: 100, message: '不能大于 100 个字符' },
          ],
        }}
      />
      <ProFormTextArea
        width="md"
        name="versionDesc"
        label="版本描述"
        placeholder="请输入版本描述"
        formItemProps={{
          rules: [
            { required: true, message: '不能为空' },
            { max: 100, message: '不能大于 100 个字符' },
          ],
        }}
      />
      <ProFormText
        width="md"
        name="tag"
        label="版本标签"
        placeholder="可选，如 v1.0 / 里程碑"
        fieldProps={{
          'data-testid': 'version-tag-input',
          maxLength: 64,
        }}
        formItemProps={{
          rules: [
            { max: 64, message: '不能大于 64 个字符' },
          ],
        }}
      />
    </ModalForm>
  );
};

export default React.memo(AddVersion);
