import React, {useContext} from 'react';
import { Button } from "antd";
import {MyIcon} from "@/components/Menu";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";

const ExportJson: React.FC = () => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);
  return (
    <Button
      type="text"
      size="small"
      block
      icon={<MyIcon type="icon-JSON"/>}
      onClick={() => {
        closeProjectMenu();
        projectDispatch.exportFile('JSON');
      }}
      style={{ textAlign: 'left' }}
      aria-label="导出ERD"
    >导出ERD</Button>
  );
};

export default React.memo(ExportJson);
