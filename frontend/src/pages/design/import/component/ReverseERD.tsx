import React, {useState} from 'react';
import {InboxOutlined} from '@ant-design/icons';
import Dragger from "antd/es/upload/Dragger";
import {message} from "antd";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import { cloneDeep as _cloneDeep, merge as _merge, set as _set, unionBy as _unionBy } from 'lodash-es';
import {showImportSkipWarning} from '@/utils/importSkipWarningModal';
import { designIntl } from '@/pages/design/locales/intl';
import '../../secondary-pane.scss';


export type ReverseERDProps = {};

/**
 * 合并导入模块 + dataTypeDomains/profile；
 * 仅 setProjectJson persist:true（save code===200）写 store；失败不写。
 */
export const importModuleAndProfile = async (
  dataSource: any,
  erdJson: any,
  resultModules: any,
  projectDispatch: any,
): Promise<{ ok: boolean; modules: any[] }> => {
  const nextDomains = _cloneDeep(dataSource?.dataTypeDomains || {});
  const nextProfile = _cloneDeep(dataSource?.profile || {});

  const datatype = _unionBy(
    nextDomains?.datatype,
    erdJson?.dataTypeDomains?.datatype,
    'code',
  );
  const database = _unionBy(
    nextDomains?.database,
    erdJson?.dataTypeDomains?.database,
    'code',
  );
  _merge(nextDomains, erdJson?.dataTypeDomains);
  _set(nextDomains, 'datatype', datatype);
  _set(nextDomains, 'database', database);

  const defaultFields = _unionBy(
    nextProfile?.defaultFields,
    erdJson?.profile?.defaultFields,
    'name',
  );
  const dbs = _unionBy(nextProfile?.dbs, erdJson?.profile?.dbs, 'name');
  _merge(nextProfile, erdJson?.profile);
  _set(nextProfile, 'defaultFields', defaultFields);
  _set(nextProfile, 'dbs', dbs);

  let modules = resultModules;
  if (modules) {
    modules = projectDispatch.fixModules(
      modules,
      nextDomains?.datatype,
      nextDomains?.database,
    );
  }

  const nextJson = {
    ...dataSource,
    modules: (dataSource.modules || []).concat(modules || []),
    dataTypeDomains: nextDomains,
    profile: nextProfile,
  };

  const ok = await projectDispatch.setProjectJson(nextJson, {persist: true});
  return {ok: !!ok, modules: modules || []};
};

const ReverseERD: React.FC<ReverseERDProps> = () => {
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
      const name = String(file?.name || '').toLowerCase();
      const isJSON =
        file.type === 'application/json' ||
        name.endsWith('.json') ||
        name.endsWith('.erd.json');
      if (!isJSON) {
        message.error(designIntl('design.import.reverseErd.error.notStandardJson'));
        return false;
      }

      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        void (async () => {
          let originJson;
          try {
            // @ts-ignore
            originJson = projectDispatch.decrypt('AES', reader.result.toString());
          } catch (e) {
            message.error(designIntl('design.import.reverseErd.error.decryptFailed'));
            return;
          }
          let erdJson;
          try {
            erdJson = JSON.parse(originJson);
          } catch {
            message.error(designIntl('design.import.reverseErd.error.invalidFile'));
            return;
          }
          let erdJsonModules = erdJson['modules'];
          if (!erdJsonModules) {
            message.error(designIntl('design.import.reverseErd.error.invalidFile'));
            return;
          }
          if (!(erdJsonModules instanceof Array)) {
            message.error(designIntl('design.import.reverseErd.error.invalidFile'));
            return;
          }
          if (erdJsonModules.length <= 0) {
            message.warning(designIntl('design.import.reverseErd.warn.noModel'));
            return;
          }
          // @ts-ignore
          const dataSource = projectJSON;
          let resultMsg: any = [];
          let resultModules: any = [];
          erdJsonModules.forEach((module: any) => {
            let hasMulti = (dataSource.modules || []).some((module1: any) => module.name === module1.name);
            if (!hasMulti) {
              resultModules.push(module);
            } else {
              resultMsg.push(designIntl('design.import.reverseErd.skipModule', { name: module.name }));
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
              message.success(designIntl('design.import.reverseErd.success'));
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
    <div className="erd-secondary-pane erd-secondary-pane--import" data-testid="import-erd-page">
      <div className="erd-secondary-pane__content">
        <h2 className="erd-secondary-pane__title">{designIntl('design.import.reverseErd.page.title')}</h2>
        <p className="erd-secondary-pane__hint">{designIntl('design.import.reverseErd.page.hint')}</p>
        <div className="erd-secondary-pane__upload">
          <Dragger {...prop}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined/>
            </p>
            <p className="ant-upload-text">{designIntl('design.import.reverseErd.upload.text')}</p>
            <p className="ant-upload-hint">
              {designIntl('design.import.reverseErd.upload.hint')}
            </p>
          </Dragger>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReverseERD)
