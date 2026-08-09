import React, { useEffect } from 'react';
import { history, useLocation } from '@@/exports';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';

/** 旧深链 `/design/table/setting/databaseTemplates` → 数据类型字典页并自动打开 DDL 模板 Modal */
const DatabaseTemplatesRedirect: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectId =
      params.get('projectId') || cache.getItem(CONSTANT.PROJECT_ID) || '';
    params.delete('openDdlTemplates');
    params.set('openDdlTemplates', '1');
    if (projectId && !params.get('projectId')) {
      params.set('projectId', projectId);
    }
    history.replace(`/design/table/setting/dataType?${params.toString()}`);
  }, [location.search]);

  return null;
};

export default DatabaseTemplatesRedirect;
