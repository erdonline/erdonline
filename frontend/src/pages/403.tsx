import { Button, Result, Space } from 'antd';
import React from 'react';
import { history } from 'umi';

const NoAccessPage: React.FC = () => (
  <Result
    status="403"
    title="403"
    subTitle="抱歉，你无权访问该页面"
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

export default NoAccessPage;
