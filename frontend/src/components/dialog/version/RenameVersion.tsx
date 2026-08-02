import React from 'react';
import {ModalForm, ProFormText, ProFormTextArea} from "@ant-design/pro-components";
import useVersionStore from "@/store/version/useVersionStore";
import shallow from "zustand/shallow";
import {compareStringVersion} from "@/utils/string";
import {Button, message} from "antd";
import {EditOutlined} from "@ant-design/icons";


export type RenameVersionProps = {};

const RenameVersion: React.FC<RenameVersionProps> = (props) => {
  const {currentVersionIndex, currentVersion, versions, versionDispatch} = useVersionStore(state => ({
    currentVersionIndex: state.currentVersionIndex,
    currentVersion: state.currentVersion,
    versions: state.versions,
    versionDispatch: state.dispatch,
  }), shallow);


  return (<>
    <ModalForm
      title="编辑版本"
      onFinish={async (values: { version?: string; versionDesc?: string; tag?: string }) => {
        const tag = (values.tag || '').trim();
        const tempValue = {
          ...currentVersion,
          version: values.version,
          versionDesc: values.versionDesc,
          tag: tag || undefined,
        };

        const tempVersions = versions.slice(1);
        const tagTaken = tag && versions.some(
          (v: { id?: string; tag?: string }) =>
            v.id !== currentVersion?.id && (v.tag || '').trim() === tag,
        );
        if (tagTaken) {
          message.error('该版本标签已经存在了');
          return false;
        }
        if (currentVersionIndex !== 0) {
          versionDispatch.updateVersionData(tempValue, currentVersion, 'update');
          return true;
        }
        if (tempVersions.map((v: { version?: string }) => v.version).includes(tempValue.version)) {
          message.error('该版本号已经存在了');
          return false;
        }
        if (
          tempVersions[0] &&
          compareStringVersion(tempValue.version, tempVersions[0].version) <= 0
        ) {
          message.error('新版本不能小于或等于已经存在的版本');
          return false;
        }
        versionDispatch.updateVersionData(tempValue, currentVersion, 'update');
        return true;
      }}
      trigger={
        <Button
          key="editor"
          size={"small"}
          type={"link"}
          icon={<EditOutlined />}
          data-testid="version-rename-btn"
          aria-label="编辑版本"
        >
          编辑
        </Button>
      }
      request={async (params) => {
        return currentVersion;
      }}
    >
      <ProFormText
        width="md"
        name="version"
        label="版本号"
        placeholder="请输入版本号"
        readonly={currentVersionIndex !== 0}
        formItemProps={{
          rules: [
            {
              required: true,
              message: '不能为空',
            },
            {
              pattern: new RegExp(/^([1-9]\d|[1-9])(\.([1-9]\d|\d)){2}$/),
              message: '版本号格式不对,版本需满足正则：/^([1-9]\\d|[1-9])(\\.([1-9]\\d|\\d)){2}$/，正确示例：1.0.1',
            },
            {
              max: 100,
              message: '不能大于 100 个字符',
            },
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
        name="tag"
        label="版本标签"
        placeholder="可选，如 v1.0 / 里程碑"
        fieldProps={{
          'data-testid': 'version-tag-input',
          maxLength: 64,
        }}
        formItemProps={{
          rules: [
            {
              max: 64,
              message: '不能大于 64 个字符',
            },
          ],
        }}
      />
    </ModalForm>
  </>);
}

export default React.memo(RenameVersion)
