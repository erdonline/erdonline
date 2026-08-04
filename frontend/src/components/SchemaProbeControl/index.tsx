import React, { useCallback, useMemo, useState } from 'react';
import { Button, Tag, Tooltip } from 'antd';
import { RadarChartOutlined } from '@ant-design/icons';
import * as Save from '@/utils/save';
import useProjectStore from '@/store/project/useProjectStore';
import useVersionStore from '@/store/version/useVersionStore';
import { SNAPSHOT_DB_KEY } from '@/utils/versionConstants';
import {
  type ProbeResult,
  type SchemaProbeReason,
  STATUS_COLOR,
  STATUS_LABEL,
  resolveUnknownCopy,
  statusHint,
} from '@/utils/schemaProbeCopy';

type SchemaProbeControlProps = {
  disabled?: boolean;
};

const INITIAL_RESULT: ProbeResult = {
  status: 'UNKNOWN',
  reason: 'PROBE_NOT_PROBED',
};

/**
 * B 层显式探测控件（ADR-0022 #8/#10）：五态 + 未知四路文案。
 */
const SchemaProbeControl: React.FC<SchemaProbeControlProps> = ({ disabled }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProbeResult>(INITIAL_RESULT);

  const projectJSON = useProjectStore((s) => s.project?.projectJSON);
  const getCurrentDBData = useVersionStore((s) => s.dispatch.getCurrentDBData);

  const datasourceMissing = useMemo(() => {
    const dbData = getCurrentDBData();
    return !dbData || dbData.isSnapshot || dbData.key === SNAPSHOT_DB_KEY;
  }, [getCurrentDBData]);

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

  const statusTag = (
    <Tooltip title={loading ? '正在连接并逆向解析实库…' : statusHint(displayResult)}>
      <Tag
        color={tagColor}
        data-testid="schema-probe-status"
        data-probe-status={status}
        data-probe-reason={displayResult.reason ?? ''}
      >
        {tagLabel}
      </Tag>
    </Tooltip>
  );

  const unknownHint =
    isUnknown && unknownCopy ? (
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
    ) : null;

  return (
    <span className="schema-probe-control" data-testid="schema-probe-control">
      <Button
        size="small"
        icon={<RadarChartOutlined />}
        loading={loading}
        disabled={disabled || loading || datasourceMissing}
        onClick={runProbe}
        aria-label="探测实库 schema"
        data-testid="schema-probe-btn"
      >
        探测实库
      </Button>
      {statusTag}
      {unknownHint}
    </span>
  );
};

export default SchemaProbeControl;
