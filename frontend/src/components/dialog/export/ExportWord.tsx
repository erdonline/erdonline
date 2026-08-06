import React, {useContext} from 'react';
import { Button } from "antd";
import { FileWordOutlined } from '@ant-design/icons';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";

const ExportWord: React.FC = () => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const {projectDispatch} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
  }), shallow);
  return (
    <Button
      type="text"
      size="small"
      block
      icon={<FileWordOutlined />}
      onClick={() => {
        closeProjectMenu();
        projectDispatch.exportFile('Word');
      }}
      style={{ textAlign: 'left' }}
      aria-label="导出Word"
    >导出Word</Button>
  );
};

export default React.memo(ExportWord);
