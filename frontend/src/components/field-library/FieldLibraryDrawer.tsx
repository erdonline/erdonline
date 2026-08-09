import React from 'react';
import { Drawer } from 'antd';
import FieldLibraryManager from '@/pages/design/setting/component/FieldLibraryManager';

export type FieldLibraryDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const FieldLibraryDrawer: React.FC<FieldLibraryDrawerProps> = (props) => (
  <Drawer
    title="字段库"
    placement="right"
    width={480}
    open={props.open}
    onClose={props.onClose}
    destroyOnClose
    data-testid="field-library-drawer"
  >
    <FieldLibraryManager compact />
  </Drawer>
);

export default React.memo(FieldLibraryDrawer);
