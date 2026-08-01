import React from 'react';
import { Tooltip, Row, Col } from 'antd';
import { Link, history } from 'umi';
import styles from './index.less';

export interface QuickLink {
  title: string;
  icon: React.ReactNode;
  href?: string;
  /** 点击时执行（优先于 href），用于一键创建示例等 */
  onClick?: () => void | Promise<void>;
  description: string;
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'premium';
  hidden?: boolean;
  testId?: string;
}

interface EditableLinkGroupProps {
  links: QuickLink[];
}

const EditableLinkGroup: React.FC<EditableLinkGroupProps> = ({ links }) => {
  const visibleLinks = links.filter((link) => !link.hidden);

  return (
    <Row gutter={[12, 12]}>
      {visibleLinks.map((link, index) => {
        const className = `${styles.quickLink} ${styles[link.type || 'secondary']}`;
        const body = (
          <>
            <div className={styles.iconWrapper}>{link.icon}</div>
            <div className={styles.textWrapper}>
              <span className={styles.linkTitle}>{link.title}</span>
            </div>
          </>
        );
        return (
          <Col key={index} xs={12} sm={8} md={6}>
            <Tooltip title={link.description} placement="bottom">
              {link.onClick ? (
                <a
                  className={className}
                  data-testid={link.testId}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    void link.onClick?.();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void link.onClick?.();
                    }
                  }}
                >
                  {body}
                </a>
              ) : (
                <Link
                  to={link.href || '/home'}
                  className={className}
                  data-testid={link.testId}
                  onClick={(e) => {
                    if (!link.href) {
                      e.preventDefault();
                      history.push('/home');
                    }
                  }}
                >
                  {body}
                </Link>
              )}
            </Tooltip>
          </Col>
        );
      })}
    </Row>
  );
};

export default EditableLinkGroup;
