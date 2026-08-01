import React from 'react';
import { Button } from "antd";
import {MyIcon} from "@/components/Menu";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";

export type ExportJsonProps = {};

const ExportJson: React.FC<ExportJsonProps> = () => {
  const {projectDispatch} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);
  return (
    <Button
      type="text"
      size="small"
      block
      icon={<MyIcon type="icon-JSON"/>}
      onClick={() => projectDispatch.exportFile('JSON')}
      style={{ textAlign: 'left' }}
    >导出ERD</Button>
  );
};

export default React.memo(ExportJson);
