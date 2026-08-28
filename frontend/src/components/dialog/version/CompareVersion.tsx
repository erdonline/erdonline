import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isVersionGreater, isVersionLessOrEqual } from '@/utils/string';
import useVersionStore from '@/store/version/useVersionStore';
import shallow from 'zustand/shallow';
import CodeEditor from '@/components/CodeEditor';
import { Alert, Button, Col, Divider, Dropdown, Modal, Row, Select, Space, Spin, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import type { BaseSelectRef } from 'rc-select';
import dayjs from '@/utils/dayjs';
import * as File from '@/utils/file';
import {
  CloudUploadOutlined,
  DiffOutlined,
  DownOutlined,
  ExportOutlined,
  FileTextOutlined,
  FlagOutlined,
} from '@ant-design/icons';
import { Access, useAccess, useIntl } from '@@/exports';
import SqlApproval from '@/components/dialog/approval/SqlApproval';
import { useSearchParams } from '@@/exports';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';
import VersionDiffPanel, { VersionDiffSummary } from './VersionDiffPanel';
import { formatVersionDiffMarkdown } from './formatVersionDiffMarkdown';
import './version-compare-layout.scss';

const { Text } = Typography;

export const CompareVersionType = { DETAIL: 'detail', COMPARE: 'compare' };

export type CompareVersionProps = {
  type: string;
  /** 覆盖触发按钮文案（默认：详情 / 版本比对） */
  buttonLabel?: string;
  testId?: string;
};

const CompareVersion: React.FC<CompareVersionProps> = (props) => {
  const intl = useIntl();
  const { currentVersion, dbVersion, messages, data, versions, versionPanelDiffError, versionDispatch } =
    useVersionStore(
    (state) => ({
      messages: state.messages,
      data: state.data,
      versions: state.versions,
      currentVersion: state.currentVersion,
      dbVersion: state.dbVersion,
      versionPanelDiffError: state.versionPanelDiffError,
      versionDispatch: state.dispatch,
    }),
    shallow,
  );

  const compareBodyHeight = '450px';

  const [open, setOpen] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [state, setState] = useState({
    initVersion: (versions[1] && versions[1].version) || '',
    incrementVersion: (versions[0] && versions[0].version) || '',
    incrementVersionData: {},
    again: false,
    synchronous: false,
    preSynchronous: false,
    flagSynchronous: false,
  });
  const initVersionSelectRef = useRef<BaseSelectRef>(null);

  const access = useAccess();
  const [exed, setExed] = useState(1);

  const isDetail = props.type === CompareVersionType.DETAIL;
  const isCompare = props.type === CompareVersionType.COMPARE;

  const defaultButtonLabel = isDetail
    ? intl.formatMessage({ id: 'versionModal.compare.detail' })
    : intl.formatMessage({ id: 'versionModal.compare.compare' });
  const buttonLabel = props.buttonLabel ?? defaultButtonLabel;

  useEffect(() => {
    if (versions && versions.length > 1 && !state.initVersion && !state.incrementVersion) {
      setState((prevState) => ({
        ...prevState,
        initVersion: versions[1].version,
        incrementVersion: versions[0].version,
      }));
    }
  }, [versions, state.initVersion, state.incrementVersion]);

  const loadVersionDiff = useCallback(async () => {
    setDiffLoading(true);
    try {
      if (isDetail) {
        await versionDispatch.loadVersionPanelDiff();
      } else {
        await versionDispatch.loadVersionPanelDiff({
          compare: {
            initVersion: state.initVersion,
            incrementVersion: state.incrementVersion,
          },
        });
      }
    } catch {
      // 错误已在 store 写入 versionPanelDiffError 并 toast；禁止 fallback 到前端 diff
    } finally {
      setDiffLoading(false);
    }
  }, [
    isDetail,
    state.initVersion,
    state.incrementVersion,
    versionDispatch,
  ]);

  const versionSelect = versions.map((v: { version: string }) => ({
    label: v.version,
    value: v.version,
  }));

  const onVersionChange = (value: string, version: 'initVersion' | 'incrementVersion') => {
    setState((prev) => ({
      ...prev,
      [version]: value,
    }));
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    if (isCompare && (!state.initVersion || !state.incrementVersion)) {
      return;
    }
    void loadVersionDiff();
  }, [open, isCompare, state.initVersion, state.incrementVersion, loadVersionDiff]);

  const stamp = () => dayjs().format('YYYY-MM-DD-HHmmss');

  const versionRangeLabel = () => {
    if (isCompare && state.initVersion && state.incrementVersion) {
      return `${state.initVersion}-to-${state.incrementVersion}`;
    }
    if (currentVersion?.version) {
      return String(currentVersion.version);
    }
    return 'diff';
  };

  const exportSql = () => {
    const sql = data != null ? String(data).trim() : '';
    if (!sql) {
      message.warning(intl.formatMessage({ id: 'versionModal.compare.exportSqlEmpty' }));
      return;
    }
    File.save(sql, `version-diff-${versionRangeLabel()}-${stamp()}.sql`);
    message.success(intl.formatMessage({ id: 'versionModal.compare.exportSqlSuccess' }));
  };

  const exportDiffMarkdown = () => {
    const sql = data != null ? String(data).trim() : '';
    const list = Array.isArray(messages) ? messages : [];
    if (!list.length && !sql) {
      message.warning(intl.formatMessage({ id: 'versionModal.compare.exportDiffEmpty' }));
      return;
    }
    const md = formatVersionDiffMarkdown({
      messages: list,
      fromVersion: isCompare ? state.initVersion : undefined,
      toVersion: isCompare ? state.incrementVersion : currentVersion?.version,
      sql,
    });
    File.save(md, `version-diff-${versionRangeLabel()}-${stamp()}.md`);
    message.success(intl.formatMessage({ id: 'versionModal.compare.exportDiffSuccess' }));
  };

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'md',
      label: intl.formatMessage({ id: 'versionModal.compare.exportMd' }),
      onClick: exportDiffMarkdown,
    },
    {
      key: 'sql',
      label: intl.formatMessage({ id: 'versionModal.compare.exportSql' }),
      onClick: exportSql,
    },
  ];

  const execSQL = (updateDBVersion: boolean, type: string) => {
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
      message.error(intl.formatMessage({ id: 'versionModal.compare.crossVersionError' }));
    }
  };

  const [searchParams] = useSearchParams();
  let projectId = searchParams.get('projectId') || '';
  if (!projectId || projectId === '') {
    projectId = cache.getItem(CONSTANT.PROJECT_ID) || '';
  }

  const bookmarkGreater = isVersionGreater(currentVersion.version, dbVersion);
  const bookmarkLessOrEqual = isVersionLessOrEqual(currentVersion.version, dbVersion);
  const showSyncActions =
    isDetail && currentVersion.version && bookmarkGreater === true;
  const showAgain =
    isDetail && currentVersion.version && bookmarkLessOrEqual === true;

  const needTwoVersionsMsg = intl.formatMessage({ id: 'versionModal.compare.needTwoVersions' });

  const closeModal = () => {
    setOpen(false);
  };

  const openModal = () => {
    if (isCompare && (!versions || versions.length < 2)) {
      message.warning(needTwoVersionsMsg);
      return;
    }
    if (isCompare && versions.length >= 2) {
      // 每次打开比对弹层都刷新默认区间，避免 versions 从 0→2 时 useEffect 与 open 竞态导致 diff 未拉取
      setState((prev) => ({
        ...prev,
        initVersion: versions[1].version,
        incrementVersion: versions[0].version,
      }));
    }
    setOpen(true);
  };

  const focusFirstControl = () => {
    if (isCompare) {
      initVersionSelectRef.current?.focus();
      return;
    }
    // 详情无可编辑字段：首焦主操作「导出变更清单」
    document
      .querySelector<HTMLElement>('[data-testid="version-diff-export-btn"]')
      ?.focus();
  };

  const scriptHeading = useMemo(() => {
    if (!currentVersion) {
      return intl.formatMessage({ id: 'versionModal.compare.script' });
    }
    if (bookmarkLessOrEqual === true) {
      return intl.formatMessage({ id: 'versionModal.compare.scriptPushed' });
    }
    if (bookmarkLessOrEqual === null) {
      return intl.formatMessage({ id: 'versionModal.compare.scriptBookmarkUnknown' });
    }
    return intl.formatMessage({ id: 'versionModal.compare.scriptNotSynced' });
  }, [bookmarkLessOrEqual, currentVersion, intl]);

  const footer = [
    <Access accessible={access.enterprise} fallback={<></>} key="approval">
      <SqlApproval
        projectId={projectId}
        approveSql={data}
        versionId={currentVersion.id}
        display={showSyncActions ? '' : 'none'}
      />
    </Access>,
    <Dropdown.Button
      key="export"
      type="primary"
      icon={<DownOutlined />}
      menu={{ items: exportMenuItems }}
      onClick={exportDiffMarkdown}
      buttonsRender={([leftButton, rightButton]) => [
        React.cloneElement(leftButton as React.ReactElement, {
          'data-testid': 'version-diff-export-btn',
          'aria-label': intl.formatMessage({ id: 'versionModal.compare.exportAria' }),
        }),
        rightButton,
      ]}
    >
      <ExportOutlined />
      {intl.formatMessage({ id: 'versionModal.compare.export' })}
    </Dropdown.Button>,
    <Access accessible={access.canErdConnectorDbsync} fallback={<></>} key="sync">
      <Button
        type="primary"
        loading={state.synchronous}
        title={intl.formatMessage({ id: 'versionModal.compare.syncTitle' })}
        style={{ display: showSyncActions ? '' : 'none' }}
        onClick={() => execSQL(true, 'synchronous')}
      >
        <CloudUploadOutlined />
        {state.synchronous
          ? intl.formatMessage({ id: 'versionModal.compare.syncing' })
          : intl.formatMessage({ id: 'versionModal.compare.sync' })}
      </Button>
    </Access>,
    <Access accessible={access.canErdConnectorDbsync} fallback={<></>} key="flag">
      <Button
        type="primary"
        loading={state.flagSynchronous}
        title={intl.formatMessage({ id: 'versionModal.compare.flagSyncTitle' })}
        style={{ display: showSyncActions ? '' : 'none' }}
        onClick={() => execSQL(true, 'flagSynchronous')}
      >
        <FlagOutlined />
        {state.flagSynchronous
          ? intl.formatMessage({ id: 'versionModal.compare.flagSyncing' })
          : intl.formatMessage({ id: 'versionModal.compare.flagSync' })}
      </Button>
    </Access>,
    <Access accessible={access.canErdConnectorDbsync} fallback={<></>} key="again">
      <Button
        type="primary"
        danger
        ghost
        loading={state.again}
        title={intl.formatMessage({ id: 'versionModal.compare.againTitle' })}
        style={{
          display: showAgain ? '' : 'none',
          marginLeft: 10,
        }}
        onClick={() => execSQL(false, 'again')}
      >
        {state.again
          ? intl.formatMessage({ id: 'versionModal.compare.againLoading' })
          : intl.formatMessage({ id: 'versionModal.compare.again' })}
      </Button>
    </Access>,
  ];

  return (
    <>
      <Button
        key="compare"
        size={isDetail ? 'small' : 'middle'}
        type={isDetail ? 'link' : 'default'}
        icon={isDetail ? <FileTextOutlined /> : <DiffOutlined />}
        data-testid={
          props.testId || (isDetail ? 'version-detail-btn' : 'version-compare-btn')
        }
        aria-label={buttonLabel}
        disabled={isCompare && (!versions || versions.length < 2)}
        title={
          isCompare && (!versions || versions.length < 2) ? needTwoVersionsMsg : undefined
        }
        onClick={openModal}
      >
        {buttonLabel}
      </Button>
      <Modal
        title={intl.formatMessage({
          id: isDetail ? 'versionModal.compare.detailTitle' : 'versionModal.compare.compareTitle',
        })}
        open={open}
        onCancel={closeModal}
        destroyOnClose
        width={960}
        footer={footer}
        keyboard
        focusTriggerAfterClose
        afterOpenChange={(visible) => {
          if (!visible) {
            return;
          }
          window.setTimeout(() => focusFirstControl(), 0);
        }}
      >
        {isCompare ? (
          <Space style={{ marginBottom: 8 }} wrap>
            <span>
              <span style={{ marginRight: 8 }}>
                {intl.formatMessage({ id: 'versionModal.compare.initVersion' })}
              </span>
              <Select
                ref={initVersionSelectRef}
                style={{ width: 160 }}
                options={versionSelect}
                value={state.initVersion || undefined}
                onChange={(value) => onVersionChange(value, 'initVersion')}
                aria-label={intl.formatMessage({ id: 'versionModal.compare.initVersion' })}
              />
            </span>
            <span>
              <span style={{ marginRight: 8 }}>
                {intl.formatMessage({ id: 'versionModal.compare.incrementVersion' })}
              </span>
              <Select
                style={{ width: 160 }}
                options={versionSelect}
                value={state.incrementVersion || undefined}
                onChange={(value) => onVersionChange(value, 'incrementVersion')}
                aria-label={intl.formatMessage({ id: 'versionModal.compare.incrementVersion' })}
              />
            </span>
          </Space>
        ) : null}
        <Divider />
        {versionPanelDiffError ? (
          <Alert
            type="error"
            showIcon
            message={intl.formatMessage({ id: 'versionModal.diff.loadError' })}
            description={versionPanelDiffError}
            data-testid="version-diff-error"
            style={{ marginBottom: 12 }}
          />
        ) : null}
        <Spin spinning={diffLoading}>
          <div className="version-compare-layout" data-testid="version-compare-layout">
          <Row gutter={16} align="top">
            <Col span={10}>
              <div className="version-compare-col">
                <div className="version-compare-col__heading">
                  {intl.formatMessage({ id: 'versionModal.compare.modelChanges' })}
                </div>
                <div className="version-compare-col__toolbar">
                  {!versionPanelDiffError ? (
                    <VersionDiffSummary
                      messages={messages}
                      summaryHintId={
                        isDetail
                          ? 'versionModal.diff.summaryHintVersionDetail'
                          : 'versionModal.diff.summaryHintCompare'
                      }
                    />
                  ) : null}
                </div>
                <div className="version-compare-col__body">
                  <VersionDiffPanel
                    messages={versionPanelDiffError ? [] : messages}
                    showSummary={false}
                    hasScript={!versionPanelDiffError && !!(data && String(data).trim())}
                    loadError={versionPanelDiffError}
                  />
                </div>
              </div>
            </Col>
            <Col span={14}>
              <div className="version-compare-col">
                <div className="version-compare-col__heading">{scriptHeading}</div>
                <div className="version-compare-col__toolbar">
                  <Text
                    className="version-compare-col__copy"
                    copyable={
                      data && String(data).trim()
                        ? { text: String(data), tooltips: false }
                        : false
                    }
                    type="secondary"
                  >
                    {intl.formatMessage({ id: 'accountSettings.common.copy' })}
                  </Text>
                </div>
                <div className="version-compare-col__body">
                  <CodeEditor
                    mode="mysql"
                    height={compareBodyHeight}
                    value={versionPanelDiffError ? '' : data}
                  />
                </div>
              </div>
            </Col>
          </Row>
        </div>
        </Spin>
      </Modal>
    </>
  );
};

export default React.memo(CompareVersion);
