import React, {useState} from 'react';
import {InboxOutlined} from '@ant-design/icons';
import Dragger from "antd/es/upload/Dragger";
import {message} from "antd";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import _ from "lodash";
import {showImportSkipWarning} from '@/utils/importSkipWarningModal';
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
  const nextDomains = _.cloneDeep(dataSource?.dataTypeDomains || {});
  const nextProfile = _.cloneDeep(dataSource?.profile || {});

  const datatype = _.unionBy(
    nextDomains?.datatype,
    erdJson?.dataTypeDomains?.datatype,
    'code',
  );
  const database = _.unionBy(
    nextDomains?.database,
    erdJson?.dataTypeDomains?.database,
    'code',
  );
  _.merge(nextDomains, erdJson?.dataTypeDomains);
  _.set(nextDomains, 'datatype', datatype);
  _.set(nextDomains, 'database', database);

  const defaultFields = _.unionBy(
    nextProfile?.defaultFields,
    erdJson?.profile?.defaultFields,
    'name',
  );
  const dbs = _.unionBy(nextProfile?.dbs, erdJson?.profile?.dbs, 'name');
  _.merge(nextProfile, erdJson?.profile);
  _.set(nextProfile, 'defaultFields', defaultFields);
  _.set(nextProfile, 'dbs', dbs);

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
        message.error('请确认上传文件是ERD导出的标准json文件!');
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
            message.error(`ERD文件解密失败！`)
            return;
          }
          let erdJson;
          try {
            erdJson = JSON.parse(originJson);
          } catch {
            message.error('您导入的是非法的ERD文件!');
            return;
          }
          let erdJsonModules = erdJson['modules'];
          if (!erdJsonModules) {
            message.error('您导入的是非法的ERD文件!');
            return;
          }
          if (!(erdJsonModules instanceof Array)) {
            message.error('您导入的是非法的ERD文件!');
            return;
          }
          if (erdJsonModules.length <= 0) {
            message.warning('您尚未在ERD新建模型，无需导入，可直接在本系统新建模型!');
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
              resultMsg.push("[" + module.name + "]已经在本系统中存在，已跳过导入");
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
              message.success('ERD文件导入成功！');
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
    <div className="erd-secondary-pane" data-testid="import-erd-page">
      <h2 className="erd-secondary-pane__title">解析 ERD 文件</h2>
      <p className="erd-secondary-pane__hint">上传完毕后自动解析；每次仅支持一个 ERD json</p>
      <div className="erd-secondary-pane__upload">
        <Dragger {...prop}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined/>
          </p>
          <p className="ant-upload-text">点击或者拖拽ERD导出的json文件到此区域以上传</p>
          <p className="ant-upload-hint">
            上传完毕后，系统会自动开始解析；每次仅支持解析一个ERD文件。
          </p>
        </Dragger>
      </div>
    </div>
  );
};

export default React.memo(ReverseERD)
