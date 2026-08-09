import { useCallback, useMemo, useState } from 'react';
import { useAccess, useIntl } from '@umijs/max';
import * as Save from '@/utils/save';
import useProjectStore from '@/store/project/useProjectStore';
import useVersionStore from '@/store/version/useVersionStore';
import { SNAPSHOT_DB_KEY } from '@/utils/versionConstants';
import { isShareGuestContext } from '@/utils/shareContext';
import {
  type ProbeResult,
  type SchemaProbeReason,
  resolveUnknownCopy,
  statusHint,
} from '@/utils/schemaProbeCopy';
import { intlFormat } from '@/utils/messageFormat';

const INITIAL_RESULT: ProbeResult = {
  status: 'UNKNOWN',
  reason: 'PROBE_NOT_PROBED',
};

export function useSchemaProbe() {
  const intl = useIntl();
  const format = intlFormat(intl);
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
          message: res?.msg || intl.formatMessage({ id: 'designer.schemaProbe.failedDefault' }),
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
  }, [getCurrentDBData, intl, projectJSON]);

  const status = displayResult.status ?? 'UNKNOWN';
  const isUnknown = status === 'UNKNOWN';
  const unknownCopy = isUnknown
    ? resolveUnknownCopy(displayResult.reason as SchemaProbeReason | undefined, displayResult.message, format)
    : null;

  const handleUnknownCta = useCallback(() => {
    if (displayResult.reason === 'PROBE_NO_DATASOURCE') {
      const select = document.querySelector<HTMLElement>('[data-testid="datasource-select"]');
      select?.focus();
      return;
    }
    void runProbe();
  }, [displayResult.reason, runProbe]);

  const statusTooltip = loading
    ? intl.formatMessage({ id: 'designer.schemaProbe.probingTooltip' })
    : isUnknown && unknownCopy
      ? `${unknownCopy.title}：${unknownCopy.hint}`
      : statusHint(displayResult, format);

  const probeDisabled = loading || datasourceMissing;

  return {
    probeAllowed,
    loading,
    displayResult,
    status,
    isUnknown,
    unknownCopy,
    runProbe,
    handleUnknownCta,
    statusTooltip,
    probeDisabled,
    datasourceMissing,
  };
}
