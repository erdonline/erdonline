import React, {useContext, useState} from 'react';
import {Button, Modal, Upload, message} from 'antd';
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

export type ReversePdManProps = MenuDialogControl;

type ModuleLike = {name?: string};

const ReversePdMan: React.FC<ReversePdManProps> = ({
  hideTrigger,
  open: openProp,
  onOpenChange,
}) => {
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
        file.type === 'application/json' || name.endsWith('.json');
      if (!isJSON) {
        message.error('请确认上传文件是PDMan导出的标准json文件!');
        return false;
      }

      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        void (async () => {
          let pdmanJson: {
            modules?: ModuleLike[];
            dataTypeDomains?: unknown;
            profile?: unknown;
          };
          try {
            pdmanJson = JSON.parse(String(reader.result));
          } catch {
            message.error('您导入的是非法的PDMan文件!');
            return;
          }
          const pdmanJsonModules = pdmanJson.modules;
          if (!pdmanJsonModules) {
            message.error('您导入的是非法的PDMan文件!');
            return;
          }
          if (!(pdmanJsonModules instanceof Array)) {
            message.error('您导入的是非法的PDMan文件!');
            return;
          }
          if (pdmanJsonModules.length <= 0) {
            message.warning('您尚未在PDMan新建模型，无需导入，可直接在本系统新建模型!');
            return;
          }
          const dataSource = projectJSON as {
            modules?: ModuleLike[];
            dataTypeDomains?: unknown;
            profile?: unknown;
          };
          const resultMsg: string[] = [];
          const resultModules: ModuleLike[] = [];
          pdmanJsonModules.forEach((module) => {
            const hasMulti = (dataSource.modules || []).some(
              (module1) => module.name === module1.name,
            );
            if (!hasMulti) {
              resultModules.push(module);
            } else {
              resultMsg.push(`[${module.name}]已经在本系统中存在，已跳过导入`);
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
              pdmanJson,
              resultModules,
              projectDispatch,
            );
            if (!ok) {
              return;
            }
            if (resultMsg.length > 0) {
              showImportSkipWarning(resultMsg);
            } else {
              message.success('PdMan文件导入成功！');
            }
          } finally {
            setImporting(false);
          }
        })();
      };
      return false;
    },
  };

  return (
    <>
      {hideTrigger ? null : (
        <Button
          key="pdman"
          type="text"
          size="small"
          block
          icon={<FileOutlined />}
          style={{textAlign: 'left'}}
          aria-label="解析PdMan文件"
          onClick={openModal}
        >
          解析PdMan文件
        </Button>
      )}
      <Modal
        title="解析已有PdMan文件"
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
          // rc-upload 把 aria-* 挂到隐藏 input；键盘面在 `.ant-upload-btn`
          const tryFocus = (attempt = 0) => {
            const btn = document.querySelector<HTMLElement>(
              '.erd-io-modal-root .ant-upload-btn',
            );
            if (btn) {
              btn.setAttribute('aria-label', '选择PdMan文件');
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
          <p className="ant-upload-text">点击或者拖拽PdMand导出的json文件到此区域以上传</p>
          <p className="ant-upload-hint">
            上传完毕后，系统会自动开始解析；每次仅支持解析一个PdMan文件。
          </p>
        </Dragger>
      </Modal>
    </>
  );
};

export default React.memo(ReversePdMan);
