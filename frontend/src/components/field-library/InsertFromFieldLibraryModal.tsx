import React, { useMemo, useState } from 'react';
import { Alert, Button, Modal, message } from 'antd';
import FieldLibraryTree from '@/components/field-library/FieldLibraryTree';
import { applyDataDict, type DataDictTreeNode } from '@/services/data-dict';
import { applyFieldLibraryToEntity } from '@/utils/applyFieldLibrary';

export type InsertFromFieldLibraryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleName: string;
  entityTitle: string;
  /** 网格选中行索引；有值时为覆盖模式 */
  selectedRowIndices?: number[];
  /** 落盘成功后通知父级刷新 JExcel（组件不吃 props.data 增量） */
  onApplied?: () => void;
};

const InsertFromFieldLibraryModal: React.FC<InsertFromFieldLibraryModalProps> = (
  props,
) => {
  const [selected, setSelected] = useState<DataDictTreeNode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedCount = props.selectedRowIndices?.length ?? 0;
  const isOverwrite = selectedCount > 0;

  const modeHint = useMemo(() => {
    if (!isOverwrite) {
      return '未选中行：写入后将追加到字段列表末尾。';
    }
    if (selectedCount === 1) {
      return '已选中 1 行：写入后将覆盖该行字段属性（copy-on-apply）。';
    }
    return `已选中 ${selectedCount} 行：写入后将按行覆盖（1 个库字段覆盖全部选中行；多库字段按顺序 zip）。`;
  }, [isOverwrite, selectedCount]);

  const onApply = async () => {
    if (!selected?.id) {
      message.warning('请选择要写入的字段条目');
      return;
    }
    setSubmitting(true);
    try {
      const applyRes = await applyDataDict(selected.id);
      const result = await applyFieldLibraryToEntity({
        moduleName: props.moduleName,
        entityTitle: props.entityTitle,
        applyResult: applyRes,
        selectedRowIndices: props.selectedRowIndices,
      });
      if (!result.ok) {
        message.error('写入字段失败');
        return;
      }
      if (result.mode === 'overwrite') {
        if (result.modifiedFieldCount === 0) {
          message.info('未能覆盖选中行，请重试');
        } else {
          message.success(`已覆盖 ${result.modifiedFieldCount} 个字段`);
        }
      } else if (result.addedFieldCount === 0) {
        message.info('字段已存在，未重复写入');
      } else {
        message.success(`已写入 ${result.addedFieldCount} 个字段`);
      }
      props.onApplied?.();
      props.onOpenChange(false);
      setSelected(null);
    } catch {
      message.error('写入字段失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="从字段库写入"
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
          key="apply"
          type="primary"
          data-testid="field-library-insert-confirm"
          aria-label={isOverwrite ? '覆盖选中字段' : '写入选中字段'}
          loading={submitting}
          disabled={!selected?.isLeaf}
          onClick={() => { void onApply(); }}
        >
          {isOverwrite ? '覆盖' : '写入'}
        </Button>,
      ]}
    >
      <Alert
        type="info"
        showIcon
        message={modeHint}
        style={{ marginBottom: 12 }}
        data-testid="field-library-mode-hint"
      />
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
