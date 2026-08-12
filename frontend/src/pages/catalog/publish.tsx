import {useEffect} from 'react';
import {history, useIntl} from '@@/exports';
import {message} from 'antd';

/** 旧入口已废弃：发布须从设计器项目菜单或项目列表行发起。 */
export default function CatalogPublishRedirect() {
  const intl = useIntl();
  useEffect(() => {
    message.info(intl.formatMessage({id: 'catalog.publish.redirectInfo'}));
    history.replace('/project/recent');
  }, [intl]);
  return null;
}
