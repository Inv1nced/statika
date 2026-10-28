/* Курс «Кинематика: план скоростей» — движок */
(function () {
'use strict';
const K = window.KRC, MS = window.KMECH, VX = window.KVX;
const { add, sub, mul, dot, crs, len, unit, rot, angd, mid, ll, el, hh, C, Scene, drawItems, Kon, mountKon, bestAng, omegaSpec } = K;

/* ---------- текст ---------- */
const LC = { 1: '#a78bfa', 2: '#2ee6c5', 3: '#9be15d', 4: '#4fd1ff', 5: '#f78fb3', 6: '#ffb86b' };
const lc = n => LC[n] || '#cdd3e5';
const SUBD = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
const uni = s => String(s).replace(/(\d)/g, d => SUBD[d]);
const svgName = (M, n) => (M.lab && M.lab[n]) || n.replace(/(\d+)/g, '_{$1}');
const htm = s => String(s).replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>');
const oName = s => String(s).replace(/\bO(\d)/g, 'O<sub>$1</sub>');
const tx = s => oName(htm(s));
const ptH = n => n.replace(/(\d+)$/, '<sub>$1</sub>');
const eqHtml = s => oName(String(s).replace(/V_\{([^}]*)\}(\|{0,2})/g, (m, a, u) => `<span class="vt${u.length ? ' u' + u.length : ''}"><span class="vv">V</span><sub>${a}</sub></span>`));
const plLab = (M, k) => (M.pl && M.pl[k]) || k.replace(/(\d+)/g, '_{$1}');
const plH = (M, k) => htm(plLab(M, k));
const dirW = w => (w < 0 ? 'по часовой' : 'против часовой');

/* ---------- геометрия механизма ---------- */
function prep(M) {
  if (M._ok) return; const P = {};
  for (const k in M.P) P[k] = [M.P[k][0], -M.P[k][1]];
  if (M.init) M.init(P);
  M.P = P; M._ok = true;
}
const dirOf = (M, L) => L.perp ? rot(sub(M.P[L.perp[1]], M.P[L.perp[0]])) : (L.par ? sub(M.P[L.par[1]], M.P[L.par[0]]) : L.dir.slice());
const dirTxtH = L => L.perp ? '⊥ ' + ptH(L.perp[0]) + ptH(L.perp[1]) : (L.par ? '∥ ' + ptH(L.par[0]) + ptH(L.par[1]) : L.t);

function solveM(M) {
  prep(M); const P = M.P, v = { p: [0, 0] }, d = M.drive;
  if (d.type === 'crank') v[d.key] = mul(rot(sub(P[d.A], P[d.O])), d.w);
  else v[d.key] = mul(unit(d.dir), d.V || 120);
  for (const op of M.ops) {
    if (op.L) v[op.k] = ll(v[op.L[0].f], dirOf(M, op.L[0]), v[op.L[1].f], dirOf(M, op.L[1]));
    else if (op.r) { const a = P[op.on[0]], b = P[op.on[1]], ab = sub(b, a), t = dot(sub(P[op.X], a), ab) / dot(ab, ab); op._t = t; v[op.k] = add(v[op.r[0]], mul(sub(v[op.r[1]], v[op.r[0]]), t)); }
    else if (op.avg) { let s = [0, 0]; op.avg.forEach(k => { s = add(s, v[k]); }); v[op.k] = mul(s, 1 / op.avg.length); }
    else if (op.same) v[op.k] = v[op.same];
  }
  const om = {};
  (M.omegas || []).forEach(o => { const r = sub(P[o.Q], P[o.P]); om[o.n] = crs(r, sub(v[o.kq], v[o.kp])) / dot(r, r); });
  return { v, om };
}

/* ---------- схема ---------- */
function linkNb(M, n) {
  const out = [];
  M.links.forEach(L => { if (L.pts.includes(n)) L.pts.forEach(q => { if (q !== n) out.push(M.P[q]); }); });
  return out;
}
function schemeItems(M, o) {
  prep(M); o = o || {}; const P = M.P, it = [], s = -1;
  const m = (k, pr) => { it.push(Object.assign({ k: k, s: s }, pr)); };
  const span = (() => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const k in P) { x0 = Math.min(x0, P[k][0]); x1 = Math.max(x1, P[k][0]); y0 = Math.min(y0, P[k][1]); y1 = Math.max(y1, P[k][1]); } return Math.max(x1 - x0, y1 - y0); })();
  (M.sliders || []).forEach(sl => { if (sl.dir && !sl.free && !sl.along) m('guide', { p: P[sl.at], d: sl.dir, l1: sl.l1 || 55, l2: sl.l2 || 55, side: sl.side || 1 }); });
  (M.rods || []).forEach(r => {
    const pts = r.pts.map(q => [q[0], -q[1]]);
    for (let i = 0; i < pts.length - 1; i++) m('link', { a: pts[i], b: pts[i + 1], col: lc(r.n), w: 3.4 });
    if (r.bush) m('bush', { p: [r.bush[0], -r.bush[1]], d: [0, 1], l: 30 });
  });
  (M.rodsP || []).forEach(r => { const a = P[r.a], b = P[r.b]; m('link', { a: a, b: b, col: lc(r.n), w: 3.4 }); m('bush', { p: add(a, mul(sub(b, a), r.bush || 0.6)), d: unit(sub(b, a)), l: 30 }); });
  (M.auxLines || []).forEach(q => m('seg', { a: P[q[0]], b: P[q[1]], dash: '5 4', col: C.muted }));
  M.links.forEach(L => {
    const pts = L.pts.map(n => P[n]), col = lc(L.n);
    if (L.kind === 'tri') { m('tri', { p: pts, col: col }); for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) m('link', { a: pts[i], b: pts[j], col: col }); }
    else if (L.kind === 'bent') { for (let i = 0; i < pts.length - 1; i++) m('link', { a: pts[i], b: pts[i + 1], col: col }); }
    else { let a = pts[0], b = pts[0]; pts.forEach(q => { if (len(sub(q, pts[0])) > len(sub(b, pts[0]))) b = q; }); m('link', { a: a, b: b, col: col }); }
  });
  (M.sliders || []).forEach(sl => { const d = sl.dir || sub(P[sl.along[1]], P[sl.along[0]]); m('slider', { p: P[sl.at], d: d }); if (sl.pivot) m('ground', { p: P[sl.at] }); });
  (M.fixed || []).forEach(f => { if (!(M.sliders || []).some(sl => sl.pivot && sl.at === f)) m('ground', { p: P[f] }); });
  const joints = new Set();
  M.links.forEach(L => L.pts.forEach(n => joints.add(n))); (M.fixed || []).forEach(n => joints.add(n)); (M.sliders || []).forEach(sl => joints.add(sl.at));
  joints.forEach(n => m('joint', { p: P[n], r: 4.2 }));
  (M.aux || []).forEach(n => m('dot', { p: P[n], r: 3.2, col: C.soft }));
  (M.cms || []).forEach(n => m('dot', { p: P[n], r: 2.6, col: C.soft }));
  // ω1 / входной ползун
  let omMid = null;
  if (M.drive.type === 'crank') { const sp = omegaSpec(P[M.drive.O], [P[M.drive.A]], M.drive.w, 'ω_{1}', C.known, true, 22); omMid = sp.a + (sp.cw ? -50 : 50); m('omega', sp); }
  else { const A = P[M.drive.A], dd = unit(M.drive.dir), off = mul(rot(dd), -0.07 * span); m('vec', { a: add(A, off), b: add(add(A, off), mul(dd, 0.13 * span)), col: C.known, w: 2.2 }); }
  // подписи
  const all = Array.from(joints).concat(M.aux || [], M.cms || []);
  all.forEach(n => {
    const p = P[n], nb = linkNb(M, n), av = [];
    (M.sliders || []).forEach(sl => { if (sl.at === n) { const d = sl.dir || sub(P[sl.along[1]], P[sl.along[0]]); const a = angd(d); av.push(a, a + 180, a + 90, a - 90); } });
    (M.auxLines || []).forEach(q => { if (q[0] === n) nb.push(P[q[1]]); if (q[1] === n) nb.push(P[q[0]]); });
    if ((M.fixed || []).includes(n)) av.push(250, 270, 290);
    if (M.drive.type === 'crank' && n === M.drive.O && omMid != null) av.push(omMid, omMid - 35, omMid + 35);
    (M.rods || []).forEach(r => r.pts.forEach(q => { const qq = [q[0], -q[1]]; if (len(sub(qq, p)) > 1e-6 && len(sub(qq, p)) < span * 0.4) nb.push(qq); }));
    const isS = (M.cms || []).includes(n);
    if (isS) { M.links.forEach(L => { const ids = L.pts.map(q => P[q]); for (let i = 0; i < ids.length - 1; i++) { nb.push(ids[i], ids[i + 1]); } }); }
    const near = nb.filter(q => len(sub(q, p)) < span * 0.6);
    m('lbl', { p: p, t: svgName(M, n), ang: bestAng(p, near.length ? near : nb, av), size: isS ? 12 : 14, dist: isS ? 13 : 18, col: isS ? C.muted : C.text, wt: isS ? 500 : 600 });
  });
  return it;
}

