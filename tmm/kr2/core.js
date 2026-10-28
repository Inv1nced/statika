/* План скоростей: геометрия, чертежи по шагам, решатели механизмов */
(function () {
'use strict';

/* ---------- математика ---------- */
const D2R = Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const crs = (a, b) => a[0] * b[1] - a[1] * b[0];
const len = a => Math.hypot(a[0], a[1]);
const unit = a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
const rot = a => [-a[1], a[0]];
const dirv = d => [Math.cos(d * D2R), Math.sin(d * D2R)];
const angd = a => Math.atan2(a[1], a[0]) / D2R;
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const cen = (a, b, c) => [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
const rotBy = (v, deg) => { const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
function cc(c1, r1, c2, r2) {
  const d = sub(c2, c1), L = len(d); if (L < 1e-9) return null;
  const a = (r1 * r1 - r2 * r2 + L * L) / (2 * L), h2 = r1 * r1 - a * a;
  if (h2 < -1e-7 * r1 * r1) return null;
  const h = Math.sqrt(Math.max(0, h2)), u = mul(d, 1 / L), m = add(c1, mul(u, a)), n = rot(u);
  return [add(m, mul(n, h)), add(m, mul(n, -h))]; // [слева от c1→c2, справа]
}
function lc(p, d, c, r) {
  d = unit(d); const f = sub(p, c), b = dot(f, d), q = dot(f, f) - r * r, D = b * b - q;
  if (D < 0) return null; const s = Math.sqrt(D);
  return [add(p, mul(d, -b - s)), add(p, mul(d, -b + s))]; // по возрастанию вдоль d
}
function ll(p, d, q, e) { const den = crs(d, e); if (Math.abs(den) < 1e-12) return null; const t = crs(sub(q, p), e) / den; return add(p, mul(d, t)); }
function lineAng(v) { let a = angd(v); a = ((a % 180) + 180) % 180; if (a > 179.95) a = 0; return a; }
function ang360(v) { const a = angd(v); return a < 0 ? a + 360 : a; }
function omegaOf(P, Q, vP, vQ, k) { const r = mul(sub(Q, P), k); return crs(r, sub(vQ, vP)) / dot(r, r); }
function spanOf(pts) { let x0 = 1e18, x1 = -1e18, y0 = 1e18, y1 = -1e18; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } return Math.max(x1 - x0, y1 - y0); }
function qsin(d1, d2) { return Math.abs(crs(unit(d1), unit(d2))); }

/* ---------- числа и текст ---------- */
const fz = s => String(s).replace('-', '−').replace('.', ',');
const f1 = x => { const r = Math.round(x * 10) / 10; return fz(Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : r.toFixed(1)); };
function fs(x, n) {
  n = n || 3; if (!isFinite(x)) return '—'; if (Math.abs(x) < 1e-12) return '0';
  const a = Math.abs(x); let d = n - 1 - Math.floor(Math.log10(a)); d = Math.max(0, Math.min(4, d));
  return fz(x.toFixed(d));
}
function fa(a) { const r = Math.round(a * 10) / 10; const s = Math.abs(r - Math.round(r)) < 0.05 ? String(Math.round(r)) : r.toFixed(1); return fz(s) + '°'; }
const fmu = m => fz(String(m));
const fnum = x => fz(String(Math.round(x * 1000) / 1000));
const dirW = w => (w < 0 ? 'по часовой' : 'против часовой');
const dirWord = a => ['вправо', 'вправо-вверх', 'вверх', 'влево-вверх', 'влево', 'влево-вниз', 'вниз', 'вправо-вниз'][Math.round((((a % 360) + 360) % 360) / 45) % 8];
const Vh = s => '<span class="vv">V</span><sub>' + s + '</sub>';
const Vs = s => 'V<sub>' + s + '</sub>';
const Lh = s => 'l<sub>' + s + '</sub>';
const UNIT = { 'мм': 0.001, 'см': 0.01, 'м': 1 };
const MLS = [0.0005, 0.001, 0.002, 0.0025, 0.004, 0.005, 0.01, 0.02, 0.025, 0.04, 0.05, 0.1];
const MVS = [0.0005, 0.001, 0.002, 0.0025, 0.004, 0.005, 0.01, 0.02, 0.025, 0.04, 0.05, 0.1, 0.2, 0.25, 0.5];
function bbOf(pts) { let x0 = 1e18, x1 = -1e18, y0 = 1e18, y1 = -1e18; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } return [x1 - x0, y1 - y0]; }
function pickML(pts, k) { const wh = bbOf(pts); for (const m of MLS) if (wh[0] * k / m <= 175 && wh[1] * k / m <= 135) return m; return MLS[MLS.length - 1]; }
function pickMV(vA, spanV) { for (const m of MVS) if (vA / m <= 100 && spanV / m <= 175) return m; return MVS[MVS.length - 1]; }
const scaleWords = ml => '1 мм на листе = ' + fz(String(Math.round(ml * 1000 * 1000) / 1000)) + ' мм механизма';

/* ---------- svg ---------- */
const NS = 'http://www.w3.org/2000/svg';
function el(tag, at, par) { const e = document.createElementNS(NS, tag); if (at) for (const k in at) { if (at[k] != null) e.setAttribute(k, at[k]); } if (par) par.appendChild(e); return e; }
function hh(tag, cls, par, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (par) par.appendChild(e); return e; }
function rich(t, str, fsz) {
  fsz = fsz || 14; const re = /([_^])\{([^}]*)\}/g; let pos = 0, m, sh = 0;
  const put = (s, dy, small) => { const sp = el('tspan', null, t); if (dy) sp.setAttribute('dy', dy.toFixed(1)); if (small) sp.setAttribute('font-size', (fsz * 0.72).toFixed(1)); sp.textContent = s; };
  while ((m = re.exec(str))) {
    if (m.index > pos) { put(str.slice(pos, m.index), -sh, false); sh = 0; }
    const s = m[1] === '_' ? fsz * 0.3 : -fsz * 0.42; put(m[2], s - sh, true); sh = s; pos = re.lastIndex;
  }
  if (pos < str.length) put(str.slice(pos), -sh, false);
}
const pth = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
const C = { bg: '#0a0e1a', text: '#e8ecf6', soft: '#cdd3e5', muted: '#8d97b3', pencil: '#b9c2dc', known: '#7aa2ff', found: '#ff9f43', rel: '#ff5d8f', l1: '#a78bfa', l2: '#2ee6c5', l3: '#ffd166', l4: '#9be15d', l5: '#4fd1ff', ok: '#46d39a', bad: '#ff6b6b' };

let SID = 0;
class Scene {
  constructor(svg, o) {
    this.svg = svg; this.o = Object.assign({ W: 400, maxH: 420, minH: 140, pad: 46 }, o || {});
    this.id = 'k' + (++SID); this.mk = {};
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    this.defs = el('defs', null, svg); this.L = {};
    for (const n of ['under', 'cons', 'main', 'top']) this.L[n] = el('g', null, svg);
  }
  fit(pts) {
    const o = this.o; let x0 = 1e18, y0 = 1e18, x1 = -1e18, y1 = -1e18;
    for (const p of pts) { if (!p || !isFinite(p[0]) || !isFinite(p[1])) continue; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    if (x0 > x1) { x0 = -1; x1 = 1; y0 = -1; y1 = 1; }
    let bw = x1 - x0, bh = y1 - y0; const m = Math.max(bw, bh) || 1;
    if (bw < m * 0.05) { x0 -= m * 0.025; x1 += m * 0.025; bw = x1 - x0; }
    if (bh < m * 0.05) { y0 -= m * 0.025; y1 += m * 0.025; bh = y1 - y0; }
    const k = Math.min((o.W - 2 * o.pad) / bw, (o.maxH - 2 * o.pad) / bh);
    let H = o.H || (bh * k + 2 * o.pad); H = Math.max(H, o.minH);
    this.k = k; this.H = H; this.W = o.W; this.ox = (o.W - bw * k) / 2 - x0 * k; this.oy = (H - bh * k) / 2 + y1 * k;
    this.svg.setAttribute('viewBox', '0 0 ' + o.W + ' ' + H.toFixed(1));
  }
  X(p) { return [this.ox + p[0] * this.k, this.oy - p[1] * this.k]; }
  sd(v) { return unit([v[0], -v[1]]); }
  marker(col) {
    if (this.mk[col]) return this.mk[col];
    const id = this.id + 'm' + Object.keys(this.mk).length;
    const m = el('marker', { id: id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 9, markerHeight: 9, markerUnits: 'userSpaceOnUse', orient: 'auto' }, this.defs);
    el('path', { d: 'M0 0.6L10 5L0 9.4z', fill: col }, m);
    return (this.mk[col] = 'url(#' + id + ')');
  }
  clear() { for (const n in this.L) { const g = this.L[n]; while (g.firstChild) g.removeChild(g.firstChild); } }
}
function arcPath(sc, c, r, a0, a1) {
  const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 3)); const pts = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D2R; pts.push(sc.X([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)])); }
  return pth(pts);
}
function sArc(S, r, a0, a1, n) { const pts = []; n = n || 24; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D2R; pts.push([S[0] + r * Math.cos(a), S[1] - r * Math.sin(a)]); } return pts; }
function txt(g, x, y, s, col, size, wt, anchor) { const t = el('text', { x: x.toFixed(1), y: y.toFixed(1), fill: col, 'font-size': size, 'font-weight': wt || 600, 'text-anchor': anchor || 'middle' }, g); rich(t, s, size); return t; }

