/**
 * IE Crow's foot SVG marker defs（ADR-0016）。
 * 边 path 以 url(#erd-cf-*) 引用；色分 ink / brand（选中）。
 */
import React, { memo } from 'react';
import { erdColors } from '@/theme/tokens';
import {
  CrowFootEnd,
  CrowFootMarkerRole,
  CrowFootMarkerTone,
  crowFootMarkerId,
} from '@/utils/relationEdges';

const ENDS: CrowFootEnd[] = ['one', 'many'];
const ROLES: CrowFootMarkerRole[] = ['start', 'end'];
const TONES: CrowFootMarkerTone[] = ['ink', 'brand'];

function markerStroke(tone: CrowFootMarkerTone): string {
  // ink 与 EDGE_STROKE（ink900）对齐，避免粗干道 + 淡爪头
  return tone === 'brand' ? erdColors.brand : erdColors.ink900;
}

/** one：端点竖线；many：鸦爪三叉（趾尖朝实体）；线宽贴合 EDGE_STROKE_WIDTH，marker 盒仍 14 不胀撞 chip */
function MarkerPaths({ end, stroke }: { end: CrowFootEnd; stroke: string }) {
  if (end === 'one') {
    return (
      <path
        d="M9 1.5 V10.5"
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
      />
    );
  }
  return (
    <path
      d="M1.5 6 L10.5 1.5 M1.5 6 L10.5 6 M1.5 6 L10.5 10.5"
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function ErdCrowFootMarkers() {
  return (
    <svg
      width={0}
      height={0}
      aria-hidden
      data-testid="erd-crowfoot-markers"
      style={{ position: 'absolute', overflow: 'visible' }}
    >
      <defs>
        {ENDS.flatMap((end) =>
          TONES.flatMap((tone) =>
            ROLES.map((role) => (
              <marker
                key={crowFootMarkerId(end, role, tone)}
                id={crowFootMarkerId(end, role, tone)}
                viewBox="0 0 12 12"
                refX={end === 'many' ? 11 : 9}
                refY={6}
                markerWidth={14}
                markerHeight={14}
                markerUnits="userSpaceOnUse"
                orient={role === 'start' ? 'auto-start-reverse' : 'auto'}
              >
                <MarkerPaths end={end} stroke={markerStroke(tone)} />
              </marker>
            )),
          ),
        )}
      </defs>
    </svg>
  );
}

export default memo(ErdCrowFootMarkers);