/* ---------- разбор: пошаговое построение плана ---------- */
function planLabels(M, v, keys) {
  const pts = keys.map(k => v[k]);
  return keys.map(k => { const nb = pts.filter(q => len(sub(q, v[k])) > 1e-6); return { k: k, ang: bestAng(v[k], nb) }; });
}
function planKon(M) {
  const S = solveM(M), v = S.v, P = M.P, Kk = new Kon();
  Kk.scene('mech', { maxH: 300, title: M.title }); Kk.scene('plan', { maxH: 400, title: 'План скоростей' });
  schemeItems(M).forEach(it => Kk.add('mech', it));
  const Pl = Kk.fn('plan'), Mc = Kk.fn('mech');
  const keys = ['p'].concat(Object.keys(v).filter(k => k !== 'p'));
  const uniq = []; keys.forEach(k => { if (!uniq.some(u => len(sub(v[u], v[k])) < 1e-9)) uniq.push(k); });
  const lab = {}; planLabels(M, v, uniq).forEach(o => { lab[o.k] = o.ang; });
  const L = (k, size) => Pl('lbl', { p: v[k], t: k === 'p' ? 'p' : plLab(M, k), ang: lab[k] != null ? lab[k] : 45, size: size || 14, dist: 15 });
  const fix = (M.fixed || []).map(ptH).join(', ');
  Kk.step(`<b>Шаг 1. Полюс.</b> Ставим полюс p в свободном месте листа. Из него проводим все абсолютные скорости (скорости относительно стойки). Неподвижные точки ${fix} на плане совпадают с p: их скорость равна нулю.`);
  Pl('dot', { p: [0, 0], r: 3.6 }); L('p');
  const d = M.drive, dk = d.key;
  if (d.type === 'crank') {
    const cr = ptH(d.O) + ptH(d.A);
    Kk.step(`<b>Шаг 2. Скорость ведущей точки ${ptH(d.A)}.</b> V<sub>${d.A}</sub> = ω<sub>1</sub>·l<sub>${oName(d.O + d.A)}</sub>. Вектор ⊥ ${cr}, в сторону вращения кривошипа (ω<sub>1</sub> ${dirW(d.w)}). Длину отрезка от p до ${plH(M, dk)} выбираем сами (удобно 50–100 мм), тогда масштаб μ<sub>V</sub> = V<sub>A</sub> / pa, (м/с)/мм. ${M.driveNote || ''}`);
    Mc('hl', { a: P[d.O], b: P[d.A], col: lc(1), only: true });
  } else {
    Kk.step(`<b>Шаг 2. Скорость ведущего ползуна A</b> задана: откладываем pa по направлению его движения (по стрелке на схеме). Масштаб μ<sub>V</sub> = V<sub>A</sub> / pa.`);
  }
  Pl('vec', { a: [0, 0], b: v[dk], col: C.known }); Pl('dot', { p: v[dk], r: 3 }); L(dk);
  let n = 3; const cms = [];
  M.ops.forEach(op => {
    if (op.cm) { cms.push(op); return; }
    const x = v[op.k], X = plH(M, op.k);
    if (op.L) {
      const [l1, l2] = op.L;
      Kk.step(`<b>Шаг ${n}. Точка ${X}.</b> ${tx(op.pre || '')}Уравнение: ${eqHtml(op.eq)}. Первая прямая: через ${l1.f === 'p' ? 'полюс p' : plH(M, l1.f)} — ${tx(dirTxtH(l1))}: ${tx(eqHtml(l1.w))}.`);
      Pl('cl', { a: v[l1.f], b: x, e1: 40, e2: 46 });
      if (l1.perp || l1.par) Mc('hl', { a: P[(l1.perp || l1.par)[0]], b: P[(l1.perp || l1.par)[1]], col: '#ffffff', only: true });
      n++;
      Kk.step(`<b>Шаг ${n}.</b> Вторая прямая: через ${l2.f === 'p' ? 'полюс p' : plH(M, l2.f)} — ${tx(dirTxtH(l2))}: ${tx(eqHtml(l2.w))}. Пересечение прямых — точка ${X}. ${tx(op.post || '')}`);
      Pl('cl', { a: v[l2.f], b: x, e1: 40, e2: 46 });
      if (l2.perp || l2.par) Mc('hl', { a: P[(l2.perp || l2.par)[0]], b: P[(l2.perp || l2.par)[1]], col: '#ffffff', only: true });
      [l1, l2].forEach(l => { if (l.f !== 'p') Pl('vec', { a: v[l.f], b: x, col: C.rel, w: 2 }); });
      Pl('vec', { a: [0, 0], b: x, col: C.found }); Pl('dot', { p: x, r: 3 }); L(op.k);
      n++;
    } else {
      Kk.step(`<b>Шаг ${n}. Точка ${X}.</b> ${tx(op.w)}`);
      if (op.r && op.r[0] !== 'p') Pl('seg', { a: v[op.r[0]], b: x, col: C.rel, w: 1.4 });
      Pl('vec', { a: [0, 0], b: x, col: C.found }); Pl('dot', { p: x, r: 3 }); L(op.k);
      if (op.r) Mc('hl', { a: P[op.on[0]], b: P[op.on[1]], col: '#ffffff', only: true });
      n++;
    }
  });
  if (cms.length) {
    Kk.step(`<b>Шаг ${n}. Центры масс</b> — по подобию: ${cms.map(o => tx(o.w)).join('; ')}. Скорость любой точки: V = μ<sub>V</sub>·|p…|.`);
    cms.forEach(op => { if (len(v[op.k]) > 1e-9 && !op.same) { Pl('vec', { a: [0, 0], b: v[op.k], col: C.found, w: 1.5, dash: '5 3' }); Pl('dot', { p: v[op.k], r: 2.6, col: C.text }); L(op.k, 12); } });
    n++;
  }
  if ((M.omegas || []).length) {
    const parts = M.omegas.map(o => `${htm(o.n)} = ${tx(o.f)} — <b>${dirW(S.om[o.n])}</b>${o.note ? ' (' + o.note + ')' : ''}`);
    Kk.step(`<b>Шаг ${n}. Угловые скорости.</b> ${parts.join('; ')}. Направление: вектор относительной скорости (например, ab) переносим в соответствующую точку схемы, закрепляем другую точку звена и смотрим, куда стрелка поворачивает звено.`);
    M.omegas.forEach(o => { const c = P[o.piv]; Mc('omega', omegaSpec(c, linkNb(M, o.piv), S.om[o.n], o.n, C.rel, (M.fixed || []).includes(o.piv), 24)); });
  }
  return Kk;
}

