import React from 'react';
import { Button } from "antd";
import {MyIcon} from "@/components/Menu";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";

export type ExportFileProps = {};

const ExportHTML: React.FC<ExportFileProps> = () => {
  const {projectDispatch} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);
  return (
    <Button
      type="text"
      size="small"
      block
      icon={<MyIcon type="icon-HTML"/>}
      onClick={() => projectDispatch.exportFile('Html')}
      style={{ textAlign: 'left' }}
    >导出HTML</Button>
  );
};

export default React.memo(ExportHTML);
