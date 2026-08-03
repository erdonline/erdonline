import React, { useEffect, useState } from 'react';
import { Button, Empty, Form, Input, Modal, Select, Space, message } from 'antd';
import type { FormInstance } from 'antd/es/form';
import useProjectStore from '@/store/project/useProjectStore';
import { ModuleEntity } from '@/store/tab/useTabStore';
import { confirmDestructive } from '@/utils/destructiveConfirm';

export type TableTriggerEditProps = {
  moduleEntity: ModuleEntity;
};

export type TriggerRow = {
  name?: string;
  timing?: string;
  event?: string;
  orientation?: string;
  statement?: string;
  ddl?: string;
};

const TIMING_OPTS = ['BEFORE', 'AFTER', 'INSTEAD OF'] as const;
const EVENT_OPTS = ['INSERT', 'UPDATE', 'DELETE'] as const;
const ORIENT_OPTS = ['ROW', 'STATEMENT'] as const;

const triggerNameBase = (entity: { title?: string; name?: string }) =>
  String(entity.title || entity.name || 'T').replace(/\W+/g, '_');

const nextTriggerName = (base: string, existing: TriggerRow[]) => {
  const names = new Set(existing.map((t) => t.name).filter(Boolean));
  let n = existing.length + 1;
  while (names.has(`trg_${base}_${n}`)) n += 1;
  return `trg_${base}_${n}`;
};

const buildDdl = (t: TriggerRow, tableTitle: string): string => {
  if (t.ddl?.trim()) return t.ddl.trim();
  const timing = (t.timing || 'BEFORE').toUpperCase();
  const event = (t.event || 'UPDATE').toUpperCase();
  const orient = (t.orientation || 'ROW').toUpperCase();
  const body = (t.statement || '').trim() || '-- body';
  const name = t.name || 'trg';
  return `CREATE TRIGGER \`${name}\` ${timing} ${event} ON \`${tableTitle}\` FOR EACH ${orient}\n${body}`;
};

type EditorMode = 'add' | 'edit';