/* ---------- прогресс ---------- */
const PK = 'kin-kurs-v1';
let prog = {};
try { prog = JSON.parse(localStorage.getItem(PK) || '{}') || {}; } catch (e) { prog = {}; }
const save = () => { try { localStorage.setItem(PK, JSON.stringify(prog)); } catch (e) {} };
function markDone(id) { if (!id || prog[id]) { upd(); return; } prog[id] = 1; save(); upd(); }
function upd() {
  const blocks = Array.from(document.querySelectorAll('section.blk'));
  let doneN = 0;
  blocks.forEach((b, i) => {
    const tasks = Array.from(b.querySelectorAll('[data-task]')).map(e => e.dataset.task);
    const dn = tasks.filter(t => prog[t]).length, all = tasks.length;
    const done = all > 0 && dn === all;
    if (done) doneN++;
    const prev = blocks[i - 1], prevDone = !prev || (() => { const ts = Array.from(prev.querySelectorAll('[data-task]')).map(e => e.dataset.task); return ts.every(t => prog[t]); })();
    const open = true;
    b.classList.toggle('locked', !open);
    b.classList.toggle('done', done);
    const st = b.querySelector('.blk-st'); if (st) st.textContent = all ? (done ? 'пройден ✓' : `задачи: ${dn} из ${all}`) : '';
    const nav = document.querySelector(`.kn a[href="#${b.id}"]`);
    if (nav) { nav.classList.toggle('ok', done); nav.classList.toggle('lk', !open); }
    const nx = b.querySelector('.blk-next'); if (nx) nx.classList.toggle('on', done);
    b.querySelectorAll('[data-task]').forEach(e => e.classList.toggle('tdone', !!prog[e.dataset.task]));
  });
  const bar = document.querySelector('.kprog i'), lbl = document.querySelector('.kprog-l');
  const tot = blocks.filter(b => b.querySelector('[data-task]')).length;
  if (bar) bar.style.width = (doneN / Math.max(1, tot) * 100).toFixed(1) + '%';
  if (lbl) lbl.textContent = `Пройдено блоков: ${doneN} из ${tot}`;
}

