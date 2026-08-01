import React, {useContext} from 'react';
import { Button } from "antd";
import {MyIcon} from "@/components/Menu";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";

export type ExportFileProps = {};

const ExportMarkdown: React.FC<ExportFileProps> = () => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);
  return (
    <Button
      type="text"
      size="small"
      block
      icon={<MyIcon type="icon-markdown"/>}
      onClick={() => {
        closeProjectMenu();
        projectDispatch.exportFile('Markdown');
      }}
      style={{ textAlign: 'left' }}
      aria-label="导出Markdown"
    >导出Markdown</Button>
  );
};

export default React.memo(ExportMarkdown);
