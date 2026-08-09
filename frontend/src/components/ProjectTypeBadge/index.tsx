import React from 'react';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import './index.less';

export type ProjectTypeBadgeProps = {
  /** '1' | person = 个人；'2' | team = 团队 */
  type: string | number;
  className?: string;
};

/**
 * 个人/团队类型徽章（token 同源；禁 Tag color="blue" / #5BD8A6）。
 */
const ProjectTypeBadge: React.FC<ProjectTypeBadgeProps> = ({ type, className }) => {
  const intl = useIntl();
  const isPerson = String(type) === '1' || type === 'personal' || type === 'person';
  const label = isPerson
    ? intl.formatMessage({ id: 'projectList.type.person' })
    : intl.formatMessage({ id: 'projectList.type.team' });
  return (
    <span
      className={`erd-project-type-badge erd-project-type-badge--${
        isPerson ? 'person' : 'team'
      }${className ? ` ${className}` : ''}`}
      data-testid="project-type-badge"
      title={label}
      aria-label={label}
    >
      {isPerson ? <UserOutlined aria-hidden /> : <TeamOutlined aria-hidden />}
    </span>
  );
};

export default ProjectTypeBadge;