/* ---------- примитивы ---------- */
const R = {};
R.link = (sc, it, g) => { el('path', { d: pth([sc.X(it.a), sc.X(it.b)]), stroke: it.col || C.soft, 'stroke-width': it.w || 3.6, 'stroke-linecap': 'round', fill: 'none', class: 'dr', 'stroke-dasharray': it.dash || null }, g); };
R.tri = (sc, it, g) => { el('path', { d: pth(it.p.map(q => sc.X(q))) + 'Z', fill: it.col, 'fill-opacity': it.op || 0.14, stroke: it.stroke || 'none', 'stroke-width': 1 }, g); };
R.poly = R.tri;
R.joint = (sc, it, g) => { const s = sc.X(it.p); el('circle', { cx: s[0].toFixed(1), cy: s[1].toFixed(1), r: it.r || 4.6, fill: C.bg, stroke: it.col || C.soft, 'stroke-width': 2 }, g); };
R.dot = (sc, it, g) => { const s = sc.X(it.p); el('circle', { cx: s[0].toFixed(1), cy: s[1].toFixed(1), r: it.r || 3.4, fill: it.col || C.text }, g); };
R.lbl = (sc, it, g) => {
  const s = sc.X(it.p); let dx = it.dx || 0, dy = it.dy || 0;
  if (it.ang != null) { const d = it.dist || 17; dx += d * Math.cos(it.ang * D2R); dy -= d * Math.sin(it.ang * D2R); }
  const size = it.size || 14; txt(g, s[0] + dx, s[1] + dy + size * 0.35, it.t, it.col || C.text, size, it.wt || 600, it.anchor);
};
R.ground = (sc, it, g) => {
  const [x, y] = sc.X(it.p), s = it.col || C.soft;
  el('path', { d: `M${(x - 3).toFixed(1)} ${(y + 4).toFixed(1)}L${(x - 10).toFixed(1)} ${(y + 16).toFixed(1)}M${(x + 3).toFixed(1)} ${(y + 4).toFixed(1)}L${(x + 10).toFixed(1)} ${(y + 16).toFixed(1)}M${(x - 16).toFixed(1)} ${(y + 16).toFixed(1)}H${(x + 16).toFixed(1)}`, stroke: s, 'stroke-width': 1.5, fill: 'none' }, g);
  let h = ''; for (let i = 0; i < 5; i++) { const xx = x - 14 + i * 7; h += `M${xx.toFixed(1)} ${(y + 16).toFixed(1)}l-5 6`; }
  el('path', { d: h, stroke: s, 'stroke-width': 1, fill: 'none' }, g);
};
R.guide = (sc, it, g) => {
  const S = sc.X(it.p), d = sc.sd(it.d), n = [-d[1], d[0]], sg = it.side || 1;
  const a = add(S, mul(d, -(it.l1 || 60))), b = add(S, mul(d, it.l2 || 60));
  el('path', { d: pth([a, b]), stroke: it.col || C.soft, 'stroke-width': 1.6, fill: 'none', class: 'dr' }, g);
  let h = ''; const N = Math.max(2, Math.floor(len(sub(b, a)) / 11));
  for (let i = 0; i <= N; i++) { const q = lerp(a, b, i / N); h += pth([q, add(add(q, mul(n, 7 * sg)), mul(d, -5))]); }
  el('path', { d: h, stroke: it.col || C.soft, 'stroke-width': 1, fill: 'none', 'stroke-opacity': 0.8 }, g);
};
R.bush = (sc, it, g) => {
  const S = sc.X(it.p), d = sc.sd(it.d), n = [-d[1], d[0]], gp = it.gap || 8, L = it.l || 26, col = it.col || C.soft;
  let pa = '', hs = '';
  for (const sg of [1, -1]) {
    const o = mul(n, gp * sg), a = add(add(S, o), mul(d, -L / 2)), b = add(add(S, o), mul(d, L / 2)); pa += pth([a, b]);
    for (let i = 0; i <= 4; i++) { const q = lerp(a, b, i / 4); hs += pth([q, add(add(q, mul(n, 6 * sg)), mul(d, -4))]); }
  }
  el('path', { d: pa, stroke: col, 'stroke-width': 1.8, fill: 'none' }, g);
  el('path', { d: hs, stroke: col, 'stroke-width': 1, fill: 'none' }, g);
};
R.slider = (sc, it, g) => {
  const S = sc.X(it.p), d = sc.sd(it.d), a = Math.atan2(d[1], d[0]) / D2R, w = it.w || 32, h = it.h || 16;
  el('rect', { x: (S[0] - w / 2).toFixed(1), y: (S[1] - h / 2).toFixed(1), width: w, height: h, rx: 3, fill: C.bg, stroke: it.col || C.l3, 'stroke-width': 2, transform: `rotate(${a.toFixed(1)} ${S[0].toFixed(1)} ${S[1].toFixed(1)})` }, g);
};
R.cl = (sc, it, g) => {
  const A = sc.X(it.a), B = sc.X(it.b); const u = unit(sub(B, A)), e1 = it.e1 != null ? it.e1 : 30, e2 = it.e2 != null ? it.e2 : 40;
  el('path', { d: pth([sub(A, mul(u, e1)), add(B, mul(u, e2))]), stroke: it.col || C.muted, 'stroke-width': it.w || 1.15, 'stroke-dasharray': it.dash || '6 4', fill: 'none' }, g);
};
R.ray = (sc, it, g) => {
  const A = sc.X(it.a), u = sc.sd(it.d);
  el('path', { d: pth([add(A, mul(u, it.l0 || 0)), add(A, mul(u, it.l || 60))]), stroke: it.col || C.muted, 'stroke-width': it.w || 1.1, 'stroke-dasharray': it.dash || '6 4', fill: 'none' }, g);
};
R.seg = (sc, it, g) => { el('path', { d: pth([sc.X(it.a), sc.X(it.b)]), stroke: it.col || C.muted, 'stroke-width': it.w || 1.2, 'stroke-dasharray': it.dash || null, fill: 'none', class: it.dash ? null : 'dr' }, g); };
R.arc = (sc, it, g) => { el('path', { d: arcPath(sc, it.c, it.r, it.a0, it.a1), stroke: it.col || C.pencil, 'stroke-width': it.w || 1.3, fill: 'none', 'stroke-opacity': 0.95, class: 'arcp' }, g); };
R.circ = (sc, it, g) => {
  const a0 = it.a0 != null ? it.a0 : 90;
  if (it.fill) { const S = sc.X(it.c); el('circle', { cx: S[0].toFixed(1), cy: S[1].toFixed(1), r: (it.r * sc.k).toFixed(1), fill: it.fill, 'fill-opacity': it.op || 0.14, stroke: 'none' }, g); }
  el('path', { d: arcPath(sc, it.c, it.r, a0, a0 + 360), stroke: it.col || C.pencil, 'stroke-width': it.w || 1.3, fill: 'none', class: 'arcp' }, g);
};
R.vec = (sc, it, g) => {
  const A = sc.X(it.a), B = sc.X(it.b); if (len(sub(B, A)) < 3) return; const col = it.col || C.found;
  el('path', { d: pth([A, B]), stroke: col, 'stroke-width': it.w || 2.6, 'stroke-linecap': 'round', fill: 'none', 'marker-end': sc.marker(col), class: 'dr', 'stroke-dasharray': it.dash || null }, g);
};
R.hl = (sc, it, g) => { el('path', { d: pth([sc.X(it.a), sc.X(it.b)]), stroke: it.col || '#ffffff', 'stroke-width': 13, 'stroke-opacity': 0.26, 'stroke-linecap': 'round', fill: 'none' }, g); };
R.ang = (sc, it, g) => {
  const S = sc.X(it.c), r = it.r || 26;
  el('path', { d: pth(sArc(S, r, it.a0, it.a1)), stroke: it.col || C.soft, 'stroke-width': 1.3, fill: 'none', class: 'dr' }, g);
  if (it.t) { const am = ((it.a0 + it.a1) / 2) * D2R, rr = r + (it.td || 13); txt(g, S[0] + rr * Math.cos(am), S[1] - rr * Math.sin(am) + 4.5, it.t, it.col || C.soft, 13); }
};
R.omega = (sc, it, g) => {
  const S = sc.X(it.c), r = it.r || 24, a0 = it.a, a1 = it.cw ? a0 - (it.span || 100) : a0 + (it.span || 100), col = it.col || C.known;
  el('path', { d: pth(sArc(S, r, a0, a1)), stroke: col, 'stroke-width': 1.8, fill: 'none', 'marker-end': sc.marker(col), class: 'dr' }, g);
  if (it.t) { const am = ((a0 + a1) / 2) * D2R, rr = r + 12; txt(g, S[0] + rr * Math.cos(am), S[1] - rr * Math.sin(am) + 5, it.t, col, 14, 700); }
};
R.protr = (sc, it, g) => {
  const S = sc.X(it.c), r = it.r || 46, sg = it.lower ? -1 : 1;
  el('path', { d: pth(sArc(S, r, 0, 180 * sg, 36)) + 'Z', fill: 'rgba(122,162,255,0.10)', stroke: 'rgba(122,162,255,0.65)', 'stroke-width': 1 }, g);
  let tk = '';
  for (let d = 0; d <= 180; d += 10) { const a = sg * d * D2R, r0 = r - (d % 30 === 0 ? 9 : 5); tk += pth([[S[0] + r0 * Math.cos(a), S[1] - r0 * Math.sin(a)], [S[0] + r * Math.cos(a), S[1] - r * Math.sin(a)]]); }
  el('path', { d: tk, stroke: 'rgba(122,162,255,0.85)', 'stroke-width': 1, fill: 'none' }, g);
  el('circle', { cx: S[0].toFixed(1), cy: S[1].toFixed(1), r: 2.2, fill: 'rgba(122,162,255,0.95)' }, g);
  if (it.mark != null) {
    const a = it.mark * D2R;
    el('path', { d: pth([[S[0] + (r + 2) * Math.cos(a), S[1] - (r + 2) * Math.sin(a)], [S[0] + (r + 11) * Math.cos(a), S[1] - (r + 11) * Math.sin(a)]]), stroke: C.found, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
    txt(g, S[0] + (r + 23) * Math.cos(a), S[1] - (r + 23) * Math.sin(a) + 4, it.mt || fa(Math.abs(it.mark)), C.found, 12, 700);
  }
};
R.ra = (sc, it, g) => {
  const S = sc.X(it.p), u = sc.sd(it.d1), v = sc.sd(it.d2), q = it.size || 9;
  el('path', { d: pth([add(S, mul(u, q)), add(add(S, mul(u, q)), mul(v, q)), add(S, mul(v, q))]), stroke: it.col || C.soft, 'stroke-width': 1.1, fill: 'none' }, g);
};
R.dim = (sc, it, g) => {
  const A = sc.X(it.a), B = sc.X(it.b), u = unit(sub(B, A)), n = [-u[1], u[0]], o = it.off || 0;
  const a = add(A, mul(n, o)), b = add(B, mul(n, o)), m = mid(a, b), col = it.col || C.muted, mk = sc.marker(col);
  el('path', { d: pth([m, a]), stroke: col, 'stroke-width': 1, fill: 'none', 'marker-end': mk }, g);
  el('path', { d: pth([m, b]), stroke: col, 'stroke-width': 1, fill: 'none', 'marker-end': mk }, g);
  if (o) el('path', { d: pth([A, add(a, mul(n, Math.sign(o) * 4))]) + pth([B, add(b, mul(n, Math.sign(o) * 4))]), stroke: col, 'stroke-width': 0.8, fill: 'none', 'stroke-dasharray': '2 2' }, g);
  if (it.t) { const tp = add(m, mul(n, it.toff != null ? it.toff : (o >= 0 ? 12 : -12))); txt(g, tp[0], tp[1] + 4, it.t, col, 12); }
};
R.pad = () => {};
const LAYER = { tri: 'under', poly: 'under', hl: 'under', cl: 'cons', ray: 'cons', seg: 'cons', arc: 'cons', ang: 'cons', ra: 'cons', dim: 'cons', link: 'main', vec: 'main', ground: 'main', guide: 'main', bush: 'main', slider: 'main', omega: 'main', circ: 'main', joint: 'top', dot: 'top', lbl: 'top', protr: 'top' };
const ANIM = { link: 'draw', vec: 'draw', seg: 'draw', guide: 'draw', ang: 'draw', omega: 'draw', arc: 'compass', circ: 'compass' };

function fitPts(items) {
  const P = [];
  for (const it of items) {
    if (it.nofit) continue;
    switch (it.k) {
      case 'link': case 'vec': case 'hl': case 'dim': case 'seg': P.push(it.a, it.b); break;
      case 'tri': case 'poly': P.push.apply(P, it.p); break;
      case 'joint': case 'dot': case 'lbl': case 'ground': case 'slider': case 'guide': case 'bush': case 'pad': P.push(it.p); break;
      case 'arc': for (let i = 0; i <= 6; i++) { const a = (it.a0 + (it.a1 - it.a0) * i / 6) * D2R; P.push([it.c[0] + it.r * Math.cos(a), it.c[1] + it.r * Math.sin(a)]); } break;
      case 'circ': P.push([it.c[0] - it.r, it.c[1] - it.r], [it.c[0] + it.r, it.c[1] + it.r]); break;
    }
  }
  return P;
}
function drawItems(sc, items) { for (const it of items) { const g = el('g', null, sc.L[it.layer || LAYER[it.k] || 'main']); R[it.k](sc, it, g); } }

/* подписи: выбираем направление подальше от соседних звеньев */
function bestAng(P, nb, avoid) {
  const ds = (nb || []).filter(q => q && len(sub(q, P)) > 1e-9).map(q => angd(sub(q, P))).concat(avoid || []);
  if (!ds.length) return 45;
  let best = 45, bv = -1;
  for (let a = 0; a < 360; a += 15) {
    let mn = 360; for (const d of ds) { const x = Math.abs(((((a - d) % 360) + 540) % 360) - 180); mn = Math.min(mn, x); }
    const v = mn + (a % 90 === 45 ? 0.5 : 0); if (v > bv + 1e-6) { bv = v; best = a; }
  }
  return best;
}
function omegaMid(cn, nb, ground) { const av = (nb || []).filter(Boolean).map(q => angd(sub(q, cn))); if (ground) av.push(270, 245, 295); return bestAng(cn, [], av.length ? av : [0]); }
function pivAng(P, nb, avoid, omNb) { const m = omegaMid(P, omNb, true); return bestAng(P, nb, (avoid || []).concat([m, m + 40, m - 40])); }
const PIVD = 20;
function omegaSpec(cn, nb, w, t, col, ground, r) {
  const m = omegaMid(cn, nb, ground);
  return { c: cn, r: r || 26, a: w < 0 ? m + 50 : m - 50, span: 100, cw: w < 0, t: t, col: col || C.known };
}
function angPlan(a) {
  a = ((a % 360) + 360) % 360;
  if (a <= 180.0001) return { mark: a, lower: false, txt: 'отсчитываем ' + fa(a) + ' от горизонтали вправо против часовой стрелки' };
  return { mark: a - 360, lower: true, mt: fa(360 - a), txt: fa(a) + ' больше 180°, поэтому удобнее перевернуть транспортир и отложить ' + fa(360 - a) + ' вниз от горизонтали вправо' };
}

/* ---------- построение по шагам ---------- */
class Kon {
  constructor() { this.sc = {}; this.order = []; this.steps = []; this.all = []; }
  scene(n, o) { if (!this.sc[n]) { this.sc[n] = { o: o || {}, items: [] }; this.order.push(n); } return this; }
  step(cap) { this.steps.push(cap); return this; }
  get i() { return this.steps.length - 1; }
  add(n, it) { if (it.s == null) it.s = this.i; if (it.only) it.e = it.s; this.sc[n].items.push(it); this.all.push(it); return it; }
  fn(n) { return (k, pr) => this.add(n, Object.assign({ k: k }, pr)); }
}
function reveal(it, t, st) {
  const g = it.__g, an = ANIM[it.k] || 'fade';
  if (an === 'compass') { animCompass(it, t, st); return t + (it.dur || 850) * 0.9; }
  if (an === 'draw') {
    let any = false;
    g.querySelectorAll('.dr').forEach(p => {
      any = true; p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1';
      const mk = p.getAttribute('marker-end');
      if (mk) { p.removeAttribute('marker-end'); st.fix.push(() => p.setAttribute('marker-end', mk)); }
      const a = p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 600, delay: t, easing: 'ease-out', fill: 'backwards' });
      st.anims.push(a); a.onfinish = () => { if (mk) p.setAttribute('marker-end', mk); };
    });
    Array.prototype.forEach.call(g.children, e => { if (!e.classList.contains('dr')) { const a = e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, delay: t + 300, fill: 'backwards' }); st.anims.push(a); } });
    return t + (any ? 380 : 120);
  }
  const a = g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: t, fill: 'backwards' }); st.anims.push(a); return t + 110;
}
function animCompass(it, t, st) {
  const g = it.__g, sc = it.__sc, p = g.querySelector('.arcp'); if (!p) return;
  const full = p.getAttribute('d'), tok = st.tok, a0 = it.k === 'circ' ? (it.a0 != null ? it.a0 : 90) : it.a0, a1 = it.k === 'circ' ? a0 + 360 : it.a1;
  p.setAttribute('d', 'M0 0');
  const gl = el('g', { 'pointer-events': 'none' }, sc.L.top);
  const leg = el('path', { stroke: '#f2f5ff', 'stroke-width': 2, 'stroke-opacity': 0.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, gl);
  const hg = el('circle', { r: 3.6, fill: '#f2f5ff', 'fill-opacity': 0.9 }, gl), tip = el('circle', { r: 2.4, fill: C.found }, gl);
  gl.style.display = 'none';
  const dur = it.dur || (it.k === 'circ' ? 1300 : 850), t0 = performance.now() + t;
  const done = () => { p.setAttribute('d', full); gl.remove(); };
  st.fix.push(done);
  function fr(now) {
    if (st.tok !== tok) { done(); return; }
    if (now < t0) { requestAnimationFrame(fr); return; }
    gl.style.display = '';
    const x = Math.min(1, (now - t0) / dur), e = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2, a = a0 + (a1 - a0) * e;
    p.setAttribute('d', arcPath(sc, it.c, it.r, a0, a));
    const S = sc.X(it.c), T = sc.X(add(it.c, mul(dirv(a), it.r))), v = sub(T, S), L = len(v);
    let n = unit([v[1], -v[0]]); if (n[1] > 0) n = mul(n, -1);
    const H = add(mid(S, T), mul(n, Math.max(16, L * 0.45)));
    leg.setAttribute('d', pth([S, H, T])); hg.setAttribute('cx', H[0].toFixed(1)); hg.setAttribute('cy', H[1].toFixed(1)); tip.setAttribute('cx', T[0].toFixed(1)); tip.setAttribute('cy', T[1].toFixed(1));
    if (x < 1) requestAnimationFrame(fr);
    else { p.setAttribute('d', full); const fo = gl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, delay: 150, fill: 'forwards' }); fo.onfinish = () => gl.remove(); }
  }
  requestAnimationFrame(fr);
}
function mountKon(host, K, opt) {
  opt = opt || {}; host.innerHTML = ''; host.classList.add('kon');
  const multi = K.order.length > 1, wrap = hh('div', 'scs' + (multi ? ' duo' : ''), host);
  for (const n of K.order) {
    const def = K.sc[n], box = hh('div', 'scb scb-' + n, wrap);
    if (def.o.title) hh('div', 'sct', box, def.o.title);
    const svg = el('svg', { class: 'scsvg', role: 'img', 'aria-label': def.o.title || 'чертёж' }, box);
    const sc = new Scene(svg, def.o); sc.fit(fitPts(def.items));
    for (const it of def.items) { const g = el('g', null, sc.L[it.layer || LAYER[it.k] || 'main']); try { R[it.k](sc, it, g); } catch (e) { console.error(it.k, e); } it.__g = g; it.__sc = sc; }
  }
  const order = K.all.filter(it => it.__g);
  if (opt.static || !K.steps.length) { order.forEach(it => { it.__g.style.display = it.e == null ? '' : 'none'; }); return null; }
  const ctl = hh('div', 'ctl', host), cnt = hh('span', 'cnt', ctl), bar = hh('div', 'bar', ctl), fill = hh('i', null, bar);
  const bp = hh('button', 'bp', ctl, '‹'); bp.setAttribute('aria-label', 'Назад');
  const bn = hh('button', 'bn', ctl, 'Дальше ›'), be = hh('button', 'be', ctl, 'Конец');
  const cap = hh('div', 'cap', host);
  const st = { cur: -1, tok: 0, anims: [], fix: [] };
  function show(i, anim) {
    i = Math.max(0, Math.min(K.steps.length - 1, i)); st.tok++;
    st.anims.forEach(a => { try { a.cancel(); } catch (e) {} }); st.anims = []; st.fix.forEach(f => f()); st.fix = [];
    st.cur = i;
    for (const it of order) { const vis = it.s <= i && (it.e == null || i <= it.e); it.__g.style.display = vis ? '' : 'none'; }
    if (anim) { let t = 0; for (const it of order) if (it.s === i) t = reveal(it, t, st); }
    cap.innerHTML = K.steps[i]; cnt.textContent = (i + 1) + ' / ' + K.steps.length; fill.style.width = ((i + 1) / K.steps.length * 100).toFixed(1) + '%';
    bp.classList.toggle('off', i === 0); bn.classList.toggle('off', i === K.steps.length - 1);
  }
  bp.onclick = () => show(st.cur - 1, false);
  bn.onclick = () => { if (st.cur < K.steps.length - 1) show(st.cur + 1, true); };
  be.onclick = () => show(K.steps.length - 1, false);
  show(opt.start || 0, false);
  return { show: show };
}

/* ---------- общие куски шагов ---------- */
function vecScale(mechPts, vecs) { const sp = spanOf(mechPts); let mx = 1e-9; for (const v of vecs) mx = Math.max(mx, len(v)); return 0.24 * sp / mx; }
function perpCap(name, P, Q, at) {
  const th = lineAng(sub(Q, P)), tp = lineAng(rot(sub(Q, P)));
  return { th: th, tp: tp, html: name + ' стоит под ' + fa(th) + ' к горизонтали → перпендикуляр идёт под ' + fa(th) + (th < 90 ? ' + ' : ' − ') + '90° = ' + fa(tp) + '. Транспортир центром в ' + at + ', ноль — по горизонтали вправо, отмечаем ' + fa(tp) + ' и проводим прямую через ' + at + '.' };
}
function vaCap(S, crankName, center, A, w1, a, mv, rM, Lp) {
  const thA = lineAng(sub(A, center)), tp = lineAng(a), dir = ang360(a);
  return `<b>Шаг 2. Вектор pa ⊥ ${crankName}.</b> ${crankName} стоит под ${fa(thA)} к горизонтали → перпендикуляр под ${fa(tp)}. Транспортир центром в p, отмечаем ${fa(tp)}, проводим прямую и откладываем pa = ${Lp(a)} мм в ту сторону, куда ω<sub>1</sub> крутит кривошип (${dirW(w1)}): стрелка смотрит ${dirWord(dir)}.`;
}
function lenMM(v, mv) { return len(v) / mv; }


