import React, { useMemo, useState } from 'react';
import { Alert, Button, Modal, Space, message } from 'antd';
import { useIntl } from '@umijs/max';
import { history } from '@@/exports';
import FieldLibraryTree from '@/components/field-library/FieldLibraryTree';
import { applyDataDict, type DataDictTreeNode } from '@/services/data-dict';
import { applyFieldLibraryToEntity } from '@/utils/applyFieldLibrary';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';

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
  const intl = useIntl();
  const projectId = useProjectStore((s) => s.project?.id, shallow);
  const [selected, setSelected] = useState<DataDictTreeNode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedCount = props.selectedRowIndices?.length ?? 0;
  const isOverwrite = selectedCount > 0;

  const modeHint = useMemo(() => {
    if (!isOverwrite) {
      return intl.formatMessage({ id: 'fieldLibrary.insert.modeAppend' });
    }
    if (selectedCount === 1) {
      return intl.formatMessage({ id: 'fieldLibrary.insert.modeOverwriteOne' });
    }
    return intl.formatMessage(
      { id: 'fieldLibrary.insert.modeOverwriteMany' },
      { count: selectedCount },
    );
  }, [isOverwrite, selectedCount, intl]);

  const goManage = () => {
    props.onOpenChange(false);
    setSelected(null);
    const q = projectId ? `?projectId=${projectId}` : '';
    history.push(`/design/table/setting/fieldLibrary${q}`);
  };

  const onApply = async () => {
    if (!selected?.id) {
      message.warning(intl.formatMessage({ id: 'fieldLibrary.insert.selectRequired' }));
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
        message.error(intl.formatMessage({ id: 'fieldLibrary.insert.applyFailed' }));
        return;
      }
      if (result.mode === 'overwrite') {
        if (result.modifiedFieldCount === 0) {
          message.info(intl.formatMessage({ id: 'fieldLibrary.insert.overwriteNone' }));
        } else {
          message.success(
            intl.formatMessage(
              { id: 'fieldLibrary.insert.overwriteSuccess' },
              { count: result.modifiedFieldCount },
            ),
          );
        }
      } else if (result.addedFieldCount === 0) {
        message.info(intl.formatMessage({ id: 'fieldLibrary.insert.existsSkipped' }));
      } else {
        message.success(
          intl.formatMessage(
            { id: 'fieldLibrary.insert.applySuccess' },
            { count: result.addedFieldCount },
          ),
        );
      }
      props.onApplied?.();
      props.onOpenChange(false);
      setSelected(null);
    } catch {
      message.error(intl.formatMessage({ id: 'fieldLibrary.insert.applyFailed' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <span>{intl.formatMessage({ id: 'fieldLibrary.insert.title' })}</span>
          <Button
            type="link"
            size="small"
            data-testid="field-library-insert-manage"
            aria-label={intl.formatMessage({ id: 'fieldLibrary.insert.manageAria' })}
            onClick={goManage}
          >
            {intl.formatMessage({ id: 'fieldLibrary.insert.manage' })}
          </Button>
        </Space>
      }
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
          {intl.formatMessage({ id: 'fieldLibrary.insert.cancel' })}
        </Button>,
        <Button
          key="apply"
          type="primary"
          data-testid="field-library-insert-confirm"
          aria-label={
            isOverwrite
              ? intl.formatMessage({ id: 'fieldLibrary.insert.overwriteAria' })
              : intl.formatMessage({ id: 'fieldLibrary.insert.applyAria' })
          }
          loading={submitting}
          disabled={!selected?.isLeaf}
          onClick={() => { void onApply(); }}
        >
          {isOverwrite
            ? intl.formatMessage({ id: 'fieldLibrary.insert.overwrite' })
            : intl.formatMessage({ id: 'fieldLibrary.insert.apply' })}
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
        onManage={goManage}
      />
    </Modal>
  );
};

export default React.memo(InsertFromFieldLibraryModal);
