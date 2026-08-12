import React from 'react';
import { Button, Drawer, Space } from 'antd';
import { useIntl } from '@umijs/max';
import { history } from '@@/exports';
import FieldLibraryManager from '@/pages/design/setting/component/FieldLibraryManager';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';

export type FieldLibraryDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const FieldLibraryDrawer: React.FC<FieldLibraryDrawerProps> = (props) => {
  const intl = useIntl();
  const projectId = useProjectStore((s) => s.project?.id, shallow);

  const openSettingsPage = () => {
    props.onClose();
    const q = projectId ? `?projectId=${projectId}` : '';
    history.push(`/design/table/setting/fieldLibrary${q}`);
  };

  return (
    <Drawer
      title={intl.formatMessage({ id: 'designLayout.route.fieldLibrary' })}
      placement="right"
      width={480}
      open={props.open}
      onClose={props.onClose}
      destroyOnClose
      data-testid="field-library-drawer"
      extra={
        <Button
          type="link"
          size="small"
          data-testid="field-library-drawer-open-settings"
          aria-label={intl.formatMessage({ id: 'fieldLibrary.drawer.openSettingsAria' })}
          onClick={openSettingsPage}
        >
          {intl.formatMessage({ id: 'fieldLibrary.drawer.openSettings' })}
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <FieldLibraryManager compact />
      </Space>
    </Drawer>
  );
};

export default React.memo(FieldLibraryDrawer);
