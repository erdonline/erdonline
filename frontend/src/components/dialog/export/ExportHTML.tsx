import React, {useContext} from 'react';
import { Button } from "antd";
import {MyIcon} from "@/components/Menu";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";

const ExportHTML: React.FC = () => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);
  return (
    <Button
      type="text"
      size="small"
      block
      icon={<MyIcon type="icon-HTML"/>}
      onClick={() => {
        closeProjectMenu();
        projectDispatch.exportFile('Html');
      }}
      style={{ textAlign: 'left' }}
      aria-label="导出HTML"
    >导出HTML</Button>
  );
};

export default React.memo(ExportHTML);
