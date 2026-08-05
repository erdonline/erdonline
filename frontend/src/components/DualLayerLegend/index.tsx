import React from 'react';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  layerACompareHint,
  layerAName,
  layerBCompareHint,
  layerBName,
  parityLabel,
  TOP_BAR_SIGNALS,
} from '@/utils/dualLayerTokens';
import { intlFormat } from '@/utils/messageFormat';

/**
 * 双层一致性图例：帮助区分「未存版本」与「与库落差」。
 */
const DualLayerLegend: React.FC = () => {
  const intl = useIntl();
  const format = intlFormat(intl);
  const synced = parityLabel('SYNCED', format);

  const signalCopy = {
    persist: {
      label: format('designer.legend.signal.persist'),
      hint: format('designer.legend.signal.persistHint'),
    },
    version: {
      label: format('designer.legend.signal.version'),
      hint: format('designer.legend.signal.versionHint'),
    },
    schema: {
      label: format('designer.legend.signal.schema'),
      hint: format('designer.legend.signal.schemaHint'),
    },
  } as const;

  const title = (
    <div style={{ maxWidth: 320, fontSize: 12, lineHeight: 1.5 }}>
      <div style={{ marginBottom: 6, fontWeight: 600 }}>
        {format('designer.legend.title')}
      </div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        <li>
          {format('designer.legend.layerA', {
            name: layerAName(format),
            hint: layerACompareHint(format),
          })}
        </li>
        <li>
          {format('designer.legend.layerB', {
            name: layerBName(format),
            hint: layerBCompareHint(format),
          })}
        </li>
      </ul>
      <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600 }}>
        {format('designer.legend.signalsTitle')}
      </div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {TOP_BAR_SIGNALS.map((s) => (
          <li key={s.key}>
            <strong>{signalCopy[s.key].label}</strong>：{signalCopy[s.key].hint}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600 }}>
        {format('designer.legend.parityTitle')}
      </div>
      <div>
        {format('designer.legend.parityColors', { synced })}
      </div>
    </div>
  );

  return (
    <Tooltip title={title} placement="bottom">
      <button
        type="button"
        className="dual-layer-legend"
        data-testid="dual-layer-legend"
        aria-label={format('designer.legend.aria')}
        style={{
          border: 'none',
          background: 'transparent',
          padding: '0 4px',
          cursor: 'help',
          color: 'var(--erd-ink-400, #8c8c8c)',
          lineHeight: 1,
        }}
      >
        <InfoCircleOutlined />
      </button>
    </Tooltip>
  );
};

export default DualLayerLegend;
