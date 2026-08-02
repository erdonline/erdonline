import React from 'react';
import {Typography, message} from 'antd';
import ProForm, {ProFormText,} from '@ant-design/pro-form';

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

  const handleFinish = async (values: {
    username?: string;
    email?: string;
    phone?: string;
  }) => {
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
            <ProForm
              layout="vertical"
              onFinish={(values) => handleFinish(values)}
              submitter={{
                searchConfig: {
                  submitText: '更新基本信息',
                },
                render: (_, dom) => dom[1],
              }}
              initialValues={{
                ...r?.data,
              }}
              hideRequiredMark
            >
              <ProFormText
                width="md"
                name="username"
                label="用户名"
                disabled
                rules={[
                  {
                    required: true,
                    message: '请输入您的用户名!',
                  },
                ]}
              />
              <ProFormText
                width="md"
                name="email"
                label="邮箱"
                rules={[
                  {
                    required: true,
                    message: '请输入您的邮箱!',
                  },
                ]}
              />

              <ProFormText
                width="md"
                name="phone"
                label="联系电话"
                rules={[
                  {
                    required: true,
                    message: '请输入您的联系电话!',
                  },
                ]}
              />
            </ProForm>
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
