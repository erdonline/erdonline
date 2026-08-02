import React, {useState} from 'react';
import {ConsoleSqlOutlined} from '@ant-design/icons';
import {Button, Form, Input, Modal, Select, message} from 'antd';
import {GET, POST} from '@/services/crud';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import _ from 'lodash';

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
      message.error('请选择有效的目标数据库');
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
        message.success('审批已发起');
        setOpen(false);
        return;
      }
      message.error(resp?.msg || resp?.message || '发起审批失败');
    } catch (e: unknown) {
      const err = e as {message?: string};
      message.error(err?.message || '发起审批失败');
    }
  };

  return (
    <>
      <Button
        key="approval"
        type="primary"
        style={{display: props.display}}
        aria-label="SQL审批"
        onClick={openModal}
      >
        <ConsoleSqlOutlined />
        SQL审批
      </Button>
      <Modal
        title="发起SQL审批"
        open={open}
        onOk={handleOk}
        onCancel={closeModal}
        destroyOnClose
        width={520}
        forceRender
        okButtonProps={{'aria-label': '确定'}}
        cancelButtonProps={{type: 'dashed'}}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="approver"
            label="审批人"
            rules={[{required: true, message: '请输入审批人'}]}
          >
            <Select
              showSearch
              filterOption={false}
              placeholder="审批人"
              options={approverOptions}
              loading={fetching}
              onSearch={(v) => void fetchApprovers(v)}
              aria-label="审批人"
            />
          </Form.Item>
          <Form.Item
            name="dbInfo"
            label="目标数据库"
            rules={[{required: true, message: '选择一个目标数据库!'}]}
          >
            <Select
              options={dbOptions}
              placeholder="请选择目标数据库"
              aria-label="目标数据库"
            />
          </Form.Item>
          <Form.Item
            name="approveRemark"
            label="审批说明"
            rules={[
              {required: true, message: '不能为空'},
              {min: 5, max: 500, message: '只能输入5~500 个字符'},
            ]}
          >
            <Input.TextArea placeholder="审批说明，不少于5个字" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default React.memo(SqlApproval);
