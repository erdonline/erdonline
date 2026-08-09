import {useEffect} from 'react';
import {history} from '@@/exports';
import {message} from 'antd';

/** 旧入口已废弃：发布须从设计器项目菜单或项目列表行发起。 */
export default function CatalogPublishRedirect() {
  useEffect(() => {
    message.info('请在设计器「项目菜单」或项目列表行中选择「发布为模板」');
    history.replace('/project/recent');
  }, []);
  return null;
}
