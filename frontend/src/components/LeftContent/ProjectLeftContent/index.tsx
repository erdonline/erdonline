import React from 'react';
import { Menu } from 'antd';
import { Left } from 'react-spaces';

export type ProjectLeftContentProps = {};

const ProjectLeftContent: React.FC<ProjectLeftContentProps> = () => {
  return (
    <Left size="12%">
      <Menu selectedKeys={['models']} mode="inline">
        <Menu.Item key="models">项目模型</Menu.Item>
      </Menu>
    </Left>
  );
};

export default React.memo(ProjectLeftContent);
