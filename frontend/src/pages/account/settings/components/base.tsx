import React from 'react';
import {Button, Form, Input, Typography, message} from 'antd';

import styles from './BaseView.less';
import {useRequest} from "@umijs/hooks";
import {GET, POST} from "@/services/crud";
import PageSkeleton from "@/components/PageSkeleton";
import {useIntl} from '@umijs/max';

const AvatarView = ({avatar}: { avatar: string }) => {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  return (
    <>
      <div className={styles.avatar_title}>{t('accountSettings.base.avatarTitle')}</div>
      <div className={styles.avatar}>
        <img src={avatar} alt="avatar"/>
      </div>
      <Typography.Text type="secondary" className={styles.button_view}>
        {t('accountSettings.base.avatarUploadClosed')}
      </Typography.Text>
    </>
  );
};

type BasicValues = {
  username?: string;
  email?: string;
  phone?: string;
};

const BaseView: React.FC = () => {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
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
        message.success(t('accountSettings.base.updateSuccess'));
        return;
      }
      // 业务码非 200：全局 response 拦截器已 toast msg；此处兜底无 msg 的静默失败
      if (!res?.msg) {
        message.error(t('accountSettings.base.updateFailed'));
      }
    } catch {
      // HTTP/网络：request errorHandler 已 toast
    }
  };
  return (
    <div className={styles.baseView} data-testid="account-settings-base-view">
      {loading ? <PageSkeleton rows={4} /> : (
        <>
          <div className={styles.left}>
            <Form
              layout="vertical"
              size="small"
              requiredMark={false}
              initialValues={{...r?.data}}
              onFinish={handleFinish}
              className="account-settings-form"
              style={{maxWidth: 328}}
            >
              <Form.Item
                name="username"
                label={t('accountSettings.base.username')}
                rules={[{required: true, message: t('accountSettings.base.usernameRequired')}]}
              >
                <Input
                  disabled
                  aria-label={t('accountSettings.base.username')}
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                name="email"
                label={t('accountSettings.base.email')}
                rules={[{required: true, message: t('accountSettings.base.emailRequired')}]}
              >
                <Input aria-label={t('accountSettings.base.email')} autoComplete="email" />
              </Form.Item>
              <Form.Item
                name="phone"
                label={t('accountSettings.base.phone')}
                rules={[{required: true, message: t('accountSettings.base.phoneRequired')}]}
              >
                <Input aria-label={t('accountSettings.base.phone')} autoComplete="tel" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  aria-label={t('accountSettings.base.submitAria')}
                  data-testid="account-settings-base-submit"
                >
                  {t('accountSettings.base.submit')}
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
