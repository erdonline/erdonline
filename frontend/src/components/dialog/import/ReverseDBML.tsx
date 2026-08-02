import React, {useContext, useState} from 'react';
import {Button, Input, Modal, Upload, message} from 'antd';
import {InboxOutlined} from '@ant-design/icons';
import {MyIcon} from '@/components/Menu';
import useProjectStore from '@/store/project/useProjectStore';
import shallow from 'zustand/shallow';
import {ProjectMenuCloseContext} from '@/components/Menu/projectMenuClose';
import {importModuleAndProfile} from '@/pages/design/import/component/ReverseERD';
import type {DbmlProjectJSON} from '@/utils/dbml/toProjectJSON';

const {Dragger} = Upload;
const {TextArea} = Input;

export type ReverseDBMLProps = {};

type ModuleLike = {name?: string};

const ReverseDBML: React.FC<ReverseDBMLProps> = () => {
  const closeProjectMenu = useContext(ProjectMenuCloseContext);
  const [open, setOpen] = useState(false);
  const [paste, setPaste] = useState('');
  const [loading, setLoading] = useState(false);
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

  const mergeImported = (dbmlJson: DbmlProjectJSON) => {
    const modules = dbmlJson.modules || [];
    if (modules.length <= 0) {
      message.warning('DBML 中未找到可导入的模型');
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
        resultMsg.push(`[${module.name}]已经在本系统中存在，已跳过导入`);
      }
    });
    if (resultModules.length <= 0) {
      Modal.warning({
        title: '重要提示',
        content: (
          <>
            {resultMsg.map((m) => (
              <p key={m}>{m}</p>
            ))}
          </>
        ),
      });
      return;
    }
    importModuleAndProfile(dataSource, dbmlJson, resultModules, projectDispatch);
    if (resultMsg.length > 0) {
      Modal.warning({
        title: '重要提示',
        content: (
          <>
            {resultMsg.map((m) => (
              <p key={m}>{m}</p>
            ))}
          </>
        ),
      });
    } else {
      const n = resultModules.reduce((acc, m) => {
        const ents = (m as {entities?: unknown[]}).entities;
        return acc + (Array.isArray(ents) ? ents.length : 0);
      }, 0);
      message.success(`DBML 导入成功（${n} 张表）`);
    }
    setOpen(false);
    setPaste('');
  };

  const runImport = async (text: string) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      message.error('请粘贴 DBML 文本或上传 .dbml 文件');
      return;
    }
    setLoading(true);
    const hide = message.loading('正在解析 DBML…', 0);
    try {
      const {dbmlToProjectJSON} = await import('@/utils/dbml/toProjectJSON');
      const json = await dbmlToProjectJSON(trimmed);
      mergeImported(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      message.error(msg || 'DBML 导入失败');
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
        message.error('请上传 .dbml 或纯文本文件');
        return false;
      }
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        void runImport(String(reader.result || ''));
      };
      reader.onerror = () => {
        message.error('读取文件失败');
      };
      return false;
    },
  };

  return (
    <>
      <Button
        key="dbml"
        type="text"
        size="small"
        block
        icon={<MyIcon type="icon-other_win" />}
        style={{textAlign: 'left'}}
        aria-label="导入DBML"
        onClick={openModal}
      >
        导入DBML
      </Button>
      <Modal
        title="导入 DBML"
        open={open}
        onCancel={closeModal}
        destroyOnClose
        width={560}
        okText="解析并导入"
        cancelText="取消"
        confirmLoading={loading}
        onOk={() => void runImport(paste)}
      >
        <TextArea
          aria-label="DBML文本"
          placeholder="粘贴 DBML 文本（Table / Ref / Note）…"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={8}
          disabled={loading}
          style={{marginBottom: 12}}
        />
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽 .dbml 文件到此区域</p>
          <p className="ant-upload-hint">
            映射表、字段、默认值、索引、外键与注释（note→显示名）；枚举/触发器本切片不导入。
          </p>
        </Dragger>
      </Modal>
    </>
  );
};

export default React.memo(ReverseDBML);
