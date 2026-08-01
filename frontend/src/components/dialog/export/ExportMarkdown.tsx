import React from 'react';
import { Button } from "antd";
import {MyIcon} from "@/components/Menu";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";

export type ExportFileProps = {};

const ExportMarkdown: React.FC<ExportFileProps> = () => {
  const {projectDispatch} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);
  return (
    <Button
      type="text"
      size="small"
      block
      icon={<MyIcon type="icon-markdown"/>}
      onClick={() => projectDispatch.exportFile('Markdown')}
      style={{ textAlign: 'left' }}
      aria-label="导出Markdown"
    >导出Markdown</Button>
  );
};

export default React.memo(ExportMarkdown);
