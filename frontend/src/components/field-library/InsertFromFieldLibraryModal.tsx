import React, { useState } from 'react';
import { Button, Modal, message } from 'antd';
import FieldLibraryTree from '@/components/field-library/FieldLibraryTree';
import { applyDataDict, type DataDictTreeNode } from '@/services/data-dict';
import { applyFieldLibraryToEntity } from '@/utils/applyFieldLibrary';

export type InsertFromFieldLibraryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleName: string;
  entityTitle: string;
};

const InsertFromFieldLibraryModal: React.FC<InsertFromFieldLibraryModalProps> = (
  props,
) => {
  const [selected, setSelected] = useState<DataDictTreeNode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onInsert = async () => {
    if (!selected?.id) {
      message.warning('请选择要插入的字段条目');
      return;
    }
    setSubmitting(true);
    try {
      const applyRes = await applyDataDict(selected.id);
      const result = await applyFieldLibraryToEntity({
        moduleName: props.moduleName,
        entityTitle: props.entityTitle,
        applyResult: applyRes,
      });
      if (!result.ok) {
        message.error('插入字段失败');
        return;
      }
      if (result.addedFieldCount === 0) {
        message.info('字段已存在，未重复插入');
      } else {
        message.success(`已插入 ${result.addedFieldCount} 个字段`);
      }
      props.onOpenChange(false);
      setSelected(null);
    } catch {
      message.error('插入字段失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="从字段库插入"
      open={props.open}
      onCancel={() => {
        props.onOpenChange(false);
        setSelected(null);
      }}
      destroyOnClose
      width={560}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            props.onOpenChange(false);
            setSelected(null);
          }}
        >
          取消
        </Button>,
        <Button
          key="insert"
          type="primary"
          data-testid="field-library-insert-confirm"
          aria-label="插入选中字段"
          loading={submitting}
          disabled={!selected?.isLeaf}
          onClick={() => { void onInsert(); }}
        >
          插入
        </Button>,
      ]}
    >
      <FieldLibraryTree
        leafOnly
        selectable
        selectedId={selected?.id}
        onSelectLeaf={(node) => setSelected(node)}
      />
    </Modal>
  );
};

export default React.memo(InsertFromFieldLibraryModal);
