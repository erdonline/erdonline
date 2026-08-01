import React from 'react';
import { Result } from 'antd';
import { useRequest } from '@umijs/hooks';
import { GET } from '@/services/crud';
import { PeopleTopCard } from '@icon-park/react';
import * as cache from '@/utils/cache';
import PageSkeleton from '@/components/PageSkeleton';

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
    <Result
      icon={
        <PeopleTopCard
          theme="filled"
          size="66"
          fill="#DE2910"
          strokeWidth={2}
          strokeLinejoin="miter"
        />
      }
      title={title}
      subTitle={subTitle}
    />
  );
};

export default React.memo(Identification);
