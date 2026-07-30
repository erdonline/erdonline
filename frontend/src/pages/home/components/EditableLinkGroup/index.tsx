import React from 'react';
import { Tooltip, Row, Col } from 'antd';
import { Link } from 'umi';
import styles from './index.less';

export interface QuickLink {
  title: string;
  icon: React.ReactNode;
  href: string;
  description: string;
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'premium';
  hidden?: boolean;
}

interface EditableLinkGroupProps {
  links: QuickLink[];
}

const EditableLinkGroup: React.FC<EditableLinkGroupProps> = ({ links }) => {
  const visibleLinks = links.filter(link => !link.hidden);

  return (
    <Row gutter={[12, 12]}>
      {visibleLinks.map((link, index) => (
        <Col key={index} xs={12} sm={8} md={6}>
          <Tooltip title={link.description} placement="bottom">
            <Link to={link.href} className={`${styles.quickLink} ${styles[link.type || 'secondary']}`}>
              <div className={styles.iconWrapper}>{link.icon}</div>
              <div className={styles.textWrapper}>
                <span className={styles.linkTitle}>{link.title}</span>
              </div>
            </Link>
          </Tooltip>
        </Col>
      ))}
    </Row>
  );
};

export default EditableLinkGroup;