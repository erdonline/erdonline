import React, {useRef, useState} from 'react';
import {ConsoleSqlOutlined} from '@ant-design/icons';
import {Button, Form, Input, Modal, Select, message} from 'antd';
import {useIntl} from '@umijs/max';
import type {RefSelectProps} from 'antd/es/select';
import {GET, POST} from '@/services/crud';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import _ from 'lodash-es';

export type SqlApprovalProps = {
  projectId: string;
  approveSql: string;
  versionId: string;
  display: string;
};

type FormValues = {
  approver?: string;
  dbInfo?: string;
  approveRemark?: string;
};

type DbRow = {
  name: string;
  select?: string;
  properties?: Record<string, string> & {driver_class_name?: string};
};

type ApproverOption = {
  value: string;
  label: string;
};

const SqlApproval: React.FC<SqlApprovalProps> = (props) => {
  const intl = useIntl();
  const {dbs} = useVersionStore(
    (state) => ({
      dbs: state.dbs as DbRow[] | undefined,
    }),
    shallow,
  );

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [approverOptions, setApproverOptions] = useState<ApproverOption[]>([]);
  const [fetching, setFetching] = useState(false);
  const approverSelectRef = useRef<RefSelectProps>(null);

  const groupDb = _.groupBy(dbs || [], (g) => g.select);
  const dbOptions = Object.keys(groupDb).map((m) => ({
    label: m,
    options: groupDb[m].map((m1) => ({
      label: m1.name,
      value: m1.name,
    })),
  }));

  const fetchApprovers = async (keyword?: string) => {
    setFetching(true);
    try {
      const result = await GET('/ncnb/project/group/approval/users', {
        projectId: props.projectId,
        username: keyword,
      });
      const rows = (result?.data ?? []) as {id: string; username: string; email: string}[];
      setApproverOptions(
        rows.map((m) => ({
          value: m.id,
          label: `${m.username}  -  ${m.email}`,
        })),
      );
    } finally {
      setFetching(false);
    }
  };

  const openModal = () => {
    form.resetFields();
    setApproverOptions([]);
    setOpen(true);
    void fetchApprovers();
  };

  const closeModal = () => {
    setOpen(false);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const db = dbs?.find((d) => d.name === values.dbInfo);
    if (!db?.properties) {
      message.error(intl.formatMessage({ id: 'approvalModal.invalidDb' }));
      return;
    }
    const dbConfig = _.omit(db.properties, ['driver_class_name']);
    const params = {
      ...dbConfig,
      driverClassName: db.properties.driver_class_name,
    };
    try {
      const resp = await POST('/ncnb/approval', {
        projectId: props.projectId,
        approver: values.approver,
        versionId: props.versionId,
        approveRemark: values.approveRemark,
        dbInfo: JSON.stringify(params) || '',
        approveSql: props.approveSql,
      });
      if (resp?.code === 200) {
        message.success(intl.formatMessage({ id: 'approvalModal.submitSuccess' }));
        setOpen(false);
        return;
      }
      message.error(
        resp?.msg || resp?.message || intl.formatMessage({ id: 'approvalModal.submitFailed' }),
      );
    } catch (e: unknown) {
      const err = e as {message?: string};
      message.error(
        err?.message || intl.formatMessage({ id: 'approvalModal.submitFailed' }),
      );
    }
  };

  return (
    <>
      <Button
        key="approval"
        type="primary"
        style={{display: props.display}}
        aria-label={intl.formatMessage({ id: 'approvalModal.sqlButtonAria' })}
        data-testid="sql-approval-btn"
        onClick={openModal}
      >
        <ConsoleSqlOutlined />
        {intl.formatMessage({ id: 'approvalModal.sqlButton' })}
      </Button>
      <Modal
        title={intl.formatMessage({ id: 'approvalModal.sqlTitle' })}
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        destroyOnClose
        width={520}
        forceRender
        okButtonProps={{'aria-label': intl.formatMessage({ id: 'approvalModal.sqlOkAria' })}}
        cancelButtonProps={{type: 'dashed'}}
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          const tryFocus = (attempt = 0) => {
            if (approverSelectRef.current) {
              approverSelectRef.current.focus();
              return;
            }
            if (attempt >= 20) {
              return;
            }
            window.setTimeout(() => tryFocus(attempt + 1), 50);
          };
          window.setTimeout(() => tryFocus(), 0);
        }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="approver"
            label={intl.formatMessage({ id: 'approvalModal.approverLabel' })}
            rules={[{required: true, message: intl.formatMessage({ id: 'approvalModal.approverRequired' })}]}
          >
            <Select
              ref={approverSelectRef}
              showSearch
              filterOption={false}
              placeholder={intl.formatMessage({ id: 'approvalModal.approverPlaceholder' })}
              options={approverOptions}
              loading={fetching}
              onSearch={(v) => void fetchApprovers(v)}
              aria-label={intl.formatMessage({ id: 'approvalModal.approverAria' })}
            />
          </Form.Item>
          <Form.Item
            name="dbInfo"
            label={intl.formatMessage({ id: 'approvalModal.targetDbLabel' })}
            rules={[{required: true, message: intl.formatMessage({ id: 'approvalModal.targetDbRequired' })}]}
          >
            <Select
              options={dbOptions}
              placeholder={intl.formatMessage({ id: 'approvalModal.targetDbPlaceholder' })}
              aria-label={intl.formatMessage({ id: 'approvalModal.targetDbAria' })}
            />
          </Form.Item>
          <Form.Item
            name="approveRemark"
            label={intl.formatMessage({ id: 'approvalModal.remarkLabel' })}
            rules={[
              {required: true, message: intl.formatMessage({ id: 'versionModal.validation.required' })},
              {min: 5, max: 500, message: intl.formatMessage({ id: 'approvalModal.remarkLength' })},
            ]}
          >
            <Input.TextArea
              placeholder={intl.formatMessage({ id: 'approvalModal.remarkPlaceholder' })}
              rows={3}
              aria-label={intl.formatMessage({ id: 'approvalModal.remarkAria' })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(SqlApproval);
