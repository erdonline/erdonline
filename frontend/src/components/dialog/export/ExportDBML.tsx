import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Button, Input, Modal, Select, Space, message} from 'antd';
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
      message.error(msg || 'DBML 导出失败');
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
      message.warning('项目中没有任何模型可导出');
    }
    // 仅在打开时初始化
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
      message.error('没有可下载的 DBML 内容');
      return;
    }
    const base = moduleName || 'export';
    File.save(preview, `${base}.dbml`);
    message.success('已下载 DBML');
  };

  const handleCopy = async () => {
    if (!preview.trim()) {
      message.error('没有可复制的 DBML 内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(preview);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动选择文本复制');
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
          aria-label="导出DBML"
          onClick={openModal}
        >
          导出DBML
        </Button>
      )}
      <Modal
        title="导出 DBML"
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
              '.erd-io-modal-root [aria-label="导出模型"]',
            );
            if (input && !input.disabled) {
              moduleSelectRef.current?.focus();
              return;
            }
            if (attempt >= 20) {
              // 无模型时 Select 禁用：首焦「取消」
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
              取消
            </Button>
            <Button
              aria-label="复制DBML"
              onClick={() => void handleCopy()}
              disabled={loading || !preview.trim()}
            >
              复制
            </Button>
            <Button
              type="primary"
              aria-label="下载DBML"
              onClick={handleDownload}
              loading={loading}
              disabled={!preview.trim()}
            >
              下载 .dbml
            </Button>
          </Space>
        }
      >
        <div className="erd-io-modal__field">
          <Select
            ref={moduleSelectRef}
            aria-label="导出模型"
            size="small"
            style={{width: '100%'}}
            placeholder="选择要导出的模型"
            value={moduleName || undefined}
            options={moduleOptions}
            onChange={handleModuleChange}
            disabled={moduleOptions.length === 0}
          />
        </div>
        <TextArea
          aria-label="DBML预览"
          value={preview}
          readOnly
          rows={10}
          placeholder="选择模型后在此预览 DBML…"
          disabled={loading}
        />
        <p className="erd-io-modal__hint">
          导出表、字段、默认值、索引、外键与注释（chnname→note）；枚举/触发器本切片不导出。
        </p>
      </Modal>
    </>
  );
};

export default React.memo(ExportDBML);
