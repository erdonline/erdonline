import { Button } from 'antd';
import { history, useIntl } from '@@/exports';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';

/**
 * 设计器顶栏常驻入口：直达版本管理页。
 * 关闭示例就绪通知后仍可完成「保存第一个版本」，不依赖侧栏找路。
 */
const SaveVersionButton: React.FC = () => {
  const intl = useIntl();

  const go = () => {
    const projectId =
      cache.getItem(CONSTANT.PROJECT_ID) ||
      new URLSearchParams(window.location.search).get('projectId') ||
      '';
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    history.push(`/design/table/version/all${q}`);
  };

  const label = intl.formatMessage({ id: 'versionModal.saveVersion.button' });

  return (
    <Button
      type="primary"
      size="small"
      data-testid="design-header-save-version"
      aria-label={intl.formatMessage({ id: 'versionModal.saveVersion.aria' })}
      onClick={go}
    >
      {label}
    </Button>
  );
};

export default SaveVersionButton;
