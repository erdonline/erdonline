import React, { useCallback, useState } from 'react';
import { Button, Tag, Tooltip, message } from 'antd';
import { RadarChartOutlined } from '@ant-design/icons';
import * as Save from '@/utils/save';
import useProjectStore from '@/store/project/useProjectStore';
import useVersionStore from '@/store/version/useVersionStore';
import { SNAPSHOT_DB_KEY } from '@/utils/versionConstants';

export type SchemaProbeStatus = 'SYNCED' | 'DIFFERENT' | 'UNKNOWN';

type ProbeResult = {
  status?: SchemaProbeStatus;
  fingerprint?: string;
  modelFingerprint?: string;
  checkedAt?: string;
  tableCount?: number;
  reason?: string;
  message?: string;
};

const STATUS_LABEL: Record<SchemaProbeStatus, string> = {
  SYNCED: '实库一致',
  DIFFERENT: '实库不同',
  UNKNOWN: '实库未知',
};

const STATUS_COLOR: Record<SchemaProbeStatus, string> = {
  SYNCED: 'green',
  DIFFERENT: 'orange',
  UNKNOWN: 'default',
};

type SchemaProbeControlProps = {
  disabled?: boolean;
};

/**
 * B 层显式探测控件（ADR-0022 #8）：用户点击后才逆向实库并对比指纹。
 */
const SchemaProbeControl: React.FC<SchemaProbeControlProps> = ({ disabled }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProbeResult | null>(null);

  const projectJSON = useProjectStore((s) => s.project?.projectJSON);
  const getCurrentDBData = useVersionStore((s) => s.dispatch.getCurrentDBData);

  const runProbe = useCallback(async () => {
    const dbData = getCurrentDBData();
    if (!dbData || dbData.isSnapshot || dbData.key === SNAPSHOT_DB_KEY) {
      message.warning('请先配置并选择 JDBC 数据源');
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
        message.error(res?.msg || '实库探测失败');
        setResult(null);
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      message.error(`实库探测失败: ${errMsg}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [getCurrentDBData, projectJSON]);

  const status = result?.status;
  const statusTag =
    status && STATUS_LABEL[status] ? (
      <Tooltip
        title={
          result?.fingerprint
            ? `指纹 ${result.fingerprint.slice(0, 12)}… · ${result.tableCount ?? 0} 表${
                result.message ? ` · ${result.message}` : ''
              }`
            : result?.message || '探测结果'
        }
      >
        <Tag color={STATUS_COLOR[status]} data-testid="schema-probe-status">
          {STATUS_LABEL[status]}
        </Tag>
      </Tooltip>
    ) : null;

  return (
    <span className="schema-probe-control" data-testid="schema-probe-control">
      <Button
        size="small"
        icon={<RadarChartOutlined />}
        loading={loading}
        disabled={disabled || loading}
        onClick={runProbe}
        aria-label="探测实库 schema"
        data-testid="schema-probe-btn"
      >
        探测实库
      </Button>
      {statusTag}
    </span>
  );
};

export default SchemaProbeControl;
