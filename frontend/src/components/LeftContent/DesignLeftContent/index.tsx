import React from 'react';

import "./index.less";
import DataTable from "@/components/LeftContent/DesignLeftContent/component/DataTable";
import useGlobalStore from "@/store/global/globalStore";
import shallow from "zustand/shallow";

export type DesignLeftContentProps = {
  collapsed: boolean | undefined;
};

const DesignLeftContent: React.FC<DesignLeftContentProps> = (props) => {
    const {globalDispatch} = useGlobalStore(state => ({
      globalDispatch: state.dispatch
    }), shallow);

    return (
      props.collapsed ? <></> : <DataTable />
    )
  }
;

export default React.memo(DesignLeftContent)
