import React, {useContext, useState} from 'react';
import {Button, Modal, Upload, message} from 'antd';
import {useIntl} from '@umijs/max';
import {InboxOutlined} from '@ant-design/icons';
import { FileOutlined } from '@ant-design/icons';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import {ProjectMenuCloseContext} from '@/components/Menu/projectMenuClose';
import type {MenuDialogControl} from '@/components/Menu/menuDialog';
import {importModuleAndProfile} from '@/pages/design/import/component/ReverseERD';
import {showImportSkipWarning} from '@/utils/importSkipWarningModal';
import '../io-modal.scss';

const {Dragger} = Upload;

export type ReverseERDProps = MenuDialogControl;

type ModuleLike = {name?: string};

const ReverseERD: React.FC<ReverseERDProps> = ({
  hideTrigger,
  open: openProp,
  onOpenChange,
}) => {
  const intl = useIntl();
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const [innerOpen, setInnerOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) {
      setInnerOpen(v);
    }
    onOpenChange?.(v);
  };
  const {projectDispatch, projectJSON} = useProjectStore(
    (state) => ({
      projectDispatch: state.dispatch,
      projectJSON: state.project.projectJSON || {},
    }),
    shallow,
  );

  const openModal = () => {
    closeProjectMenu();
    setOpen(true);
  };

  const closeModal = () => {
    if (importing) {
      return;
    }
    setOpen(false);
  };

  const uploadProps = {
    multiple: false,
    maxCount: 1,
    disabled: importing,
    beforeUpload(file: File) {
      const name = String(file?.name || '').toLowerCase();
      const isJSON =
        file.type === 'application/json' ||
        name.endsWith('.json') ||
        name.endsWith('.erd.json');
      if (!isJSON) {
        message.error(intl.formatMessage({ id: 'importModal.erd.invalidJson' }));
        return false;
      }

      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        void (async () => {
          let originJson: string;
          try {
            originJson = projectDispatch.decrypt('AES', String(reader.result));
          } catch {
            message.error(intl.formatMessage({ id: 'importModal.erd.decryptFailed' }));
            return;
          }
          let erdJson: {
            modules?: ModuleLike[];
            dataTypeDomains?: unknown;
            profile?: unknown;
          };
          try {
            erdJson = JSON.parse(originJson);
          } catch {
            message.error(intl.formatMessage({ id: 'importModal.erd.invalidFile' }));
            return;
          }
          const erdJsonModules = erdJson.modules;
          if (!erdJsonModules) {
            message.error(intl.formatMessage({ id: 'importModal.erd.invalidFile' }));
            return;
          }
          if (!(erdJsonModules instanceof Array)) {
            message.error(intl.formatMessage({ id: 'importModal.erd.invalidFile' }));
            return;
          }
          if (erdJsonModules.length <= 0) {
            message.warning(intl.formatMessage({ id: 'importModal.erd.noModule' }));
            return;
          }
          const dataSource = projectJSON as {
            modules?: ModuleLike[];
            dataTypeDomains?: unknown;
            profile?: unknown;
          };
          const resultMsg: string[] = [];
          const resultModules: ModuleLike[] = [];
          erdJsonModules.forEach((module) => {
            const hasMulti = (dataSource.modules || []).some(
              (module1) => module.name === module1.name,
            );
            if (!hasMulti) {
              resultModules.push(module);
            } else {
              resultMsg.push(
                intl.formatMessage({ id: 'importModal.dbml.moduleExists' }, { name: module.name }),
              );
            }
          });
          if (resultModules.length <= 0) {
            showImportSkipWarning(resultMsg);
            return;
          }
          setImporting(true);
          try {
            const {ok} = await importModuleAndProfile(
              dataSource,
              erdJson,
              resultModules,
              projectDispatch,
            );
            if (!ok) {
              return;
            }
            if (resultMsg.length > 0) {
              showImportSkipWarning(resultMsg);
            } else {
              message.success(intl.formatMessage({ id: 'importModal.erd.success' }));
            }
          } finally {
            setImporting(false);
          }
        })();
      };
      return false;
    },
  };

  const fileAria = intl.formatMessage({ id: 'importModal.erd.fileAria' });

  return (
    <>
      {hideTrigger ? null : (
        <Button
          key="erd"
          type="text"
          size="small"
          block
          icon={<FileOutlined />}
          style={{textAlign: 'left'}}
          aria-label={intl.formatMessage({ id: 'importModal.erd.triggerAria' })}
          onClick={openModal}
        >
          {intl.formatMessage({ id: 'importModal.erd.trigger' })}
        </Button>
      )}
      <Modal
        title={intl.formatMessage({ id: 'importModal.erd.title' })}
        open={open}
        onOk={closeModal}
        onCancel={closeModal}
        confirmLoading={importing}
        okButtonProps={{disabled: importing}}
        destroyOnClose
        width={480}
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
            const btn = document.querySelector<HTMLElement>(
              '.erd-io-modal-root .ant-upload-btn',
            );
            if (btn) {
              btn.setAttribute('aria-label', fileAria);
              btn.focus();
              return;
            }
            if (attempt >= 20) {
              return;
            }
            window.setTimeout(() => tryFocus(attempt + 1), 50);
          };
          window.setTimeout(() => tryFocus(), 0);
        }}
      >
        <Dragger {...uploadProps} hasControlInside={false}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{intl.formatMessage({ id: 'importModal.erd.uploadHint' })}</p>
          <p className="ant-upload-hint">
            {intl.formatMessage({ id: 'importModal.erd.draggerHint' })}
          </p>
        </Dragger>
      </Modal>
    </>
  );
};

export default React.memo(ReverseERD);
