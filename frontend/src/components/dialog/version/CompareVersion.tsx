import React, { useEffect, useState } from 'react';
import { ModalForm, ProForm, ProFormSelect } from '@ant-design/pro-components';
import { compareStringVersion } from '@/utils/string';
import useVersionStore, { SHOW_CHANGE_TYPE } from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import CodeEditor from '@/components/CodeEditor';
import { Button, Col, Divider, Row, Typography, message } from 'antd';
import moment from 'moment';
import * as File from '@/utils/file';
import {
  CloudUploadOutlined,
  DiffOutlined,
  ExportOutlined,
  FileTextOutlined,
  FlagOutlined,
} from '@ant-design/icons';
import { Access, useAccess } from '@@/plugin-access';
import SqlApproval from '@/components/dialog/approval/SqlApproval';
import { useSearchParams } from '@@/exports';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';
import VersionDiffPanel from './VersionDiffPanel';

const { Paragraph } = Typography;

export const CompareVersionType = { DETAIL: 'detail', COMPARE: 'compare' };

export type CompareVersionProps = {
  type: string;
};

const CompareVersion: React.FC<CompareVersionProps> = (props) => {
  const { currentVersion, dbVersion, messages, data, versions, versionDispatch } = useVersionStore(
    (state) => ({
      messages: state.messages,
      data: state.data,
      versions: state.versions,
      currentVersion: state.currentVersion,
      dbVersion: state.dbVersion,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const height = document.body.clientHeight;
  const tempHeight = height - 25;

  const [state, setState] = useState({
    initVersion: (versions[1] && versions[1].version) || '',
    incrementVersion: (versions[0] && versions[0].version) || '',
    incrementVersionData: {},
    again: false,
    synchronous: false,
    preSynchronous: false,
    flagSynchronous: false,
  });

  const access = useAccess();
  const [exed, setExed] = useState(1);

  useEffect(() => {
    if (versions && versions.length > 1) {
      if (!state.initVersion && !state.incrementVersion) {
        setState((prevState) => ({
          ...prevState,
          initVersion: versions[1].version,
          incrementVersion: versions[0].version,
        }));
      } else if (state.initVersion && state.incrementVersion) {
        versionDispatch.compare(state);
      }
    }
  }, [state.initVersion, state.incrementVersion, exed, versions]);

  const versionSelect = versions.map((v: any) => ({
    label: v.version,
    value: v.version,
  }));

  const onVersionChange = (value: any, version: string) => {
    setState({
      ...state,
      [version]: value,
    });
  };

  const onSave = () => {
    File.save(data, `${moment().format('YYYY-MM-D-h-mm-ss')}.sql`);
  };

  const execSQL = (updateDBVersion: any, type: string) => {
    const flag = versionDispatch.checkVersionCount(currentVersion);
    if (!flag) {
      const tempType = type;
      setState({
        ...state,
        [tempType]: true,
      });
      try {
        versionDispatch.execSQL(data, currentVersion, updateDBVersion, null, type === 'flagSynchronous');
        setExed(exed + 1);
      } finally {
        setState({
          ...state,
          [tempType]: false,
        });
      }
    } else {
      message.error('当前操作的版本之前还有版本尚未同步，请不要跨版本操作!');
    }
  };

  const isDetail = props.type === CompareVersionType.DETAIL;
  const isCompare = props.type === CompareVersionType.COMPARE;

  const [searchParams] = useSearchParams();
  let projectId = searchParams.get('projectId') || '';
  if (!projectId || projectId === '') {
    projectId = cache.getItem(CONSTANT.PROJECT_ID) || '';
  }
  return (
    <>
      <ModalForm
        title={isDetail ? '版本变更详情' : '任意版本比较'}
        layout="horizontal"
        width={960}
        modalProps={{ destroyOnClose: true }}
        trigger={
          <Button
            key="compare"
            size={isDetail ? 'small' : 'middle'}
            type={isDetail ? 'link' : 'default'}
            icon={isDetail ? <FileTextOutlined /> : <DiffOutlined />}
            data-testid={isDetail ? 'version-detail-btn' : 'version-compare-btn'}
            disabled={isCompare && (!versions || versions.length < 2)}
            title={
              isCompare && (!versions || versions.length < 2)
                ? '至少需要两个版本才能比对'
                : undefined
            }
            onClick={() => {
              if (isCompare && (!versions || versions.length < 2)) {
                message.warning('至少需要两个版本才能比对');
                return;
              }
              if (isDetail) {
                versionDispatch.showChanges(SHOW_CHANGE_TYPE.CURRENT, null, null, null);
              } else {
                versionDispatch.compare(state);
              }
            }}
          >
            {isDetail ? '详情' : '版本比对'}
          </Button>
        }
        submitter={{
          render: () => {
            return [
              <Access accessible={access.enterprise} fallback={<></>} key="approval">
                <SqlApproval
                  projectId={projectId}
                  approveSql={data}
                  versionId={currentVersion.id}
                  display={
                    isDetail &&
                    currentVersion.version &&
                    compareStringVersion(currentVersion.version, dbVersion) > 0
                      ? ''
                      : 'none'
                  }
                />
              </Access>,
              <Button type="primary" key="save" onClick={onSave}>
                <ExportOutlined />
                导出
              </Button>,
              <Access accessible={access.canErdConnectorDbsync} fallback={<></>} key="sync">
                <Button
                  type="primary"
                  loading={state.synchronous}
                  title="会更新数据源中的版本号"
                  style={{
                    display:
                      isDetail &&
                      currentVersion.version &&
                      compareStringVersion(currentVersion.version, dbVersion) > 0
                        ? ''
                        : 'none',
                  }}
                  onClick={() => execSQL(true, 'synchronous')}
                >
                  <CloudUploadOutlined />
                  {state.synchronous ? '正在同步' : '同步'}
                </Button>
              </Access>,
              <Access accessible={access.canErdConnectorDbsync} fallback={<></>} key="flag">
                <Button
                  type="primary"
                  loading={state.flagSynchronous}
                  title="更新数据源的版本号，不会执行差异化的SQL"
                  style={{
                    display:
                      isDetail &&
                      currentVersion.version &&
                      compareStringVersion(currentVersion.version, dbVersion) > 0
                        ? ''
                        : 'none',
                  }}
                  onClick={() => execSQL(true, 'flagSynchronous')}
                >
                  <FlagOutlined />
                  {state.flagSynchronous ? '正在标记为同步' : '标记为同步'}
                </Button>
              </Access>,
              <Access accessible={access.canErdConnectorDbsync} fallback={<></>} key="again">
                <Button
                  type="primary"
                  danger
                  ghost
                  loading={state.again}
                  title="不会更新数据源中的版本号"
                  style={{
                    display:
                      isDetail &&
                      currentVersion.version &&
                      compareStringVersion(currentVersion.version, dbVersion) <= 0
                        ? ''
                        : 'none',
                    marginLeft: 10,
                  }}
                  onClick={() => execSQL(false, 'again')}
                >
                  {state.again ? '正在执行' : '再次执行'}
                </Button>
              </Access>,
            ];
          },
        }}
      >
        <ProForm.Group style={{ display: isCompare ? '' : 'none' }}>
          <ProFormSelect
            fieldProps={{
              onChange: (value: any) => onVersionChange(value, 'initVersion'),
            }}
            request={async () => versionSelect || []}
            name="initVersion"
            initialValue={state.initVersion}
            label="初始版本"
          />
          <ProFormSelect
            fieldProps={{
              onChange: (value: any) => onVersionChange(value, 'incrementVersion'),
            }}
            request={async () => versionSelect || []}
            name="incrementVersion"
            initialValue={state.incrementVersion}
            label="增量版本"
          />
        </ProForm.Group>
        <Divider />
        <Row gutter={16}>
          <Col span={10}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>模型变更</div>
            <VersionDiffPanel messages={messages} hasScript={!!(data && String(data).trim())} />
          </Col>
          <Col span={14}>
            <Paragraph copyable={{ text: data }} style={{ marginBottom: 8 }}>
              {currentVersion
                ? `变化脚本(${
                    compareStringVersion(currentVersion.version, dbVersion) <= 0
                      ? '已同步'
                      : '未同步'
                  })`
                : '变化脚本'}
            </Paragraph>
            <CodeEditor mode="mysql" height={`${tempHeight * 0.5}px`} value={data} />
          </Col>
        </Row>
      </ModalForm>
    </>
  );
};

export default React.memo(CompareVersion);