/* ---------- конструктор плана ---------- */
function consWidget(host, M, tid) {
  const S = solveM(M), v = S.v, P = M.P;
  host.classList.add('cons');
  host.innerHTML = `<div class="duo"><div class="scb"><div class="sct">${M.title}</div><svg class="scsvg"></svg></div><div class="scb"><div class="sct">Твой план скоростей</div><svg class="scsvg"></svg></div></div><div class="cpan"></div>`;
  const svgs = host.querySelectorAll('svg');
  const sm = new Scene(svgs[0], { maxH: 300, pad: 40 }), sitems = schemeItems(M);
  sm.fit(K.fitPts(sitems)); drawItems(sm, sitems);
  const sp = new Scene(svgs[1], { maxH: 340, pad: 42 });
  sp.fit(Object.keys(v).map(k => v[k]).concat([[0, 0]]));
  const pan = host.querySelector('.cpan');
  const span = (() => { let m = 0; for (const k in v) m = Math.max(m, len(v[k])); return m || 1; })();
  const tol = 0.02 * span;
  // направления
  const dirs = [], seen = {};
  const addDir = (t, d) => { if (seen[t]) return; seen[t] = 1; dirs.push({ t: t, d: d }); };
  const segs = [];
  M.links.forEach(L => { for (let i = 0; i < L.pts.length; i++) for (let j = i + 1; j < L.pts.length; j++) segs.push([L.pts[i], L.pts[j]]); });
  (M.segs || []).forEach(s => segs.push(s));
  segs.forEach(s => { const a = s[0], b = s[1], d = sub(P[b], P[a]); addDir('⊥ ' + uni(a) + uni(b), rot(d)); addDir('∥ ' + uni(a) + uni(b), d); });
  addDir('∥ x–x (горизонтально)', [1, 0]); addDir('вертикально', [0, 1]);
  M.ops.forEach(op => (op.L || []).forEach(l => { if (l.dir) addDir(l.t, l.dir); }));
  // состояние
  let known = ['p', M.drive.key], items = [], oi = 0, phase = 'ops';
  const labelOf = k => k === 'p' ? 'p' : plLab(M, k);
  function redraw() {
    sp.clear();
    const keys = known.slice(), uniq = []; keys.forEach(k => { if (!uniq.some(u => len(sub(v[u], v[k])) < 1e-9)) uniq.push(k); });
    const lab = planLabels(M, v, uniq);
    const all = items.concat([{ k: 'dot', p: [0, 0], r: 3.6 }]).concat(lab.map(o => ({ k: 'lbl', p: v[o.k], t: labelOf(o.k), ang: o.ang, dist: 15 })));
    drawItems(sp, all);
  }
  items.push({ k: 'vec', a: [0, 0], b: v[M.drive.key], col: C.known }, { k: 'dot', p: v[M.drive.key], r: 3 });
  const optPts = () => known.filter((k, i) => known.findIndex(q => len(sub(v[q], v[k])) < 1e-9) === i).map(k => `<option value="${k}">${k === 'p' ? 'p (полюс)' : uni(labelOf(k).replace(/_\{([^}]*)\}/g, '$1'))}</option>`).join('');
  const optDirs = () => dirs.map((d, i) => `<option value="${i}">${d.t}</option>`).join('');
  function nextOp() {
    while (oi < M.ops.length && !M.ops[oi].L) {
      const ops = []; while (oi < M.ops.length && !M.ops[oi].L) { ops.push(M.ops[oi]); oi++; }
      showAuto(ops); return;
    }
    if (oi >= M.ops.length) { showOmega(); return; }
    showInt(M.ops[oi]);
  }
  function showAuto(ops) {
    const reg = ops.filter(o => !o.cm), cm = ops.filter(o => o.cm);
    pan.innerHTML = `<div class="cq">${reg.map(o => `<p><b>Точка ${plH(M, o.k)}.</b> ${tx(o.w)}</p>`).join('')}${cm.length ? `<p><b>Центры масс по подобию:</b> ${cm.map(o => tx(o.w)).join('; ')}.</p>` : ''}<button class="nx">Дальше ›</button></div>`;
    ops.forEach(o => {
      known.push(o.k);
      if (len(v[o.k]) > 1e-9 && !o.same) items.push({ k: 'vec', a: [0, 0], b: v[o.k], col: C.found, w: o.cm ? 1.5 : 2.4, dash: o.cm ? '5 3' : null }, { k: 'dot', p: v[o.k], r: 2.8 });
      if (o.r && o.r[0] !== 'p' && !o.cm) items.push({ k: 'seg', a: v[o.r[0]], b: v[o.k], col: C.rel, w: 1.4 });
    });
    redraw();
    pan.querySelector('.nx').onclick = nextOp;
  }
  function showInt(op) {
    let tries = 0;
    const X = plH(M, op.k);
    pan.innerHTML = `<div class="cq"><div class="cq-h">Найди точку ${X}</div><div class="cq-eq">${eqHtml(op.eq)}</div>
      <p class="small">Каждое слагаемое с одной чертой даёт прямую: через уже известную точку плана в известном направлении. Выбери две прямые.</p>
      ${[1, 2].map(i => `<div class="cq-row"><span class="cq-n">Прямая ${i}: через</span><select class="sp">${optPts()}</select><select class="sd"><option value="">направление…</option>${optDirs()}</select></div>`).join('')}
      <div class="cq-b"><button class="go">Провести</button><button class="hint">Подсказка</button></div><div class="fb"></div></div>`;
    const fb = pan.querySelector('.fb'), rows = pan.querySelectorAll('.cq-row');
    rows[1].querySelector('.sp').value = known.includes('p') ? 'p' : known[0];
    pan.querySelector('.hint').onclick = () => { fb.innerHTML = '<b>Подсказка.</b> ' + op.L.map((l, i) => `Прямая ${i + 1}: ${tx(eqHtml(l.w))}.`).join(' '); };
    pan.querySelector('.go').onclick = () => {
      const ls = Array.from(rows).map(r => ({ k: r.querySelector('.sp').value, d: r.querySelector('.sd').value }));
      if (ls.some(l => l.d === '')) { fb.innerHTML = '<span class="badc">Выбери направление для обеих прямых.</span>'; return; }
      const x = v[op.k];
      const res = ls.map(l => { const o = v[l.k], dd = unit(dirs[+l.d].d), dist = Math.abs(crs(dd, sub(x, o))); return { ok: dist < tol, o: o, dd: dd, l: l }; });
      const par = Math.abs(crs(res[0].dd, res[1].dd)) < 0.06;
      if (res[0].ok && res[1].ok && !par) {
        res.forEach(r => items.push({ k: 'cl', a: r.o, b: x, e1: 36, e2: 40 }));
        res.forEach(r => { if (r.l.k !== 'p') items.push({ k: 'vec', a: r.o, b: x, col: C.rel, w: 2 }); });
        items.push({ k: 'vec', a: [0, 0], b: x, col: C.found }, { k: 'dot', p: x, r: 3 });
        known.push(op.k); oi++; redraw();
        fb.innerHTML = `<span class="okc">Верно.</span> Пересечение прямых — точка ${X}. ${tx(op.post || '')}`;
        pan.querySelector('.cq-b').innerHTML = '<button class="nx">Дальше ›</button>';
        pan.querySelector('.nx').onclick = nextOp;
      } else {
        tries++;
        const msg = par && res[0].ok && res[1].ok ? 'Обе прямые совпали — нужны две разные прямые.' : res.map((r, i) => r.ok ? `Прямая ${i + 1} подходит.` : `Прямая ${i + 1} не проходит через искомую точку.`).join(' ');
        fb.innerHTML = `<span class="badc">Не сходится.</span> ${msg}${tries >= 2 ? ' <button class="show">Показать ответ</button>' : ''}`;
        const sh = fb.querySelector('.show');
        if (sh) sh.onclick = () => {
          op.L.forEach((l, i) => { rows[i].querySelector('.sp').value = known.find(k => len(sub(v[k], v[l.f])) < 1e-9) || l.f; const t = l.perp ? '⊥ ' + uni(l.perp[0]) + uni(l.perp[1]) : (l.par ? '∥ ' + uni(l.par[0]) + uni(l.par[1]) : l.t); let idx = dirs.findIndex(d => d.t === t); if (idx < 0 && l.perp) idx = dirs.findIndex(d => d.t === '⊥ ' + uni(l.perp[1]) + uni(l.perp[0])); if (idx < 0 && l.par) idx = dirs.findIndex(d => d.t === '∥ ' + uni(l.par[1]) + uni(l.par[0])); rows[i].querySelector('.sd').value = idx >= 0 ? String(idx) : ''; });
          fb.innerHTML = '<b>Правильные прямые выставлены.</b> ' + op.L.map((l, i) => `Прямая ${i + 1}: ${tx(eqHtml(l.w))}.`).join(' ') + ' Нажми «Провести».';
        };
      }
    };
  }
  function showOmega() {
    const om = M.omegas || [];
    if (!om.length) { finish(); return; }
    pan.innerHTML = `<div class="cq"><div class="cq-h">Последний шаг: направления угловых скоростей</div><p class="small">Перенеси вектор относительной скорости в точку схемы, закрепи другую точку звена и посмотри, куда повернётся звено.</p>${om.map((o, i) => `<div class="cq-row om" data-i="${i}"><span class="cq-n om-l">${htm(o.n)} = ${tx(o.f)}</span><button data-w="-1">↻ по часовой</button><button data-w="1">↺ против</button><span class="mk"></span></div>`).join('')}<div class="fb"></div></div>`;
    const okSet = new Set();
    pan.querySelectorAll('.om').forEach(r => r.querySelectorAll('button').forEach(b => b.onclick = () => {
      const o = om[+r.dataset.i], right = Math.sign(S.om[o.n]) === +b.dataset.w;
      r.querySelector('.mk').innerHTML = right ? '<span class="okc">✓</span>' : '<span class="badc">✗</span>';
      r.querySelectorAll('button').forEach(x => x.classList.remove('ok', 'bad')); b.classList.add(right ? 'ok' : 'bad');
      if (right) okSet.add(r.dataset.i); else okSet.delete(r.dataset.i);
      if (okSet.size === om.length) finish();
    }));
  }
  function finish() {
    const box = pan.querySelector('.cq') || pan;
    const f = hh('div', 'cdone', box, '<b>План построен ✓</b> Задача засчитана.');
    hh('button', 'again', f, 'Решить заново').onclick = () => consWidget(host, M, tid);
    markDone(tid);
  }
  redraw(); nextOp();
}

