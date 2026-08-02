import { Button, Result, Space } from 'antd';
import React from 'react';
import { history } from 'umi';

const NoFoundPage: React.FC = () => (
  <Result
    status="404"
    title="404"
    subTitle="抱歉，你访问的页面不存在"
    extra={
      <Space>
        <Button type="primary" onClick={() => history.push('/')}>
          返回首页
        </Button>
        <Button onClick={() => history.push('/demo')}>打开示例 demo</Button>
      </Space>
    }
  />
);

export default NoFoundPage;
