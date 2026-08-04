import React from 'react';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { LAYER, PARITY_VERB, TOP_BAR_SIGNALS } from '@/utils/dualLayerTokens';

/**
 * 双层一致性图例：帮助区分「未存版本」与「与库落差」。
 */
const DualLayerLegend: React.FC = () => {
  const title = (
    <div style={{ maxWidth: 320, fontSize: 12, lineHeight: 1.5 }}>
      <div style={{ marginBottom: 6, fontWeight: 600 }}>双层比较（互不合并）</div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        <li>
          <strong>A · {LAYER.A.name}</strong>：{LAYER.A.compareHint}
        </li>
        <li>
          <strong>B · {LAYER.B.name}</strong>：{LAYER.B.compareHint}（需显式探测）
        </li>
      </ul>
      <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600 }}>顶栏三信号</div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {TOP_BAR_SIGNALS.map((s) => (
          <li key={s.key}>
            <strong>{s.label}</strong>：{s.hint}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600 }}>共用 parity 色</div>
      <div>
        {PARITY_VERB.SYNCED}·绿 / 领先·蓝 / 落后·橙 / 分叉·红 / 未知·灰
      </div>
    </div>
  );

  return (
    <Tooltip title={title} placement="bottom">
      <button
        type="button"
        className="dual-layer-legend"
        data-testid="dual-layer-legend"
        aria-label="双层一致性说明"
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
