import React from 'react';
import {Button, Form, Input, Typography, message} from 'antd';

import styles from './BaseView.less';
import {useRequest} from "@umijs/hooks";
import {GET, POST} from "@/services/crud";
import PageSkeleton from "@/components/PageSkeleton";

const AvatarView = ({avatar}: { avatar: string }) => (
  <>
    <div className={styles.avatar_title}>头像</div>
    <div className={styles.avatar}>
      <img src={avatar} alt="avatar"/>
    </div>
    <Typography.Text type="secondary" className={styles.button_view}>
      头像上传暂未开放
    </Typography.Text>
  </>
);

type BasicValues = {
  username?: string;
  email?: string;
  phone?: string;
};

const BaseView: React.FC = () => {
  const {data: r, loading} = useRequest(() => {
    return GET('/syst/user/settings/basic', {});
  });


  const getAvatarURL = () => {
    if (r) {
      if (r.data?.avatar) {
        return r.data?.avatar;
      }
      const url = '/logo.svg';
      return url;
    }
    return '/logo.svg';
  };

  const handleFinish = async (values: BasicValues) => {
    try {
      const res = await POST('/syst/user/settings/update', values);
      if (res?.code === 200) {
        message.success('更新基本信息成功');
        return;
      }
      // 业务码非 200：全局 response 拦截器已 toast msg；此处兜底无 msg 的静默失败
      if (!res?.msg) {
        message.error('更新基本信息失败');
      }
    } catch {
      // HTTP/网络：request errorHandler 已 toast
    }
  };
  return (
    <div className={styles.baseView}>
      {loading ? <PageSkeleton rows={4} /> : (
        <>
          <div className={styles.left}>
            <Form
              layout="vertical"
              requiredMark={false}
              initialValues={{...r?.data}}
              onFinish={handleFinish}
              style={{maxWidth: 328}}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[{required: true, message: '请输入您的用户名!'}]}
              >
                <Input disabled aria-label="用户名" autoComplete="username" />
              </Form.Item>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{required: true, message: '请输入您的邮箱!'}]}
              >
                <Input aria-label="邮箱" autoComplete="email" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[{required: true, message: '请输入您的联系电话!'}]}
              >
                <Input aria-label="联系电话" autoComplete="tel" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" aria-label="更新基本信息">
                  更新基本信息
                </Button>
              </Form.Item>
            </Form>
          </div>
          <div className={styles.right}>
            <AvatarView avatar={getAvatarURL()}/>
          </div>
        </>
      )}
    </div>
  );
};

export default BaseView;
