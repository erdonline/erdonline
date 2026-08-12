import React, {useState} from 'react';
import {InboxOutlined} from '@ant-design/icons';
import {message, Upload} from "antd";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {importModuleAndProfile} from "@/pages/design/import/component/ReverseERD";
import {showImportSkipWarning} from '@/utils/importSkipWarningModal';
import { designIntl } from '@/pages/design/locales/intl';
import '../../secondary-pane.scss';

const { Dragger } = Upload;

export type ReversePdManProps = {};

const ReversePdMan: React.FC<ReversePdManProps> = () => {
  const [importing, setImporting] = useState(false);
  const {projectDispatch, projectJSON} = useProjectStore(state => ({
    projectDispatch: state.dispatch,
    projectJSON: state.project.projectJSON || {},
  }), shallow);

  const prop = {
    multiple: false,
    maxCount: 1,
    disabled: importing,
    beforeUpload(file: any) {
      const isJSON = file.type === 'application/json';
      if (!isJSON) {
        message.error(designIntl('design.import.reversePdMan.error.notStandardJson'));
        return false;
      }

      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        void (async () => {
          let pdmanJson;
          try {
            // @ts-ignore
            pdmanJson = JSON.parse(reader.result.toString());
          } catch {
            message.error(designIntl('design.import.reversePdMan.error.invalidFile'));
            return;
          }
          let pdmanJsonModules = pdmanJson['modules'];
          if (!pdmanJsonModules) {
            message.error(designIntl('design.import.reversePdMan.error.invalidFile'));
            return;
          }
          if (!(pdmanJsonModules instanceof Array)) {
            message.error(designIntl('design.import.reversePdMan.error.invalidFile'));
            return;
          }
          if (pdmanJsonModules.length <= 0) {
            message.warning(designIntl('design.import.reversePdMan.warn.noModel'));
            return;
          }
          // @ts-ignore
          const dataSource = projectJSON;
          let resultMsg: any = [];
          let resultModules: any = [];
          pdmanJsonModules.forEach((module: any) => {
            let hasMulti = (dataSource.modules || []).some((module1: any) => module.name === module1.name);
            if (!hasMulti) {
              resultModules.push(module);
            } else {
              resultMsg.push(designIntl('design.import.reversePdMan.skipModule', { name: module.name }));
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
              message.success(designIntl('design.import.reversePdMan.success'));
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
    <div className="erd-secondary-pane erd-secondary-pane--import" data-testid="import-pdman-page">
      <div className="erd-secondary-pane__content">
        <h2 className="erd-secondary-pane__title">{designIntl('design.import.reversePdMan.page.title')}</h2>
        <p className="erd-secondary-pane__hint">{designIntl('design.import.reversePdMan.page.hint')}</p>
        <div className="erd-secondary-pane__upload">
          <Dragger {...prop}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined/>
            </p>
            <p className="ant-upload-text">{designIntl('design.import.reversePdMan.upload.text')}</p>
            <p className="ant-upload-hint">
              {designIntl('design.import.reversePdMan.upload.hint')}
            </p>
          </Dragger>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReversePdMan)
