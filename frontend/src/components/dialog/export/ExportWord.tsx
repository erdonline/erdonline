import React, {useContext} from 'react';
import { Button } from "antd";
import { useIntl } from '@umijs/max';
import { FileWordOutlined } from '@ant-design/icons';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";

const ExportWord: React.FC = () => {
  const intl = useIntl();
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
      aria-label={intl.formatMessage({ id: 'exportModal.wordAria' })}
    >{intl.formatMessage({ id: 'exportModal.word' })}</Button>
  );
};

export default React.memo(ExportWord);
