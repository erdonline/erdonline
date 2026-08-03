import React from 'react';

import DataTable from "@/components/LeftContent/DesignLeftContent/component/DataTable";

export type DesignLeftContentProps = {
  collapsed: boolean | undefined;
};

const DesignLeftContent: React.FC<DesignLeftContentProps> = (props) => {
    return (
      props.collapsed ? <></> : <DataTable />
    )
  }
;

export default React.memo(DesignLeftContent)