/* ---------- читаемость схемы (для генераторов задач) ---------- */
const NICE_PHI = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
function segX(p1, p2, q1, q2) { const d1 = crs(sub(p2, p1), sub(q1, p1)), d2 = crs(sub(p2, p1), sub(q2, p1)), d3 = crs(sub(q2, q1), sub(p1, q1)), d4 = crs(sub(q2, q1), sub(p2, q1)); return d1 * d2 < 0 && d3 * d4 < 0; }
function segDist(P, A, B) { const ab = sub(B, A), t = Math.max(0, Math.min(1, dot(sub(P, A), ab) / dot(ab, ab))); return len(sub(P, add(A, mul(ab, t)))); }
/* pts — точки схемы; segs — [i, j, ...члены] (i, j — концы звена; остальные индексы — точки, лежащие на нём) */
function readable(pts, segs, o) {
  o = o || {}; const sp = spanOf(pts), dmin = (o.pt || 0.13) * sp, smin = (o.seg || 0.08) * sp;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (len(sub(pts[i], pts[j])) < dmin) return false;
  for (const sg of segs) for (let i = 0; i < pts.length; i++) { if (sg.includes(i)) continue; if (segDist(pts[i], pts[sg[0]], pts[sg[1]]) < smin) return false; }
  for (let a = 0; a < segs.length; a++) for (let b = a + 1; b < segs.length; b++) {
    const A = segs[a], B = segs[b]; if (A.slice(0, 2).some(x => B.slice(0, 2).includes(x))) continue;
    if (segX(pts[A[0]], pts[A[1]], pts[B[0]], pts[B[1]])) return false;
  }
  return true;
}

/* =========================================================
   Тип 1. Кривошипно-ползунный механизм (и основа для кулачка)
   ========================================================= */
function solveSlider(p, k) {
  const O = [0, 0], A = mul(dirv(p.phi), p.r), gp = p.gp || [0, p.e || 0], gd = dirv(p.gd || 0);
  const X = lc(gp, gd, A, p.l); if (!X) return null;
  const B = (p.sel || 1) > 0 ? X[1] : X[0];
  const a = mul(rot(A), p.w1 * k), b = ll(a, rot(sub(B, A)), [0, 0], gd); if (!b) return null;
  return { O: O, A: A, B: B, a: a, b: b, gd: gd, gp: gp, w2: omegaOf(A, B, a, b, k) };
}
const KS = {
  key: 'ks', title: 'Кривошипно-ползунный механизм',
  solve(p) {
    const k = UNIT[p.u], s = solveSlider(p, k); if (!s) return null;
    const S = Object.assign({ type: 'ks', p: p, k: k }, s);
    S.S2 = mid(S.A, S.B); S.s2 = mid(S.a, S.b); S.vA = len(S.a);
    const pk = [S.O, S.A, S.B, add(S.B, mul(S.gd, 0.12 * p.l)), add(S.O, [-p.r, -p.r]), add(S.O, [p.r, p.r])]; S.span = spanOf(pk) * k; S.ml = pickML(pk, k);
    S.mv = pickMV(S.vA, spanOf([[0, 0], S.a, S.b])); return S;
  },
  draw(K, n, S, o) {
    o = o || {}; const m = (k, pr) => K.add(n, Object.assign({ k: k, s: o.s }, pr)), p = S.p;
    m('ray', { a: S.O, d: [1, 0], l: 46 });
    m('guide', { p: S.B, d: S.gd, l1: 64, l2: 46, side: 1 });
    m('link', { a: S.O, b: S.A, col: C.l1 }); m('link', { a: S.A, b: S.B, col: C.l2 }); m('slider', { p: S.B, d: S.gd });
    m('ground', { p: S.O }); [S.O, S.A, S.B].forEach(q => m('joint', { p: q }));
    m('lbl', { p: S.O, t: 'O', ang: pivAng(S.O, [S.A], [0, 250, 290, p.phi / 2 - 22, p.phi / 2, p.phi / 2 + 22], [S.A, add(S.O, [1, 0]), add(S.O, dirv(p.phi / 2))]), dist: PIVD });
    m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O, S.B]) });
    m('lbl', { p: S.B, t: 'B', ang: bestAng(S.B, [S.A], [angd(S.gd), angd(S.gd) + 180, angd(S.gd) - 90]), dist: 21 });
    if (o.w1 !== false) m('omega', omegaSpec(S.O, [S.A, add(S.O, [1, 0]), add(S.O, dirv(p.phi / 2))], p.w1, 'ω_{1}', C.known, true));
    if (o.phi !== false) m('ang', { c: S.O, a0: 0, a1: p.phi, r: 18, t: 'φ', col: C.muted, td: 10 });
    if (o.cm) { m('dot', { p: S.S2, r: 3 }); m('lbl', { p: S.S2, t: 'S_{2}', ang: bestAng(S.S2, [S.A, S.B]), size: 12 }); }
  },
  pos(S) {
    const K = new Kon(), p = S.p, k = S.k, ml = S.ml, L = x => f1(Math.abs(x) * k / ml), m = K.fn('mech'); K.scene('mech', { maxH: 380 });
    const e = p.e || 0, xl = Math.min(-p.r * 1.1, S.B[0] - p.l * 0.2), xr = Math.max(S.B[0], p.r) + p.l * 0.15;
    K.step(`<b>Шаг 1. Масштаб.</b> Размах схемы ≈ ${fs(S.span, 2)} м; под схему на листе А4 отводим примерно 170 × 130 мм. Берём μ<sub>l</sub> = ${fmu(ml)} м/мм (${scaleWords(ml)}). Длины на листе: OA = ${L(p.r)} мм, AB = ${L(p.l)} мм${e ? ', e = ' + L(e) + ' мм' : ''}. Ставим точку O и проводим через неё горизонталь.`);
    m('cl', { a: [xl, 0], b: [xr, 0], e1: 0, e2: 0 }); m('ground', { p: S.O }); m('joint', { p: S.O }); m('lbl', { p: S.O, t: 'O', ang: pivAng(S.O, [S.A], [0, 180, 250, 290, p.phi / 2 - 22, p.phi / 2, p.phi / 2 + 22], [S.A, add(S.O, [1, 0]), add(S.O, dirv(p.phi / 2))]), dist: PIVD });
    K.step(e ? `<b>Шаг 2. Направляющая ползуна.</b> Она смещена на e = ${L(e)} мм ${e > 0 ? 'вверх' : 'вниз'} от O. Откладываем e по вертикали и проводим через эту точку горизонталь — по ней будет ездить ползун.` : `<b>Шаг 2. Направляющая ползуна.</b> Здесь e = 0: ползун ездит прямо по горизонтали через O (центральный механизм). Отдельную линию проводить не нужно.`);
    if (e) { m('cl', { a: [xl, e], b: [xr, e], e1: 0, e2: 0 }); m('dim', { a: [xr * 0.85, 0], b: [xr * 0.85, e], off: e > 0 ? 12 : -12, t: 'e' }); }
    m('guide', { p: S.B, d: S.gd, l1: 64, l2: 46, side: 1 });
    const ap = angPlan(p.phi);
    K.step(`<b>Шаг 3. Угол φ = ${fa(p.phi)}.</b> Центр транспортира — в O, ноль — по горизонтали вправо. ${ap.txt[0].toUpperCase() + ap.txt.slice(1)}. Ставим отметку и проводим через неё луч из O.`);
    m('protr', { c: S.O, mark: ap.mark, lower: ap.lower, mt: ap.mt, only: true }); m('cl', { a: S.O, b: S.A, e1: 0, e2: 34 }); m('ang', { c: S.O, a0: 0, a1: p.phi, r: 18, t: 'φ', col: C.muted, td: 10 });
    K.step(`<b>Шаг 4. Кривошип.</b> Раствор циркуля ${L(p.r)} мм (это OA), иглу ставим в O и делаем засечку на луче. Получили точку A.`);
    m('arc', { c: S.O, r: p.r, a0: p.phi - 14, a1: p.phi + 14 }); m('link', { a: S.O, b: S.A, col: C.l1 }); m('joint', { p: S.A }); m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O, S.B]) });
    m('omega', omegaSpec(S.O, [S.A, add(S.O, [1, 0]), add(S.O, dirv(p.phi / 2))], p.w1, 'ω_{1}', C.known, true));
    const ab = angd(sub(S.B, S.A));
    K.step(`<b>Шаг 5. Ползун B.</b> Раствор ${L(p.l)} мм (AB), иглу — в A. Дуга пересекает направляющую — это точка B. У дуги есть и вторая точка пересечения (${(p.sel || 1) > 0 ? 'левее' : 'правее'}) — это другая сборка механизма, её не берём: смотри на рисунок в задании.`);
    m('arc', { c: S.A, r: p.l, a0: ab - 9, a1: ab + 9 }); m('dot', { p: S.B, col: C.found });
    K.step(`<b>Шаг 6. Шатун, ползун, центр масс.</b> Обводим AB, рисуем ползун на направляющей. S<sub>2</sub> — середина AB: ${L(p.l / 2)} мм от A (или найди середину циркулем, см. «Инструменты»).`);
    m('link', { a: S.A, b: S.B, col: C.l2 }); m('slider', { p: S.B, d: S.gd }); m('joint', { p: S.B }); m('lbl', { p: S.B, t: 'B', ang: bestAng(S.B, [S.A], [angd(S.gd), angd(S.gd) + 180, angd(S.gd) - 90]), dist: 21 });
    m('dot', { p: S.S2, r: 3 }); m('lbl', { p: S.S2, t: 'S_{2}', ang: bestAng(S.S2, [S.A, S.B]), size: 12 });
    return K;
  },
  plan(S) {
    const K = new Kon(), p = S.p, mv = S.mv, Lp = v => f1(len(v) / mv), o = [0, 0];
    K.scene('mech', { maxH: 250, title: 'Механизм' }); K.scene('plan', { maxH: 400, title: 'План скоростей' });
    KS.draw(K, 'mech', S, { s: -1, cm: true });
    const P = K.fn('plan'), M = K.fn('mech'), kv = vecScale([S.O, S.A, S.B], [S.a, S.b]), ba = sub(S.b, S.a);
    K.step(`<b>Шаг 1. Скорость точки A.</b> ${Vs('A')} = ω<sub>1</sub>·${Lh('OA')} = ${fnum(Math.abs(p.w1))}·${fnum(p.r * S.k)} = <b>${fs(S.vA)} м/с</b>. Пусть на плане она будет отрезком pa = ${Lp(S.a)} мм. Тогда масштаб μ<sub>V</sub> = ${fs(S.vA)} / ${Lp(S.a)} = ${fmu(mv)} (м/с)/мм. Ставим полюс p в свободном месте листа.`);
    P('dot', { p: o }); P('lbl', { p: o, t: 'p', ang: bestAng(o, [S.a, S.b, S.s2]) });
    K.step(vaCap(S, 'OA', S.O, S.A, p.w1, S.a, mv, null, Lp));
    P('protr', { c: o, mark: lineAng(S.a), only: true }); P('vec', { a: o, b: S.a, col: C.known }); P('lbl', { p: S.a, t: 'a', ang: bestAng(S.a, [o, S.b]) });
    M('hl', { a: S.O, b: S.A, col: C.l1, only: true }); M('vec', { a: S.A, b: add(S.A, mul(S.a, kv)), col: C.known, only: true });
    const c1 = perpCap('AB', S.A, S.B, 'a');
    K.step(`<b>Шаг 3. Уравнение для B.</b> ${Vh('B')} = ${Vh('A')} + ${Vh('BA')}. Длина ${Vh('BA')} неизвестна, но направление известно: ${Vh('BA')} ⊥ AB. ${c1.html}`);
    P('protr', { c: S.a, mark: c1.tp, only: true }); P('cl', { a: S.a, b: S.b, e1: 36, e2: 36 }); M('hl', { a: S.A, b: S.B, col: C.l2, only: true });
    const gA = lineAng(S.gd), gw = gA === 0 ? 'горизонтально' : (Math.abs(gA - 90) < 0.01 ? 'вертикально' : 'под ' + fa(gA));
    K.step(`<b>Шаг 4.</b> Ползун ездит по неподвижной направляющей, поэтому ${Vh('B')} ∥ направляющей — то есть ${gw}. ${Vh('B')} — абсолютная скорость, она выходит из полюса: проводим через p прямую ${gw}.`);
    P('cl', { a: o, b: S.b, e1: 36, e2: 36 }); M('hl', { a: add(S.B, mul(S.gd, -p.l * 0.22)), b: add(S.B, mul(S.gd, p.l * 0.22)), col: C.l3, only: true });
    K.step(`<b>Шаг 5. Точка b</b> — пересечение двух прямых. Меряем линейкой: pb ≈ ${Lp(S.b)} мм → ${Vs('B')} = ${Lp(S.b)}·${fmu(mv)} = <b>${fs(len(S.b))} м/с</b>; ab ≈ ${Lp(ba)} мм → ${Vs('BA')} = <b>${fs(len(ba))} м/с</b>. Стрелки ставим к b: pb — абсолютная скорость, ab — относительная.`);
    P('dot', { p: S.b }); P('lbl', { p: S.b, t: 'b', ang: bestAng(S.b, [o, S.a]) }); P('vec', { a: o, b: S.b, col: C.found }); P('vec', { a: S.a, b: S.b, col: C.rel });
    K.step(`<b>Шаг 6. Центр масс S<sub>2</sub>.</b> S<sub>2</sub> делит AB пополам, значит s<sub>2</sub> — середина ab. ps<sub>2</sub> ≈ ${Lp(S.s2)} мм → ${Vs('S2')} = <b>${fs(len(S.s2))} м/с</b>.`);
    P('dot', { p: S.s2, r: 3 }); P('lbl', { p: S.s2, t: 's_{2}', ang: bestAng(S.s2, [o, S.a, S.b]), size: 13 }); P('vec', { a: o, b: S.s2, col: C.found, w: 2 });
    K.step(`<b>Шаг 7. ω<sub>2</sub> и её направление.</b> ω<sub>2</sub> = ${Vs('BA')} / ${Lh('AB')} = ${fs(len(ba))} / ${fnum(p.l * S.k)} = <b>${fs(Math.abs(S.w2))} рад/с</b>. Направление: переносим вектор ab в точку B механизма и мысленно закрепляем A — шатун поворачивается <b>${dirW(S.w2)}</b>.`);
    M('vec', { a: S.B, b: add(S.B, mul(ba, kv)), col: C.rel }); M('omega', omegaSpec(S.A, [S.O, S.B], S.w2, 'ω_{2}', C.rel, false, 22));
    return K;
  },
  ans(S) { return [{ id: 'vb', h: Vs('B'), v: len(S.b), u: 'м/с' }, { id: 'vs2', h: Vs('S2'), v: len(S.s2), u: 'м/с' }, { id: 'w2', h: 'ω<sub>2</sub>', v: Math.abs(S.w2), u: 'рад/с', dir: S.w2 < 0 ? 0 : 1 }]; },
  rows(S) { const mv = S.mv; return [['V<sub>A</sub>', 'pa', S.a], ['V<sub>B</sub>', 'pb', S.b], ['V<sub>BA</sub>', 'ab', sub(S.b, S.a)], ['V<sub>S2</sub>', 'ps<sub>2</sub>', S.s2]].map(r => [r[0], r[1], len(r[2]) / mv, len(r[2])]).concat([['ω<sub>2</sub>', '', null, Math.abs(S.w2), dirW(S.w2)]]); },
  given(p) { const e = p.e || 0; return `OA = ${fnum(p.r)} ${p.u}, AB = ${fnum(p.l)} ${p.u}, ${e ? 'направляющая смещена на e = ' + fnum(Math.abs(e)) + ' ' + p.u + ' ' + (e > 0 ? 'выше' : 'ниже') + ' O' : 'направляющая проходит через O (e = 0)'}; φ = ${fa(p.phi)} (от горизонтали вправо, против часовой); ω<sub>1</sub> = ${fnum(Math.abs(p.w1))} рад/с ${dirW(p.w1)}. S<sub>2</sub> — середина AB.`; },
  find: 'V<sub>B</sub>, V<sub>S2</sub>, ω<sub>2</sub> и её направление',
  struct: 'Звенья: 0 — стойка, 1 — кривошип OA, 2 — шатун AB, 3 — ползун B. n<sub>Σ</sub> = 4; p<sub>1</sub> = 4 (шарниры O, A, B и поступательная пара «ползун — стойка»), p<sub>2</sub> = 0. W = 3·(4 − 1) − 2·4 = 1. Формула строения: I(0,1) ← II(2,3) — одна группа ВВП (шатун + ползун).',
  hint(S) { return `1) ${Vs('A')} = ω<sub>1</sub>·${Lh('OA')}, вектор ⊥ OA по ω<sub>1</sub>. 2) ${Vh('B')} = ${Vh('A')} + ${Vh('BA')}: через a — прямая ⊥ AB, через p — прямая ∥ направляющей. 3) ω<sub>2</sub> = ab·μ<sub>V</sub> / ${Lh('AB')}, направление — переносом ab в точку B.`; },
  gen(Rn) {
    for (let t = 0; t < 300; t++) {
      const r = Rn.ri(40, 120, 10), l = Math.round(r * Rn.rf(2.8, 4.5) / 10) * 10, e = Rn.pick([0, 0, 10, -10, 20, -20, 30]);
      if (Math.abs(e) > r * 0.5) continue;
      const p = { u: 'мм', r: r, l: l, e: e, phi: Rn.pick(NICE_PHI), w1: Rn.ri(5, 20, 1) * Rn.pick([1, -1]) };
      const S = KS.solve(p); if (!S || len(S.b) < 0.15 * S.vA) continue;
      if (!readable([S.O, S.A, S.B], [[0, 1], [1, 2]], { pt: 0.12 })) continue; return p;
    }
    return null;
  }
};

