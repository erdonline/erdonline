import React, {useMemo} from 'react';
import {Divider, List} from 'antd';
import ResetPassword from '@/components/dialog/account/ResetPassword';
import FederatedAccountsView from './federatedAccounts';
import {useIntl} from '@umijs/max';

type Unpacked<T> = T extends (infer U)[] ? U : T;

const SecurityView: React.FC = () => {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });

  const passwordStrength = useMemo(
    () => ({
      strong: <span className="strong">{t('accountSettings.security.strengthStrong')}</span>,
      medium: <span className="medium">{t('accountSettings.security.strengthMedium')}</span>,
      weak: <span className="weak">{t('accountSettings.security.strengthWeak')}</span>,
    }),
    [intl],
  );

  const getData = () => [
    {
      title: t('accountSettings.security.passwordTitle'),
      description: (
        <>
          {t('accountSettings.security.passwordStrengthLabel')}
          {passwordStrength.strong}
        </>
      ),
      actions: [<ResetPassword key="reset" />],
    },
  ];

  const data = getData();
  return (
    <>
      <List<Unpacked<typeof data>>
        itemLayout="horizontal"
        dataSource={data}
        renderItem={(item) => (
          <List.Item actions={item.actions}>
            <List.Item.Meta title={item.title} description={item.description} />
          </List.Item>
        )}
      />
      <Divider orientation="left">{t('accountSettings.security.federatedDivider')}</Divider>
      <FederatedAccountsView />
    </>
  );
};

export default SecurityView;
