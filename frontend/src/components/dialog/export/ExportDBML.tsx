import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Button, Input, Modal, Select, Space, message} from 'antd';
import {useIntl} from '@umijs/max';
import type {BaseSelectRef} from 'rc-select';
import { FileTextOutlined } from '@ant-design/icons';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import {ProjectMenuCloseContext} from '@/components/Menu/projectMenuClose';
import type {MenuDialogControl} from '@/components/Menu/menuDialog';
import * as File from '@/utils/file';
import '../io-modal.scss';

const {TextArea} = Input;

type ModuleOpt = {name: string; chnname?: string; entities?: unknown[]};

const ExportDBML: React.FC<MenuDialogControl> = ({
  hideTrigger,
  open: openProp,
  onOpenChange,
}) => {
  const intl = useIntl();
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) {
      setInnerOpen(v);
    }
    onOpenChange?.(v);
  };
  const [moduleName, setModuleName] = useState<string>('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const moduleSelectRef = useRef<BaseSelectRef>(null);

  const {projectJSON, currentModule} = useProjectStore(
    (state) => ({
      projectJSON: (state.project.projectJSON || {}) as {
        modules?: ModuleOpt[];
      },
      currentModule: state.currentModule as string | undefined,
    }),
    shallow,
  );

  const modules = useMemo(
    () => (projectJSON.modules || []).filter((m) => m?.name),
    [projectJSON.modules],
  );

  const moduleOptions = useMemo(
    () =>
      modules.map((m) => ({
        value: m.name,
        label: m.chnname ? `${m.chnname}（${m.name}）` : m.name,
      })),
    [modules],
  );

  const rebuildPreview = async (name: string) => {
    if (!name) {
      setPreview('');
      return;
    }
    setLoading(true);
    try {
      const {projectJSONToDbml} = await import('@/utils/dbml/fromProjectJSON');
      const text = projectJSONToDbml(projectJSON, {moduleName: name});
      setPreview(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPreview('');
      message.error(msg || intl.formatMessage({ id: 'exportModal.dbml.exportFailed' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const preferred =
      (currentModule && modules.some((m) => m.name === currentModule)
        ? currentModule
        : undefined) ||
      modules.find((m) => Array.isArray(m.entities) && m.entities.length > 0)
        ?.name ||
      modules[0]?.name ||
      '';
    setModuleName(preferred);
    if (preferred) {
      void rebuildPreview(preferred);
    } else {
      setPreview('');
      message.warning(intl.formatMessage({ id: 'exportModal.dbml.noModules' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openModal = () => {
    closeProjectMenu();
    setOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setOpen(false);
    setPreview('');
    setModuleName('');
  };

  const handleModuleChange = (name: string) => {
    setModuleName(name);
    void rebuildPreview(name);
  };

  const handleDownload = () => {
    if (!preview.trim()) {
      message.error(intl.formatMessage({ id: 'exportModal.dbml.noContent' }));
      return;
    }
    const base = moduleName || 'export';
    File.save(preview, `${base}.dbml`);
    message.success(intl.formatMessage({ id: 'exportModal.dbml.downloadSuccess' }));
  };

  const handleCopy = async () => {
    if (!preview.trim()) {
      message.error(intl.formatMessage({ id: 'exportModal.dbml.noCopyContent' }));
      return;
    }
    try {
      await navigator.clipboard.writeText(preview);
      message.success(intl.formatMessage({ id: 'exportModal.dbml.copySuccess' }));
    } catch {
      message.error(intl.formatMessage({ id: 'exportModal.dbml.copyFailed' }));
    }
  };

  return (
    <>
      {hideTrigger ? null : (
        <Button
          type="text"
          size="small"
          block
          icon={<FileTextOutlined />}
          style={{textAlign: 'left'}}
          aria-label={intl.formatMessage({ id: 'exportModal.dbml.triggerAria' })}
          onClick={openModal}
        >
          {intl.formatMessage({ id: 'exportModal.dbml.trigger' })}
        </Button>
      )}
      <Modal
        title={intl.formatMessage({ id: 'exportModal.dbml.title' })}
        open={open}
        onCancel={closeModal}
        destroyOnClose
        width={560}
        className="erd-io-modal"
        rootClassName="erd-io-modal-root"
        transitionName=""
        maskTransitionName=""
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          const tryFocus = (attempt = 0) => {
            const input = document.querySelector<HTMLInputElement>(
              '.erd-io-modal-root [data-testid="export-dbml-module-select"]',
            );
            if (input && !input.disabled) {
              moduleSelectRef.current?.focus();
              return;
            }
            if (attempt >= 20) {
              document
                .querySelector<HTMLButtonElement>(
                  '.erd-io-modal-root .ant-modal-footer .ant-btn:not(.ant-btn-primary)',
                )
                ?.focus();
              return;
            }
            window.setTimeout(() => tryFocus(attempt + 1), 50);
          };
          window.setTimeout(() => tryFocus(), 0);
        }}
        footer={
          <Space>
            <Button onClick={closeModal} disabled={loading}>
              {intl.formatMessage({ id: 'exportModal.dbml.cancel' })}
            </Button>
            <Button
              aria-label={intl.formatMessage({ id: 'exportModal.dbml.copyAria' })}
              onClick={() => void handleCopy()}
              disabled={loading || !preview.trim()}
            >
              {intl.formatMessage({ id: 'exportModal.dbml.copy' })}
            </Button>
            <Button
              type="primary"
              aria-label={intl.formatMessage({ id: 'exportModal.dbml.downloadAria' })}
              onClick={handleDownload}
              loading={loading}
              disabled={!preview.trim()}
            >
              {intl.formatMessage({ id: 'exportModal.dbml.download' })}
            </Button>
          </Space>
        }
      >
        <div className="erd-io-modal__field">
          <Select
            ref={moduleSelectRef}
            aria-label={intl.formatMessage({ id: 'exportModal.dbml.moduleAria' })}
            data-testid="export-dbml-module-select"
            size="small"
            style={{width: '100%'}}
            placeholder={intl.formatMessage({ id: 'exportModal.dbml.modulePlaceholder' })}
            value={moduleName || undefined}
            options={moduleOptions}
            onChange={handleModuleChange}
            disabled={moduleOptions.length === 0}
          />
        </div>
        <TextArea
          aria-label={intl.formatMessage({ id: 'exportModal.dbml.previewAria' })}
          value={preview}
          readOnly
          rows={10}
          placeholder={intl.formatMessage({ id: 'exportModal.dbml.previewPlaceholder' })}
          disabled={loading}
        />
        <p className="erd-io-modal__hint">
          {intl.formatMessage({ id: 'exportModal.dbml.hint' })}
        </p>
      </Modal>
    </>
  );
};

export default React.memo(ExportDBML);