/* =========================================================
   Тип 2. Шарнирный четырёхзвенник
   ========================================================= */
const RRR = {
  key: 'rrr', title: 'Шарнирный четырёхзвенник',
  solve(p) {
    const k = UNIT[p.u], O1 = [0, 0], O3 = p.O3, A = mul(dirv(p.phi), p.r1);
    const X = cc(A, p.l2, O3, p.l3); if (!X) return null; const B = (p.br || 1) > 0 ? X[0] : X[1];
    const a = mul(rot(A), p.w1 * k), b = ll(a, rot(sub(B, A)), [0, 0], rot(sub(B, O3))); if (!b) return null;
    const S = { type: 'rrr', p: p, k: k, O1: O1, O3: O3, A: A, B: B, a: a, b: b };
    S.w2 = omegaOf(A, B, a, b, k); S.w3 = omegaOf(O3, B, [0, 0], b, k); S.S2 = mid(A, B); S.s2 = mid(a, b);
    if (p.M) { const Y = cc(A, p.M.AM, B, p.M.BM); if (!Y) return null; S.M = Y[0]; S.m = ll(a, rot(sub(S.M, A)), b, rot(sub(S.M, B))); if (!S.m) return null; }
    S.vA = len(a); const pts = [O1, O3, A, B, add(O1, [-p.r1, -p.r1]), add(O1, [p.r1, p.r1])]; if (S.M) pts.push(S.M);
    S.span = spanOf(pts) * k; S.ml = pickML(pts, k);
    const pv = [[0, 0], a, b]; if (S.m) pv.push(S.m); S.mv = pickMV(S.vA, spanOf(pv)); S.q = qsin(sub(B, A), sub(B, O3));
    return S;
  },
  draw(K, n, S, o) {
    o = o || {}; const m = (k, pr) => K.add(n, Object.assign({ k: k, s: o.s }, pr)), p = S.p;
    m('ray', { a: S.O1, d: [1, 0], l: 44 });
    if (S.M) { m('tri', { p: [S.A, S.B, S.M], col: C.l2 }); m('link', { a: S.A, b: S.M, col: C.l2, w: 2.6 }); m('link', { a: S.B, b: S.M, col: C.l2, w: 2.6 }); }
    m('link', { a: S.O1, b: S.A, col: C.l1 }); m('link', { a: S.A, b: S.B, col: C.l2 }); m('link', { a: S.O3, b: S.B, col: C.l4 });
    m('ground', { p: S.O1 }); m('ground', { p: S.O3 });
    [S.O1, S.O3, S.A, S.B].forEach(q => m('joint', { p: q }));
    m('lbl', { p: S.O1, t: 'O_{1}', ang: pivAng(S.O1, [S.A], [0, 250, 290, p.phi / 2 - 22, p.phi / 2, p.phi / 2 + 22], [S.A, add(S.O1, [1, 0]), add(S.O1, dirv(p.phi / 2))]), dist: PIVD });
    m('lbl', { p: S.O3, t: 'O_{3}', ang: bestAng(S.O3, [S.B], [250, 290]) });
    m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O1, S.B, S.M]) });
    m('lbl', { p: S.B, t: 'B', ang: bestAng(S.B, [S.A, S.O3, S.M]) });
    if (S.M) { m('joint', { p: S.M, r: 3.8 }); m('lbl', { p: S.M, t: 'M', ang: bestAng(S.M, [S.A, S.B]) }); }
    if (o.w1 !== false) m('omega', omegaSpec(S.O1, [S.A, add(S.O1, [1, 0]), add(S.O1, dirv(p.phi / 2))], p.w1, 'ω_{1}', C.known, true));
    if (o.phi !== false) m('ang', { c: S.O1, a0: 0, a1: p.phi, r: 18, t: 'φ', col: C.muted, td: 10 });
    if (o.cm && !S.M) { m('dot', { p: S.S2, r: 3 }); m('lbl', { p: S.S2, t: 'S_{2}', ang: bestAng(S.S2, [S.A, S.B]), size: 12 }); }
  },
  pos(S) {
    const K = new Kon(), p = S.p, k = S.k, ml = S.ml, L = x => f1(Math.abs(x) * k / ml), m = K.fn('mech'); K.scene('mech', { maxH: 380 });
    const x3 = p.O3[0], y3 = p.O3[1];
    K.step(`<b>Шаг 1. Масштаб.</b> Размах схемы ≈ ${fs(S.span, 2)} м → μ<sub>l</sub> = ${fmu(ml)} м/мм (${scaleWords(ml)}). На листе: O<sub>1</sub>A = ${L(p.r1)} мм, AB = ${L(p.l2)} мм, O<sub>3</sub>B = ${L(p.l3)} мм. Ставим O<sub>1</sub>, проводим горизонталь.`);
    m('cl', { a: [-p.r1 * 1.2, 0], b: [Math.max(x3, S.B[0]) + p.r1 * 0.6, 0], e1: 0, e2: 0 }); m('ground', { p: S.O1 }); m('joint', { p: S.O1 }); m('lbl', { p: S.O1, t: 'O_{1}', ang: pivAng(S.O1, [S.A], [0, 180, 250, 290, p.phi / 2 - 22, p.phi / 2, p.phi / 2 + 22], [S.A, add(S.O1, [1, 0]), add(S.O1, dirv(p.phi / 2))]), dist: PIVD });
    K.step(`<b>Шаг 2. Второй неподвижный шарнир O<sub>3</sub>.</b> От O<sub>1</sub> по горизонтали ${x3 >= 0 ? 'вправо' : 'влево'} ${L(x3)} мм${y3 ? ', затем по вертикали ' + (y3 > 0 ? 'вверх' : 'вниз') + ' ' + L(y3) + ' мм' : ''}.`);
    if (y3) { m('seg', { a: S.O1, b: [x3, 0], dash: '4 3' }); m('seg', { a: [x3, 0], b: S.O3, dash: '4 3' }); }
    m('ground', { p: S.O3 }); m('joint', { p: S.O3 }); m('lbl', { p: S.O3, t: 'O_{3}', ang: bestAng(S.O3, [S.B], [250, 290]) });
    const ap = angPlan(p.phi);
    K.step(`<b>Шаг 3. Угол φ = ${fa(p.phi)}.</b> Транспортир центром в O<sub>1</sub>, ${ap.txt}. Проводим луч.`);
    m('protr', { c: S.O1, mark: ap.mark, lower: ap.lower, mt: ap.mt, only: true }); m('cl', { a: S.O1, b: S.A, e1: 0, e2: 34 }); m('ang', { c: S.O1, a0: 0, a1: p.phi, r: 18, t: 'φ', col: C.muted, td: 10 });
    K.step(`<b>Шаг 4. Кривошип.</b> Раствор циркуля ${L(p.r1)} мм, иглу в O<sub>1</sub> — засечка на луче. Это точка A.`);
    m('arc', { c: S.O1, r: p.r1, a0: p.phi - 14, a1: p.phi + 14 }); m('link', { a: S.O1, b: S.A, col: C.l1 }); m('joint', { p: S.A }); m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O1, S.B, S.M]) });
    m('omega', omegaSpec(S.O1, [S.A, add(S.O1, [1, 0]), add(S.O1, dirv(p.phi / 2))], p.w1, 'ω_{1}', C.known, true));
    const aAB = angd(sub(S.B, S.A)), aO3B = angd(sub(S.B, S.O3));
    K.step(`<b>Шаг 5. Точка B — засечками.</b> Раствор ${L(p.l2)} мм (AB) — дуга из A. Раствор ${L(p.l3)} мм (O<sub>3</sub>B) — дуга из O<sub>3</sub>. Дуги пересекаются в двух точках; берём ту, что ${(p.br || 1) > 0 ? 'слева от направления A → O<sub>3</sub>' : 'справа от направления A → O<sub>3</sub>'} — как на схеме в задании.`);
    m('arc', { c: S.A, r: p.l2, a0: aAB - 12, a1: aAB + 12 }); m('arc', { c: S.O3, r: p.l3, a0: aO3B - 14, a1: aO3B + 14 }); m('dot', { p: S.B, col: C.found });
    K.step(`<b>Шаг 6. Обводим звенья.</b> Шатун AB и коромысло O<sub>3</sub>B. ${S.M ? 'Точку M шатуна находим ещё одной парой засечек: ' + L(p.M.AM) + ' мм из A и ' + L(p.M.BM) + ' мм из B.' : 'S<sub>2</sub> — середина AB.'}`);
    m('link', { a: S.A, b: S.B, col: C.l2 }); m('link', { a: S.O3, b: S.B, col: C.l4 }); m('joint', { p: S.B }); m('lbl', { p: S.B, t: 'B', ang: bestAng(S.B, [S.A, S.O3, S.M]) });
    if (S.M) { const a1 = angd(sub(S.M, S.A)), a2 = angd(sub(S.M, S.B)); m('arc', { c: S.A, r: p.M.AM, a0: a1 - 10, a1: a1 + 10 }); m('arc', { c: S.B, r: p.M.BM, a0: a2 - 10, a1: a2 + 10 }); m('tri', { p: [S.A, S.B, S.M], col: C.l2 }); m('link', { a: S.A, b: S.M, col: C.l2, w: 2.6 }); m('link', { a: S.B, b: S.M, col: C.l2, w: 2.6 }); m('joint', { p: S.M, r: 3.8 }); m('lbl', { p: S.M, t: 'M', ang: bestAng(S.M, [S.A, S.B]) }); }
    else { m('dot', { p: S.S2, r: 3 }); m('lbl', { p: S.S2, t: 'S_{2}', ang: bestAng(S.S2, [S.A, S.B]), size: 12 }); }
    return K;
  },
  plan(S) {
    const K = new Kon(), p = S.p, mv = S.mv, Lp = v => f1(len(v) / mv), o = [0, 0];
    K.scene('mech', { maxH: 250, title: 'Механизм' }); K.scene('plan', { maxH: 400, title: 'План скоростей' });
    RRR.draw(K, 'mech', S, { s: -1, cm: true });
    const P = K.fn('plan'), M = K.fn('mech'), vs = [S.a, S.b]; if (S.m) vs.push(S.m);
    const kv = vecScale([S.O1, S.O3, S.A, S.B], vs), ba = sub(S.b, S.a);
    K.step(`<b>Шаг 1. Скорость точки A.</b> ${Vs('A')} = ω<sub>1</sub>·${Lh('O₁A')} = ${fnum(Math.abs(p.w1))}·${fnum(p.r1 * S.k)} = <b>${fs(S.vA)} м/с</b>. Отрезок pa = ${Lp(S.a)} мм → μ<sub>V</sub> = ${fmu(mv)} (м/с)/мм. Ставим полюс p.`);
    P('dot', { p: o }); P('lbl', { p: o, t: 'p', ang: bestAng(o, vs) });
    K.step(vaCap(S, 'O₁A', S.O1, S.A, p.w1, S.a, mv, null, Lp));
    P('protr', { c: o, mark: lineAng(S.a), only: true }); P('vec', { a: o, b: S.a, col: C.known }); P('lbl', { p: S.a, t: 'a', ang: bestAng(S.a, [o, S.b, S.m]) });
    M('hl', { a: S.O1, b: S.A, col: C.l1, only: true }); M('vec', { a: S.A, b: add(S.A, mul(S.a, kv)), col: C.known, only: true });
    const c1 = perpCap('AB', S.A, S.B, 'a');
    K.step(`<b>Шаг 3. Первое уравнение для B.</b> ${Vh('B')} = ${Vh('A')} + ${Vh('BA')}, ${Vh('BA')} ⊥ AB. ${c1.html}`);
    P('protr', { c: S.a, mark: c1.tp, only: true }); P('cl', { a: S.a, b: S.b, e1: 36, e2: 36 }); M('hl', { a: S.A, b: S.B, col: C.l2, only: true });
    const c2 = perpCap('O₃B', S.O3, S.B, 'p');
    K.step(`<b>Шаг 4. Второе уравнение для B.</b> Та же точка B принадлежит коромыслу, которое вращается вокруг неподвижного O<sub>3</sub>: ${Vh('B')} = ${Vh('O₃')} + ${Vh('BO₃')}, причём ${Vs('O₃')} = 0. Значит ${Vh('B')} выходит из полюса и ⊥ O<sub>3</sub>B. ${c2.html}`);
    P('protr', { c: o, mark: c2.tp, only: true }); P('cl', { a: o, b: S.b, e1: 36, e2: 36 }); M('hl', { a: S.O3, b: S.B, col: C.l4, only: true });
    K.step(`<b>Шаг 5. Точка b</b> — пересечение. pb ≈ ${Lp(S.b)} мм → ${Vs('B')} = <b>${fs(len(S.b))} м/с</b>; ab ≈ ${Lp(ba)} мм → ${Vs('BA')} = <b>${fs(len(ba))} м/с</b>.`);
    P('dot', { p: S.b }); P('lbl', { p: S.b, t: 'b', ang: bestAng(S.b, [o, S.a, S.m]) }); P('vec', { a: o, b: S.b, col: C.found }); P('vec', { a: S.a, b: S.b, col: C.rel });
    if (S.M) {
      const c3 = perpCap('AM', S.A, S.M, 'a'), c4 = perpCap('BM', S.B, S.M, 'b');
      K.step(`<b>Шаг 6. Точка m.</b> M лежит на том же шатуне: ${Vh('M')} = ${Vh('A')} + ${Vh('MA')} = ${Vh('B')} + ${Vh('MB')}. Через a — прямая ⊥ AM (${fa(c3.tp)}), через b — прямая ⊥ BM (${fa(c4.tp)}). Пересечение — m. Проверка: треугольник abm подобен ABM. pm ≈ ${Lp(S.m)} мм → ${Vs('M')} = <b>${fs(len(S.m))} м/с</b>.`);
      P('cl', { a: S.a, b: S.m, e1: 26, e2: 26 }); P('cl', { a: S.b, b: S.m, e1: 26, e2: 26 }); P('poly', { p: [S.a, S.b, S.m], col: C.l2 }); P('dot', { p: S.m }); P('lbl', { p: S.m, t: 'm', ang: bestAng(S.m, [o, S.a, S.b]) }); P('vec', { a: o, b: S.m, col: C.found });
      M('hl', { a: S.A, b: S.M, col: C.l2, only: true }); M('hl', { a: S.B, b: S.M, col: C.l2, only: true });
    } else {
      K.step(`<b>Шаг 6. Центр масс шатуна.</b> s<sub>2</sub> — середина ab. ps<sub>2</sub> ≈ ${Lp(S.s2)} мм → ${Vs('S2')} = <b>${fs(len(S.s2))} м/с</b>.`);
      P('dot', { p: S.s2, r: 3 }); P('lbl', { p: S.s2, t: 's_{2}', ang: bestAng(S.s2, [o, S.a, S.b]), size: 13 }); P('vec', { a: o, b: S.s2, col: C.found, w: 2 });
    }
    K.step(`<b>Шаг 7. Угловые скорости.</b> ω<sub>2</sub> = ${Vs('BA')} / ${Lh('AB')} = ${fs(len(ba))} / ${fnum(p.l2 * S.k)} = <b>${fs(Math.abs(S.w2))} рад/с, ${dirW(S.w2)}</b> (ab перенесли в B, A закрепили). ω<sub>3</sub> = ${Vs('B')} / ${Lh('O₃B')} = ${fs(len(S.b))} / ${fnum(p.l3 * S.k)} = <b>${fs(Math.abs(S.w3))} рад/с, ${dirW(S.w3)}</b> (pb перенесли в B, вращение вокруг O<sub>3</sub>).`);
    M('vec', { a: S.B, b: add(S.B, mul(ba, kv)), col: C.rel }); M('vec', { a: S.B, b: add(S.B, mul(S.b, kv)), col: C.found });
    M('omega', omegaSpec(S.A, [S.O1, S.B, S.M], S.w2, 'ω_{2}', C.rel, false, 22)); M('omega', omegaSpec(S.O3, [S.B], S.w3, 'ω_{3}', C.found, true, 24));
    return K;
  },
  ans(S) {
    const r = [{ id: 'vb', h: Vs('B'), v: len(S.b), u: 'м/с' }, { id: 'w2', h: 'ω<sub>2</sub>', v: Math.abs(S.w2), u: 'рад/с', dir: S.w2 < 0 ? 0 : 1 }, { id: 'w3', h: 'ω<sub>3</sub>', v: Math.abs(S.w3), u: 'рад/с', dir: S.w3 < 0 ? 0 : 1 }];
    r.push(S.M ? { id: 'vm', h: Vs('M'), v: len(S.m), u: 'м/с' } : { id: 'vs2', h: Vs('S2'), v: len(S.s2), u: 'м/с' }); return r;
  },
  rows(S) { const mv = S.mv, r = [['V<sub>A</sub>', 'pa', S.a], ['V<sub>B</sub>', 'pb', S.b], ['V<sub>BA</sub>', 'ab', sub(S.b, S.a)]]; r.push(S.M ? ['V<sub>M</sub>', 'pm', S.m] : ['V<sub>S2</sub>', 'ps<sub>2</sub>', S.s2]); return r.map(x => [x[0], x[1], len(x[2]) / mv, len(x[2])]).concat([['ω<sub>2</sub>', '', null, Math.abs(S.w2), dirW(S.w2)], ['ω<sub>3</sub>', '', null, Math.abs(S.w3), dirW(S.w3)]]); },
  given(p) { const x = p.O3[0], y = p.O3[1]; return `O<sub>1</sub>A = ${fnum(p.r1)} ${p.u}, AB = ${fnum(p.l2)} ${p.u}, O<sub>3</sub>B = ${fnum(p.l3)} ${p.u}; O<sub>3</sub> ${x >= 0 ? 'правее' : 'левее'} O<sub>1</sub> на ${fnum(Math.abs(x))} ${p.u}${y ? ' и ' + (y > 0 ? 'выше' : 'ниже') + ' на ' + fnum(Math.abs(y)) + ' ' + p.u : ''}; φ = ${fa(p.phi)} (от горизонтали вправо, против часовой); ω<sub>1</sub> = ${fnum(Math.abs(p.w1))} рад/с ${dirW(p.w1)}.${p.M ? ' Точка M шатуна: AM = ' + fnum(p.M.AM) + ' ' + p.u + ', BM = ' + fnum(p.M.BM) + ' ' + p.u + '.' : ' S<sub>2</sub> — середина AB.'}`; },
  find: 'V<sub>B</sub>, ω<sub>2</sub>, ω<sub>3</sub> с направлениями и скорость точки шатуна',
  struct: 'Звенья: 0 — стойка, 1 — кривошип O<sub>1</sub>A, 2 — шатун AB, 3 — коромысло O<sub>3</sub>B. n<sub>Σ</sub> = 4, p<sub>1</sub> = 4 (шарниры O<sub>1</sub>, A, B, O<sub>3</sub>). W = 3·3 − 2·4 = 1. Формула строения: I(0,1) ← II(2,3) — группа ВВВ.',
  hint(S) { return `1) ${Vs('A')} = ω<sub>1</sub>·${Lh('O₁A')} ⊥ O<sub>1</sub>A. 2) B — общая точка шатуна и коромысла: через a — прямая ⊥ AB, через p — прямая ⊥ O<sub>3</sub>B. 3) ω<sub>2</sub> = ab·μ<sub>V</sub>/${Lh('AB')}, ω<sub>3</sub> = pb·μ<sub>V</sub>/${Lh('O₃B')}.${S.M ? ' 4) Для M: через a ⊥ AM, через b ⊥ BM.' : ''}`; },
  gen(Rn) {
    for (let t = 0; t < 400; t++) {
      const d = Rn.ri(140, 240, 10), y = Rn.pick([0, 0, 20, -20, 40, -40]), r1 = Rn.ri(40, 70, 5), l2 = Rn.ri(Math.max(2 * r1, 100), 220, 10), l3 = Rn.ri(90, 200, 10), D = Math.hypot(d, y);
      const arr = [r1, l2, l3, D].sort((x, z) => x - z); if (arr[0] !== r1 || arr[0] + arr[3] > arr[1] + arr[2] - 10) continue;
      const p = { u: 'мм', r1: r1, l2: l2, l3: l3, O3: [d, y], phi: Rn.pick(NICE_PHI), w1: Rn.ri(5, 15, 1) * Rn.pick([1, -1]), br: 1 };
      if (Rn.rf(0, 1) < 0.35) { p.M = { AM: Math.round(l2 * Rn.rf(0.45, 0.7) / 10) * 10, BM: Math.round(l2 * Rn.rf(0.5, 0.75) / 10) * 10 }; }
      const S = RRR.solve(p); if (!S || S.q < 0.4 || len(S.b) < 0.15 * S.vA) continue;
      const pts = [S.O1, S.O3, S.A, S.B], sg = [[0, 2], [2, 3], [1, 3]]; if (S.M) { pts.push(S.M); sg.push([2, 4], [3, 4]); }
      if (!readable(pts, sg)) continue; return p;
    }
    return null;
  }
};

