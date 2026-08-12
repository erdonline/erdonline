import React, {useContext} from 'react';
import { Button } from "antd";
import { useIntl } from '@umijs/max';
import { FileOutlined } from '@ant-design/icons';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";

const ExportJson: React.FC = () => {
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
      icon={<FileOutlined />}
      onClick={() => {
        closeProjectMenu();
        projectDispatch.exportFile('JSON');
      }}
      style={{ textAlign: 'left' }}
      aria-label={intl.formatMessage({ id: 'exportModal.jsonAria' })}
    >{intl.formatMessage({ id: 'exportModal.json' })}</Button>
  );
};

export default React.memo(ExportJson);
