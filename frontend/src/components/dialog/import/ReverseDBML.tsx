import React, {useContext, useRef, useState} from 'react';
import {Button, Input, Modal, Upload, message} from 'antd';
import {useIntl} from '@umijs/max';
import type {InputRef} from 'antd/es/input';
import {InboxOutlined} from '@ant-design/icons';
import {history} from 'umi';
import { FileOutlined } from '@ant-design/icons';
import useProjectStore from '@/store/project/useProjectStore';
import useTabStore, {TabGroup} from '@/store/tab/useTabStore';
import shallow from 'zustand/shallow';
import {ProjectMenuCloseContext} from '@/components/Menu/projectMenuClose';
import type {MenuDialogControl} from '@/components/Menu/menuDialog';
import {importModuleAndProfile} from '@/pages/design/import/component/ReverseERD';
import {relationTabEntity} from '@/utils/diagram';
import type {DbmlProjectJSON} from '@/utils/dbml/toProjectJSON';
import {showImportSkipWarning} from '@/utils/importSkipWarningModal';
import '../io-modal.scss';

const {Dragger} = Upload;
const {TextArea} = Input;

export type ReverseDBMLProps = MenuDialogControl;

type ModuleLike = {name?: string};

const ReverseDBML: React.FC<ReverseDBMLProps> = ({
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
  const [paste, setPaste] = useState('');
  const [loading, setLoading] = useState(false);
  const pasteRef = useRef<InputRef>(null);
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
    if (loading) return;
    setOpen(false);
    setPaste('');
  };

  const mergeImported = async (dbmlJson: DbmlProjectJSON) => {
    const modules = dbmlJson.modules || [];
    if (modules.length <= 0) {
      message.warning(intl.formatMessage({ id: 'importModal.dbml.noModule' }));
      return;
    }
    const dataSource = projectJSON as {
      modules?: ModuleLike[];
      dataTypeDomains?: unknown;
      profile?: unknown;
    };
    const resultMsg: string[] = [];
    const resultModules: ModuleLike[] = [];
    modules.forEach((module) => {
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
    const {ok} = await importModuleAndProfile(
      dataSource,
      dbmlJson,
      resultModules,
      projectDispatch,
    );
    if (!ok) {
      return;
    }
    if (resultMsg.length > 0) {
      showImportSkipWarning(resultMsg);
    } else {
      const n = resultModules.reduce((acc, m) => {
        const ents = (m as {entities?: unknown[]}).entities;
        return acc + (Array.isArray(ents) ? ents.length : 0);
      }, 0);
      const frameN = resultModules.reduce((acc, m) => {
        const diagrams = (m as {diagrams?: Array<{groups?: unknown[]}>}).diagrams;
        const groups = diagrams?.[0]?.groups;
        return acc + (Array.isArray(groups) ? groups.length : 0);
      }, 0);
      message.success(
        frameN > 0
          ? intl.formatMessage(
              { id: 'importModal.dbml.successWithFrames' },
              { tables: n, frames: frameN },
            )
          : intl.formatMessage({ id: 'importModal.dbml.success' }, { tables: n }),
      );
    }
    const firstName = resultModules[0]?.name;
    if (firstName) {
      useTabStore.getState().dispatch.addTab({
        group: TabGroup.MODEL,
        module: firstName,
        entity: relationTabEntity(firstName),
      });
      projectDispatch.setCurrentModule(firstName);
      if (history.location.pathname !== '/design/table/model') {
        history.push({pathname: '/design/table/model'});
      }
    }
    setOpen(false);
    setPaste('');
  };

  const runImport = async (text: string) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      message.error(intl.formatMessage({ id: 'importModal.dbml.pasteRequired' }));
      return;
    }
    setLoading(true);
    const hide = message.loading(intl.formatMessage({ id: 'importModal.dbml.parsing' }), 0);
    try {
      const {dbmlToProjectJSON} = await import('@/utils/dbml/toProjectJSON');
      const json = await dbmlToProjectJSON(trimmed);
      await mergeImported(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      message.error(msg || intl.formatMessage({ id: 'importModal.dbml.importFailed' }));
    } finally {
      hide();
      setLoading(false);
    }
  };

  const uploadProps = {
    multiple: false,
    maxCount: 1,
    disabled: loading,
    beforeUpload(file: File) {
      const name = String(file?.name || '').toLowerCase();
      const ok =
        name.endsWith('.dbml') ||
        name.endsWith('.txt') ||
        file.type === 'text/plain' ||
        file.type === '';
      if (!ok) {
        message.error(intl.formatMessage({ id: 'importModal.dbml.fileTypeError' }));
        return false;
      }
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        void runImport(String(reader.result || ''));
      };
      reader.onerror = () => {
        message.error(intl.formatMessage({ id: 'importModal.dbml.readFailed' }));
      };
      return false;
    },
  };

  return (
    <>
      {hideTrigger ? null : (
        <Button
          key="dbml"
          type="text"
          size="small"
          block
          icon={<FileOutlined />}
          style={{textAlign: 'left'}}
          aria-label={intl.formatMessage({ id: 'importModal.dbml.triggerAria' })}
          onClick={openModal}
        >
          {intl.formatMessage({ id: 'importModal.dbml.trigger' })}
        </Button>
      )}
      <Modal
        title={intl.formatMessage({ id: 'importModal.dbml.title' })}
        open={open}
        onCancel={closeModal}
        destroyOnClose
        width={520}
        className="erd-io-modal"
        rootClassName="erd-io-modal-root"
        transitionName=""
        maskTransitionName=""
        keyboard
        focusTriggerAfterClose
        okText={intl.formatMessage({ id: 'importModal.dbml.okText' })}
        cancelText={intl.formatMessage({ id: 'shareModal.cancel' })}
        confirmLoading={loading}
        onOk={() => void runImport(paste)}
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => pasteRef.current?.focus(), 0);
        }}
      >
        <TextArea
          ref={pasteRef}
          aria-label={intl.formatMessage({ id: 'importModal.dbml.textAria' })}
          placeholder={intl.formatMessage({ id: 'importModal.dbml.textPlaceholder' })}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={6}
          disabled={loading}
          className="erd-io-modal__field"
        />
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{intl.formatMessage({ id: 'importModal.dbml.uploadHint' })}</p>
          <p className="ant-upload-hint">
            {intl.formatMessage({ id: 'importModal.dbml.draggerHint' })}
          </p>
        </Dragger>
      </Modal>
    </>
  );
};

export default React.memo(ReverseDBML);
