import React from 'react';
import { Button } from "antd";
import {MyIcon} from "@/components/Menu";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";

export type ExportFileProps = {};

const ExportWord: React.FC<ExportFileProps> = () => {
  const {projectDispatch} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);
  return (
    <Button
      type="text"
      size="small"
      block
      icon={<MyIcon type="icon-file-word"/>}
      onClick={() => projectDispatch.exportFile('Word')}
      style={{ textAlign: 'left' }}
      aria-label="导出Word"
    >导出Word</Button>
  );
};

export default React.memo(ExportWord);
