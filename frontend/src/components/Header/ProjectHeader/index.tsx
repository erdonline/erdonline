import React from 'react';
import { Layout } from 'antd';

const { Header } = Layout;

export type ProjectHeaderProps = {};

const ProjectHeader: React.FC<ProjectHeaderProps> = () => {
  return (
    <Header style={{ background: '#404854', height: '50px', lineHeight: '50px', padding: '0 12px' }}>
      <img src="/favicon.ico" alt="logo" style={{ height: 24, verticalAlign: 'middle' }} />
      <span style={{ color: '#fff', marginLeft: 8 }}>ERD Online</span>
    </Header>
  );
};

export default React.memo(ProjectHeader);
