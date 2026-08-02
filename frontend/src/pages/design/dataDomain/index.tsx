import React from 'react';
import { Alert } from 'antd';
import DataDomain from '@/components/LeftContent/DesignLeftContent/component/DataDomain';

/**
 * 实验页：类型域/库映射维护。不挂 DesignLayout 侧栏（与 Chat SQL 同策略）；
 * 深链仍可达。DDL/字段类型仍读 projectJSON.dataTypeDomains，本页非主旅程。
 */
const DataDomainPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }} data-testid="data-domain-page">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="实验功能"
        description="数据域（类型映射）侧栏入口已隐藏。本页仅深链保留，不作为建模主路径；字段类型仍可在表编辑中选用。"
      />
      <h1>数据域</h1>
      <DataDomain />
    </div>
  );
};

export default DataDomainPage;