/* ---------- векторные уравнения ---------- */
function vexWidget(host, ex, tid, idx) {
  const g = {}; for (const n in ex.g) { const q = ex.g[n]; g[n] = { p0: [q[0][0], -q[0][1]], p1: [q[1][0], -q[1][1]], known: !!q[2] }; g[n].d = sub(g[n].p1, g[n].p0); }
  const eqH = ex.eq.map(t => Array.isArray(t) ? `<span class="vt${t[1] ? ' u' + t[1] : ''}"><span class="vv">${t[0]}</span></span>` : ` ${t} `).join('');
  host.classList.add('vex');
  host.innerHTML = `<div class="vex-h"><span class="tk-n">Упражнение ${idx}</span><span class="vex-eq">${eqH}</span></div><div class="fig"><div class="sct">Дано</div><svg class="scsvg"></svg></div><p class="small">Одна черта — известно только направление (пунктир), две — и направление, и величина. Разбор — сразу ниже: жми «Дальше» или «Конец».</p><div class="vsol"></div>`;
  const sc = new Scene(host.querySelector('svg'), { maxH: 240, pad: 30 }), it = [];
  for (const n in g) {
    const q = g[n];
    if (q.known) it.push({ k: 'vec', a: q.p0, b: q.p1, col: C.known });
    else it.push({ k: 'seg', a: q.p0, b: q.p1, col: C.muted, dash: '7 5', w: 1.4 });
    it.push({ k: 'lbl', p: mid(q.p0, q.p1), t: n, ang: angd(rot(q.d)), dist: 14, size: 16, col: q.known ? C.known : C.soft });
  }
  sc.fit(K.fitPts(it)); drawItems(sc, it);
  const box = host.querySelector('.vsol');
  mountKon(box, vexKon(ex, g));
  const chk = () => { const c = box.querySelector('.cnt'); if (c) { const [a, b] = c.textContent.split('/').map(s => parseInt(s, 10)); if (a === b) markDone(tid); } };
  box.addEventListener('click', () => setTimeout(chk, 50));
}
function vexKon(ex, g) {
  const Kk = new Kon(); Kk.scene('s', { maxH: 300, pad: 36 }); const m = Kk.fn('s'), O = [0, 0];
  const kv = n => g[n].d;
  const chain = (names, start) => { let e = start; const segs = []; names.forEach(n => { if (g[n] && g[n].known) { segs.push([n, e, add(e, kv(n))]); e = add(e, kv(n)); } }); return { e: e, segs: segs }; };
  const L = chain(ex.L, O), R = chain(ex.R, O);
  const unk = ex.L.filter(n => g[n] && !g[n].known).map(n => [n, 'L']).concat(ex.R.filter(n => g[n] && !g[n].known).map(n => [n, 'R']));
  let sn = 1; const st = t => Kk.step(t.replace('#', sn++));
  const lblV = (n, a, b, col) => { m('vec', { a: a, b: b, col: col }); m('lbl', { p: mid(a, b), t: n, ang: angd(rot(sub(b, a))), dist: 13, size: 16, col: col }); };
  st('<b>Шаг #.</b> Ставим общую начальную точку O. Обе части уравнения начинаются в ней и обязаны закончиться в одной точке — это и есть равенство векторов.');
  m('dot', { p: O, r: 3.4 }); m('lbl', { p: O, t: 'O', ang: 225, size: 13 });
  if (L.segs.length) { st(`<b>Шаг #. Левая часть.</b> Известные векторы откладываем друг за другом: каждый следующий — из конца предыдущего (${L.segs.map(s => s[0]).join(', ')}).`); L.segs.forEach(s => lblV(s[0], s[1], s[2], C.known)); }
  if (R.segs.length) { st(`<b>Шаг #. Правая часть.</b> От той же точки O откладываем известные векторы правой части: ${R.segs.map(s => s[0]).join(', ')}.`); R.segs.forEach(s => lblV(s[0], s[1], s[2], C.rel)); }
  if (ex.full) {
    st(`<b>Шаг #. Замыкаем.</b> Неизвестный вектор ${ex.full} целиком неизвестен (нет черт) — но он единственный, поэтому просто замыкаем: проводим его из конца правой части в конец левой. ${ex.full} = a − b.`);
    lblV(ex.full, R.e, L.e, C.found);
    return Kk;
  }
  const [u1, u2] = unk, d1 = g[u1[0]].d, d2 = g[u2[0]].d;
  let X, a1, b1, a2, b2, cap;
  if (u1[1] !== u2[1]) {
    const e1 = u1[1] === 'L' ? L.e : R.e, e2 = u2[1] === 'L' ? L.e : R.e;
    X = ll(e1, d1, e2, d2); a1 = e1; b1 = X; a2 = e2; b2 = X;
    cap = `через конец левой части — направление ${u1[1] === 'L' ? u1[0] : u2[0]}, через конец правой — направление ${u1[1] === 'R' ? u1[0] : u2[0]}`;
  } else {
    const eA = u1[1] === 'L' ? L.e : R.e, eB = u1[1] === 'L' ? R.e : L.e;
    X = ll(eA, d1, eB, d2); a1 = eA; b1 = X; a2 = X; b2 = eB;
    cap = `оба неизвестных в одной части: через конец её известных векторов — направление ${u1[0]}, а через конец другой части (здесь ${eB === O ? 'точка O' : 'конец правой'}) — направление ${u2[0]}`;
  }
  st(`<b>Шаг #. Неизвестные направления.</b> Ровно два неизвестных — длины ${u1[0]} и ${u2[0]}, их направления известны. Проводим две прямые: ${cap}.`);
  m('cl', { a: a1, b: X, e1: 40, e2: 50 }); m('cl', { a: b2, b: X, e1: 40, e2: 50 });
  st(`<b>Шаг #. Ответ.</b> Пересечение прямых — искомая точка. Обводим ${u1[0]} и ${u2[0]} и ставим стрелки так, чтобы левая и правая части пришли в одну точку.`);
  lblV(u1[0], a1, b1, C.found); lblV(u2[0], a2, b2, C.found); m('dot', { p: X, r: 3.4, col: C.found });
  return Kk;
}

