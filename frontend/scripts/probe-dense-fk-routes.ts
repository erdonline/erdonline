/**
 * Dense-FK route probe: DBML → dagre → route modes / bypass lengths.
 * Run: cd frontend && npx tsx scripts/probe-dense-fk-routes.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Position } from 'reactflow';
import { dbmlToProjectJSON } from '../src/utils/dbml/toProjectJSON';
import { FIELD_ROW_H, NODE_WIDTH, estimateNodeHeight } from '../src/utils/graphLayout';
import {
  expandObstacle,
  bypassLRWaypoints,
  pickBypassYCandidates,
  polylineHitsObstacles,
  routeErdSmoothStep,
} from '../src/utils/relationEdgeRoute';
import { EDGE_STEP_OFFSET } from '../src/utils/relationEdges';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, '../tests/fixtures/dense-fk.dbml');

function manhattanPath(pts: Array<{ x: number; y: number }>): number {
  let L = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    L += Math.abs(pts[i + 1].x - pts[i].x) + Math.abs(pts[i + 1].y - pts[i].y);
  }
  return L;
}

async function main() {
  const text = fs.readFileSync(fixture, 'utf8');
  const json = await dbmlToProjectJSON(text);
  const mod = json.modules[0];
  const entities = mod.entities;
  const associations = mod.associations;
  const layoutNodes = mod.diagrams?.[0]?.layout?.nodes ?? mod.graphCanvas?.nodes ?? [];

  const byTitle = new Map(entities.map((e) => [e.title, e]));
  const boxes = [];
  for (const n of layoutNodes) {
    const title = String((n as { title?: string; id?: string }).title || (n as { id?: string }).id || '');
    const ent = byTitle.get(title);
    if (!ent) continue;
    boxes.push({
      id: title,
      title,
      x: Number((n as { x?: number }).x) || 0,
      y: Number((n as { y?: number }).y) || 0,
      width: NODE_WIDTH,
      height: estimateNodeHeight(ent),
    });
  }
  const boxByTitle = new Map(boxes.map((b) => [b.title, b]));

  const fieldY = (box: (typeof boxes)[0], field: string) => {
    const ent = byTitle.get(box.title)!;
    const fields = (ent.fields || []).filter((f) => !f.relationNoShow);
    const idx = Math.max(0, fields.findIndex((f) => f.name === field));
    // 表头 chrome ≈ NODE_CHROME_H 的可视部分；密表再压后用 32
    return box.y + 32 + idx * FIELD_ROW_H + FIELD_ROW_H / 2;
  };

  const modes: Record<string, number> = {};
  const long: Array<{ edge: string; mode: string; best: number; first: number; direct: number }> = [];

  for (const a of associations) {
    const fromT = a.from?.entity;
    const toT = a.to?.entity;
    const fromF = a.from?.field;
    const toF = a.to?.field;
    if (!fromT || !toT || !fromF || !toF) continue;
    const sb = boxByTitle.get(fromT);
    const tb = boxByTitle.get(toT);
    if (!sb || !tb) continue;

    const sourceX = sb.x + sb.width;
    const targetX = tb.x;
    const sourceY = fieldY(sb, fromF);
    const targetY = fieldY(tb, toF);
    const obstacles = boxes
      .filter((b) => b.title !== fromT && b.title !== toT)
      .map((b) => ({ id: b.id, x: b.x, y: b.y, width: b.width, height: b.height }));

    const r = routeErdSmoothStep({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      offset: EDGE_STEP_OFFSET,
      obstacles,
    });
    modes[r.mode] = (modes[r.mode] || 0) + 1;

    const sourceGappedX = sourceX + EDGE_STEP_OFFSET;
    const targetGappedX = targetX - EDGE_STEP_OFFSET;
    const loX = Math.min(sourceGappedX, targetGappedX);
    const hiX = Math.max(sourceGappedX, targetGappedX);
    const expanded = obstacles.map((o) => expandObstacle(o));
    const ys = pickBypassYCandidates(sourceY, targetY, loX, hiX, expanded);
    const clear = ys
      .map((by) => {
        const pts = bypassLRWaypoints(
          sourceX,
          sourceY,
          targetX,
          targetY,
          EDGE_STEP_OFFSET,
          by,
          Position.Right,
          Position.Left,
        );
        return {
          by,
          hit: polylineHitsObstacles(pts, expanded),
          len: manhattanPath(pts),
        };
      })
      .filter((x) => !x.hit);
    const first = clear[0];
    const best = [...clear].sort((a, b) => a.len - b.len)[0];
    const direct = Math.abs(targetX - sourceX) + Math.abs(targetY - sourceY);
    if (best && first && (best.len < first.len - 40 || best.len > direct * 2.2)) {
      long.push({
        edge: `${fromT}.${fromF}→${toT}.${toF}`,
        mode: r.mode,
        best: best.len,
        first: first.len,
        direct,
      });
    }
  }

  console.log('modes', modes);
  console.log('long/suboptimal bypass candidates', long.length);
  for (const row of long) {
    console.log(
      `  ${row.edge} mode=${row.mode} first=${row.first} best=${row.best} direct=${row.direct} ratio=${(row.first / row.direct).toFixed(2)}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
