/**
 * ReactFlow fitView 预设（ADR-0016：导入后首屏 / 分享截图同密）。
 * 单表用 INIT（防空画布放大过头）；多表用 SHAREABLE（与分享只读同 padding）。
 */
export const FIT_VIEW_INIT = { padding: 0.15, maxZoom: 1 } as const;

export const FIT_VIEW_SHAREABLE = { padding: 0.08, maxZoom: 1.15 } as const;

export function fitViewOptionsForTableCount(tableCount: number) {
  return tableCount >= 2 ? FIT_VIEW_SHAREABLE : FIT_VIEW_INIT;
}
