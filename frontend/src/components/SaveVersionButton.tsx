import { Button } from 'antd';
import { history } from '@@/core/history';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';

/**
 * 设计器顶栏常驻入口：直达版本管理页。
 * 关闭示例就绪通知后仍可完成「保存第一个版本」，不依赖侧栏找路。
 */
const SaveVersionButton: React.FC = () => {
  const go = () => {
    const projectId =
      cache.getItem(CONSTANT.PROJECT_ID) ||
      new URLSearchParams(window.location.search).get('projectId') ||
      '';
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    history.push(`/design/table/version/all${q}`);
  };

  return (
    <Button
      type="link"
      size="small"
      data-testid="design-header-save-version"
      aria-label="保存版本"
      onClick={go}
    >
      保存版本
    </Button>
  );
};

export default SaveVersionButton;
