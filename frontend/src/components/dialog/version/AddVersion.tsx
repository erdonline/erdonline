import React, {useMemo, useState} from 'react';
import {PlusOutlined} from '@ant-design/icons';
import {Button, Form, Input, Modal, Select} from 'antd';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import {suggestNextVersion} from '@/utils/versionConstants';
import {joinVersionTags} from '@/utils/versionTags';

export type AddVersionProps = {
  trigger: string;
  /** 触发按钮文案；空态 CTA 用「保存第一个版本」 */
  label?: string;
  /** 触发按钮 testid；默认 add-version-btn，空态用 version-empty-save-btn 避免重复 */
  testId?: string;
};

type FormValues = {
  version?: string;
  versionDesc?: string;
  tags?: string[];
};

const AddVersion: React.FC<AddVersionProps> = (props) => {
  const {label = '新增版本', testId = 'add-version-btn'} = props;
  const {versions, versionDispatch} = useVersionStore(
    (state) => ({
      versions: state.versions,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const initialVersion = useMemo(() => suggestNextVersion(versions), [versions]);

  const closeModal = () => {
    setOpen(false);
  };

  const openModal = () => {
    form.setFieldsValue({
      version: initialVersion,
      versionDesc: '模型快照',
      tags: [],
    });
    setOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const tag = joinVersionTags(values.tags);
    if (tag && tag.length > 255) {
      return Promise.reject(new Error('标签总长度不能大于 255 个字符'));
    }
    const ok = await versionDispatch.saveNewVersion({
      version: values.version,
      versionDesc: values.versionDesc,
      tag,
    });
    if (ok === false) {
      // 拒绝关闭（对齐 ModalForm onFinish 返回 false）；受控 open 须自行关
      return Promise.reject(new Error('save failed'));
    }
    setOpen(false);
  };

  return (
    <>
      <Button
        key="artifact"
        type="primary"
        data-testid={testId}
        aria-label={label}
        onClick={openModal}
      >
        <PlusOutlined />
        {label}
      </Button>
      <Modal
        title="新增版本"
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        destroyOnClose
        width={520}
        forceRender
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="version"
            label="版本号"
            rules={[
              {required: true, message: '不能为空'},
              {
                pattern: /^([1-9]\d|[1-9])(\.([1-9]\d|\d)){2}$/,
                message: '版本号格式不对，正确示例：1.0.1',
              },
              {max: 100, message: '不能大于 100 个字符'},
            ]}
          >
            <Input placeholder="请输入版本号" />
          </Form.Item>
          <Form.Item
            name="versionDesc"
            label="版本描述"
            rules={[
              {required: true, message: '不能为空'},
              {max: 100, message: '不能大于 100 个字符'},
            ]}
          >
            <Input.TextArea placeholder="请输入版本描述" rows={3} />
          </Form.Item>
          <Form.Item
            name="tags"
            label="版本标签"
            rules={[
              {
                validator: async (_: unknown, value: string[] | undefined) => {
                  const joined = joinVersionTags(value);
                  if (joined && joined.length > 255) {
                    return Promise.reject(new Error('标签总长度不能大于 255 个字符'));
                  }
                },
              },
            ]}
          >
            <Select
              mode="tags"
              tokenSeparators={[',']}
              placeholder="可选，回车添加多个标签"
              data-testid="version-tag-input"
              aria-label="版本标签"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(AddVersion);
