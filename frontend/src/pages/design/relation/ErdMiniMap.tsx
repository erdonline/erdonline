import React, { useEffect } from 'react';
import { MiniMap, MiniMapProps } from 'reactflow';

/**
 * RF MiniMap + d3-zoom（pannable/zoomable）会给 SVG 写入 tabindex=0，
 * 键盘 Tab 会掉进缩略图「陷阱」。鼠标仍可拖/滚；SVG 改为 tabindex=-1，
 * 保留 role=img 可访问名（装饰定位，非 Tab 站）。
 */
function stripMiniMapTabStop() {
  document.querySelectorAll<SVGElement>('.react-flow__minimap svg').forEach((svg) => {
    if (svg.getAttribute('tabindex') !== '-1') {
      svg.setAttribute('tabindex', '-1');
    }
  });
}

const ErdMiniMap: React.FC<MiniMapProps> = (props) => {
  useEffect(() => {
    stripMiniMapTabStop();
    // d3-zoom 在 MiniMap 的 effect 里写 tabindex；观察属性回写 -1
    const roots = document.querySelectorAll('.react-flow__minimap');
    if (!roots.length) return undefined;
    const mo = new MutationObserver(stripMiniMapTabStop);
    roots.forEach((root) => {
      mo.observe(root, {
        attributes: true,
        subtree: true,
        attributeFilter: ['tabindex'],
      });
    });
    return () => mo.disconnect();
  }, []);

  return <MiniMap {...props} />;
};

export default ErdMiniMap;