/* ---------- тесты ---------- */
const Q = {
  v1: { q: 'Сколько неизвестных можно найти из одного векторного уравнения на плоскости?', o: ['Два (две величины, или величину и направление одного вектора)', 'Одно', 'Сколько угодно'], a: 0, e: 'Векторное равенство на плоскости — это два скалярных уравнения (по x и по y). Поэтому неизвестных не больше двух.' },
  v2: { q: 'Что означают две черты под вектором?', o: ['Известны и величина, и направление', 'Известно только направление', 'Вектор равен нулю'], a: 0, e: 'Черта — один известный параметр. Две черты — вектор известен полностью, его можно сразу отложить.' },
  v3: { q: 'Как сложить несколько векторов графически?', o: ['Строим друг за другом (каждый из конца предыдущего); сумма — из начала первого в конец последнего', 'Все из одной точки, сумма — самый длинный', 'Только по правилу параллелограмма, по два'], a: 0, e: 'Порядок слагаемых не важен, многоугольник векторов всё равно замкнётся в той же точке.' },
  p1: { q: 'Как направлен вектор скорости точки A кривошипа?', o: ['⊥ кривошипу, в сторону его вращения', 'Вдоль кривошипа, от O к A', 'Горизонтально'], a: 0, e: 'A ходит по окружности вокруг O — скорость по касательной, то есть ⊥ OA, и туда, куда крутит ω₁.' },
  p2: { q: 'Что такое V_BA в уравнении V_B = V_A + V_BA?', o: ['Скорость поворота B вокруг A, она ⊥ AB', 'Скорость B относительно стойки', 'Скорость A относительно B, ∥ AB'], a: 0, e: 'Плоское движение = поступательное вместе с A + поворот вокруг A. Поворот даёт V_BA = ω₂·l_AB, ⊥ AB.' },
  p3: { q: 'Как по плану найти скорость точки X?', o: ['V_X = μ_V · |px| — длина отрезка от полюса', 'V_X = μ_V · |ax|', 'V_X = |px| / μ_V'], a: 0, e: 'Абсолютные скорости — лучи из полюса. Масштаб μ_V = V_A / pa в (м/с)/мм.' },
  p4: { q: 'Через какую точку плана проводим направление абсолютной скорости ползуна V_B?', o: ['Через полюс p', 'Через точку a', 'Через середину pa'], a: 0, e: 'Абсолютная скорость — от полюса. Через a проводят только относительную V_BA.' },
  f1: { q: 'Где на плане скоростей лежат неподвижные точки (O, C, мгновенный центр W)?', o: ['В полюсе p', 'Там же, где на схеме', 'На продолжении pa'], a: 0, e: 'Их скорость — ноль, а нулевой вектор из p заканчивается в самом p.' },
  f2: { q: 'Как найти скорость точки K треугольного звена ABK, если a и b уже на плане?', o: ['По подобию: строим треугольник abk, подобный ABK (через a ⊥ AK, через b ⊥ BK)', 'k — середина ab', 'Через p ⊥ AK'], a: 0, e: 'Концы векторов скоростей точек одного звена образуют фигуру, подобную звену (повёрнутую на 90° в сторону ω).' },
  f3: { q: 'Как найти угловую скорость коромысла CB (C неподвижна)?', o: ['ω₃ = V_B / l_BC', 'ω₃ = V_BA / l_BC', 'ω₃ = V_A / l_BC'], a: 0, e: 'Коромысло вращается вокруг неподвижной C, у B только вращательная скорость.' },
  d1: { q: 'В каком порядке строят план скоростей шестизвенника?', o: ['В порядке присоединения групп Ассура: ведущее звено → первая диада → вторая', 'С последнего звена', 'В любом'], a: 0, e: 'Каждая следующая диада опирается на точки, найденные для предыдущей.' },
  k1: { q: 'Почему V_A2 = V_A1 (камень на кривошипе)?', o: ['Камень шарнирно сидит на пальце кривошипа: траектория A₂ — та же окружность радиуса O₁A', 'Потому что камень невесомый', 'Это верно только в мёртвой точке'], a: 0, e: 'Центр камня и конец кривошипа — одна точка шарнира.' },
  k2: { q: 'Как направлена относительная скорость V_A3A2 (кулиса относительно камня)?', o: ['∥ кулисе', '⊥ кулисе', '⊥ кривошипу'], a: 0, e: 'Камень может только скользить вдоль кулисы.' },
  k3: { q: 'Как связаны ω₂ камня и ω₃ кулисы?', o: ['ω₂ = ω₃ — камень поворачивается вместе с кулисой', 'ω₂ = ω₁', 'ω₂ = 0'], a: 0, e: 'Камень не может провернуться относительно кулисы, он только скользит по ней.' },
  k4: { q: 'Кулиса AB проходит через камень, шарнирно закреплённый на стойке в точке B. Как найти b₂?', o: ['Через a ⊥ AB и через p ∥ AB (V_B3 = 0)', 'Через a ∥ AB и через p ⊥ AB', 'b₂ совпадает с p'], a: 0, e: 'V_B2 = V_B3 + V_B2B3, V_B3 = 0, значит V_B2 — скольжение вдоль камня: из полюса ∥ AB.' },
  g1: { q: 'Почему в группе III порядка нельзя сразу решить V_A3 = V_A2 + V_A3A2?', o: ['У V_A3 неизвестны и величина, и направление — неизвестных больше двух', 'Потому что V_A2 неизвестна', 'Можно, просто долго'], a: 0, e: 'Направление V_A3 неизвестно: траектория точки A₃ не известна заранее.' },
  g2: { q: 'Точку Ассура K базисного звена BC строят так, чтобы…', o: ['AK ⊥ BC и BK ⊥ V_B', 'K — середина BC', 'CK ∥ O₂B'], a: 0, e: 'Тогда V_A3A2 и V_KA3 лежат на одной прямой ∥ BC, а V_K ⊥ BK — остаются две неизвестные.' },
  g3: { q: 'В способе «обратного порядка» масштаб плана определяется…', o: ['В конце: по полученной длине pa₁ и известной V_A1', 'Сразу, по V_B', 'Его не нужно определять'], a: 0, e: 'Начинают с произвольной длины pb. Если pa₁ пришёл против ω₁, направление pb выбрали неверно — план перечерчивают.' }
};
function mcqWidget(host, id, tid) {
  const q = Q[id]; if (!q) return;
  host.classList.add('mcq');
  const ord = q.o.map((_, i) => i).sort(() => Math.random() - 0.5);
  host.innerHTML = `<div class="qz-q">${tx(q.q.replace(/V_(\w+)/g, 'V_{$1}').replace(/l_(\w+)/g, 'l_{$1}'))}</div><div class="qz-o">${ord.map(i => `<button data-i="${i}">${tx(q.o[i].replace(/V_(\w+)/g, 'V_{$1}').replace(/l_(\w+)/g, 'l_{$1}'))}</button>`).join('')}</div><div class="fb"></div><button class="qz-show">Показать ответ</button>`;
  host.querySelector('.qz-show').onclick = () => { host.querySelectorAll('.qz-o button').forEach(x => { x.classList.remove('bad'); x.classList.toggle('ok', +x.dataset.i === q.a); }); host.querySelector('.fb').innerHTML = '<span class="okc">Ответ:</span> ' + tx(q.e.replace(/V_(\w+)/g, 'V_{$1}').replace(/l_(\w+)/g, 'l_{$1}')); };
  host.querySelectorAll('.qz-o button').forEach(b => b.onclick = () => {
    const i = +b.dataset.i, ok = i === q.a;
    host.querySelectorAll('.qz-o button').forEach(x => x.classList.remove('ok', 'bad'));
    b.classList.add(ok ? 'ok' : 'bad');
    host.querySelector('.fb').innerHTML = (ok ? '<span class="okc">Верно.</span> ' : '<span class="badc">Нет.</span> ') + tx(q.e.replace(/V_(\w+)/g, 'V_{$1}').replace(/l_(\w+)/g, 'l_{$1}'));
    if (ok) markDone(tid);
  });
}

