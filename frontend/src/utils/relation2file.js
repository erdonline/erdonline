/* eslint-disable */
/**
 * 模块关系图 → PNG（供 Markdown/HTML/Word/PDF 导出嵌入）
 * ADR-0001 R3 后续：不再依赖 G6；用 DOM 卡片 + SVG 连线，再 html2canvas。
 */
import { uuid } from './uuid';

const CARD_W = 200;
const FIELD_H = 18;
const HEADER_H = 28;

const gridPosition = (i) => ({
  x: 40 + (i % 4) * 260,
  y: 40 + Math.floor(i / 4) * 220,
});

const posOf = (entity, savedNodes, index) => {
  const title = entity.title;
  const saved = (savedNodes || []).find(n => (n.title || n.id || '').split(':')[0] === title);
  if (saved && typeof saved.x === 'number') {
    return { x: saved.x, y: saved.y };
  }
  return gridPosition(index);
};

/** 构建可截图的模块关系图 DOM（实体即节点，与画布语义一致） */
const buildModuleDom = (module) => {
  const entities = module.entities || [];
  const savedNodes = (module.graphCanvas && module.graphCanvas.nodes) || [];
  const associations = module.associations || [];

  if (entities.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'width:200px;height:200px;text-align:center;line-height:200px;color:#999;font:14px sans-serif;';
    empty.innerText = '未绘制关系图';
    return empty;
  }

  const positions = {};
  entities.forEach((e, i) => {
    positions[e.title] = posOf(e, savedNodes, i);
  });

  let maxX = 400;
  let maxY = 300;
  entities.forEach((e) => {
    const fields = (e.fields || []).filter(f => !f.relationNoShow);
    const h = HEADER_H + fields.length * FIELD_H + 8;
    const p = positions[e.title];
    maxX = Math.max(maxX, p.x + CARD_W + 40);
    maxY = Math.max(maxY, p.y + h + 40);
  });

  const wrap = document.createElement('div');
  wrap.setAttribute('data-erd-export-canvas', '1');
  wrap.style.cssText = `position:relative;width:${maxX}px;height:${maxY}px;background:#fafafa;`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(maxX));
  svg.setAttribute('height', String(maxY));
  svg.style.cssText = 'position:absolute;left:0;top:0;';

  associations.forEach((a) => {
    const fromPos = positions[a.from && a.from.entity];
    const toPos = positions[a.to && a.to.entity];
    if (!fromPos || !toPos) {
      return;
    }
    const fromEntity = entities.find(e => e.title === a.from.entity);
    const toEntity = entities.find(e => e.title === a.to.entity);
    const fromFields = (fromEntity && fromEntity.fields || []).filter(f => !f.relationNoShow);
    const toFields = (toEntity && toEntity.fields || []).filter(f => !f.relationNoShow);
    const fi = Math.max(0, fromFields.findIndex(f => f.name === a.from.field));
    const ti = Math.max(0, toFields.findIndex(f => f.name === a.to.field));
    const x1 = fromPos.x + CARD_W;
    const y1 = fromPos.y + HEADER_H + fi * FIELD_H + FIELD_H / 2;
    const x2 = toPos.x;
    const y2 = toPos.y + HEADER_H + ti * FIELD_H + FIELD_H / 2;
    const mx = (x1 + x2) / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
    path.setAttribute('stroke', '#666');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);
  });
  wrap.appendChild(svg);

  entities.forEach((e) => {
    const p = positions[e.title];
    const fields = (e.fields || []).filter(f => !f.relationNoShow);
    const card = document.createElement('div');
    card.style.cssText = [
      `position:absolute;left:${Math.round(p.x)}px;top:${Math.round(p.y)}px;width:${CARD_W}px`,
      'background:#fff;border:1px solid #d9d9d9;border-radius:6px',
      'font:12px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden',
    ].join(';');

    const header = document.createElement('div');
    header.style.cssText = 'padding:6px 10px;background:#e6f0ff;font-weight:600;color:#1d39c4;border-bottom:1px solid #dbe6fb';
    header.textContent = e.chnname ? `${e.title} ${e.chnname}` : e.title;
    card.appendChild(header);

    fields.forEach((f) => {
      const row = document.createElement('div');
      row.style.cssText = 'padding:2px 10px;border-bottom:1px solid #f0f0f0;display:flex;gap:6px';
      const pk = document.createElement('span');
      pk.style.cssText = `color:${f.pk ? '#fa8c16' : '#999'};width:18px;flex-shrink:0`;
      pk.textContent = f.pk ? 'PK' : '';
      const name = document.createElement('span');
      name.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      name.textContent = f.name || '';
      const type = document.createElement('span');
      type.style.cssText = 'color:#999;flex-shrink:0';
      type.textContent = f.type || '';
      row.appendChild(pk);
      row.appendChild(name);
      row.appendChild(type);
      card.appendChild(row);
    });
    wrap.appendChild(card);
  });

  return wrap;
};

/** 按需加载 html2canvas（仅在导出关系图时触发） */
const loadHtml2canvas = () => new Promise((resolve, reject) => {
  if (typeof html2canvas === 'function') return resolve();
  const s = document.createElement('script');
  s.src = '/js/html2canvas.min.js?v=20260828a';
  s.async = true;
  s.onload = () => resolve();
  s.onerror = () => reject(new Error('html2canvas 加载失败'));
  document.head.appendChild(s);
});

/**
 * @param {object} dataSource projectJSON
 * @param {any} _columnOrder 保留签名兼容 exportSlice（新实现按 entities 字段渲染）
 * @param {(images: Record<string,string>) => void} callBack moduleName → dataURL
 * @param {(err: Error) => void} [errorCallback]
 */
export const saveImage = (dataSource, _columnOrder, callBack, errorCallback) => {
  const modules = (dataSource && dataSource.modules) || [];
  const images = {};
  Promise.all(modules.map(module => new Promise((resolve, reject) => {
    const id = uuid();
    const host = document.createElement('div');
    host.id = id;
    host.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;';
    const graph = buildModuleDom(module);
    host.appendChild(graph);
    document.body.appendChild(host);
    setTimeout(() => {
      loadHtml2canvas().then(() => html2canvas(graph).then((canvas) => {
        images[module.name] = canvas.toDataURL('png');
        host.parentNode && host.parentNode.removeChild(host);
        resolve();
      }).catch((err) => {
        host.parentNode && host.parentNode.removeChild(host);
        reject(err);
      })).catch((err) => {
        host.parentNode && host.parentNode.removeChild(host);
        reject(err);
      });
    }, 50);
  }))).then(() => {
    callBack && callBack(images);
  }).catch((err) => {
    errorCallback && errorCallback(err);
  });
};
