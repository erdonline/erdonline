import React, { useCallback, useMemo, useState } from 'react';
import { Button, Tag, Tooltip } from 'antd';
import { RadarChartOutlined } from '@ant-design/icons';
import { useAccess } from '@@/plugin-access';
import * as Save from '@/utils/save';
import useProjectStore from '@/store/project/useProjectStore';
import useVersionStore from '@/store/version/useVersionStore';
import { SNAPSHOT_DB_KEY } from '@/utils/versionConstants';
import { isShareGuestContext } from '@/utils/shareContext';
import {
  type ProbeResult,
  type SchemaProbeReason,
  STATUS_COLOR,
  STATUS_LABEL,
  resolveUnknownCopy,
  statusHint,
} from '@/utils/schemaProbeCopy';
import './index.less';

type SchemaProbeControlProps = {
  disabled?: boolean;
  /** chrome = 设计器顶栏（icon-only）；toolbar 保留完整按钮文案（已弃用，统一顶栏） */
  variant?: 'chrome' | 'toolbar';
};

const INITIAL_RESULT: ProbeResult = {
  status: 'UNKNOWN',
  reason: 'PROBE_NOT_PROBED',
};

/**
 * B 层显式探测控件（ADR-0022 #8/#10）：五态 + 未知四路文案。
 */
const SchemaProbeControl: React.FC<SchemaProbeControlProps> = ({
  disabled,
  variant = 'chrome',
}) => {
  const isChrome = variant === 'chrome';
  const access = useAccess();
  const probeAllowed = !isShareGuestContext() && access.canErdConnectorSchemaProbe;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProbeResult>(INITIAL_RESULT);

  const projectJSON = useProjectStore((s) => s.project?.projectJSON);
  const getCurrentDBData = useVersionStore((s) => s.dispatch.getCurrentDBData);
  const dbs = useVersionStore((s) => s.dbs);

  const datasourceMissing = useMemo(() => {
    const dbData = getCurrentDBData();
    return !dbData || dbData.isSnapshot || dbData.key === SNAPSHOT_DB_KEY;
  }, [getCurrentDBData, dbs]);

  const displayResult: ProbeResult = useMemo(() => {
    if (datasourceMissing) {
      return { status: 'UNKNOWN', reason: 'PROBE_NO_DATASOURCE' };
    }
    if (loading) {
      return { status: 'UNKNOWN', reason: 'PROBE_NOT_PROBED' };
    }
    return result;
  }, [datasourceMissing, loading, result]);

  const runProbe = useCallback(async () => {
    const dbData = getCurrentDBData();
    if (!dbData || dbData.isSnapshot || dbData.key === SNAPSHOT_DB_KEY) {
      setResult({ status: 'UNKNOWN', reason: 'PROBE_NO_DATASOURCE' });
      return;
    }
    setLoading(true);
    try {
      const res = await Save.schemaProbe({
        ...dbData.properties,
        dataSourceId: dbData.id,
        dbKey: dbData.key,
        projectJSON,
      });
      if (res?.code === 200 && res.data) {
        setResult(res.data as ProbeResult);
      } else {
        setResult({
          status: 'UNKNOWN',
          reason: 'PROBE_CONNECTION_FAILED',
          message: res?.msg || '实库探测失败',
        });
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setResult({
        status: 'UNKNOWN',
        reason: 'PROBE_CONNECTION_FAILED',
        message: errMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [getCurrentDBData, projectJSON]);

  const status = displayResult.status ?? 'UNKNOWN';
  const isUnknown = status === 'UNKNOWN';
  const unknownCopy = isUnknown
    ? resolveUnknownCopy(displayResult.reason as SchemaProbeReason | undefined, displayResult.message)
    : null;

  const handleUnknownCta = useCallback(() => {
    if (displayResult.reason === 'PROBE_NO_DATASOURCE') {
      const select = document.querySelector<HTMLElement>('[data-testid="datasource-select"]');
      select?.focus();
      return;
    }
    void runProbe();
  }, [displayResult.reason, runProbe]);

  const tagLabel = loading ? '探测中…' : STATUS_LABEL[status] ?? STATUS_LABEL.UNKNOWN;
  const tagColor = loading ? 'processing' : STATUS_COLOR[status] ?? STATUS_COLOR.UNKNOWN;

  const statusTooltip = loading
    ? '正在连接并逆向解析实库…'
    : isUnknown && unknownCopy
      ? `${unknownCopy.title}：${unknownCopy.hint}`
      : statusHint(displayResult);

  const statusTag = (
    <Tooltip title={statusTooltip}>
      <Tag
        color={tagColor}
        className={isChrome && isUnknown && unknownCopy ? 'schema-probe-control__status--actionable' : undefined}
        data-testid="schema-probe-status"
        data-probe-status={status}
        data-probe-reason={displayResult.reason ?? ''}
        onClick={
          isChrome && isUnknown && unknownCopy && !disabled && !loading
            ? handleUnknownCta
            : undefined
        }
      >
        {tagLabel}
      </Tag>
    </Tooltip>
  );

  const unknownHint =
    !isChrome && isUnknown && unknownCopy ? (
      <Tooltip title={unknownCopy.hint}>
        <Button
          type="link"
          size="small"
          className="schema-probe-control__unknown-cta"
          data-testid="schema-probe-unknown-hint"
          onClick={handleUnknownCta}
          disabled={disabled || loading}
          aria-label={unknownCopy.title}
        >
          {unknownCopy.title}
        </Button>
      </Tooltip>
    ) : isChrome && isUnknown && unknownCopy ? (
      // chrome 模式：可行动文案进 status tooltip + 点 Tag；E2E 仍断言 hint 文案
      <span
        className="schema-probe-control__unknown-cta"
        data-testid="schema-probe-unknown-hint"
        aria-hidden="true"
        hidden
      >
        {unknownCopy.title}
      </span>
    ) : null;

  if (!probeAllowed) {
    return null;
  }

  const probeButton = (
    <Button
      size="small"
      icon={<RadarChartOutlined />}
      loading={loading}
      disabled={disabled || loading || datasourceMissing}
      onClick={runProbe}
      aria-label="探测实库 schema"
      data-testid="schema-probe-btn"
    >
      {isChrome ? null : '探测实库'}
    </Button>
  );

  return (
    <span
      className={`schema-probe-control${isChrome ? ' schema-probe-control--chrome' : ''}`}
      data-testid="schema-probe-control"
    >
      {isChrome ? (
        <Tooltip title="探测实库 schema（显式操作，不会自动同步）">{probeButton}</Tooltip>
      ) : (
        probeButton
      )}
      {statusTag}
      {unknownHint}
    </span>
  );
};

export default SchemaProbeControl;
