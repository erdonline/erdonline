import React from 'react';
import { useRequest } from '@umijs/hooks';
import { GET } from '@/services/crud';
import { PeopleTopCard } from '@icon-park/react';
import * as cache from '@/utils/cache';
import PageSkeleton from '@/components/PageSkeleton';
import styles from './identification.less';

export type IdentificationProps = {};

const Identification: React.FC<IdentificationProps> = () => {
  const { loading } = useRequest(() => {
    return GET('/syst/user/settings/basic', {});
  });

  const licence = cache.getItem2object('licence');
  const licensed = !!licence?.licensedStartTime;
  const title = licensed ? '已取得授权' : '开源版';
  const subTitle = licensed
    ? `授权给: ${licence?.licensedTo}，有效期：${licence.licensedStartTime} ~ ${licence.licensedEndTime}`
    : 'MIT 开源：不限个人/团队项目数量；版本与协作可用';

  return loading ? (
    <PageSkeleton rows={3} />
  ) : (
    <div
      className={styles.panel}
      data-testid="account-settings-identification"
      role="status"
      aria-live="polite"
    >
      <span className={styles.icon} aria-hidden data-testid="identification-icon">
        <PeopleTopCard
          theme="filled"
          size="40"
          fill="currentColor"
          strokeWidth={2}
          strokeLinejoin="miter"
        />
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.sub}>{subTitle}</p>
    </div>
  );
};

export default React.memo(Identification);