/* ---------- особые разборы группы III порядка: обратный порядок ---------- */
function g3ReverseKon() {
  const M = MS.g3, S = solveM(M), v = S.v, P = M.P, Kk = new Kon();
  Kk.scene('mech', { maxH: 280, title: M.title }); Kk.scene('plan', { maxH: 360, title: 'План в обратном порядке' });
  schemeItems(M).forEach(it => Kk.add('mech', it));
  const Pl = Kk.fn('plan'), Mc = Kk.fn('mech'), k = 0.8, w = x => mul(x, k);
  const pts = { b: w(v.b), c: w(v.c), a3: w(v.a3), a12: w(v.a12) };
  const nb = q => Object.keys(pts).map(z => pts[z]).concat([[0, 0]]).filter(z => len(sub(z, q)) > 1e-6);
  Kk.step('<b>Шаг 1.</b> Начинаем не с ведущего звена, а с ведомого — со скорости точки B. V<sub>B</sub> ⊥ O<sub>2</sub>B, длину pb берём <b>произвольную</b>. Масштаб пока неизвестен — он определится в самом конце.');
  Pl('dot', { p: [0, 0], r: 3.6 }); Pl('lbl', { p: [0, 0], t: 'p', ang: bestAng([0, 0], nb([0, 0])) });
  Pl('vec', { a: [0, 0], b: pts.b, col: C.found }); Pl('lbl', { p: pts.b, t: 'b', ang: bestAng(pts.b, nb(pts.b)) });
  Mc('hl', { a: P.O2, b: P.B, col: '#ffffff', only: true });
  Kk.step('<b>Шаг 2.</b> V<sub>C</sub> = V<sub>B</sub> + V<sub>CB</sub>: через b — ⊥ BC, через p — горизонтально (ползун 5). Пересечение — c.');
  Pl('cl', { a: pts.b, b: pts.c, e1: 30, e2: 30 }); Pl('cl', { a: [0, 0], b: pts.c, e1: 30, e2: 30 });
  Pl('vec', { a: [0, 0], b: pts.c, col: C.found }); Pl('vec', { a: pts.b, b: pts.c, col: C.rel, w: 2 }); Pl('lbl', { p: pts.c, t: 'c', ang: bestAng(pts.c, nb(pts.c)) });
  Kk.step('<b>Шаг 3.</b> A лежит на BC — a<sub>3</sub> находим по подобию на отрезке bc.');
  Pl('vec', { a: [0, 0], b: pts.a3, col: C.found, w: 2 }); Pl('dot', { p: pts.a3, r: 3 }); Pl('lbl', { p: pts.a3, t: 'a_{3}', ang: bestAng(pts.a3, nb(pts.a3)) });
  Kk.step('<b>Шаг 4.</b> V<sub>A2</sub> = V<sub>A3</sub> + V<sub>A2A3</sub>: через a<sub>3</sub> — ∥ BC (скольжение камня), через p — ⊥ O<sub>1</sub>A (камень на кривошипе). Получили pa<sub>1</sub>.');
  Pl('cl', { a: pts.a3, b: pts.a12, e1: 30, e2: 30 }); Pl('cl', { a: [0, 0], b: pts.a12, e1: 30, e2: 30 });
  Pl('vec', { a: [0, 0], b: pts.a12, col: C.known }); Pl('lbl', { p: pts.a12, t: 'a_{1}, a_{2}', ang: bestAng(pts.a12, nb(pts.a12)) });
  Kk.step('<b>Шаг 5. Масштаб и проверка.</b> μ<sub>V</sub> = V<sub>A1</sub> / pa<sub>1</sub> = ω<sub>1</sub>·l<sub>O1A</sub> / pa<sub>1</sub>. Проверь направление: pa<sub>1</sub> должен смотреть туда, куда крутит ω<sub>1</sub>. Если вышло наоборот — значит, направление pb выбрали неверно, и план перечерчивают (на слайде так и показано).');
  return Kk;
}

