import React, {useEffect, useMemo, useState} from 'react';
import {Button, Divider, Form, Input, Select, message} from 'antd';
import {GET} from '@/services/crud';
import {useIntl, useSearchParams} from '@@/exports';
import { join as _join } from 'lodash-es';
import RemoveGroupProject from '@/pages/project/group/component/RemoveGroupProject';
import {updateGroupProject} from '@/services/group-project';
import {Access, useAccess} from '@@/plugin-access';
import './basic-setting.scss';

export type BasicSettingProps = {};

type FormValues = {
  projectName?: string;
  tags?: string[];
  description?: string;
  createTime?: string;
  updateTime?: string;
};

const BasicSetting: React.FC<BasicSettingProps> = () => {
  const intl = useIntl();
  const access = useAccess();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const canEdit = !!access.canErdProjectGroupEdit;

  const requiredRule = useMemo(
    () => ({
      required: true,
      message: intl.formatMessage({id: 'groupSetting.validation.required'}),
    }),
    [intl],
  );
  const max100Rule = useMemo(
    () => ({
      max: 100,
      message: intl.formatMessage({id: 'groupSetting.validation.max100'}),
    }),
    [intl],
  );

  useEffect(() => {
    if (!projectId) {
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await GET('/ncnb/project/group/get/' + projectId, {});
      if (cancelled) {
        return;
      }
      const data = result?.data;
      if (!data) {
        return;
      }
      const tags = data.tags;
      form.setFieldsValue({
        ...data,
        tags:
          typeof tags === 'string'
            ? tags
                .split(/[,;]/)
                .map((t: string) => t.trim())
                .filter(Boolean)
            : tags,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, form]);

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      const r = await updateGroupProject({
        id: projectId,
        projectName: values.projectName,
        description: values.description,
        tags: _join(values.tags, ','),
      });
      if (r?.code === 200) {
        message.success(intl.formatMessage({id: 'groupSetting.basic.updateSuccess'}));
        return;
      }
      if (!r?.msg) {
        message.error(intl.formatMessage({id: 'groupSetting.basic.updateFailed'}));
      }
    } catch {
      // HTTP/网络：request errorHandler 已 toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="basic-setting-page" data-testid="basic-setting-page">
      <h2 className="basic-setting-page__title" data-testid="basic-setting-title">
        {intl.formatMessage({id: 'groupSetting.basic.title'})}
      </h2>
      <Form
        form={form}
        layout="vertical"
        className="basic-setting-form"
        onFinish={onFinish}
      >
        <Form.Item
          name="projectName"
          label={intl.formatMessage({id: 'groupSetting.basic.projectName'})}
          rules={[requiredRule, max100Rule]}
        >
          <Input
            placeholder={intl.formatMessage({id: 'groupSetting.basic.projectNamePlaceholder'})}
            disabled={!canEdit}
            bordered={canEdit}
          />
        </Form.Item>
        <Form.Item
          name="tags"
          label={intl.formatMessage({id: 'groupSetting.basic.tags'})}
          rules={[requiredRule]}
        >
          <Select
            mode="tags"
            tokenSeparators={[',', ';']}
            placeholder={intl.formatMessage({id: 'groupSetting.basic.tagsPlaceholder'})}
            disabled={!canEdit}
            bordered={canEdit}
            aria-label={intl.formatMessage({id: 'groupSetting.basic.tagsAria'})}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={intl.formatMessage({id: 'groupSetting.basic.description'})}
          rules={[requiredRule, max100Rule]}
        >
          <Input.TextArea
            placeholder={intl.formatMessage({id: 'groupSetting.basic.descriptionPlaceholder'})}
            disabled={!canEdit}
            bordered={canEdit}
            rows={3}
          />
        </Form.Item>
        <Form.Item
          name="createTime"
          label={intl.formatMessage({id: 'groupSetting.basic.createTime'})}
          rules={[requiredRule, max100Rule]}
        >
          <Input bordered={false} disabled />
        </Form.Item>
        <Form.Item
          name="updateTime"
          label={intl.formatMessage({id: 'groupSetting.basic.updateTime'})}
          rules={[requiredRule, max100Rule]}
        >
          <Input bordered={false} disabled />
        </Form.Item>
        {canEdit ? (
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              data-testid="basic-setting-submit"
            >
              {intl.formatMessage({id: 'groupSetting.basic.submit'})}
            </Button>
          </Form.Item>
        ) : null}
      </Form>

      <div
        className="basic-setting-delete"
        data-testid="basic-setting-delete-zone"
      >
        <Divider className="basic-setting-delete__divider" />
        <Access accessible={access.canErdProjectGroupDel} fallback={<></>}>
          <div className="basic-setting-delete__body">
            <h2 className="basic-setting-page__title basic-setting-delete__title">
              {intl.formatMessage({id: 'groupSetting.basic.deleteTitle'})}
            </h2>
            <p className="basic-setting-delete__hint" data-testid="basic-setting-delete-hint">
              {intl.formatMessage({id: 'groupSetting.basic.deleteHint'})}
            </p>
            <RemoveGroupProject projectId={projectId} />
          </div>
        </Access>
      </div>
    </div>
  );
};

export default React.memo(BasicSetting);
