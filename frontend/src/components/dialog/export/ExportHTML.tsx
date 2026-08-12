import React, {useContext} from 'react';
import { Button } from "antd";
import { useIntl } from '@umijs/max';
import { Html5Outlined } from '@ant-design/icons';
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";

const ExportHTML: React.FC = () => {
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
      icon={<Html5Outlined />}
      onClick={() => {
        closeProjectMenu();
        projectDispatch.exportFile('Html');
      }}
      style={{ textAlign: 'left' }}
      aria-label={intl.formatMessage({ id: 'exportModal.htmlAria' })}
    >{intl.formatMessage({ id: 'exportModal.html' })}</Button>
  );
};

export default React.memo(ExportHTML);
