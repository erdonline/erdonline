import React, { useContext, useState } from 'react';
import { Button, Modal } from 'antd';
import { ProjectMenuCloseContext } from '@/components/Menu/projectMenuClose';
import type { MenuDialogControl } from '@/components/Menu/menuDialog';
import DatabaseTemplatesEditor from '@/pages/design/setting/component/DatabaseTemplatesEditor';
import '../io-modal.scss';

export type DatabaseTemplatesModalProps = MenuDialogControl;

const DatabaseTemplatesModal: React.FC<DatabaseTemplatesModalProps> = ({
  hideTrigger,
  open: openProp,
  onOpenChange,
}) => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) {
      setInnerOpen(v);
    }
    onOpenChange?.(v);
  };

  const openModal = () => {
    closeProjectMenu();
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
  };

  return (
    <>
      {hideTrigger ? null : (
        <Button
          key="ddl-templates"
          type="text"
          size="small"
          block
          style={{ textAlign: 'left' }}
          aria-label="DDL 模板"
          data-testid="menu-ddl-templates"
          onClick={openModal}
        >
          DDL 模板
        </Button>
      )}
      <Modal
        title="DDL 模板"
        open={open}
        onCancel={closeModal}
        destroyOnClose
        width={1120}
        className="erd-io-modal erd-ddl-templates-modal"
        rootClassName="erd-io-modal-root"
        keyboard
        focusTriggerAfterClose
        footer={[
          <Button key="close" size="small" aria-label="关闭 DDL 模板" onClick={closeModal}>
            关闭
          </Button>,
        ]}
      >
        <DatabaseTemplatesEditor compact />
      </Modal>
    </>
  );
};

export default React.memo(DatabaseTemplatesModal);