/* =========================================================
   Тип 3. Кулисный механизм (камень на качающейся кулисе)
   ========================================================= */
const KUL = {
  key: 'kul', title: 'Кулисный механизм',
  solve(p) {
    const k = UNIT[p.u], O1 = [0, 0], O3 = p.O3, A = mul(dirv(p.phi), p.r), u = unit(sub(A, O3));
    const a1 = mul(rot(A), p.w1 * k), a3 = ll(a1, u, [0, 0], rot(u)); if (!a3) return null;
    const S = { type: 'kul', p: p, k: k, O1: O1, O3: O3, A: A, u: u, a: a1, a3: a3 };
    S.lA = len(sub(A, O3)); S.w3 = omegaOf(O3, A, [0, 0], a3, k); S.slip = sub(a3, a1); S.vA = len(a1);
    S.lK = len(O3) + p.r * 1.2; const pk = [O1, O3, add(O1, [-p.r, -p.r]), add(O1, [p.r, p.r]), add(O3, mul(u, S.lK))]; S.span = spanOf(pk) * k; S.ml = pickML(pk, k);
    S.mv = pickMV(S.vA, spanOf([[0, 0], a1, a3])); return S;
  },
  draw(K, n, S, o) {
    o = o || {}; const m = (k, pr) => K.add(n, Object.assign({ k: k, s: o.s }, pr)), p = S.p, E = add(S.O3, mul(S.u, S.lK));
    m('ray', { a: S.O1, d: [1, 0], l: 44 });
    m('link', { a: S.O3, b: E, col: C.l2 }); m('link', { a: S.O1, b: S.A, col: C.l1 }); m('slider', { p: S.A, d: S.u, col: C.l3 });
    m('ground', { p: S.O1 }); m('ground', { p: S.O3 }); [S.O1, S.O3, S.A].forEach(q => m('joint', { p: q }));
    m('lbl', { p: S.O1, t: 'O_{1}', ang: pivAng(S.O1, [S.A], [0, 250, 290, p.phi / 2 - 22, p.phi / 2, p.phi / 2 + 22], [S.A, add(S.O1, [1, 0]), add(S.O1, dirv(p.phi / 2))]), dist: PIVD }); m('lbl', { p: S.O3, t: 'O_{3}', ang: bestAng(S.O3, [E], [250, 290]) });
    m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O1, E, S.O3]), dist: 21 });
    if (o.w1 !== false) m('omega', omegaSpec(S.O1, [S.A, add(S.O1, [1, 0]), add(S.O1, dirv(p.phi / 2))], p.w1, 'ω_{1}', C.known, true));
    if (o.phi !== false) m('ang', { c: S.O1, a0: 0, a1: p.phi, r: 18, t: 'φ', col: C.muted, td: 10 });
  },
  pos(S) {
    const K = new Kon(), p = S.p, k = S.k, ml = S.ml, L = x => f1(Math.abs(x) * k / ml), m = K.fn('mech'); K.scene('mech', { maxH: 400 });
    const E = add(S.O3, mul(S.u, S.lK)), d3 = len(p.O3);
    K.step(`<b>Шаг 1. Масштаб.</b> Размах ≈ ${fs(S.span, 2)} м → μ<sub>l</sub> = ${fmu(ml)} м/мм. На листе: O<sub>1</sub>A = ${L(p.r)} мм, O<sub>1</sub>O<sub>3</sub> = ${L(d3)} мм. Ставим O<sub>1</sub> и горизонталь через неё.`);
    m('cl', { a: [-p.r * 1.3, 0], b: [p.r * 1.3, 0], e1: 0, e2: 0 }); m('ground', { p: S.O1 }); m('joint', { p: S.O1 }); m('lbl', { p: S.O1, t: 'O_{1}', ang: pivAng(S.O1, [S.A], [0, 180, 250, 290, p.phi / 2 - 22, p.phi / 2, p.phi / 2 + 22], [S.A, add(S.O1, [1, 0]), add(S.O1, dirv(p.phi / 2))]), dist: PIVD });
    K.step(`<b>Шаг 2. Опора кулисы O<sub>3</sub>.</b> ${p.O3[0] === 0 ? 'По вертикали ' + (p.O3[1] < 0 ? 'вниз' : 'вверх') + ' от O<sub>1</sub> на ' + L(d3) + ' мм (вертикаль — транспортиром на 90°).' : 'Откладываем от O<sub>1</sub> по горизонтали ' + L(p.O3[0]) + ' мм и по вертикали ' + L(p.O3[1]) + ' мм.'}`);
    m('seg', { a: S.O1, b: S.O3, dash: '4 3' }); m('ground', { p: S.O3 }); m('joint', { p: S.O3 }); m('lbl', { p: S.O3, t: 'O_{3}', ang: bestAng(S.O3, [E, S.O1], [250, 290]) });
    const ap = angPlan(p.phi);
    K.step(`<b>Шаг 3. Угол φ = ${fa(p.phi)}.</b> Транспортир в O<sub>1</sub>, ${ap.txt}. Луч.`);
    m('protr', { c: S.O1, mark: ap.mark, lower: ap.lower, mt: ap.mt, only: true }); m('cl', { a: S.O1, b: S.A, e1: 0, e2: 34 }); m('ang', { c: S.O1, a0: 0, a1: p.phi, r: 18, t: 'φ', col: C.muted, td: 10 });
    K.step(`<b>Шаг 4. Кривошип.</b> Раствор ${L(p.r)} мм, засечка из O<sub>1</sub> на луче → A. В точке A шарнир кривошипа и камня 2.`);
    m('arc', { c: S.O1, r: p.r, a0: p.phi - 14, a1: p.phi + 14 }); m('link', { a: S.O1, b: S.A, col: C.l1 }); m('joint', { p: S.A }); m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O1, E, S.O3]), dist: 21 });
    m('omega', omegaSpec(S.O1, [S.A, add(S.O1, [1, 0]), add(S.O1, dirv(p.phi / 2))], p.w1, 'ω_{1}', C.known, true));
    K.step(`<b>Шаг 5. Кулиса.</b> Линейкой через O<sub>3</sub> и A проводим прямую — это кулиса 3, камень сидит на ней в точке A. Меряем O<sub>3</sub>A ≈ ${L(S.lA)} мм → ${Lh('O₃A')} = ${L(S.lA)}·${fmu(ml)} = <b>${fs(S.lA * k)} м</b>. Эта длина меняется с положением, её всегда берут с чертежа.`);
    m('link', { a: S.O3, b: E, col: C.l2 }); m('slider', { p: S.A, d: S.u, col: C.l3 }); m('joint', { p: S.A }); m('dim', { a: S.O3, b: S.A, off: 16, t: Lh('O₃A').replace(/<[^>]+>/g, '') });
    return K;
  },
  plan(S) {
    const K = new Kon(), p = S.p, mv = S.mv, Lp = v => f1(len(v) / mv), o = [0, 0];
    K.scene('mech', { maxH: 260, title: 'Механизм' }); K.scene('plan', { maxH: 400, title: 'План скоростей' });
    KUL.draw(K, 'mech', S, { s: -1 });
    const P = K.fn('plan'), M = K.fn('mech'), kv = vecScale([S.O1, S.O3, S.A], [S.a, S.a3]);
    K.step(`<b>Шаг 1. Скорость A<sub>1</sub>.</b> Точка A кривошипа: ${Vs('A1')} = ω<sub>1</sub>·${Lh('O₁A')} = ${fnum(Math.abs(p.w1))}·${fnum(p.r * S.k)} = <b>${fs(S.vA)} м/с</b>. Камень на шарнире, поэтому ${Vs('A2')} = ${Vs('A1')}. pa<sub>1</sub> = ${Lp(S.a)} мм → μ<sub>V</sub> = ${fmu(mv)} (м/с)/мм.`);
    P('dot', { p: o }); P('lbl', { p: o, t: 'p', ang: bestAng(o, [S.a, S.a3]) });
    K.step(vaCap(S, 'O₁A', S.O1, S.A, p.w1, S.a, mv, null, Lp).replace('Шаг 2. Вектор pa', 'Шаг 2. Вектор pa<sub>1</sub>'));
    P('protr', { c: o, mark: lineAng(S.a), only: true }); P('vec', { a: o, b: S.a, col: C.known }); P('lbl', { p: S.a, t: 'a_{1}=a_{2}', ang: bestAng(S.a, [o, S.a3]) });
    M('hl', { a: S.O1, b: S.A, col: C.l1, only: true }); M('vec', { a: S.A, b: add(S.A, mul(S.a, kv)), col: C.known, only: true });
    const th = lineAng(S.u);
    K.step(`<b>Шаг 3. Уравнение для точки кулисы A<sub>3</sub>.</b> ${Vh('A3')} = ${Vh('A2')} + ${Vh('A3A2')}. Относительно камня кулиса может только скользить вдоль себя, поэтому ${Vh('A3A2')} ∥ O<sub>3</sub>A. Кулиса стоит под ${fa(th)} → через a<sub>1</sub> проводим прямую под ${fa(th)} (тот же угол — это параллель).`);
    P('protr', { c: S.a, mark: th, only: true }); P('cl', { a: S.a, b: S.a3, e1: 36, e2: 36 }); M('hl', { a: S.O3, b: add(S.O3, mul(S.u, S.lK)), col: C.l2, only: true });
    const c2 = perpCap('Кулиса O₃A', S.O3, S.A, 'p');
    K.step(`<b>Шаг 4.</b> Кулиса вращается вокруг неподвижного O<sub>3</sub>, поэтому ${Vh('A3')} ⊥ O<sub>3</sub>A и выходит из полюса. ${c2.html}`);
    P('protr', { c: o, mark: c2.tp, only: true }); P('cl', { a: o, b: S.a3, e1: 36, e2: 36 });
    K.step(`<b>Шаг 5. Точка a<sub>3</sub></b> — пересечение. pa<sub>3</sub> ≈ ${Lp(S.a3)} мм → ${Vs('A3')} = <b>${fs(len(S.a3))} м/с</b>; a<sub>1</sub>a<sub>3</sub> ≈ ${Lp(S.slip)} мм → скорость скольжения ${Vs('A3A2')} = <b>${fs(len(S.slip))} м/с</b>. Треугольник p a<sub>1</sub> a<sub>3</sub> прямоугольный: прямой угол при a<sub>3</sub>.`);
    P('dot', { p: S.a3 }); P('lbl', { p: S.a3, t: 'a_{3}', ang: bestAng(S.a3, [o, S.a]) }); P('vec', { a: o, b: S.a3, col: C.found }); P('vec', { a: S.a, b: S.a3, col: C.rel });
    if (len(S.a3) > 1e-9 && len(S.slip) > 1e-9) P('ra', { p: S.a3, d1: mul(S.a3, -1), d2: mul(S.slip, -1), col: C.found });
    K.step(`<b>Шаг 6. ω<sub>3</sub>.</b> ω<sub>3</sub> = ${Vs('A3')} / ${Lh('O₃A')} = ${fs(len(S.a3))} / ${fs(S.lA * S.k)} = <b>${fs(Math.abs(S.w3))} рад/с</b>. Переносим pa<sub>3</sub> в точку A механизма: кулиса поворачивается вокруг O<sub>3</sub> <b>${dirW(S.w3)}</b>.`);
    M('vec', { a: S.A, b: add(S.A, mul(S.a3, kv)), col: C.found }); M('omega', omegaSpec(S.O3, [add(S.O3, mul(S.u, S.lK)), S.O1], S.w3, 'ω_{3}', C.found, true, 26));
    return K;
  },
  ans(S) { return [{ id: 'va3', h: Vs('A3'), v: len(S.a3), u: 'м/с' }, { id: 'vsl', h: Vs('A3A2'), v: len(S.slip), u: 'м/с' }, { id: 'w3', h: 'ω<sub>3</sub>', v: Math.abs(S.w3), u: 'рад/с', dir: S.w3 < 0 ? 0 : 1 }]; },
  rows(S) { const mv = S.mv; return [['V<sub>A1</sub> = V<sub>A2</sub>', 'pa<sub>1</sub>', S.a], ['V<sub>A3</sub>', 'pa<sub>3</sub>', S.a3], ['V<sub>A3A2</sub>', 'a<sub>1</sub>a<sub>3</sub>', S.slip]].map(x => [x[0], x[1], len(x[2]) / mv, len(x[2])]).concat([['ω<sub>3</sub>', '', null, Math.abs(S.w3), dirW(S.w3)]]); },
  given(p) { const d = len(p.O3); return `O<sub>1</sub>A = ${fnum(p.r)} ${p.u}; опора кулисы O<sub>3</sub> ${p.O3[0] === 0 ? (p.O3[1] < 0 ? 'ниже' : 'выше') + ' O<sub>1</sub> на ' + fnum(d) + ' ' + p.u : 'в точке (' + fnum(p.O3[0]) + '; ' + fnum(p.O3[1]) + ') ' + p.u}; φ = ${fa(p.phi)} (от горизонтали вправо, против часовой); ω<sub>1</sub> = ${fnum(Math.abs(p.w1))} рад/с ${dirW(p.w1)}.`; },
  find: 'V<sub>A3</sub> (точка кулисы под камнем), скорость скольжения V<sub>A3A2</sub>, ω<sub>3</sub> и её направление',
  struct: 'Звенья: 0 — стойка, 1 — кривошип O<sub>1</sub>A, 2 — камень, 3 — кулиса. n<sub>Σ</sub> = 4; p<sub>1</sub> = 4 (вращательные O<sub>1</sub>, A, O<sub>3</sub> и поступательная «камень — кулиса»). W = 3·3 − 2·4 = 1. Формула строения: I(0,1) ← II(2,3) — группа ВПВ. В точке A совпадают три точки: A<sub>1</sub> (кривошип), A<sub>2</sub> (камень) и A<sub>3</sub> (кулиса). Подробно про них — в <a href="../113/">разборе задачи 113</a>.',
  hint(S) { return `1) ${Vs('A1')} = ${Vs('A2')} = ω<sub>1</sub>·${Lh('O₁A')} ⊥ O<sub>1</sub>A. 2) ${Vh('A3')} = ${Vh('A2')} + ${Vh('A3A2')}: через a<sub>1</sub> — прямая ∥ кулисе, через p — прямая ⊥ кулисе. 3) ω<sub>3</sub> = pa<sub>3</sub>·μ<sub>V</sub> / ${Lh('O₃A')}, а O<sub>3</sub>A меряй на своём чертеже.`; },
  gen(Rn) {
    for (let t = 0; t < 300; t++) {
      const L = Rn.ri(80, 150, 10), r = Rn.ri(30, Math.floor(0.7 * L / 5) * 5, 5);
      const p = { u: 'мм', r: r, O3: [0, -L], phi: Rn.pick(NICE_PHI), w1: Rn.ri(4, 15, 1) * Rn.pick([1, -1]) };
      const S = KUL.solve(p); if (!S || len(S.a3) < 0.15 * S.vA || len(S.slip) < 0.1 * S.vA) continue; return p;
    }
    return null;
  }
};