const TableTriggerEdit: React.FC<TableTriggerEditProps> = (props) => {
  const { module, entity: entityName } = props.moduleEntity;
  const projectDispatch = useProjectStore((s) => s.dispatch);
  const entity = useProjectStore((state) =>
    state.project?.projectJSON?.modules
      ?.find((m: { name?: string }) => m.name === module)
      ?.entities?.find(
        (e: { title?: string; name?: string }) =>
          (e.title || e.name) === entityName,
      ),
  );

  const triggers: TriggerRow[] = Array.isArray(entity?.triggers) ? entity.triggers : [];
  const entityTitle = entity?.title || entity?.name || entityName;
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('add');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    setSelected(null);
    setModalOpen(false);
    setEditIndex(null);
    form.resetFields();
  }, [module, entityName, form]);

  useEffect(() => {
    if (selected != null && selected >= triggers.length) {
      setSelected(triggers.length ? triggers.length - 1 : null);
    }
  }, [triggers.length, selected]);

  const persistTriggers = async (payload: TriggerRow[]): Promise<boolean> => {
    if (!module || !entityTitle) {
      message.error('当前模块或实体未定义');
      return false;
    }
    try {
      const ok = await Promise.resolve(
        projectDispatch.updateEntityTriggers(module, entityTitle, payload, {
          persist: true,
        }),
      );
      return !!ok;
    } catch {
      message.error('触发器保存失败');
      return false;
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditIndex(null);
    form.resetFields();
  };

  const openAdd = () => {
    const base = triggerNameBase(entity || { title: entityTitle });
    form.setFieldsValue({
      name: nextTriggerName(base, triggers),
      timing: 'BEFORE',
      event: 'UPDATE',
      orientation: 'ROW',
      statement: '',
      ddl: '',
    });
    setEditorMode('add');
    setEditIndex(null);
    setModalOpen(true);
  };

  const openEdit = (rowIndex: number) => {
    const target = triggers[rowIndex];
    if (!target) return;
    form.setFieldsValue({
      name: target.name || '',
      timing: target.timing || 'BEFORE',
      event: target.event || 'UPDATE',
      orientation: target.orientation || 'ROW',
      statement: target.statement || '',
      ddl: target.ddl || '',
    });
    setEditorMode('edit');
    setEditIndex(rowIndex);
    setSelected(rowIndex);
    setModalOpen(true);
  };

  const submitEditor = async () => {
    let values: TriggerRow;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const name = String(values.name || '').trim();
    if (!name) {
      message.error('触发器名不能为空');
      return;
    }
    const conflict = triggers.some((t, i) => {
      if (editorMode === 'edit' && i === editIndex) return false;
      return t.name === name;
    });
    if (conflict) {
      message.error(`触发器名重复: ${name}`);
      return;
    }
    const timing = values.timing || 'BEFORE';
    const event = values.event || 'UPDATE';
    const orientation = values.orientation || 'ROW';
    const statement = (values.statement || '').trim();
    const formDdl = (values.ddl || '').trim();
    const original =
      editorMode === 'edit' && editIndex != null ? triggers[editIndex] : null;
    // 结构字段变了但 DDL 文本未动 → 按字段重建，避免逆向/自动 ddl 盖住语句体改动
    const structuralChanged =
      !!original &&
      (name !== (original.name || '') ||
        timing !== (original.timing || 'BEFORE') ||
        event !== (original.event || 'UPDATE') ||
        orientation !== (original.orientation || 'ROW') ||
        statement !== (original.statement || '').trim());
    const ddlInput =
      original && formDdl === (original.ddl || '').trim() && structuralChanged
        ? ''
        : formDdl;
    const row: TriggerRow = {
      name,
      timing,
      event,
      orientation,
      statement,
      ddl: buildDdl(
        {
          name,
          timing,
          event,
          orientation,
          statement,
          ddl: ddlInput,
        },
        entityTitle,
      ),
    };
    setSaving(true);
    try {
      const next =
        editorMode === 'edit' && editIndex != null
          ? triggers.map((t, i) => (i === editIndex ? row : t))
          : [...triggers, row];
      const ok = await persistTriggers(next);
      if (ok) {
        setModalOpen(false);
        form.resetFields();
        setSelected(editorMode === 'edit' && editIndex != null ? editIndex : triggers.length);
        setEditIndex(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (rowIndex: number) => {
    const target = triggers[rowIndex];
    const triggerName = target?.name || `第 ${rowIndex + 1} 条`;
    confirmDestructive({
      title: `确定删除触发器 "${triggerName}" 吗?`,
      content: '此操作不可逆，请谨慎操作。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        setSaving(true);
        try {
          const next = triggers.filter((_, i) => i !== rowIndex);
          const ok = await persistTriggers(next);
          if (!ok) {
            return Promise.reject(new Error('触发器删除落盘失败'));
          }
          if (selected === rowIndex) setSelected(null);
          else if (selected != null && selected > rowIndex) setSelected(selected - 1);
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const selectedRow = selected != null ? triggers[selected] : null;
  const ddlText = selectedRow
    ? selectedRow.ddl?.trim() ||
      buildDdl(selectedRow, entityTitle)
    : '';

  if (triggers.length === 0) {
    return (
      <div
        data-testid="table-trigger-edit"
        className="erd-table-trigger-empty"
        aria-busy={saving || undefined}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span data-testid="trigger-empty-hint">
              还没有触发器。逆向保真的 triggers[] 会出现在此；亦可手动添加。
            </span>
          }
        >
          <Button
            type="primary"
            size="small"
            data-testid="trigger-empty-add"
            aria-label="添加第一个触发器"
            loading={saving}
            disabled={saving}
            onClick={openAdd}
          >
            添加第一个触发器
          </Button>
        </Empty>
        <TriggerEditorModal
          open={modalOpen}
          mode={editorMode}
          form={form}
          saving={saving}
          onCancel={closeModal}
          onOk={() => void submitEditor()}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="table-trigger-edit"
      className="erd-table-trigger-edit"
      aria-busy={saving || undefined}
    >
      <p className="erd-table-trigger-hint" data-testid="trigger-list-hint">
        列表 + 编辑 + 查看 DDL；保存走 saveProject（仅 200 写 store）。DBML 不互导触发器。
      </p>
      <ul
        className="erd-table-trigger-list"
        role="listbox"
        aria-label="触发器列表"
        data-testid="trigger-list"
      >
        {triggers.map((t, i) => {
          const name = t.name || `第 ${i + 1} 条`;
          const selectedHere = selected === i;
          return (
            <li key={`${name}-${i}`} className="erd-table-trigger-row" role="none">
              <button
                type="button"
                role="option"
                aria-selected={selectedHere}
                className={
                  selectedHere
                    ? 'erd-table-trigger-row__select is-active'
                    : 'erd-table-trigger-row__select'
                }
                data-testid={`trigger-select-${i}`}
                aria-label={`查看触发器 ${name}`}
                onClick={() => setSelected(i)}
              >
                <span className="erd-table-trigger-row__name">{name}</span>
                <span className="erd-table-trigger-row__meta">
                  {[t.timing, t.event].filter(Boolean).join(' · ') || '—'}
                </span>
              </button>
              <Button
                type="link"
                size="small"
                data-testid={`trigger-edit-${i}`}
                aria-label={`编辑触发器 ${name}`}
                disabled={saving}
                onClick={() => openEdit(i)}
              >
                编辑
              </Button>
              <Button
                danger
                type="link"
                size="small"
                data-testid={`trigger-delete-${i}`}
                aria-label={`删除触发器 ${name}`}
                disabled={saving}
                onClick={() => confirmDelete(i)}
              >
                删除
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="erd-table-trigger-add-row">
        <Button
          type="dashed"
          size="small"
          block
          data-testid="trigger-add-row"
          aria-label="再添加一条触发器"
          loading={saving}
          disabled={saving}
          onClick={openAdd}
        >
          + 再添加一条触发器
        </Button>
      </div>
      {selectedRow ? (
        <section
          className="erd-table-trigger-ddl"
          data-testid="trigger-ddl-panel"
          aria-label={`触发器 ${selectedRow.name || ''} DDL`}
        >
          <header className="erd-table-trigger-ddl__head">
            <span>DDL · {selectedRow.name}</span>
            {selectedRow.orientation ? (
              <span className="erd-table-trigger-ddl__orient">
                {selectedRow.orientation}
              </span>
            ) : null}
          </header>
          <pre
            className="erd-table-trigger-ddl__body"
            data-testid="trigger-ddl-body"
            tabIndex={0}
          >
            {ddlText}
          </pre>
          {selectedRow.statement?.trim() ? (
            <p className="erd-table-trigger-ddl__stmt" data-testid="trigger-statement">
              体：{selectedRow.statement.trim()}
            </p>
          ) : null}
        </section>
      ) : (
        <p className="erd-table-trigger-ddl-empty" data-testid="trigger-ddl-placeholder">
          选择一条触发器以查看 DDL
        </p>
      )}
      <TriggerEditorModal
        open={modalOpen}
        mode={editorMode}
        form={form}
        saving={saving}
        onCancel={closeModal}
        onOk={() => void submitEditor()}
      />
    </div>
  );
};

type EditorModalProps = {
  open: boolean;
  mode: EditorMode;
  form: FormInstance;
  saving: boolean;
  onCancel: () => void;
  onOk: () => void;
};

const TriggerEditorModal: React.FC<EditorModalProps> = ({
  open,
  mode,
  form,
  saving,
  onCancel,
  onOk,
}) => {
  const isEdit = mode === 'edit';
  const title = isEdit ? '编辑触发器' : '添加触发器';
  const okAria = isEdit ? '确认保存触发器' : '确认添加触发器';
  const cancelAria = isEdit ? '取消编辑触发器' : '取消添加触发器';

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="保存"
      cancelText="取消"
      confirmLoading={saving}
      destroyOnClose
      width={480}
      className="erd-io-modal"
      rootClassName="erd-io-modal-root"
      keyboard={!saving}
      maskClosable={!saving}
      focusTriggerAfterClose
      okButtonProps={{ 'aria-label': okAria }}
      cancelButtonProps={{ 'aria-label': cancelAria }}
      afterOpenChange={(visible) => {
        if (!visible) return;
        const tryFocus = (attempt = 0) => {
          const input = document.querySelector<HTMLInputElement>(
            '.erd-io-modal-root input[data-testid="trigger-form-name"]',
          );
          if (input) {
            input.focus();
            input.select?.();
            return;
          }
          if (attempt >= 20) return;
          window.setTimeout(() => tryFocus(attempt + 1), 50);
        };
        window.setTimeout(() => tryFocus(), 0);
      }}
    >
      <Form form={form} layout="vertical" size="small" requiredMark={false}>
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入触发器名' }]}
        >
          <Input
            data-testid="trigger-form-name"
            aria-label="触发器名称"
            autoComplete="off"
          />
        </Form.Item>
        <Space size={8} style={{ width: '100%' }} wrap>
          <Form.Item name="timing" label="时机" style={{ marginBottom: 8, minWidth: 120 }}>
            <Select
              options={TIMING_OPTS.map((v) => ({ value: v, label: v }))}
              aria-label="触发时机"
              data-testid="trigger-form-timing"
            />
          </Form.Item>
          <Form.Item name="event" label="事件" style={{ marginBottom: 8, minWidth: 120 }}>
            <Select
              options={EVENT_OPTS.map((v) => ({ value: v, label: v }))}
              aria-label="触发事件"
              data-testid="trigger-form-event"
            />
          </Form.Item>
          <Form.Item
            name="orientation"
            label="粒度"
            style={{ marginBottom: 8, minWidth: 120 }}
          >
            <Select
              options={ORIENT_OPTS.map((v) => ({ value: v, label: v }))}
              aria-label="触发粒度"
              data-testid="trigger-form-orientation"
            />
          </Form.Item>
        </Space>
        <Form.Item name="statement" label="语句体" style={{ marginBottom: 8 }}>
          <Input.TextArea
            rows={3}
            data-testid="trigger-form-statement"
            aria-label="触发器语句体"
            placeholder="SET NEW.updated_at = NOW()"
          />
        </Form.Item>
        <Form.Item
          name="ddl"
          label="DDL（可选，空则按时机/事件重建）"
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea
            rows={3}
            data-testid="trigger-form-ddl"
            aria-label="触发器 DDL"
            placeholder="留空则自动生成 CREATE TRIGGER …"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default React.memo(TableTriggerEdit);
