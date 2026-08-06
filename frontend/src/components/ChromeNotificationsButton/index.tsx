import React from 'react';
import { BellOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { history, useIntl } from '@umijs/max';

export type ChromeNotificationsButtonProps = {
  /** chrome = Home/Group 顶栏；workflow = 设计器工作流条 */
  variant?: 'chrome' | 'workflow';
  /** 默认随 variant：chrome-notifications / design-workflow-notifications */
  testId?: string;
  className?: string;
};

/** 三壳共用：跳转 /project/notice */
const ChromeNotificationsButton: React.FC<ChromeNotificationsButtonProps> = ({
  variant = 'chrome',
  testId,
  className,
}) => {
  const intl = useIntl();
  const label = intl.formatMessage({ id: 'chrome.notifications' });
  const resolvedTestId =
    testId ?? (variant === 'workflow' ? 'design-workflow-notifications' : 'chrome-notifications');
  const btnClass =
    className ??
    (variant === 'workflow' ? 'design-layout__workflow-btn' : 'erd-chrome-notifications-btn');

  return (
    <Tooltip title={label}>
      <Button
        type="text"
        size="small"
        className={btnClass}
        icon={<BellOutlined />}
        aria-label={label}
        data-testid={resolvedTestId}
        onClick={() => history.push('/project/notice')}
      >
        {label}
      </Button>
    </Tooltip>
  );
};

export default React.memo(ChromeNotificationsButton);