/* =========================================================
   Тип 4. Кулачок-эксцентрик с роликовым толкателем
   ========================================================= */
const CAM = {
  key: 'cam', title: 'Кулачок-эксцентрик и толкатель с роликом',
  solve(p) {
    const k = UNIT[p.u], s = solveSlider({ r: p.e, l: p.R + p.rr, phi: p.phi, gp: [p.s || 0, 0], gd: 90, sel: 1, w1: p.w1 }, k); if (!s) return null;
    const S = Object.assign({ type: 'cam', p: p, k: k }, s);
    S.K = add(S.A, mul(unit(sub(S.B, S.A)), p.R)); S.vA = len(S.a); S.top = add(S.B, [0, p.R * 0.95]);
    const pk = [add(S.A, [-p.R, -p.R]), add(S.A, [p.R, p.R]), add(S.O, [-p.e, -p.e]), add(S.O, [p.e, p.e]), S.top]; S.span = spanOf(pk) * k; S.ml = pickML(pk, k);
    S.mv = pickMV(S.vA, spanOf([[0, 0], S.a, S.b])); return S;
  },
  draw(K, n, S, o) {
    o = o || {}; const m = (k, pr) => K.add(n, Object.assign({ k: k, s: o.s }, pr)), p = S.p;
    m('circ', { c: S.A, r: p.R, col: C.l1, fill: C.l1, op: 0.12, w: 2.4, layer: 'under' });
    m('link', { a: S.B, b: S.top, col: C.l4, w: 4 }); m('bush', { p: add(S.B, [0, p.R * 0.62]), d: [0, 1], col: C.soft });
    m('circ', { c: S.B, r: p.rr, col: C.l3, w: 2.2 });
    m('ray', { a: S.O, d: [1, 0], l: 44 });
    m('ground', { p: S.O }); m('joint', { p: S.O }); m('dot', { p: S.A, r: 3, col: C.l1 }); m('dot', { p: S.B, r: 2.6, col: C.l3 });
    m('lbl', { p: S.O, t: 'O', ang: pivAng(S.O, [S.A], [0, 250, 290, p.phi / 2 - 22, p.phi / 2, p.phi / 2 + 22], [S.A, add(S.O, [1, 0]), add(S.O, dirv(p.phi / 2))]), dist: PIVD }); m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O, S.B]), size: 13 });
    m('lbl', { p: S.B, t: 'B', ang: bestAng(S.B, [S.A, S.top], [0, 180]), dist: 14 + p.rr * 0 + 6, size: 13 });
    if (o.w1 !== false) m('omega', omegaSpec(S.O, [S.A, add(S.O, [1, 0]), add(S.O, dirv(p.phi / 2))], p.w1, 'ω_{1}', C.known, true, 22));
    if (o.repl) { m('link', { a: S.O, b: S.A, col: C.rel, w: 2.2, dash: '6 4' }); m('link', { a: S.A, b: S.B, col: C.rel, w: 2.2, dash: '6 4' }); m('joint', { p: S.A, r: 3.6, col: C.rel }); m('joint', { p: S.B, r: 3.6, col: C.rel }); }
  },
  pos(S) {
    const K = new Kon(), p = S.p, k = S.k, ml = S.ml, L = x => f1(Math.abs(x) * k / ml), m = K.fn('mech'); K.scene('mech', { maxH: 420 });
    const s = p.s || 0;
    K.step(`<b>Шаг 1. Масштаб и ось вращения.</b> Размах ≈ ${fs(S.span, 2)} м → μ<sub>l</sub> = ${fmu(ml)} м/мм. На листе: e = OA = ${L(p.e)} мм, R = ${L(p.R)} мм, r = ${L(p.rr)} мм, R + r = ${L(p.R + p.rr)} мм. Ставим ось кулачка O.`);
    m('cl', { a: [-p.R, 0], b: [p.R, 0], e1: 0, e2: 0 }); m('ground', { p: S.O }); m('joint', { p: S.O }); m('lbl', { p: S.O, t: 'O', ang: pivAng(S.O, [S.A], [0, 180, 250, 290, p.phi / 2 - 22, p.phi / 2, p.phi / 2 + 22], [S.A, add(S.O, [1, 0]), add(S.O, dirv(p.phi / 2))]), dist: PIVD });
    K.step(`<b>Шаг 2. Ось толкателя.</b> Вертикаль ${s ? 'на расстоянии ' + L(s) + ' мм ' + (s > 0 ? 'правее' : 'левее') + ' O' : 'через O (центральный толкатель)'}. Центр ролика всегда на этой линии.`);
    m('cl', { a: [s, -p.R * 0.6], b: S.top, e1: 0, e2: 10 });
    const ap = angPlan(p.phi);
    K.step(`<b>Шаг 3. Угол φ = ${fa(p.phi)}.</b> Транспортир в O, ${ap.txt}. На луче циркулем откладываем e = ${L(p.e)} мм — это A, центр круглого кулачка.`);
    m('protr', { c: S.O, mark: ap.mark, lower: ap.lower, mt: ap.mt, only: true }); m('cl', { a: S.O, b: S.A, e1: 0, e2: 24 }); m('arc', { c: S.O, r: p.e, a0: p.phi - 18, a1: p.phi + 18 }); m('dot', { p: S.A, r: 3, col: C.l1 }); m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O, S.B]), size: 13 });
    m('omega', omegaSpec(S.O, [S.A, add(S.O, [1, 0]), add(S.O, dirv(p.phi / 2))], p.w1, 'ω_{1}', C.known, true, 22));
    K.step(`<b>Шаг 4. Профиль кулачка.</b> Раствор R = ${L(p.R)} мм, иглу в A — полный круг. Это и есть кулачок-эксцентрик: он крутится вокруг O, а не вокруг своего центра.`);
    m('circ', { c: S.A, r: p.R, col: C.l1, w: 2.2 });
    K.step(`<b>Шаг 5. Центр ролика B.</b> Ролик касается круга, значит его центр всегда на расстоянии R + r = ${L(p.R + p.rr)} мм от A. Раствор ${L(p.R + p.rr)} мм, иглу в A — засечка на оси толкателя (верхняя). Это B.`);
    const aB = angd(sub(S.B, S.A)); m('arc', { c: S.A, r: p.R + p.rr, a0: aB - 12, a1: aB + 12 }); m('dot', { p: S.B, col: C.found });
    K.step(`<b>Шаг 6. Ролик и толкатель.</b> Круг радиуса r = ${L(p.rr)} мм из B — ролик. Вверх от B — стержень толкателя в направляющей. Точка касания K лежит на прямой AB (общая нормаль проходит через оба центра).`);
    m('circ', { c: S.B, r: p.rr, col: C.l3, w: 2 }); m('link', { a: S.B, b: S.top, col: C.l4, w: 4 }); m('bush', { p: add(S.B, [0, p.R * 0.62]), d: [0, 1] });
    m('seg', { a: sub(S.A, mul(unit(sub(S.B, S.A)), p.R * 0.3)), b: add(S.B, mul(unit(sub(S.B, S.A)), p.rr * 1.8)), dash: '3 3', col: C.muted });
    m('dot', { p: S.K, r: 3, col: C.text }); m('lbl', { p: S.K, t: 'K', ang: bestAng(S.K, [S.A, S.B]), size: 12 }); m('lbl', { p: S.B, t: 'B', ang: bestAng(S.B, [S.A, S.top], [0, 180]), dist: 20, size: 13 });
    return K;
  },
  plan(S) {
    const K = new Kon(), p = S.p, mv = S.mv, Lp = v => f1(len(v) / mv), o = [0, 0];
    K.scene('mech', { maxH: 280, title: 'Механизм и заменяющий механизм' }); K.scene('plan', { maxH: 380, title: 'План скоростей' });
    CAM.draw(K, 'mech', S, { s: -1 });
    const P = K.fn('plan'), M = K.fn('mech'), kv = vecScale([S.O, S.A, S.B, S.top], [S.a, S.b]), ba = sub(S.b, S.a);
    K.step(`<b>Шаг 1. Заменяющий механизм.</b> В высшей паре (касание круга и ролика) неудобно работать напрямую. Пока толкатель касается круга, расстояние между центрами A и B не меняется: AB = R + r. Значит, можно мысленно поставить шатун AB с шарнирами в центрах. Получается кривошипно-ползунный механизм: кривошип OA = e, шатун AB, «ползун» — толкатель. Скорости точек A и B у него такие же, как у кулачкового.`);
    M('link', { a: S.O, b: S.A, col: C.rel, w: 2.4, dash: '6 4' }); M('link', { a: S.A, b: S.B, col: C.rel, w: 2.4, dash: '6 4' }); M('joint', { p: S.A, r: 3.6, col: C.rel }); M('joint', { p: S.B, r: 3.6, col: C.rel });
    K.step(`<b>Шаг 2. Скорость центра кулачка A.</b> ${Vs('A')} = ω<sub>1</sub>·e = ${fnum(Math.abs(p.w1))}·${fnum(p.e * S.k)} = <b>${fs(S.vA)} м/с</b>, ⊥ OA в сторону ω<sub>1</sub>. pa = ${Lp(S.a)} мм → μ<sub>V</sub> = ${fmu(mv)} (м/с)/мм. ${vaCap(S, 'OA', S.O, S.A, p.w1, S.a, mv, null, Lp).replace(/^<b>[^<]*<\/b>/, '')}`);
    P('dot', { p: o }); P('lbl', { p: o, t: 'p', ang: bestAng(o, [S.a, S.b]) }); P('protr', { c: o, mark: lineAng(S.a), only: true }); P('vec', { a: o, b: S.a, col: C.known }); P('lbl', { p: S.a, t: 'a', ang: bestAng(S.a, [o, S.b]) });
    M('vec', { a: S.A, b: add(S.A, mul(S.a, kv)), col: C.known, only: true });
    const c1 = perpCap('AB', S.A, S.B, 'a');
    K.step(`<b>Шаг 3.</b> ${Vh('B')} = ${Vh('A')} + ${Vh('BA')}, ${Vh('BA')} ⊥ AB. ${c1.html}`);
    P('protr', { c: S.a, mark: c1.tp, only: true }); P('cl', { a: S.a, b: S.b, e1: 36, e2: 36 }); M('hl', { a: S.A, b: S.B, col: C.rel, only: true });
    K.step(`<b>Шаг 4.</b> Толкатель движется поступательно вдоль своей оси, поэтому ${Vh('B')} — вертикально. Через p — вертикальная прямая.`);
    P('cl', { a: o, b: S.b, e1: 36, e2: 36 }); M('hl', { a: S.B, b: S.top, col: C.l4, only: true });
    const up = S.b[1] > 0;
    K.step(`<b>Шаг 5. Точка b.</b> pb ≈ ${Lp(S.b)} мм → скорость толкателя ${Vs('B')} = <b>${fs(len(S.b))} м/с</b>, направлена <b>${up ? 'вверх' : 'вниз'}</b>: толкатель сейчас ${up ? 'поднимается' : 'опускается'}. Все точки толкателя движутся поступательно, у них одна и та же скорость.`);
    P('dot', { p: S.b }); P('lbl', { p: S.b, t: 'b', ang: bestAng(S.b, [o, S.a]) }); P('vec', { a: o, b: S.b, col: C.found }); P('vec', { a: S.a, b: S.b, col: C.rel });
    M('vec', { a: S.top, b: add(S.top, mul(S.b, kv)), col: C.found });
    return K;
  },
  ans(S) { return [{ id: 'vb', h: Vs('B') + ' (толкатель)', v: len(S.b), u: 'м/с', dir: S.b[1] > 0 ? 0 : 1, opts: ['вверх', 'вниз'] }]; },
  rows(S) { const mv = S.mv; return [['V<sub>A</sub>', 'pa', S.a], ['V<sub>B</sub> толкателя', 'pb', S.b], ['V<sub>BA</sub>', 'ab', sub(S.b, S.a)]].map(x => [x[0], x[1], len(x[2]) / mv, len(x[2])]); },
  given(p) { const s = p.s || 0; return `Эксцентриситет e = OA = ${fnum(p.e)} ${p.u} (A — центр круглого кулачка), радиус кулачка R = ${fnum(p.R)} ${p.u}, радиус ролика r = ${fnum(p.rr)} ${p.u}; ось толкателя вертикальна и ${s ? 'смещена на ' + fnum(Math.abs(s)) + ' ' + p.u + ' ' + (s > 0 ? 'вправо' : 'влево') + ' от O' : 'проходит через O'}; угол OA с горизонталью φ = ${fa(p.phi)}; ω<sub>1</sub> = ${fnum(Math.abs(p.w1))} рад/с ${dirW(p.w1)}.`; },
  find: 'скорость толкателя V<sub>B</sub> и куда он движется',
  struct: 'Звенья: 0 — стойка, 1 — кулачок (круг радиуса R с центром A, вращается вокруг O), 2 — толкатель с роликом. Касание круга и ролика — высшая пара (p<sub>2</sub> = 1). Вращение ролика вокруг своей оси ни на что не влияет — его считают лишней подвижностью и «приклеивают» ролик к толкателю. Заменяем высшую пару шатуном AB = R + r с двумя шарнирами: получается кривошипно-ползунный механизм, и план строится как в разборе 1.',
  hint(S) { return `1) Заменяющий механизм: кривошип OA = e, шатун AB = R + r, ползун B на оси толкателя. 2) ${Vs('A')} = ω<sub>1</sub>·e ⊥ OA. 3) Через a — прямая ⊥ AB, через p — вдоль оси толкателя (вертикаль). 4) pb·μ<sub>V</sub> — скорость толкателя.`; },
  gen(Rn) {
    for (let t = 0; t < 300; t++) {
      const p = { u: 'мм', e: Rn.ri(10, 30, 5), R: Rn.ri(40, 80, 5), rr: Rn.ri(8, 16, 2), s: Rn.pick([0, 0, 5, -5, 10, -10]), phi: Rn.pick(NICE_PHI), w1: Rn.ri(10, 30, 1) * Rn.pick([1, -1]) };
      const S = CAM.solve(p); if (!S || len(S.b) < 0.15 * S.vA) continue; return p;
    }
    return null;
  }
};