/* ---------- запуск ---------- */
function boot() {
  document.querySelectorAll('[data-plan]').forEach(n => { try { mountKon(n, planKon(MS[n.dataset.plan])); } catch (e) { console.error('plan', n.dataset.plan, e); } });
  document.querySelectorAll('[data-scheme]').forEach(n => { try { const Kk = new Kon(); Kk.scene('m', { maxH: 260 }); schemeItems(MS[n.dataset.scheme]).forEach(it => Kk.add('m', it)); mountKon(n, Kk, { static: true }); } catch (e) { console.error('scheme', e); } });
  document.querySelectorAll('[data-cons]').forEach(n => {
    try {
      const id = n.dataset.cons, M = MS[id];
      if (!document.querySelector('[data-plan="' + id + '"]')) {
        const box = document.createElement('div'); box.className = 'task-sol';
        box.innerHTML = '<div class="sol-h"><span class="sol-tag">Разбор</span> ' + M.title + '</div><div class="ksol"></div>';
        n.parentNode.insertBefore(box, n); mountKon(box.querySelector('.ksol'), planKon(M));
      }
      const try1 = document.createElement('div'); try1.className = 'try-h'; try1.innerHTML = '<span class="sol-tag try">Сам</span> Построй этот план в конструкторе — по желанию, разбор выше';
      if (document.querySelector('[data-plan="' + id + '"]')) try1.innerHTML = '<span class="sol-tag try">Сам</span> Построй этот план в конструкторе — разбор этого механизма выше в блоке';
      n.parentNode.insertBefore(try1, n);
      consWidget(n, M, n.dataset.task);
    } catch (e) { console.error('cons', n.dataset.cons, e); }
  });
  document.querySelectorAll('[data-vex]').forEach(n => { try { const i = +n.dataset.vex; vexWidget(n, VX[i - 1], n.dataset.task, i); } catch (e) { console.error('vex', e); } });
  document.querySelectorAll('[data-mcq]').forEach(n => { try { mcqWidget(n, n.dataset.mcq, n.dataset.task); } catch (e) { console.error('mcq', e); } });
  document.querySelectorAll('[data-rev]').forEach(n => { try { mountKon(n, g3ReverseKon()); } catch (e) { console.error('rev', e); } });
  document.querySelectorAll('.blk-open').forEach(b => b.onclick = () => { const s = b.closest('section.blk'); prog['open-' + s.id] = 1; save(); upd(); });
  const rs = document.querySelector('.kreset'); if (rs) rs.onclick = () => { if (rs.dataset.c) { prog = {}; save(); location.reload(); } else { rs.dataset.c = 1; rs.textContent = 'Точно сбросить? Нажми ещё раз'; } };
  upd();
}
window.KCOURSE = { solveM, schemeItems, planKon, MS, prep };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
