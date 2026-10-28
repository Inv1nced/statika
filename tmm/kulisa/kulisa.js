/* Кулисы по пунктам: живые рисунки, построения по шагам, листание слайдов */
(function () {
'use strict';
const K = window.KRC, T = window.KTZ;
const { add, sub, mul, dot, len, unit, rot, dirv, angd, mid, lerp, ll, omegaOf, fs, f1, fa, fmu, fnum, dirW, Vh, Vs, Lh, el, hh, pth, C, Scene, drawItems, fitPts, bestAng, omegaSpec, Kon, mountKon, txt } = K;

/* ---------- пример: тот же механизм, что в КР по ТЗ ---------- */
const EX = T.EX6, KUL6 = T.KUL6, S6 = KUL6.solve(EX), kk = S6.k, ML = S6.ml, MV = S6.mv;
const mmV = v => f1(len(v) / MV);              // длина отрезка плана, мм
const mmL = x => f1(Math.abs(x) * kk / ML);    // длина на схеме, мм

/* положение кулисы при любом φ (для анимаций) */
function g1(phi) {
  const p = EX, O1 = [0, 0], O2 = p.O2, A = mul(dirv(phi), p.r), uA = sub(A, O2), lA = len(uA), u = mul(uA, 1 / lA), B = add(O2, mul(u, p.l3));
  const a = mul(rot(A), p.w1 * kk), a3 = ll(a, u, [0, 0], rot(u)) || [0, 0];
  return { phi, O1, O2, A, B, u, lA, a, a3, rel: sub(a3, a), w3: omegaOf(O2, A, [0, 0], a3, kk) };
}
const norm = a => ((a % 360) + 360) % 360;

/* ---------- рисунок механизма (только кривошип, камень, кулиса) ---------- */
function mechItems(g, o) {
  o = o || {}; const it = [];
  it.push({ k: 'ray', a: g.O1, d: [1, 0], l: 40 });
  it.push({ k: 'link', a: g.O2, b: g.B, col: C.l2, w: 4 });
  it.push({ k: 'link', a: g.O1, b: g.A, col: C.l1 });
  it.push({ k: 'slider', p: g.A, d: g.u, col: C.l3, w: 30, h: 16 });
  it.push({ k: 'ground', p: g.O1 }, { k: 'ground', p: g.O2 });
  [g.O1, g.O2, g.A, g.B].forEach(q => it.push({ k: 'joint', p: q }));
  const n = rot(g.u), away = dot(n, sub(g.O1, g.A)) > 0 ? mul(n, -1) : n;
  it.push({ k: 'lbl', p: g.A, t: 'A', ang: angd(away), dist: 24 });
  it.push({ k: 'lbl', p: g.B, t: 'B', ang: angd(g.u), dist: 16 });
  const side = dot(mul(rot(g.u), -1), sub(g.O1, g.A)) > 0 ? -1 : 1, vDim = side > 0 ? mul(rot(g.u), -1) : rot(g.u);
  it.push({ k: 'lbl', p: g.O2, t: 'O_{2}', ang: o.dim ? angd(mul(vDim, -1)) + 20 * Math.sign(vDim[0] || 1) : 0, dist: 22 });
  const om = norm(g.phi + 180);
  it.push({ k: 'omega', c: g.O1, r: 30, a: om + 50, span: 100, cw: EX.w1 < 0, t: 'ω_{1}', col: C.known });
  it.push({ k: 'lbl', p: g.O1, t: 'O_{1}', ang: bestAng(g.O1, [g.A], [om, om + 40, om - 40, 250, 270, 290, angd(sub(g.O2, g.O1))]), dist: 21 });
  if (o.dim) {
    it.push({ k: 'dim', a: g.O2, b: g.A, off: 15 * side, t: 'O_{2}A', col: C.found });
  }
  return it;
}

/* живая сцена: одна или две картинки, ползунок φ, пауза */
function live(host, o) {
  host.classList.add('fig'); host.innerHTML = '';
  const wrap = hh('div', o.plan ? 'lv-duo' : '', host), scs = [];
  const mk = (title, opt, pts) => {
    const box = hh('div', '', wrap); if (o.plan) hh('div', 'sct', box, title);
    const svg = el('svg', { class: 'scsvg', role: 'img', 'aria-label': title }, box);
    const sc = new Scene(svg, opt); sc.fit(pts); scs.push(sc); return sc;
  };
  const fitM = [], fitP = [[0, 0]];
  for (let a = 0; a < 360; a += 5) { const g = g1(a); fitM.push(...fitPts(o.items(g))); }
  const R0 = len(g1(0).a); fitP.push([-R0, -R0], [R0, R0]);
  const scM = mk('Механизм', { W: 400, maxH: o.maxH || 340, pad: 30 }, fitM);
  const scP = o.plan ? mk('План скоростей (живой)', { W: 300, maxH: o.maxH || 340, pad: 30 }, fitP) : null;
  if (o.legend) hh('div', 'legend', host, o.legend);
  const ctl = hh('div', 'lv-ctl', host), bt = hh('button', '', ctl, '❚❚');
  bt.setAttribute('aria-label', 'Пауза');
  const rg = hh('input', '', ctl); rg.type = 'range'; rg.min = 0; rg.max = 359; rg.step = 1; rg.setAttribute('aria-label', 'Угол φ');
  const val = hh('span', 'lv-v', ctl), info = hh('div', 'cap lv-info', host);
  let phi = o.phi0, run = true, active = false, raf = 0, last = 0, lastInfo = 0;
  function draw(force) {
    const g = g1(phi);
    scM.clear(); drawItems(scM, o.items(g));
    if (scP) { scP.clear(); drawItems(scP, o.plan(g)); }
    rg.value = Math.round(norm(phi)) % 360; val.textContent = 'φ = ' + (Math.round(norm(phi)) % 360) + '°';
    const now = performance.now(); if (force || now - lastInfo > 120) { info.innerHTML = o.info(g); lastInfo = now; }
  }
  function tick(now) {
    if (!active) return;
    if (run) { const dt = last ? Math.min(50, now - last) : 0; phi += (o.speed || -24) * dt / 1000; draw(); }
    last = now; raf = requestAnimationFrame(tick);
  }
  const setRun = r => { run = r; bt.textContent = r ? '❚❚' : '▶'; bt.setAttribute('aria-label', r ? 'Пауза' : 'Пуск'); };
  bt.onclick = () => setRun(!run);
  rg.oninput = () => { setRun(false); phi = +rg.value; draw(true); };
  draw(true);
  return { show() { active = true; last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }, hide() { active = false; cancelAnimationFrame(raf); } };
}

/* слайд 2: устройство */
function anat(host) {
  return live(host, {
    phi0: EX.phi, maxH: 360,
    items: g => mechItems(g, { dim: true }),
    legend: '<span class="chip"><i style="background:var(--l1)"></i>1 — кривошип</span><span class="chip"><i style="background:var(--l3)"></i>2 — камень</span><span class="chip"><i style="background:var(--l2)"></i>3 — кулиса</span><span class="chip"><i style="background:var(--found)"></i>O<sub>2</sub>A — меняется</span>',
    info: g => {
      const sl = dot(sub(g.a, g.a3), g.u), w = g.w3;
      return `Камень сейчас едет вдоль кулисы <b>${Math.abs(sl) < 0.02 ? '— почти стоит на месте' : (sl > 0 ? 'от O<sub>2</sub> к B' : 'к O<sub>2</sub>')}</b>, кулиса поворачивается <b>${Math.abs(w) < 0.15 ? '— почти стоит (крайнее положение)' : dirW(w)}</b>. O<sub>2</sub>A = <b>${f1(g.lA)} мм</b> — эта длина всё время меняется.`;
    }
  });
}

/* слайд 4: разложение скорости камня + живой план */
function decomp(host) {
  const kv = 62 / len(g1(0).a);
  const vecs = g => {
    const t2 = add(g.A, mul(g.a, kv)), t3 = add(g.A, mul(g.a3, kv)), it = [];
    it.push({ k: 'cl', a: sub(g.A, mul(g.u, 40)), b: add(g.A, mul(g.u, 40)), e1: 0, e2: 0, col: 'rgba(46,230,197,.55)' });
    if (len(g.a3) > 0.02) it.push({ k: 'vec', a: g.A, b: t3, col: C.found });
    if (len(g.rel) > 0.02) it.push({ k: 'vec', a: t2, b: t3, col: C.rel });
    it.push({ k: 'vec', a: g.A, b: t2, col: C.known });
    if (len(g.a3) > 0.06 && len(g.rel) > 0.06) it.push({ k: 'ra', p: t3, d1: mul(g.a3, -1), d2: sub(g.a, g.a3), col: C.found, size: 8 });
    it.push({ k: 'lbl', p: t2, t: 'V_{A2}', ang: angd(g.a), dist: 18, col: C.known, size: 13 });
    if (len(g.a3) > 0.1) it.push({ k: 'lbl', p: t3, t: 'V_{A3}', ang: angd(g.a3), dist: 18, col: C.found, size: 13 });
    return it;
  };
  return live(host, {
    phi0: EX.phi, maxH: 330,
    items: g => mechItems(g).concat(vecs(g)),
    plan: g => {
      const o = [0, 0], it = [];
      it.push({ k: 'dot', p: o }); it.push({ k: 'lbl', p: o, t: 'p', ang: bestAng(o, [g.a, g.a3]) });
      if (len(g.a3) > 0.02) it.push({ k: 'vec', a: o, b: g.a3, col: C.found });
      if (len(g.rel) > 0.02) it.push({ k: 'vec', a: g.a, b: g.a3, col: C.rel });
      it.push({ k: 'vec', a: o, b: g.a, col: C.known });
      if (len(g.a3) > 0.06 && len(g.rel) > 0.06) it.push({ k: 'ra', p: g.a3, d1: mul(g.a3, -1), d2: sub(g.a, g.a3), col: C.found, size: 8 });
      it.push({ k: 'lbl', p: g.a, t: 'a_{2}', ang: bestAng(g.a, [o, g.a3]), size: 13 });
      if (len(g.a3) > 0.04) it.push({ k: 'lbl', p: g.a3, t: 'a_{3}', ang: bestAng(g.a3, [o, g.a]), size: 13 });
      it.push({ k: 'pad', p: [-0.62, -0.62] }, { k: 'pad', p: [0.62, 0.62] });
      return it;
    },
    legend: '<span class="chip"><i style="background:var(--known)"></i>V<sub>A2</sub> — скорость камня (известна)</span><span class="chip"><i style="background:var(--found)"></i>V<sub>A3</sub> — поперёк кулисы: её поворот</span><span class="chip"><i style="background:var(--rel)"></i>V<sub>A3A2</sub> — вдоль кулисы: скольжение</span>',
    info: g => {
      const v3 = len(g.a3), vr = len(g.rel), vA = len(g.a);
      let s = `V<sub>A2</sub> = ${fs(vA)} м/с → поперёк кулисы <b class="xf">V<sub>A3</sub> = ${fs(v3)} м/с</b>, вдоль <b class="xr">V<sub>A3A2</sub> = ${fs(vr)} м/с</b>.`;
      if (v3 < 0.06) s += ' <span class="hot">Сейчас кривошип ⊥ кулисе: вся скорость камня идёт вдоль неё, V<sub>A3</sub> ≈ 0 — кулиса в крайнем положении, на миг остановилась.</span>';
      else if (vr < 0.06) s += ' <span class="hot">Сейчас кривошип вдоль кулисы: скольжения нет, V<sub>A3</sub> ≈ V<sub>A2</sub>.</span>';
      return s;
    }
  });
}

/* слайд 3: три точки в A (крупно, не в масштабе) */
function zoom(host) {
  host.classList.add('fig'); host.innerHTML = '';
  const svg = el('svg', { class: 'scsvg', viewBox: '0 0 420 362', role: 'img', 'aria-label': 'Точка A крупно: кривошип, камень, кулиса' }, host);
  const th = 64 * Math.PI / 180, d = [Math.cos(th), -Math.sin(th)], n = [-d[1], d[0]], Cs = [214, 184];
  const P = (s, t) => [Cs[0] + d[0] * s + n[0] * t, Cs[1] + d[1] * s + n[1] * t];
  const poly = pts => pth(pts) + 'Z';
  const defs = el('defs', null, svg), mk = (id, col) => { const m = el('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto-start-reverse' }, defs); el('path', { d: 'M0 .6L10 5L0 9.4z', fill: col }, m); return 'url(#' + id + ')'; };
  const mR = mk('zr', C.rel), mT = mk('zt', C.l2);
  // кулиса: корпус, прорезь, ось
  el('path', { d: poly([P(-128, -24), P(118, -24), P(118, 24), P(-128, 24)]), fill: 'rgba(46,230,197,.10)', stroke: C.l2, 'stroke-width': 2.2 }, svg);
  el('path', { d: poly([P(-114, -12), P(104, -12), P(104, 12), P(-114, 12)]), fill: C.bg, stroke: C.l2, 'stroke-width': 1, 'stroke-opacity': .7 }, svg);
  el('path', { d: pth([P(-146, 0), P(132, 0)]), stroke: C.l2, 'stroke-width': 1, 'stroke-dasharray': '6 5', 'stroke-opacity': .7, fill: 'none' }, svg);
  // камень
  el('path', { d: poly([P(-34, -11), P(34, -11), P(34, 11), P(-34, 11)]), fill: '#2a2410', stroke: C.l3, 'stroke-width': 2.6 }, svg);
  // скольжение — внутри прорези
  el('path', { d: pth([P(46, 0), P(94, 0)]), stroke: C.rel, 'stroke-width': 2.4, fill: 'none', 'marker-end': mR, 'marker-start': mR }, svg);
  const ts = P(72, 34); txt(svg, ts[0], ts[1] + 4, 'скользит', C.rel, 12.5, 700, 'start');
  // кривошип поверх, палец
  const O1s = [26, 102];
  el('path', { d: pth([O1s, Cs]), stroke: C.l1, 'stroke-width': 11, 'stroke-linecap': 'round', fill: 'none', 'stroke-opacity': .95 }, svg);
  el('circle', { cx: Cs[0], cy: Cs[1], r: 8, fill: C.bg, stroke: C.text, 'stroke-width': 2 }, svg);
  el('circle', { cx: Cs[0], cy: Cs[1], r: 2.6, fill: C.text }, svg);
  txt(svg, O1s[0] - 4, O1s[1] + 28, 'от O_{1}', C.l1, 12, 600, 'start');
  // качание конца кулисы
  const q1 = P(126, -40), q2 = P(142, 0), q3 = P(126, 40);
  el('path', { d: `M${q1[0].toFixed(1)} ${q1[1].toFixed(1)}Q${q2[0].toFixed(1)} ${q2[1].toFixed(1)} ${q3[0].toFixed(1)} ${q3[1].toFixed(1)}`, stroke: C.l2, 'stroke-width': 1.8, fill: 'none', 'marker-end': mT, 'marker-start': mT }, svg);
  const tq = P(150, 2); txt(svg, tq[0] + 4, tq[1], 'качается', C.l2, 12.5, 700, 'start');
  const tb = P(-140, 0); txt(svg, tb[0] - 10, tb[1] + 22, 'к опоре O_{2}', C.l2, 12, 600, 'middle');
  // выноски
  const call = (to, x, y, s, col, anchor) => {
    el('path', { d: pth([to, [x, y]]), stroke: col, 'stroke-width': 1.2, fill: 'none', 'stroke-dasharray': '3 3' }, svg);
    el('circle', { cx: x, cy: y, r: 2.6, fill: col }, svg); el('circle', { cx: to[0], cy: to[1], r: 2.6, fill: col }, svg);
    txt(svg, x + (anchor === 'end' ? -7 : 7), y + 5, s, col, 14.5, 700, anchor);
  };
  call(P(4, -7), 118, 50, 'A_{1} — кривошип', C.l1, 'end');
  call(P(-22, 8), 300, 304, 'A_{2} — камень', C.l3, 'start');
  call(P(14, 18), 316, 196, 'A_{3} — кулиса', C.l2, 'start');
  txt(svg, 210, 354, 'три точки в одном месте — у каждой своя скорость', C.muted, 12.5, 600);
}

/* статичная картинка правила двух прямых (слайд 5) */
function ruleFig(host) {
  const g = S6, o = [0, 0], Kk = new Kon(); Kk.scene('plan', { maxH: 330, W: 380 });
  const P = (k, pr) => Kk.add('plan', Object.assign({ k, s: -1 }, pr));
  const ea = sub(g.a3, g.a), ep = g.a3;
  P('cl', { a: g.a, b: g.a3, e1: 70, e2: 70, col: C.rel }); P('cl', { a: o, b: g.a3, e1: 40, e2: 70, col: C.found });
  P('vec', { a: o, b: g.a, col: C.known }); P('vec', { a: o, b: g.a3, col: C.found }); P('vec', { a: g.a, b: g.a3, col: C.rel });
  P('ra', { p: g.a3, d1: mul(g.a3, -1), d2: sub(g.a, g.a3), col: C.found });
  P('dot', { p: o }); P('dot', { p: g.a3, col: C.found });
  P('lbl', { p: o, t: 'p', ang: bestAng(o, [g.a, g.a3]) });
  P('lbl', { p: g.a, t: 'a_{1} = a_{2}', ang: bestAng(g.a, [o, g.a3]), dist: 30 });
  P('lbl', { p: g.a3, t: 'a_{3}', ang: bestAng(g.a3, [o, g.a, add(g.a3, ea), add(g.a3, ep)]), dist: 18, col: C.found });
  P('lbl', { p: sub(g.a, mul(ea, 0.75)), t: 'через a_{2}: ∥ кулисе', ang: angd(rot(ea)) + 180, dist: 14, col: C.rel, size: 13 });
  P('lbl', { p: mul(g.a3, 0.5), t: 'через p: ⊥ O_{2}A', ang: angd(rot(ep)) + (rot(ep)[1] < 0 ? 180 : 0), dist: 16, col: C.found, size: 13 });
  host.classList.add('fig'); const box = hh('div', '', host); mountKon(box, Kk, { static: true });
  hh('div', 'legend', host, '<span class="chip"><i style="background:var(--known)"></i>pa<sub>2</sub> = V<sub>A2</sub></span><span class="chip"><i style="background:var(--found)"></i>pa<sub>3</sub> = V<sub>A3</sub></span><span class="chip"><i style="background:var(--rel)"></i>a<sub>2</sub>a<sub>3</sub> = V<sub>A3A2</sub></span>');
}

/* рисунок кулисы для пошаговых построений */
function drawKul(Kk, n, g, o) {
  o = o || {}; const m = (k, pr) => Kk.add(n, Object.assign({ k, s: o.s }, pr)), p = g.p;
  m('ray', { a: g.O1, d: [1, 0], l: 40 });
  m('link', { a: g.O2, b: g.B, col: C.l2 }); m('link', { a: g.O1, b: g.A, col: C.l1 }); m('slider', { p: g.A, d: g.u, col: C.l3 });
  m('ground', { p: g.O1 }); m('ground', { p: g.O2 }); [g.O1, g.O2, g.A, g.B].forEach(q => m('joint', { p: q }));
  const n2 = rot(g.u), away = dot(n2, sub(g.O1, g.A)) > 0 ? mul(n2, -1) : n2;
  m('lbl', { p: g.A, t: 'A', ang: angd(away), dist: 23 });
  m('lbl', { p: g.B, t: 'B', ang: angd(g.u), dist: 16 });
  m('lbl', { p: g.O2, t: 'O_{2}', ang: 0, dist: 22 });
  m('omega', omegaSpec(g.O1, [g.A, add(g.O1, [1, 0]), add(g.O1, dirv(p.phi / 2)), g.O2], p.w1, 'ω_{1}', C.known, true, 30));
  m('lbl', { p: g.O1, t: 'O_{1}', ang: 160, dist: 22 });
  m('ang', { c: g.O1, a0: 0, a1: p.phi, r: 18, t: 'φ', col: C.muted, td: 10 });
  if (o.s3) { m('dot', { p: g.S3, r: 2.8 }); m('lbl', { p: g.S3, t: 'S_{3}', ang: angd(mul(away, -1)), size: 12, col: C.muted }); }
}

/* слайд 6: строим a3 */
function kA3(host) {
  const g = S6, o = [0, 0], Kk = new Kon();
  Kk.scene('mech', { W: 300, maxH: 430, title: 'Механизм' }); Kk.scene('plan', { maxH: 380, title: 'План скоростей' });
  drawKul(Kk, 'mech', g, { s: -1 });
  const M = Kk.fn('mech'), P = Kk.fn('plan'), kv = 58 / g.vA;
  Kk.step(`<b>1. Скорость точки A кривошипа.</b> V<sub>A1</sub> = ω<sub>1</sub>·l<sub>O1A</sub> = ${fnum(Math.abs(EX.w1))}·${fnum(EX.r * kk)} = <b>${fs(g.vA)} м/с</b>. Камень надет на палец кривошипа → V<sub>A2</sub> = V<sub>A1</sub>. Масштаб: μ<sub>V</sub> = ${fmu(MV)} (м/с)/мм → pa<sub>1</sub> = ${fs(g.vA)} / ${fmu(MV)} = <b>${mmV(g.a)} мм</b>. Ставим полюс p в свободном месте листа.`);
  P('dot', { p: o }); P('lbl', { p: o, t: 'p', ang: bestAng(o, [g.a, g.a3]) });
  P('pad', { p: [g.a[0] * 1.05, g.a[1] * 1.05] }); P('pad', { p: [-0.05, 0.08] });
  Kk.step(`<b>2. Вектор pa<sub>1</sub> ⊥ O<sub>1</sub>A.</b> Стрелка — туда, куда ω<sub>1</sub> (${dirW(EX.w1)}) толкает точку A: на схеме у A показано то же направление. Откладываем ${mmV(g.a)} мм. Конец — точка <b>a<sub>1</sub> = a<sub>2</sub></b>: у камня и пальца одна скорость.`);
  P('vec', { a: o, b: g.a, col: C.known }); P('lbl', { p: g.a, t: 'a_{1} = a_{2}', ang: bestAng(g.a, [o, g.a3]), dist: 28 });
  M('hl', { a: g.O1, b: g.A, col: C.l1, only: true }); M('vec', { a: g.A, b: add(g.A, mul(g.a, kv)), col: C.known, only: true });
  Kk.step(`<b>3. Через a<sub>2</sub> — прямая ∥ кулисе.</b> Это линия для V<sub>A3A2</sub>: относительно камня кулиса может только скользить вдоль себя. Угольник катетом вдоль O<sub>2</sub>B (подсвечена на схеме), линейку к гипотенузе, держим линейку и сдвигаем угольник до a<sub>2</sub> — проводим.`);
  P('cl', { a: g.a, b: g.a3, e1: 46, e2: 46, col: C.rel }); M('hl', { a: g.O2, b: g.B, col: C.l2, only: true });
  Kk.step(`<b>4. Через p — прямая ⊥ кулисе.</b> Это линия для V<sub>A3</sub>: точка A<sub>3</sub> вращается вместе с кулисой вокруг O<sub>2</sub>, её скорость ⊥ радиусу O<sub>2</sub>A. Скорость абсолютная — поэтому из полюса. Линейку не трогаем, угольник двигаем до p и проводим по <b>второму</b> катету: угол ровно 90°.`);
  P('cl', { a: o, b: g.a3, e1: 34, e2: 46, col: C.found }); M('hl', { a: g.O2, b: g.A, col: C.found, only: true });
  Kk.step(`<b>5. Пересечение прямых — точка a<sub>3</sub>.</b> Стрелки ставим к a<sub>3</sub>: pa<sub>3</sub> — это V<sub>A3</sub>, a<sub>2</sub>a<sub>3</sub> — это V<sub>A3A2</sub>. Треугольник p a<sub>2</sub> a<sub>3</sub> прямоугольный, прямой угол при a<sub>3</sub> — так и проверяем, что прямые проведены верно.`);
  P('dot', { p: g.a3, col: C.found }); P('lbl', { p: g.a3, t: 'a_{3}', ang: bestAng(g.a3, [o, g.a]), col: C.found });
  P('vec', { a: o, b: g.a3, col: C.found }); P('vec', { a: g.a, b: g.a3, col: C.rel }); P('ra', { p: g.a3, d1: mul(g.a3, -1), d2: sub(g.a, g.a3), col: C.found });
  Kk.step(`<b>6. Меряем линейкой и умножаем на μ<sub>V</sub>.</b> pa<sub>3</sub> ≈ ${mmV(g.a3)} мм → V<sub>A3</sub> = ${mmV(g.a3)}·${fmu(MV)} = <b>${fs(len(g.a3))} м/с</b>. a<sub>2</sub>a<sub>3</sub> ≈ ${mmV(g.slip)} мм → V<sub>A3A2</sub> = <b>${fs(len(g.slip))} м/с</b> — с такой скоростью камень скользит по кулисе.`);
  P('dim', { a: o, b: g.a3, off: -16, t: mmV(g.a3) + ' мм', col: C.found }); P('dim', { a: g.a, b: g.a3, off: 14, t: mmV(g.slip) + ' мм', col: C.rel });
  mountKon(host, Kk);
}

/* слайд 7: ω3 и точка B */
function kW3(host) {
  const g = S6, o = [0, 0], Kk = new Kon();
  Kk.scene('mech', { W: 300, maxH: 430, title: 'Механизм' }); Kk.scene('plan', { maxH: 380, title: 'План скоростей' });
  drawKul(Kk, 'mech', g, { s: -1 });
  const M = Kk.fn('mech'), P = Kk.fn('plan'), kv = 58 / g.vA, Pa = (k, pr) => Kk.add('plan', Object.assign({ k, s: -1 }, pr));
  Pa('dot', { p: o }); Pa('lbl', { p: o, t: 'p', ang: bestAng(o, [g.a, g.a3, g.b]) });
  Pa('vec', { a: o, b: g.a, col: C.known }); Pa('vec', { a: o, b: g.a3, col: C.found }); Pa('vec', { a: g.a, b: g.a3, col: C.rel });
  Pa('lbl', { p: g.a, t: 'a_{2}', ang: bestAng(g.a, [o, g.a3]) }); Pa('lbl', { p: g.a3, t: 'a_{3}', ang: bestAng(g.a3, [o, g.a, g.b]), col: C.found });
  const lA = g.lA * kk, w3 = Math.abs(g.w3);
  Kk.step(`<b>1. Меряем O<sub>2</sub>A на своей схеме.</b> Это расстояние от опоры до камня <b>в этом положении</b>, а не длина кулисы. На листе ≈ ${mmL(g.lA)} мм, μ<sub>l</sub> = ${fmu(ML)} м/мм → l<sub>O2A</sub> = ${mmL(g.lA)}·${fmu(ML)} = <b>${fs(lA)} м</b>.`);
  M('dim', { a: g.O2, b: g.A, off: -15, t: mmL(g.lA) + ' мм', col: C.found });
  Kk.step(`<b>2. ω<sub>3</sub> = V<sub>A3</sub> / l<sub>O2A</sub></b> = ${fs(len(g.a3))} / ${fs(lA)} = <b>${fs(w3)} рад/с</b>. Камень сидит в прорези и провернуться относительно кулисы не может, поэтому <b>ω<sub>2</sub> = ω<sub>3</sub></b> — это тоже пишем в ответ.`);
  Kk.step(`<b>3. Направление ω<sub>3</sub>.</b> Переносим вектор pa<sub>3</sub> (параллельно, той же длины) в точку A схемы. Он толкает кулису вокруг неподвижной O<sub>2</sub> → кулиса поворачивается <b>${dirW(g.w3)}</b>. Рисуем дуговую стрелку ω<sub>3</sub> у O<sub>2</sub>.`);
  M('vec', { a: g.A, b: add(g.A, mul(g.a3, kv)), col: C.found }); M('omega', omegaSpec(g.O2, [g.B], g.w3, 'ω_{3}', C.found, true, 26));
  Kk.step(`<b>4. Скорости точек кулисы.</b> Кулиса — одно твёрдое звено, вращается вокруг O<sub>2</sub>. Скорость любой её точки ⊥ кулисе и растёт пропорционально расстоянию до O<sub>2</sub> — стрелки образуют треугольник. Поэтому B быстрее A в O<sub>2</sub>B/O<sub>2</sub>A = ${fnum(EX.l3)}/${f1(g.lA)} = ${fs(EX.l3 / g.lA)} раза.`);
  const vn = mul(g.a3, kv / g.lA);
  [0.25, 0.5, 0.75, 1].forEach(t => { const q = lerp(g.O2, g.B, t), dl = t * EX.l3; M('vec', { a: q, b: add(q, mul(vn, dl)), col: C.found, w: 1.8 }); });
  M('seg', { a: g.O2, b: add(g.B, mul(vn, EX.l3)), dash: '4 3', col: C.found });
  Kk.step(`<b>5. Точка b на плане</b> — на продолжении луча pa<sub>3</sub>: pb = pa<sub>3</sub>·O<sub>2</sub>B/O<sub>2</sub>A = ${mmV(g.a3)}·${fnum(EX.l3)}/${f1(g.lA)} ≈ <b>${mmV(g.b)} мм</b> → V<sub>B</sub> = <b>${fs(len(g.b))} м/с</b>. Новых прямых не нужно. Точка по другую сторону от O<sub>2</sub> легла бы на продолжение луча за p.`);
  P('cl', { a: o, b: g.b, e1: 0, e2: 24, col: C.found }); P('vec', { a: o, b: g.b, col: C.found, w: 2.2 }); P('dot', { p: g.b }); P('lbl', { p: g.b, t: 'b', ang: bestAng(g.b, [o, g.a3]) });
  M('hl', { a: g.O2, b: g.B, col: C.l2, only: true });
  Kk.step(`<b>6. Центр масс S<sub>3</sub></b> — середина O<sub>2</sub>B, значит s<sub>3</sub> — середина pb: V<sub>S3</sub> = ${fs(len(g.s3))} м/с. Проверка: ω<sub>3</sub> = V<sub>B</sub> / l<sub>O2B</sub> = ${fs(len(g.b))} / ${fnum(EX.l3 * kk)} = ${fs(len(g.b) / (EX.l3 * kk))} рад/с — совпало.`);
  P('dot', { p: g.s3, r: 3 }); P('lbl', { p: g.s3, t: 's_{3}', ang: bestAng(g.s3, [o, g.b, g.a3, g.a]), size: 13 });
  M('dot', { p: g.S3, r: 3 }); M('lbl', { p: g.S3, t: 'S_{3}', ang: angd(rot(g.u)) + (dot(rot(g.u), sub(g.O1, g.S3)) > 0 ? 180 : 0), size: 12, col: C.muted });
  mountKon(host, Kk);
}

/* слайд 8–9: полный механизм КР */
function resTable(host) {
  const rows = KUL6.rows(S6);
  let h = '<div class="tw"><table class="kt-t"><tr><th>Величина</th><th>На плане</th><th>Отрезок, мм</th><th>Значение</th></tr>';
  rows.forEach(r => { const om = r[2] == null; h += `<tr><td>${r[0]}</td><td>${r[1] || '—'}</td><td class="n">${om ? '—' : f1(r[2])}</td><td class="n"><b>${fs(r[3])}</b> ${om ? 'рад/с' + (r[4] ? ', ' + r[4] : '') : 'м/с'}</td></tr>`; });
  host.innerHTML = h + '</table></div>';
}

/* слайд 10: камень на стойке */
const Q = { u: 'мм', r: 50, B: [140, 0], lAC: 240, phi: 120, w1: 10 };
function solveQ(q) {
  const O1 = [0, 0], A = mul(dirv(q.phi), q.r), AB = sub(q.B, A), lAB = len(AB), u = mul(AB, 1 / lAB), Cc = add(A, mul(u, q.lAC));
  const a = mul(rot(A), q.w1 * kk), b2 = ll(a, rot(u), [0, 0], u), c = add(a, mul(sub(b2, a), q.lAC / lAB));
  return { O1, A, B: q.B, C: Cc, u, lAB, a, b2, c, w2: omegaOf(A, q.B, a, b2, kk), vA: len(a) };
}
function kStone(host) {
  const g = solveQ(Q), o = [0, 0], mv = 0.005, ml = 0.002, Lp = v => f1(len(v) / mv), Kk = new Kon();
  Kk.scene('mech', { W: 440, maxH: 250, pad: 34, title: 'Механизм' }); Kk.scene('plan', { W: 440, maxH: 320, title: 'План скоростей' });
  const Ma = (k, pr) => Kk.add('mech', Object.assign({ k, s: -1 }, pr));
  Ma('ray', { a: g.O1, d: [1, 0], l: 40 });
  Ma('link', { a: g.A, b: g.C, col: C.l2 }); Ma('link', { a: g.O1, b: g.A, col: C.l1 }); Ma('slider', { p: g.B, d: g.u, col: C.l3, w: 34 });
  Ma('ground', { p: g.O1 }); Ma('ground', { p: g.B }); [g.O1, g.A, g.B].forEach(q => Ma('joint', { p: q })); Ma('dot', { p: g.C, r: 3.4 });
  Ma('lbl', { p: g.O1, t: 'O_{1}', ang: 225, dist: 22 }); Ma('lbl', { p: g.A, t: 'A', ang: bestAng(g.A, [g.O1, g.C]) });
  Ma('lbl', { p: g.B, t: 'B', ang: angd(rot(g.u)), dist: 22 }); Ma('lbl', { p: g.C, t: 'C', ang: angd(g.u), dist: 15 });
  Ma('omega', omegaSpec(g.O1, [g.A, add(g.O1, [1, 0]), g.B], Q.w1, 'ω_{1}', C.known, true, 26));
  Ma('ang', { c: g.O1, a0: 0, a1: Q.phi, r: 16, t: 'φ', col: C.muted, td: 10 });
  const M = Kk.fn('mech'), P = Kk.fn('plan'), kv = 50 / g.vA, ab = sub(g.b2, g.a);
  Kk.step(`<b>1. Что где.</b> Кривошип <span class="t1">1</span> крутится вокруг O<sub>1</sub>. Кулиса <span class="t3">2</span> шарниром соединена с кривошипом в A и проходит сквозь камень <span class="t2">3</span>. Камень шарниром сидит на стойке в B — он только покачивается на месте. В точке B две точки: <b>B<sub>2</sub></b> (кулиса) и <b>B<sub>3</sub></b> (камень, V<sub>B3</sub> = 0).`);
  P('dot', { p: o }); P('lbl', { p: o, t: 'p', ang: bestAng(o, [g.a, g.b2, g.c]) }); P('pad', { p: g.c }); P('pad', { p: g.a });
  Kk.step(`<b>2. V<sub>A</sub> = ω<sub>1</sub>·l<sub>O1A</sub></b> = ${fnum(Q.w1)}·${fnum(Q.r * kk)} = <b>${fs(g.vA)} м/с</b>, ⊥ O<sub>1</sub>A по ω<sub>1</sub> (${dirW(Q.w1)}). μ<sub>V</sub> = ${fmu(mv)} → pa = ${Lp(g.a)} мм.`);
  P('vec', { a: o, b: g.a, col: C.known }); P('lbl', { p: g.a, t: 'a', ang: bestAng(g.a, [o, g.b2]) });
  M('hl', { a: g.O1, b: g.A, col: C.l1, only: true }); M('vec', { a: g.A, b: add(g.A, mul(g.a, kv)), col: C.known, only: true });
  Kk.step(`<b>3. Первое уравнение — кулиса как твёрдое звено:</b> ${Vh('B2')} = ${Vh('A')} + ${Vh('B2A')}, где ${Vh('B2A')} ⊥ AB (вращение кулисы вокруг A). → <b>Через a — прямая ⊥ AB.</b>`);
  P('cl', { a: g.a, b: g.b2, e1: 40, e2: 46, col: C.rel }); M('hl', { a: g.A, b: g.B, col: C.l2, only: true });
  Kk.step(`<b>4. Второе — кулиса скользит в камне:</b> ${Vh('B2')} = ${Vh('B3')} + ${Vh('B2B3')}. Камень на стойке: V<sub>B3</sub> = 0, а скольжение ${Vh('B2B3')} ∥ AB. Значит, ${Vh('B2')} ∥ AB и начинается в полюсе. → <b>Через p — прямая ∥ AB.</b>`);
  P('cl', { a: o, b: g.b2, e1: 36, e2: 46, col: C.found }); M('hl', { a: add(g.B, mul(g.u, -40)), b: add(g.B, mul(g.u, 40)), col: C.l3, only: true });
  Kk.step(`<b>5. Пересечение — b<sub>2</sub>.</b> pb<sub>2</sub> ≈ ${Lp(g.b2)} мм → V<sub>B2</sub> = <b>${fs(len(g.b2))} м/с</b>: с такой скоростью кулиса проезжает сквозь камень. ab<sub>2</sub> ≈ ${Lp(ab)} мм → V<sub>B2A</sub> = <b>${fs(len(ab))} м/с</b>. Прямой угол при b<sub>2</sub>.`);
  P('dot', { p: g.b2, col: C.found }); P('lbl', { p: g.b2, t: 'b_{2}', ang: bestAng(g.b2, [o, g.a, g.c]), col: C.found });
  P('vec', { a: o, b: g.b2, col: C.found }); P('vec', { a: g.a, b: g.b2, col: C.rel }); P('ra', { p: g.b2, d1: mul(g.b2, -1), d2: mul(ab, -1), col: C.found });
  Kk.step(`<b>6. ω<sub>2</sub> = V<sub>B2A</sub> / l<sub>AB</sub>.</b> AB меряем на схеме — длина меняется с положением: ≈ ${f1(g.lAB * kk / ml)} мм·${fmu(ml)} = ${fs(g.lAB * kk)} м. ω<sub>2</sub> = ${fs(len(ab))} / ${fs(g.lAB * kk)} = <b>${fs(Math.abs(g.w2))} рад/с, ${dirW(g.w2)}</b> (ab<sub>2</sub> переносим в B, точку A мысленно закрепляем). Камень поворачивается вместе с кулисой: ω<sub>3</sub> = ω<sub>2</sub>.`);
  M('vec', { a: g.B, b: add(g.B, mul(ab, kv)), col: C.rel }); M('omega', omegaSpec(g.A, [g.O1, g.C], g.w2, 'ω_{2}', C.rel, false, 24));
  Kk.step(`<b>7. Точка C кулисы — по подобию.</b> A, B, C на одной прямой → a, b<sub>2</sub>, c тоже на одной прямой: ac = ab<sub>2</sub>·AC/AB = ${Lp(ab)}·${fnum(Q.lAC)}/${f1(g.lAB)} ≈ ${Lp(sub(g.c, g.a))} мм. pc ≈ ${Lp(g.c)} мм → V<sub>C</sub> = <b>${fs(len(g.c))} м/с</b>.`);
  P('cl', { a: g.a, b: g.c, e1: 0, e2: 20, col: C.rel }); P('dot', { p: g.c }); P('lbl', { p: g.c, t: 'c', ang: bestAng(g.c, [o, g.a, g.b2]) }); P('vec', { a: o, b: g.c, col: C.found, w: 2 });
  mountKon(host, Kk); host.classList.add('stack');
}

/* слайд 12: тест */
const QZ = [
  { q: 'Кулиса качается вокруг O₂, камень на кривошипе. Как направлена V<sub>A3</sub> — скорость точки кулисы под камнем?', o: ['⊥ O₂A — перпендикулярно кулисе', '⊥ O₁A — перпендикулярно кривошипу', '∥ кулисе'], a: 0, e: 'Точка A₃ вращается вместе с кулисой вокруг O₂, а скорость точки вращающегося звена ⊥ радиусу. ⊥ O₁A — это скорость A₁ = A₂.' },
  { q: 'Через какую точку плана проводят прямую ∥ кулисе?', o: ['через a₂ (= a₁)', 'через полюс p', 'через a₃'], a: 0, e: 'Это направление относительной скорости V<sub>A3A2</sub>. В уравнении она прибавляется к V<sub>A2</sub>, значит начинается в её конце — в a₂.' },
  { q: 'Как найти ω₃ кулисы?', o: ['V<sub>A3</sub> / l<sub>O2A</sub>, где O₂A мерим на чертеже', 'V<sub>A3</sub> / l<sub>O2B</sub> — делим на длину кулисы', 'V<sub>A2</sub> / l<sub>O1A</sub>'], a: 0, e: 'Делим скорость точки A₃ на её расстояние до O₂. Длина кулисы O₂B подходит только для V<sub>B</sub>: ω₃ = V<sub>B</sub> / l<sub>O2B</sub> — так удобно проверять.' },
  { q: 'Где на плане точка b — конец кулисы?', o: ['на луче pa₃, pb = pa₃·O₂B/O₂A', 'на пересечении прямой ⊥ O₂B через p с прямой ∥ кулисе через a₂', 'совпадает с a₃'], a: 0, e: 'Все точки кулисы вращаются вокруг O₂: скорости параллельны и пропорциональны расстоянию до O₂. Новых прямых не нужно.' },
  { q: 'Чему равна ω₂ камня?', o: ['ω₂ = ω₃', 'ω₂ = ω₁', 'ω₂ = 0, камень только скользит'], a: 0, e: 'Камень сидит в прорези и не может в ней провернуться — он поворачивается вместе с кулисой.' },
  { q: 'Камень шарниром на стойке в B, кулиса скользит сквозь него и шарнирно связана с кривошипом в A. Какие прямые дают b₂?', o: ['через a ⊥ AB и через p ∥ AB', 'через a ∥ AB и через p ⊥ AB', 'через p ⊥ AB и через p ∥ AB'], a: 0, e: 'V<sub>B2</sub> = V<sub>A</sub> + V<sub>B2A</sub> (⊥ AB) — через a. V<sub>B2</sub> = V<sub>B3</sub> + V<sub>B2B3</sub>, V<sub>B3</sub> = 0, скольжение ∥ AB — через p.' }
];
function quiz(host) {
  let ok = 0, done = 0; const sc = hh('div', 'qscore');
  QZ.forEach((z, i) => {
    const b = hh('div', 'qz', host); hh('div', 'qq', b, (i + 1) + '. ' + z.q);
    const ob = hh('div', 'qo', b), ex = hh('div', 'qe', b);
    const order = z.o.map((t, j) => j).sort(() => Math.random() - 0.5);
    order.forEach(j => {
      const bt = hh('button', '', ob, z.o[j]);
      bt.onclick = () => {
        if (b.classList.contains('done')) return; b.classList.add('done'); done++;
        if (j === z.a) { ok++; bt.classList.add('right'); ex.innerHTML = '<b class="t3">Верно.</b> ' + z.e; }
        else { bt.classList.add('wrong'); ob.children[order.indexOf(z.a)].classList.add('right'); ex.innerHTML = '<b class="xf">Не совсем.</b> ' + z.e; }
        sc.textContent = `Ответил: ${done} из ${QZ.length} · верно: ${ok}` + (done === QZ.length ? (ok === QZ.length ? ' — всё правильно, можно в пробную КР!' : ' — пролистай слайды с ошибками ещё раз') : '');
      };
    });
  });
  host.appendChild(sc);
}

/* ---------- слайды ---------- */
function boot() {
  const slides = Array.prototype.slice.call(document.querySelectorAll('section.sl'));
  const hooks = slides.map(() => []);
  const F = { anat, decomp, zoom, rule: ruleFig, kA3, kW3, pos6: n => mountKon(n, KUL6.pos(S6)), plan6: n => { const Kk = KUL6.plan(S6); Kk.sc.mech.o = Object.assign({}, Kk.sc.mech.o, { W: 320, maxH: 400 }); mountKon(n, Kk); }, res6: resTable, stone: kStone, quiz,
    given6: n => { n.innerHTML = `<div class="given"><div><span class="lbl">Дано</span> ${KUL6.given(EX)}</div><div><span class="lbl">Найти</span> ${KUL6.find}</div></div>`; } };
  document.querySelectorAll('[data-f]').forEach(n => {
    try { const h = F[n.dataset.f](n); const s = n.closest('section.sl'); if (h && h.show && h.hide && s) hooks[slides.indexOf(s)].push(h); }
    catch (e) { console.error(n.dataset.f, e); n.innerHTML = '<p class="small">Не удалось показать рисунок.</p>'; }
  });
  document.querySelectorAll('[data-num]').forEach(n => { const v = { vA: fs(S6.vA), va3: fs(len(S6.a3)), w3: fs(Math.abs(S6.w3)), lA: fs(S6.lA * kk) }[n.dataset.num]; if (v) n.textContent = v; });

  const prev = document.getElementById('prev'), next = document.getElementById('next'), dots = document.getElementById('dots'), ttl = document.getElementById('dttl');
  slides.forEach((s, i) => { const d = hh('i', '', dots); d.title = (i + 1) + '. ' + s.dataset.t; d.onclick = () => go(i); });
  let cur = -1;
  function go(i, noScroll) {
    i = Math.max(0, Math.min(slides.length - 1, i)); if (i === cur) return;
    const dir = i > cur ? 1 : -1;
    if (cur >= 0) { slides[cur].classList.remove('on'); hooks[cur].forEach(h => h.hide()); }
    const s = slides[i]; s.style.setProperty('--dx', (dir * 26) + 'px'); s.classList.add('on');
    cur = i; hooks[i].forEach(h => h.show());
    Array.prototype.forEach.call(dots.children, (d, j) => { d.className = j === i ? 'cur' : (j < i ? 'done' : ''); });
    ttl.innerHTML = `<b>${i + 1}/${slides.length}</b>${s.dataset.t}`;
    prev.classList.toggle('off', i === 0); next.classList.toggle('off', i === slides.length - 1);
    try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) {}
    try { localStorage.setItem('kulisa-slide', String(i)); } catch (e) {}
    if (!noScroll) window.scrollTo(0, 0);
  }
  prev.onclick = () => go(cur - 1); next.onclick = () => go(cur + 1);
  document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(+a.dataset.go - 1); }));
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return; const t = e.target; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(cur + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(cur - 1); }
  });
  let tx = null, ty = 0, tt = 0;
  document.addEventListener('touchstart', e => { const t = e.target; if (e.touches.length !== 1 || (t && t.tagName === 'INPUT')) { tx = null; return; } tx = e.touches[0].clientX; ty = e.touches[0].clientY; tt = Date.now(); }, { passive: true });
  document.addEventListener('touchend', e => {
    if (tx == null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Date.now() - tt < 700 && Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
  window.addEventListener('hashchange', () => { const h = parseInt(location.hash.slice(1), 10); if (h >= 1 && h <= slides.length) go(h - 1); });
  let start = parseInt(location.hash.slice(1), 10) - 1;
  if (!(start >= 0 && start < slides.length)) { try { start = parseInt(localStorage.getItem('kulisa-slide'), 10); } catch (e) { start = 0; } }
  go(start >= 0 && start < slides.length ? start : 0, true);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