/* =========================================================
   Тип 5. Шестизвенник как в КР 2 (вариант 25)
   ========================================================= */
const SIX = {
  key: 'six', title: 'Шестизвенный механизм (как в КР 2)',
  solve(p, prevD) {
    const k = UNIT[p.u], ph = ((180 - p.phiT) % 360 + 360) % 360, O1 = [0, 0], O2 = [-p.b, p.a], A = mul(dirv(ph), p.O1A);
    const X = lc([0, p.c], [1, 0], A, p.AC); if (!X) return null; const Cp = X[1];
    const BB = cc(A, p.AB, Cp, p.BC); if (!BB) return null; const B = BB[0];
    const DD = cc(O2, p.O2D, B, p.BD); if (!DD) return null;
    const D = prevD ? (len(sub(DD[0], prevD)) < len(sub(DD[1], prevD)) ? DD[0] : DD[1]) : (DD[0][1] >= DD[1][1] ? DD[0] : DD[1]);
    const a = mul(rot(A), p.w1 * k), c = ll(a, rot(sub(Cp, A)), [0, 0], [1, 0]); if (!c) return null;
    const b = ll(a, rot(sub(B, A)), c, rot(sub(B, Cp))), d = b && ll(b, rot(sub(D, B)), [0, 0], rot(sub(D, O2))); if (!b || !d) return null;
    const S = { type: 'six', p: p, k: k, ph: ph, O1: O1, O2: O2, A: A, B: B, C: Cp, D: D, a: a, b: b, c: c, d: d };
    S.w2 = omegaOf(A, Cp, a, c, k); S.w4 = omegaOf(B, D, b, d, k); S.w5 = omegaOf(O2, D, [0, 0], d, k);
    S.S1 = mid(O1, A); S.S2 = cen(A, B, Cp); S.S4 = mid(B, D); S.S5 = mid(O2, D);
    S.s1 = mul(a, 0.5); S.s2 = cen(a, b, c); S.s4 = mid(b, d); S.s5 = mul(d, 0.5);
    S.vA = len(a); const pk = [O1, O2, A, B, Cp, D, add(Cp, [p.AC * 0.1, 0])]; S.span = spanOf(pk) * k; S.ml = pickML(pk, k);
    S.mv = pickMV(S.vA, spanOf([[0, 0], a, b, c, d])); S.q = Math.min(qsin(sub(D, B), sub(D, O2)), qsin(rot(sub(Cp, A)), [1, 0]));
    return S;
  },
  draw(K, n, S, o) {
    o = o || {}; const m = (k, pr) => K.add(n, Object.assign({ k: k, s: o.s }, pr)), p = S.p;
    m('ray', { a: S.O1, d: [-1, 0], l: 46 });
    m('guide', { p: S.C, d: [1, 0], l1: 40, l2: 56, side: 1 });
    m('tri', { p: [S.A, S.B, S.C], col: C.l2 });
    m('link', { a: S.O1, b: S.A, col: C.l1 }); m('link', { a: S.A, b: S.C, col: C.l2 }); m('link', { a: S.A, b: S.B, col: C.l2 }); m('link', { a: S.B, b: S.C, col: C.l2 });
    m('link', { a: S.B, b: S.D, col: C.l4 }); m('link', { a: S.O2, b: S.D, col: C.l5 }); m('slider', { p: S.C, d: [1, 0] });
    m('ground', { p: S.O1 }); m('ground', { p: S.O2 });
    [S.O1, S.O2, S.A, S.B, S.C, S.D].forEach(q => m('joint', { p: q }));
    m('lbl', { p: S.O1, t: 'O_{1}', ang: pivAng(S.O1, [S.A], [180, 250, 290, 158 - p.phiT / 2, 180 - p.phiT / 2, 202 - p.phiT / 2], [S.A, add(S.O1, [-1, 0]), add(S.O1, dirv(180 - p.phiT / 2))]), dist: PIVD }); m('lbl', { p: S.O2, t: 'O_{2}', ang: bestAng(S.O2, [S.D], [250, 290]) });
    m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O1, S.B, S.C]) }); m('lbl', { p: S.B, t: 'B', ang: bestAng(S.B, [S.A, S.C, S.D]) });
    m('lbl', { p: S.C, t: 'C', ang: bestAng(S.C, [S.A, S.B], [0, 180, 270]), dist: 21 }); m('lbl', { p: S.D, t: 'D', ang: bestAng(S.D, [S.B, S.O2]) });
    if (o.w1 !== false) m('omega', omegaSpec(S.O1, [S.A, add(S.O1, [-1, 0]), add(S.O1, dirv(180 - p.phiT / 2))], p.w1, 'ω_{1}', C.known, true));
    if (o.phi !== false) m('ang', { c: S.O1, a0: 180, a1: 180 - p.phiT, r: 18, t: 'φ', col: C.muted, td: 10 });
    if (o.cm) [['S1', 'S_{1}', [S.O1, S.A]], ['S2', 'S_{2}', [S.A, S.B, S.C]], ['S4', 'S_{4}', [S.B, S.D]], ['S5', 'S_{5}', [S.O2, S.D]]].forEach(z => { m('dot', { p: S[z[0]], r: 3 }); m('lbl', { p: S[z[0]], t: z[1], ang: bestAng(S[z[0]], z[2]), size: 12 }); });
  },
  pos(S) {
    const K = new Kon(), p = S.p, k = S.k, ml = S.ml, L = x => f1(Math.abs(x) * k / ml), m = K.fn('mech'); K.scene('mech', { maxH: 460 });
    const xl = -p.b - p.O1A * 0.4, xr = S.C[0] + p.AC * 0.18;
    K.step(`<b>Шаг 1. Масштаб и опорная линия.</b> Схема занимает ≈ ${fs(S.span, 2)} м по большей стороне, а под неё на листе А4 есть примерно 170 × 130 мм. Берём μ<sub>l</sub> = ${fmu(ml)} м/мм — ${scaleWords(ml)}, и схема влезет в верхнюю половину листа А4. Пересчитываем длины: O<sub>1</sub>A = ${L(p.O1A)} мм, AC = ${L(p.AC)}, AB = ${L(p.AB)}, BC = ${L(p.BC)}, BD = ${L(p.BD)}, O<sub>2</sub>D = ${L(p.O2D)} мм; a = ${L(p.a)}, b = ${L(p.b)}, c = ${L(p.c)} мм. Ставим O<sub>1</sub> и проводим через неё горизонталь.`);
    m('cl', { a: [xl, 0], b: [xr, 0], e1: 0, e2: 0 }); m('ground', { p: S.O1 }); m('joint', { p: S.O1 }); m('lbl', { p: S.O1, t: 'O_{1}', ang: pivAng(S.O1, [S.A], [0, 180, 250, 290, 158 - p.phiT / 2, 180 - p.phiT / 2, 202 - p.phiT / 2], [S.A, add(S.O1, [-1, 0]), add(S.O1, dirv(180 - p.phiT / 2))]), dist: PIVD });
    K.step(`<b>Шаг 2. Неподвижный шарнир O<sub>2</sub>.</b> От O<sub>1</sub> влево по горизонтали b = ${L(p.b)} мм, оттуда вверх a = ${L(p.a)} мм. Вертикаль строим транспортиром (90°) или угольником.`);
    m('seg', { a: S.O1, b: [-p.b, 0], dash: '4 3' }); m('seg', { a: [-p.b, 0], b: S.O2, dash: '4 3' });
    m('dim', { a: [-p.b, 0], b: S.O1, off: 14, t: 'b' }); m('dim', { a: [-p.b, 0], b: S.O2, off: 14, t: 'a' });
    m('ground', { p: S.O2 }); m('joint', { p: S.O2 }); m('lbl', { p: S.O2, t: 'O_{2}', ang: bestAng(S.O2, [S.D, [-p.b, 0]], [250, 290]) });
    K.step(`<b>Шаг 3. Направляющая ползуна.</b> На высоте c = ${L(p.c)} мм над O<sub>1</sub> проводим горизонталь. По ней ездит ползун C, значит C будет где-то на этой линии.`);
    m('cl', { a: [Math.min(S.A[0], 0) - p.O1A * 0.3, p.c], b: [xr, p.c], e1: 0, e2: 0 }); m('dim', { a: [xr * 0.78, 0], b: [xr * 0.78, p.c], off: -14, t: 'c' });
    const ap = angPlan(S.ph);
    K.step(`<b>Шаг 4. Угол φ = ${fa(p.phiT)}.</b> Центр транспортира — в O<sub>1</sub>, ноль — на горизонталь. Смотри на схему в задании: φ отсчитан от <b>левой</b> половины горизонтали. Значит, от правой это 180° − ${fa(p.phiT)} = ${fa(S.ph)}. ${ap.lower ? ap.txt[0].toUpperCase() + ap.txt.slice(1) + '.' : 'Отмечаем ' + fa(S.ph) + ' и проводим луч из O<sub>1</sub>.'}`);
    m('protr', { c: S.O1, mark: ap.mark, lower: ap.lower, mt: ap.mt, only: true }); m('cl', { a: S.O1, b: S.A, e1: 0, e2: 34 }); m('ang', { c: S.O1, a0: 180, a1: 180 - p.phiT, r: 18, t: 'φ', col: C.muted, td: 10 });
    K.step(`<b>Шаг 5. Кривошип O<sub>1</sub>A.</b> Раствор циркуля ${L(p.O1A)} мм, иглу в O<sub>1</sub>, засечка на луче — это A. Рядом рисуем стрелку ω<sub>1</sub> (${dirW(p.w1)}).`);
    m('arc', { c: S.O1, r: p.O1A, a0: S.ph - 14, a1: S.ph + 14 }); m('link', { a: S.O1, b: S.A, col: C.l1 }); m('joint', { p: S.A }); m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O1, S.B, S.C]) });
    m('omega', omegaSpec(S.O1, [S.A, add(S.O1, [-1, 0]), add(S.O1, dirv(180 - p.phiT / 2))], p.w1, 'ω_{1}', C.known, true));
    const aC = angd(sub(S.C, S.A));
    K.step(`<b>Шаг 6. Ползун C.</b> Раствор ${L(p.AC)} мм (AC), иглу в A. Дуга пересекает направляющую — берём точку справа, как на схеме. Это C.`);
    m('arc', { c: S.A, r: p.AC, a0: aC - 13, a1: aC + 9 }); m('link', { a: S.A, b: S.C, col: C.l2 }); m('guide', { p: S.C, d: [1, 0], l1: 40, l2: 56, side: 1 }); m('slider', { p: S.C, d: [1, 0] }); m('joint', { p: S.C }); m('lbl', { p: S.C, t: 'C', ang: bestAng(S.C, [S.A, S.B], [0, 180, 270]), dist: 21 });
    const aAB = angd(sub(S.B, S.A)), aCB = angd(sub(S.B, S.C));
    K.step(`<b>Шаг 7. Точка B — засечками.</b> Раствор ${L(p.AB)} мм — дуга из A. Раствор ${L(p.BC)} мм — дуга из C. Дуги пересекаются дважды: над AC и под ней. На схеме B над AC — берём верхнюю.`);
    m('arc', { c: S.A, r: p.AB, a0: aAB - 13, a1: aAB + 13 }); m('arc', { c: S.C, r: p.BC, a0: aCB - 11, a1: aCB + 11 }); m('dot', { p: S.B, col: C.found });
    K.step(`<b>Шаг 8. Звено 2 — треугольник ABC.</b> Обводим AB и BC. Это одна жёсткая пластина: A, B и C движутся вместе и вращаются с одной угловой скоростью ω<sub>2</sub>.`);
    m('tri', { p: [S.A, S.B, S.C], col: C.l2 }); m('link', { a: S.A, b: S.B, col: C.l2 }); m('link', { a: S.B, b: S.C, col: C.l2 }); m('joint', { p: S.B }); m('lbl', { p: S.B, t: 'B', ang: bestAng(S.B, [S.A, S.C, S.D]) });
    const aBD = angd(sub(S.D, S.B)), aOD = angd(sub(S.D, S.O2));
    K.step(`<b>Шаг 9. Точка D — засечками.</b> Раствор ${L(p.BD)} мм — дуга из B, раствор ${L(p.O2D)} мм — дуга из O<sub>2</sub>. Берём верхнюю точку пересечения, как на схеме.`);
    m('arc', { c: S.B, r: p.BD, a0: aBD - 14, a1: aBD + 14 }); m('arc', { c: S.O2, r: p.O2D, a0: aOD - 8, a1: aOD + 8 }); m('dot', { p: S.D, col: C.found });
    K.step(`<b>Шаг 10. Звенья 4 и 5.</b> Обводим BD и O<sub>2</sub>D. Положение механизма готово — построено только линейкой, циркулем и транспортиром.`);
    m('link', { a: S.B, b: S.D, col: C.l4 }); m('link', { a: S.O2, b: S.D, col: C.l5 }); m('joint', { p: S.D }); m('joint', { p: S.B }); m('lbl', { p: S.D, t: 'D', ang: bestAng(S.D, [S.B, S.O2]) });
    K.step(`<b>Шаг 11. Центры масс.</b> S<sub>1</sub>, S<sub>4</sub>, S<sub>5</sub> — середины O<sub>1</sub>A, BD, O<sub>2</sub>D. S<sub>2</sub> — центр тяжести треугольника: проводим две медианы (из A в середину BC и из C в середину AB) — они пересекаются в S<sub>2</sub>, на 2/3 длины от вершины. Центр масс ползуна — сама точка C.`);
    m('cl', { a: S.A, b: mid(S.B, S.C), e1: 0, e2: 4, col: C.l2 }); m('cl', { a: S.C, b: mid(S.A, S.B), e1: 0, e2: 4, col: C.l2 });
    [['S1', 'S_{1}', [S.O1, S.A]], ['S2', 'S_{2}', [S.A, S.B, S.C, mid(S.B, S.C)]], ['S4', 'S_{4}', [S.B, S.D]], ['S5', 'S_{5}', [S.O2, S.D]]].forEach(z => { m('dot', { p: S[z[0]], r: 3.2 }); m('lbl', { p: S[z[0]], t: z[1], ang: bestAng(S[z[0]], z[2]), size: 12 }); });
    return K;
  },
  plan(S) {
    const K = new Kon(), p = S.p, mv = S.mv, Lp = v => f1(len(v) / mv), o = [0, 0];
    K.scene('mech', { maxH: 300, title: 'Механизм' }); K.scene('plan', { maxH: 420, title: 'План скоростей' });
    SIX.draw(K, 'mech', S, { s: -1 });
    const P = K.fn('plan'), M = K.fn('mech'), kv = vecScale([S.O1, S.O2, S.A, S.B, S.C, S.D], [S.a, S.b, S.c, S.d]);
    const ca = sub(S.c, S.a), ba = sub(S.b, S.a), bc = sub(S.b, S.c), db = sub(S.d, S.b);
    K.step(`<b>Шаг 1. Скорость точки A.</b> ${Vs('A')} = ω<sub>1</sub>·${Lh('O₁A')} = ${fnum(Math.abs(p.w1))}·${fnum(p.O1A * S.k)} = <b>${fs(S.vA)} м/с</b>. Хотим, чтобы pa было около 50–100 мм: возьмём pa = ${Lp(S.a)} мм. Масштаб μ<sub>V</sub> = ${Vs('A')} / pa = ${fs(S.vA)} / ${Lp(S.a)} = <b>${fmu(mv)} (м/с)/мм</b>. Полюс p ставим в свободном месте нижней половины листа.`);
    P('dot', { p: o }); P('lbl', { p: o, t: 'p', ang: bestAng(o, [S.a, S.b, S.c, S.d]) });
    K.step(vaCap(S, 'O₁A', S.O1, S.A, p.w1, S.a, mv, null, Lp));
    P('protr', { c: o, mark: lineAng(S.a), only: true }); P('vec', { a: o, b: S.a, col: C.known }); P('lbl', { p: S.a, t: 'a', ang: bestAng(S.a, [o, S.b, S.c]) });
    M('hl', { a: S.O1, b: S.A, col: C.l1, only: true }); M('vec', { a: S.A, b: add(S.A, mul(S.a, kv)), col: C.known, only: true });
    const c1 = perpCap('AC', S.A, S.C, 'a');
    K.step(`<b>Шаг 3. Группа 2–3: ползун C.</b> Записываем ${Vh('C')} = ${Vh('A')} + ${Vh('CA')}. Длину ${Vh('CA')} не знаем, направление знаем: ${Vh('CA')} ⊥ AC. ${c1.html}`);
    P('protr', { c: S.a, mark: c1.tp, only: true }); P('cl', { a: S.a, b: S.c, e1: 34, e2: 34 }); M('hl', { a: S.A, b: S.C, col: C.l2, only: true });
    K.step(`<b>Шаг 4. Вторая прямая для C.</b> Ползун ездит по горизонтальной неподвижной направляющей → ${Vh('C')} ∥ x–x. Это абсолютная скорость, она выходит из полюса: через p — горизонтальная прямая.`);
    P('cl', { a: o, b: S.c, e1: 34, e2: 34 }); M('hl', { a: add(S.C, [-p.AC * 0.18, 0]), b: add(S.C, [p.AC * 0.18, 0]), col: C.l3, only: true });
    K.step(`<b>Шаг 5. Точка c.</b> Пересечение двух прямых. pc ≈ ${Lp(S.c)} мм → ${Vs('C')} = ${Lp(S.c)}·${fmu(mv)} = <b>${fs(len(S.c))} м/с</b>. ac ≈ ${Lp(ca)} мм → ${Vs('CA')} = <b>${fs(len(ca))} м/с</b>. Стрелки — к c.`);
    P('dot', { p: S.c }); P('lbl', { p: S.c, t: 'c', ang: bestAng(S.c, [o, S.a, S.b]) }); P('vec', { a: o, b: S.c, col: C.found }); P('vec', { a: S.a, b: S.c, col: C.rel });
    const c2 = perpCap('AB', S.A, S.B, 'a'), c3 = perpCap('BC', S.C, S.B, 'c');
    K.step(`<b>Шаг 6. Точка b.</b> B — точка того же звена 2, что A и C, поэтому есть два уравнения: ${Vh('B')} = ${Vh('A')} + ${Vh('BA')} (${Vh('BA')} ⊥ AB) и ${Vh('B')} = ${Vh('C')} + ${Vh('BC')} (${Vh('BC')} ⊥ BC). AB стоит под ${fa(c2.th)} → через a прямая под ${fa(c2.tp)}. BC стоит под ${fa(c3.th)} → через c прямая под ${fa(c3.tp)}.`);
    P('protr', { c: S.a, mark: c2.tp, only: true }); P('protr', { c: S.c, mark: c3.tp, only: true }); P('cl', { a: S.a, b: S.b, e1: 28, e2: 30 }); P('cl', { a: S.c, b: S.b, e1: 28, e2: 30 });
    M('hl', { a: S.A, b: S.B, col: C.l2, only: true }); M('hl', { a: S.C, b: S.B, col: C.l2, only: true });
    K.step(`<b>Шаг 7. Проверка подобием.</b> Пересечение — b. pb ≈ ${Lp(S.b)} мм → ${Vs('B')} = <b>${fs(len(S.b))} м/с</b>. Треугольник abc на плане обязан быть подобен ABC: ab/AB = ${f1(len(ba) / mv)}/${f1(p.AB * S.k / S.ml)} и ac/AC = ${f1(len(ca) / mv)}/${f1(p.AC * S.k / S.ml)} дают одно и то же число ${fs(len(ba) / mv / (p.AB * S.k / S.ml))}. Буквы обходятся в одну сторону (a → b → c и A → B → C). Можно было найти b и сразу засечками: ab = ac·AB/AC = ${Lp(ba)} мм, cb = ac·BC/AC = ${Lp(bc)} мм.`);
    P('poly', { p: [S.a, S.b, S.c], col: C.l2 }); P('dot', { p: S.b }); P('lbl', { p: S.b, t: 'b', ang: bestAng(S.b, [o, S.a, S.c, S.d]) }); P('vec', { a: o, b: S.b, col: C.found }); P('vec', { a: S.a, b: S.b, col: C.rel, w: 2 }); P('vec', { a: S.c, b: S.b, col: C.rel, w: 2 });
    const c4 = perpCap('BD', S.B, S.D, 'b'), c5 = perpCap('O₂D', S.O2, S.D, 'p');
    K.step(`<b>Шаг 8. Группа 4–5: точка D.</b> Первое уравнение: ${Vh('D')} = ${Vh('B')} + ${Vh('DB')}, ${Vh('DB')} ⊥ BD. ${c4.html}`);
    P('protr', { c: S.b, mark: c4.tp, only: true }); P('cl', { a: S.b, b: S.d, e1: 30, e2: 34 }); M('hl', { a: S.B, b: S.D, col: C.l4, only: true });
    K.step(`<b>Шаг 9. Второе уравнение для D.</b> D — конец коромысла, которое вращается вокруг неподвижного O<sub>2</sub>: ${Vh('D')} = ${Vh('O₂')} + ${Vh('DO₂')}, а ${Vs('O₂')} = 0 — точка o<sub>2</sub> на плане совпадает с полюсом. Значит, ${Vh('D')} выходит из p и ⊥ O<sub>2</sub>D. ${c5.html}`);
    P('protr', { c: o, mark: c5.tp, only: true }); P('cl', { a: o, b: S.d, e1: 30, e2: 34 }); M('hl', { a: S.O2, b: S.D, col: C.l5, only: true });
    K.step(`<b>Шаг 10. Точка d.</b> pd ≈ ${Lp(S.d)} мм → ${Vs('D')} = <b>${fs(len(S.d))} м/с</b>. bd ≈ ${Lp(db)} мм → ${Vs('DB')} = <b>${fs(len(db))} м/с</b>. ${len(db) / mv > 120 ? 'Отрезок bd длинный — заранее оставь под план место на листе.' : ''}`);
    P('dot', { p: S.d }); P('lbl', { p: S.d, t: 'd', ang: bestAng(S.d, [o, S.b]) }); P('vec', { a: o, b: S.d, col: C.found }); P('vec', { a: S.b, b: S.d, col: C.rel });
    K.step(`<b>Шаг 11. Центры масс.</b> s<sub>1</sub> — середина pa (O<sub>1</sub> на плане в p), s<sub>2</sub> — точка пересечения медиан треугольника abc, s<sub>4</sub> — середина bd, s<sub>5</sub> — середина pd. Соединяем их с p и меряем: ${Vs('S1')} = ${fs(len(S.s1))}, ${Vs('S2')} = ${fs(len(S.s2))}, ${Vs('S4')} = ${fs(len(S.s4))}, ${Vs('S5')} = ${fs(len(S.s5))} м/с. Центр масс ползуна — точка C, ${Vs('S3')} = ${Vs('C')}.`);
    [['s1', 's_{1}', [o, S.a]], ['s2', 's_{2}', [o, S.a, S.b, S.c]], ['s4', 's_{4}', [o, S.b, S.d]], ['s5', 's_{5}', [o, S.d]]].forEach(z => { P('dot', { p: S[z[0]], r: 3, col: C.text }); P('vec', { a: o, b: S[z[0]], col: C.found, w: 1.6 }); P('lbl', { p: S[z[0]], t: z[1], ang: bestAng(S[z[0]], z[2]), size: 12 }); });
    K.step(`<b>Шаг 12. Угловые скорости и их направления.</b> ω<sub>2</sub> = ${Vs('CA')}/${Lh('AC')} = ${fs(len(ca))}/${fnum(p.AC * S.k)} = <b>${fs(Math.abs(S.w2))} рад/с</b>; ω<sub>4</sub> = ${Vs('DB')}/${Lh('BD')} = ${fs(len(db))}/${fnum(p.BD * S.k)} = <b>${fs(Math.abs(S.w4))} рад/с</b>; ω<sub>5</sub> = ${Vs('D')}/${Lh('O₂D')} = ${fs(len(S.d))}/${fnum(p.O2D * S.k)} = <b>${fs(Math.abs(S.w5))} рад/с</b>. Направления: вектор ac переносим в C механизма — он крутит звено 2 вокруг A <b>${dirW(S.w2)}</b>; bd в точку D — звено 4 вокруг B <b>${dirW(S.w4)}</b>; pd в точку D — звено 5 вокруг O<sub>2</sub> <b>${dirW(S.w5)}</b>.`);
    M('vec', { a: S.C, b: add(S.C, mul(ca, kv)), col: C.rel }); M('vec', { a: S.D, b: add(S.D, mul(db, kv)), col: C.rel }); M('vec', { a: S.D, b: add(S.D, mul(S.d, kv)), col: C.found });
    M('omega', omegaSpec(S.A, [S.O1, S.B, S.C], S.w2, 'ω_{2}', C.rel, false, 22)); M('omega', omegaSpec(S.B, [S.A, S.C, S.D], S.w4, 'ω_{4}', C.rel, false, 22)); M('omega', omegaSpec(S.O2, [S.D], S.w5, 'ω_{5}', C.found, true, 24));
    return K;
  },
  ans(S) { return [{ id: 'vc', h: Vs('C'), v: len(S.c), u: 'м/с' }, { id: 'vb', h: Vs('B'), v: len(S.b), u: 'м/с' }, { id: 'vd', h: Vs('D'), v: len(S.d), u: 'м/с' }, { id: 'vs2', h: Vs('S2'), v: len(S.s2), u: 'м/с' }, { id: 'w2', h: 'ω<sub>2</sub>', v: Math.abs(S.w2), u: 'рад/с', dir: S.w2 < 0 ? 0 : 1 }, { id: 'w4', h: 'ω<sub>4</sub> (BD)', v: Math.abs(S.w4), u: 'рад/с', dir: S.w4 < 0 ? 0 : 1 }, { id: 'w5', h: 'ω<sub>5</sub> (O<sub>2</sub>D)', v: Math.abs(S.w5), u: 'рад/с', dir: S.w5 < 0 ? 0 : 1 }]; },
  rows(S) {
    const mv = S.mv; return [['V<sub>A</sub>', 'pa', S.a], ['V<sub>C</sub>', 'pc', S.c], ['V<sub>CA</sub>', 'ac', sub(S.c, S.a)], ['V<sub>B</sub>', 'pb', S.b], ['V<sub>BA</sub>', 'ab', sub(S.b, S.a)], ['V<sub>BC</sub>', 'cb', sub(S.b, S.c)], ['V<sub>D</sub>', 'pd', S.d], ['V<sub>DB</sub>', 'bd', sub(S.d, S.b)], ['V<sub>S1</sub>', 'ps<sub>1</sub>', S.s1], ['V<sub>S2</sub>', 'ps<sub>2</sub>', S.s2], ['V<sub>S3</sub> = V<sub>C</sub>', 'pc', S.c], ['V<sub>S4</sub>', 'ps<sub>4</sub>', S.s4], ['V<sub>S5</sub>', 'ps<sub>5</sub>', S.s5]].map(x => [x[0], x[1], len(x[2]) / mv, len(x[2])])
      .concat([['ω<sub>1</sub>', 'задана', null, Math.abs(S.p.w1), dirW(S.p.w1)], ['ω<sub>2</sub> = V<sub>CA</sub>/l<sub>AC</sub>', '', null, Math.abs(S.w2), dirW(S.w2)], ['ω<sub>3</sub> (ползун)', 'не вращается', null, 0, '—'], ['ω<sub>4</sub> = V<sub>DB</sub>/l<sub>BD</sub>', '', null, Math.abs(S.w4), dirW(S.w4)], ['ω<sub>5</sub> = V<sub>D</sub>/l<sub>O2D</sub>', '', null, Math.abs(S.w5), dirW(S.w5)]]);
  },
  given(p) { const u = p.u; return `a = ${fnum(p.a)} ${u}, b = ${fnum(p.b)} ${u}, c = ${fnum(p.c)} ${u}; φ = ${fa(p.phiT)} (от горизонтали влево, как на схеме КР); O<sub>1</sub>A = ${fnum(p.O1A)}, AC = ${fnum(p.AC)}, AB = ${fnum(p.AB)}, BC = ${fnum(p.BC)}, BD = ${fnum(p.BD)}, O<sub>2</sub>D = ${fnum(p.O2D)} ${u}; ω<sub>1</sub> = ${fnum(Math.abs(p.w1))} рад/с ${dirW(p.w1)}. Схема — как в КР 2: треугольник ABC, ползун C на горизонтали высоты c, коромысло O<sub>2</sub>D.`; },
  find: 'V<sub>C</sub>, V<sub>B</sub>, V<sub>D</sub>, V<sub>S2</sub>, ω<sub>2</sub>, ω<sub>4</sub>, ω<sub>5</sub> с направлениями',
  struct: 'Звенья: 0 — стойка, 1 — кривошип O<sub>1</sub>A, 2 — треугольный шатун ABC, 3 — ползун C, 4 — шатун BD, 5 — коромысло O<sub>2</sub>D. n<sub>Σ</sub> = 6; p<sub>1</sub> = 7 (шарниры O<sub>1</sub>, A, B, C, D, O<sub>2</sub> и поступательная пара «ползун — стойка»), p<sub>2</sub> = 0. W = 3·(6 − 1) − 2·7 = 1. Формула строения: I(0,1) ← II(2,3) ← II(4,5). Сначала группа ВВП (шатун ABC + ползун C), потом группа ВВВ (BD + O<sub>2</sub>D). В таком порядке и строим план.',
  hint(S) { return `1) ${Vs('A')} = ω<sub>1</sub>·${Lh('O₁A')} ⊥ O<sub>1</sub>A. 2) C: через a ⊥ AC, через p горизонтально. 3) B: через a ⊥ AB, через c ⊥ BC (проверь подобие abc ~ ABC). 4) D: через b ⊥ BD, через p ⊥ O<sub>2</sub>D. 5) ω<sub>2</sub> = ac·μ<sub>V</sub>/${Lh('AC')}, ω<sub>4</sub> = bd·μ<sub>V</sub>/${Lh('BD')}, ω<sub>5</sub> = pd·μ<sub>V</sub>/${Lh('O₂D')}.`; },
  gen(Rn) {
    const bases = [{ u: 'см', a: 80, b: 40, c: 40, O1A: 30, AC: 80, AB: 50, BC: 60, BD: 40, O2D: 70 }, { u: 'см', a: 90, b: 50, c: 30, O1A: 25, AC: 90, AB: 55, BC: 60, BD: 45, O2D: 75 }, { u: 'см', a: 70, b: 30, c: 35, O1A: 25, AC: 75, AB: 45, BC: 55, BD: 40, O2D: 60 }];
    for (let t = 0; t < 300; t++) {
      const p = Object.assign({}, Rn.pick(bases), { phiT: Rn.pick(NICE_PHI), w1: Rn.ri(2, 6, 1) * Rn.pick([1, -1]) });
      const S = SIX.solve(p); if (!S || S.q < 0.3 || Math.min(len(S.b), len(S.c), len(S.d)) < 0.12 * S.vA) continue;
      if (!readable([S.O1, S.O2, S.A, S.B, S.C, S.D], [[0, 2], [2, 4], [2, 3], [3, 4], [3, 5], [1, 5]], { pt: 0.12, seg: 0.09 })) continue;
      const sp = spanOf([S.O1, S.O2, S.A, S.B, S.C, S.D]);
      if (Math.min(segDist(S.O1, S.A, S.B), segDist(S.O1, S.A, S.C), segDist(S.O1, S.B, S.C)) < 0.15 * sp) continue;
      if (Math.min(...[S.B, S.C, S.D, S.O2].map(q => len(sub(q, S.O1)))) < 0.4 * sp) continue;
      return p;
    }
    return null;
  }
};

const TYPES = { ks: KS, rrr: RRR, kul: KUL, cam: CAM, six: SIX };

window.KRC = { NICE_PHI, readable, segX, segDist, omegaMid, pivAng, D2R, add, sub, mul, dot, crs, len, unit, rot, dirv, angd, mid, lerp, cen, rotBy, cc, lc, ll, lineAng, ang360, omegaOf, spanOf, qsin, fz, f1, fs, fa, fmu, fnum, dirW, dirWord, Vh, Vs, Lh, UNIT, NS, el, hh, rich, pth, C, Scene, R, LAYER, drawItems, fitPts, bestAng, omegaSpec, angPlan, Kon, mountKon, sArc, txt, arcPath, TYPES, KS, RRR, KUL, CAM, SIX };
})();
