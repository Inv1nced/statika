/* ИДЗ к защите — анимации к задачам */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function tx(parent, s, attrs) { var e = mk('text', attrs || {}, parent); e.textContent = s; return e; }
  function f(x, d) { return x.toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function sgn(x, d) { return (x > 0 ? '+' : x < 0 ? '−' : '') + f(Math.abs(x), d); }
  function loop(host, step) {
    var visible = false, last = 0, running = true, raf = 0;
    function frame(t) {
      raf = 0;
      if (!visible || !running) { last = 0; return; }
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      step(dt);
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && visible && running) raf = requestAnimationFrame(frame); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; kick(); }, { threshold: 0.05 }).observe(host);
    else { visible = true; kick(); }
    return { set: function (r) { running = r; last = 0; kick(); }, get running() { return running; } };
  }
  function arrowHead(x, y, ux, uy, h) {
    return [x, y, x - ux * h - uy * h * 0.45, y - uy * h + ux * h * 0.45, x - ux * h + uy * h * 0.45, y - uy * h - ux * h * 0.45].map(function (v) { return v.toFixed(1); }).join(' ');
  }

  /* ---------- 2. Два шара: заряд перетекает ---------- */
  function initBalls() {
    var box = $('#balls'); if (!box) return;
    var svg = $('svg', box), st = $('#ballsTxt');
    var k = 9e9, R1 = 0.032, R2 = 0.026, Q1 = -6.5, Q2 = 4.9533, PHI = -240;
    var Q1p = PHI * R1 / k * 1e9, Q2p = PHI * R2 / k * 1e9;
    var B = [{ x: 140, r: 62, R: R1, q0: Q1, q1: Q1p, name: '1' }, { x: 420, r: 50, R: R2, q0: Q2, q1: Q2p, name: '2' }];
    var X = function (phi) { return 280 + phi * 0.12; };
    tx(svg, 'q₁ + q₂ = −1,55 нКл', { x: 280, y: 34, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700 });
    tx(svg, 'сумма зарядов не меняется', { x: 280, y: 52, 'text-anchor': 'middle', class: 't-s' });
    mk('line', { x1: B[0].x + B[0].r, y1: 118, x2: 262, y2: 118, class: 'ln', 'stroke-width': 2 }, svg);
    mk('line', { x1: 298, y1: 118, x2: B[1].x - B[1].r, y2: 118, class: 'ln', 'stroke-width': 2 }, svg);
    var lever = mk('line', { x1: 262, y1: 118, x2: 293, y2: 100, class: 'ln', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, svg);
    mk('circle', { cx: 262, cy: 118, r: 3.5, class: 'fillInk' }, svg); mk('circle', { cx: 298, cy: 118, r: 3.5, class: 'fillInk' }, svg);
    tx(svg, 'проволока', { x: 280, y: 142, 'text-anchor': 'middle', class: 't-s' });
    B.forEach(function (b) {
      b.c = mk('circle', { cx: b.x, cy: 118, r: b.r, 'stroke-width': 2.2 }, svg);
      tx(svg, 'q' + (b.name === '1' ? '₁' : '₂'), { x: b.x, y: 100, 'text-anchor': 'middle', class: 't-i', 'font-size': 15 });
      b.tq = tx(svg, '', { x: b.x, y: 122, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700 });
      b.tp = tx(svg, '', { x: b.x, y: 141, 'text-anchor': 'middle', 'font-size': 13 });
      tx(svg, 'R' + (b.name === '1' ? '₁ = 3,2' : '₂ = 2,6') + ' см', { x: b.x, y: 118 + b.r + 20, 'text-anchor': 'middle', class: 't-s' });
    });
    var dots = [];
    for (var i = 0; i < 6; i++) dots.push(mk('circle', { r: 3.6, class: 'fillB', cy: 118 }, svg));
    var eLab = tx(svg, 'e⁻ →', { x: 230, y: 108, class: 'fillB', 'font-size': 13, 'font-weight': 700 });
    /* шкала потенциалов */
    tx(svg, 'потенциалы шаров, В', { x: 40, y: 216, class: 't-s' });
    mk('line', { x1: 40, y1: 250, x2: 520, y2: 250, class: 'ln' }, svg);
    [-2000, -1000, 0, 1000, 2000].forEach(function (v) {
      mk('line', { x1: X(v), y1: 245, x2: X(v), y2: 255, class: 'ln' }, svg);
      tx(svg, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v), { x: X(v), y: 272, 'text-anchor': 'middle', class: 't-s' });
    });
    var tgt = mk('g', {}, svg); tgt.style.transition = 'opacity .4s';
    mk('line', { x1: X(PHI), y1: 236, x2: X(PHI), y2: 264, style: 'stroke:var(--ink);stroke-width:1.2;stroke-dasharray:3 3' }, tgt);
    tx(tgt, 'общий: −240', { x: X(PHI), y: 292, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700 }, tgt);
    var m1 = mk('polygon', { class: 'fillB' }, svg), m2 = mk('polygon', { class: 'fillR' }, svg);
    var l1 = tx(svg, 'φ₁', { 'text-anchor': 'end', class: 't-i fillB', 'font-size': 15, 'font-weight': 700 });
    var l2 = tx(svg, 'φ₂', { 'text-anchor': 'start', class: 't-i fillR', 'font-size': 15, 'font-weight': 700 });
    var t = 0, run = false, ph = 0;
    function g(t) { return (1 - Math.exp(-4 * t)) / (1 - Math.exp(-4)); }
    function draw() {
      var G = g(t), phis = [];
      B.forEach(function (b, j) {
        var q = b.q0 + (b.q1 - b.q0) * G, phi = k * q * 1e-9 / b.R;
        phis.push(phi);
        var col = q < 0 ? 'var(--blue)' : 'var(--red)';
        b.c.style.fill = col; b.c.style.fillOpacity = (0.08 + 0.22 * Math.min(1, Math.abs(phi) / 2000)).toFixed(3); b.c.style.stroke = col;
        b.tq.textContent = sgn(q, 2) + ' нКл';
        b.tp.textContent = 'φ' + (j ? '₂' : '₁') + ' = ' + sgn(Math.round(phi), 0) + ' В';
      });
      var a = X(phis[0]), b2 = X(phis[1]);
      m1.setAttribute('points', [a, 249, a - 7, 236, a + 7, 236].join(' '));
      m2.setAttribute('points', [b2, 249, b2 - 7, 236, b2 + 7, 236].join(' '));
      l1.setAttribute('x', a - 9); l1.setAttribute('y', 234);
      l2.setAttribute('x', b2 + 9); l2.setAttribute('y', 234);
      var on = t > 0, flow = on ? 1 - G : 0;
      lever.setAttribute('x2', on ? 298 : 293); lever.setAttribute('y2', on ? 118 : 100);
      dots.forEach(function (d, i) {
        var s = (ph + i / 6) % 1;
        d.setAttribute('cx', (B[0].x + B[0].r + 4 + s * (B[1].x - B[1].r - B[0].x - B[0].r - 8)).toFixed(1));
        d.style.opacity = (Math.min(1, flow * 3) * Math.min(1, s * 6, (1 - s) * 6)).toFixed(2);
      });
      eLab.style.opacity = Math.min(1, flow * 3).toFixed(2);
      tgt.style.opacity = t >= 1 ? 1 : 0.35;
      st.textContent = !on ? 'до соединения: потенциалы разные' : t < 1 ? 'электроны перетекают с первого шара на второй…' : 'равновесие: φ₁ = φ₂ = −240 В';
    }
    var L = loop(box, function (dt) {
      if (!run) return;
      t = Math.min(1, t + dt / 3.2); ph = (ph + dt * 0.9 * (1 - g(t)) + dt * 0.15) % 1;
      if (t >= 1) run = false;
      draw();
    });
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-b]'); if (!b) return;
      if (b.getAttribute('data-b') === 'go') { if (t === 0) { if (reduce) t = 1; else { t = 0.0001; run = true; } } }
      else { t = 0; run = false; ph = 0; }
      $('[data-b="go"]', box).disabled = t > 0;
      draw();
    });
    draw();
  }

  /* ---------- 3. Ток по контуру из двух батарей ---------- */
  function initCircuit() {
    var box = $('#circuit'); if (!box) return;
    var g = $('#cirDots'), pts = [[110, 230], [110, 50], [280, 50], [280, 230], [110, 230]], seg = [], total = 0;
    for (var i = 0; i < 4; i++) { var l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(l); total += l; }
    function at(s) {
      s = ((s % total) + total) % total;
      for (var i = 0; i < 4; i++) { if (s <= seg[i]) { var u = s / seg[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u, i]; } s -= seg[i]; }
      return pts[0];
    }
    var N = 14, dots = [], arrows = [], off = 0;
    for (var j = 0; j < N; j++) dots.push(mk('circle', { r: 4, class: 'fillI' }, g));
    [[110, 95, 0, -1], [195, 50, 1, 0], [280, 200, 0, 1], [195, 230, -1, 0]].forEach(function (a) { arrows.push(mk('polygon', { class: 'fillI', points: arrowHead(a[0] + a[2] * 8, a[1] + a[3] * 8, a[2], a[3], 13) }, g)); });
    function draw() { dots.forEach(function (d, j) { var p = at(off + j * total / N); d.setAttribute('cx', p[0].toFixed(1)); d.setAttribute('cy', p[1].toFixed(1)); }); }
    var L = loop(box, function (dt) { off += dt * 45; draw(); });
    if (reduce) L.set(false);
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-c]'); if (!b) return;
      L.set(!L.running); b.textContent = L.running ? 'Пауза' : 'Пуск';
    });
    draw();
  }

  /* ---------- 4. Труба: контур и охваченный ток ---------- */
  function initPipe() {
    var box = $('#pipe'); if (!box) return;
    var svg = $('svg', box), sl = $('#pipeSl'), out = $('#pipeR'), txt = $('#pipeTxt');
    var I = 5.2, R1 = 26, R2 = 36, CX = 150, CY = 150, S = 2.8;
    function H(r) { if (r <= R1) return 0; var c = r >= R2 ? 1 : (r * r - R1 * R1) / (R2 * R2 - R1 * R1); return I * c / (2 * Math.PI * r / 100); }
    function ring(a, b) { return 'M ' + (CX + b) + ' ' + CY + ' A ' + b + ' ' + b + ' 0 1 0 ' + (CX - b) + ' ' + CY + ' A ' + b + ' ' + b + ' 0 1 0 ' + (CX + b) + ' ' + CY + ' Z' + (a > 0 ? ' M ' + (CX + a) + ' ' + CY + ' A ' + a + ' ' + a + ' 0 1 1 ' + (CX - a) + ' ' + CY + ' A ' + a + ' ' + a + ' 0 1 1 ' + (CX + a) + ' ' + CY + ' Z' : ''); }
    mk('path', { d: ring(R1 * S, R2 * S), class: 'softA', 'fill-rule': 'evenodd' }, svg);
    var cap = mk('path', { class: 'fillI', 'fill-rule': 'evenodd', opacity: 0.5 }, svg);
    mk('circle', { cx: CX, cy: CY, r: R1 * S, class: 'ln' }, svg);
    mk('circle', { cx: CX, cy: CY, r: R2 * S, class: 'ln' }, svg);
    tx(svg, 'R₁', { x: CX - R1 * S + 6, y: CY + 5, class: 't-i', 'font-size': 14 });
    tx(svg, 'R₂', { x: CX - R2 * S - 4, y: CY + 5, class: 't-i', 'font-size': 14, 'text-anchor': 'end' });
    var cont = mk('circle', { cx: CX, cy: CY, fill: 'none', style: 'stroke:var(--teal);stroke-width:2.2;stroke-dasharray:6 5' }, svg);
    var rad = mk('line', { x1: CX, y1: CY, class: 'thin' }, svg), radL = tx(svg, 'r', { class: 't-i fillH', 'font-size': 15 });
    var hL = mk('line', { style: 'stroke:var(--teal);stroke-width:2.6' }, svg), hH = mk('polygon', { class: 'fillH' }, svg), hT = tx(svg, 'H', { class: 't-i fillH', 'font-size': 16, 'font-weight': 700, 'text-anchor': 'end' });
    mk('circle', { cx: CX, cy: CY, r: 7, class: 'sheetfill' }, svg); mk('circle', { cx: CX, cy: CY, r: 7, class: 'ln' }, svg); mk('circle', { cx: CX, cy: CY, r: 2.4, class: 'fillInk' }, svg);
    tx(svg, 'в центре — ось трубы, ток течёт к нам', { x: 12, y: 294, class: 't-s' });
    /* график */
    var gx = function (r) { return 340 + r * (240 / 45); }, gy = function (h) { return 260 - h * 80; };
    mk('line', { x1: 340, y1: 260, x2: 584, y2: 260, class: 'ln' }, svg); mk('line', { x1: 340, y1: 260, x2: 340, y2: 44, class: 'ln' }, svg);
    tx(svg, 'H, А/м', { x: 346, y: 34, class: 't-i', 'font-size': 14 });
    tx(svg, 'r, см', { x: 584, y: 282, class: 't-i', 'font-size': 14, 'text-anchor': 'end' });
    [0, 10, 20].forEach(function (v) { tx(svg, String(v), { x: gx(v), y: 276, 'text-anchor': 'middle', class: 't-s' }); });
    [1, 2].forEach(function (v) { mk('line', { x1: 336, y1: gy(v), x2: 344, y2: gy(v), class: 'ln' }, svg); tx(svg, String(v), { x: 330, y: gy(v) + 5, 'text-anchor': 'end', class: 't-s' }); });
    [[R1, 'R₁'], [R2, 'R₂']].forEach(function (p) { mk('line', { x1: gx(p[0]), y1: 260, x2: gx(p[0]), y2: 64, class: 'ln2' }, svg); tx(svg, p[1], { x: gx(p[0]), y: 276, 'text-anchor': 'middle', class: 't-i', 'font-size': 13 }); });
    [[13, 'полость', 58], [31, 'стенка', 58], [41.5, 'снаружи', 196]].forEach(function (p) { tx(svg, p[1], { x: gx(p[0]), y: p[2], 'text-anchor': 'middle', class: 't-s', 'font-size': 12 }); });
    var d = ''; for (var r = 0; r <= 45; r += 0.25) d += (r ? ' L' : 'M') + gx(r).toFixed(1) + ' ' + gy(H(r)).toFixed(1);
    mk('path', { d: d, fill: 'none', style: 'stroke:var(--teal);stroke-width:2.6' }, svg);
    var dropX = mk('line', { class: 'ln2' }, svg), dropY = mk('line', { class: 'ln2' }, svg);
    var mark = mk('circle', { r: 6, class: 'fillH', style: 'stroke:var(--sheet);stroke-width:2' }, svg);
    var mT = tx(svg, '', { 'font-size': 14, 'font-weight': 700 });
    function upd() {
      var r = +sl.value, h = H(r), pr = Math.max(r * S, 0.01);
      out.textContent = f(r, r % 1 ? 1 : 0) + ' см';
      cont.setAttribute('r', pr.toFixed(1)); cont.style.opacity = r > 0.5 ? 1 : 0;
      cap.setAttribute('d', r > R1 ? ring(R1 * S, Math.min(r, R2) * S) : 'M0 0');
      var ang = -Math.PI / 3, ex = CX + Math.cos(ang) * pr, ey = CY - Math.sin(ang) * pr;
      rad.setAttribute('x2', ex.toFixed(1)); rad.setAttribute('y2', ey.toFixed(1));
      radL.setAttribute('x', (CX + Math.cos(ang) * pr * 0.55 + 8).toFixed(1)); radL.setAttribute('y', (CY - Math.sin(ang) * pr * 0.55 + 4).toFixed(1));
      radL.style.opacity = rad.style.opacity = r > 4 ? 1 : 0;
      var len = h * 26, ty = CY - pr;
      hL.setAttribute('x1', CX); hL.setAttribute('y1', ty.toFixed(1)); hL.setAttribute('x2', (CX - Math.max(0, len - 9)).toFixed(1)); hL.setAttribute('y2', ty.toFixed(1));
      hH.setAttribute('points', arrowHead(CX - len, ty, -1, 0, 11));
      hT.setAttribute('x', (CX - len - 6).toFixed(1)); hT.setAttribute('y', (ty - 6).toFixed(1));
      hL.style.opacity = hH.style.opacity = hT.style.opacity = h > 0.05 && r > 4 ? 1 : 0;
      var mx = gx(r), my = gy(h);
      mark.setAttribute('cx', mx.toFixed(1)); mark.setAttribute('cy', my.toFixed(1));
      dropX.setAttribute('x1', mx); dropX.setAttribute('y1', my); dropX.setAttribute('x2', mx); dropX.setAttribute('y2', 260);
      dropY.setAttribute('x1', 340); dropY.setAttribute('y1', my); dropY.setAttribute('x2', mx); dropY.setAttribute('y2', my);
      mT.textContent = 'H = ' + (h > 0 ? f(h, 2) : '0');
      var right = r > R2; mT.setAttribute('text-anchor', right ? 'end' : 'start'); mT.setAttribute('x', (mx + (right ? -10 : 10)).toFixed(1)); mT.setAttribute('y', (my + (right ? 24 : -10)).toFixed(1));
      var s;
      if (r <= R1) s = 'Контур внутри полости: внутри «забора» тока нет, I охв = 0, поэтому H = 0.';
      else if (r < R2) { var c = (r * r - R1 * R1) / (R2 * R2 - R1 * R1); s = 'Контур в стенке: охвачена доля тока (r² − R₁²)/(R₂² − R₁²) = ' + f(c, 3) + ', I охв = ' + f(I * c, 2) + ' А, H = I охв/(2πr) = ' + f(h, 2) + ' А/м.'; }
      else s = 'Контур снаружи: охвачен весь ток 5,2 А, труба действует как тонкий провод: H = I/(2πr) = ' + f(h, 2) + ' А/м.';
      if (Math.abs(r - 31) < 0.01) s += ' ← Это и есть наша задача.';
      txt.textContent = s;
    }
    sl.addEventListener('input', upd);
    upd();
  }

  /* ---------- 5. Вращающаяся рамка ---------- */
  function initFrame() {
    var box = $('#frame'); if (!box) return;
    var svg = $('svg', box), info = $('#frameTxt');
    var CX = 150, CY = 140, SC = 52, YAW = -35 * Math.PI / 180, PIT = 18 * Math.PI / 180;
    function P(x, y, z) { var x1 = x * Math.cos(YAW) - y * Math.sin(YAW), y1 = x * Math.sin(YAW) + y * Math.cos(YAW); return [CX + SC * x1, CY - SC * (z * Math.cos(PIT) + y1 * Math.sin(PIT))]; }
    function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
    /* левая панель */
    tx(svg, 'рамка в поле', { x: 16, y: 24, class: 't-s' });
    var lines = [[-0.95, 0.65], [-0.95, -0.65], [0.95, 0.65], [0.95, -0.65], [0, 1.15], [0, -1.15]];
    var gBack = mk('g', {}, svg);
    lines.forEach(function (l) {
      var a = P(-2.3, l[0], l[1]), b = P(2.3, l[0], l[1]), ux = b[0] - a[0], uy = b[1] - a[1], L = Math.hypot(ux, uy); ux /= L; uy /= L;
      mk('line', { x1: a[0], y1: a[1], x2: b[0] - ux * 8, y2: b[1] - uy * 8, style: 'stroke:var(--teal);stroke-width:1.4;stroke-opacity:.75' }, gBack);
      mk('polygon', { class: 'fillH', points: arrowHead(b[0], b[1], ux, uy, 10) }, gBack);
    });
    var bl = P(2.3, 0, 1.15); tx(svg, 'B', { x: bl[0] + 8, y: bl[1] + 4, class: 't-i fillH', 'font-size': 17, 'font-weight': 700 });
    var ax1 = P(0, 0, -1.25), ax2 = P(0, 0, 1.3);
    mk('line', { x1: ax1[0], y1: ax1[1], x2: ax2[0], y2: ax2[1], style: 'stroke:var(--ink);stroke-width:1.4;stroke-dasharray:5 4' }, svg);
    tx(svg, 'ось вращения', { x: ax2[0], y: ax2[1] - 8, 'text-anchor': 'middle', class: 't-s' });
    var frame = mk('polygon', { style: 'fill:var(--amber);fill-opacity:.18;stroke:var(--amber);stroke-width:2.6;stroke-linejoin:round' }, svg);
    var nLn = mk('line', { style: 'stroke:var(--ink);stroke-width:2' }, svg), nHd = mk('polygon', { class: 'fillInk' }, svg), nT = tx(svg, 'n', { class: 't-i', 'font-size': 16, 'font-weight': 700 });
    /* правая панель */
    mk('line', { x1: 300, y1: 20, x2: 300, y2: 255, class: 'thin', 'stroke-dasharray': '3 4' }, svg);
    tx(svg, 'вид вдоль линий поля', { x: 316, y: 24, class: 't-s' });
    var RX = 450, RY = 140, sp = 22, dots = [];
    for (var i = -4; i <= 4; i++) for (var j = -3; j <= 3; j++) dots.push({ y: i * sp, z: j * sp, e: mk('circle', { cx: RX + i * sp, cy: RY - j * sp }, svg) });
    var proj = mk('rect', { style: 'fill:var(--amber);fill-opacity:.16;stroke:var(--amber);stroke-width:2.6' }, svg);
    var cnt = tx(svg, '', { x: RX, y: 236, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700 });
    tx(svg, 'точки — линии поля, идущие на нас', { x: RX, y: 254, 'text-anchor': 'middle', class: 't-s', 'font-size': 12 });
    /* график */
    var G0 = 40, G1 = 580, GY = 335, GA = 40;
    var gxa = function (a) { return G0 + (a / (2 * Math.PI)) * (G1 - G0); };
    var band = mk('rect', { x: gxa(1.5 * Math.PI), y: GY - GA - 8, width: gxa(2 * Math.PI) - gxa(1.5 * Math.PI), height: 2 * GA + 16, style: 'fill:var(--soft-amber)' }, svg);
    var bandT = tx(svg, 'от 0 до BS — за T/4', { x: (gxa(1.5 * Math.PI) + gxa(2 * Math.PI)) / 2, y: GY - GA - 13, 'text-anchor': 'middle', class: 'fillI', 'font-size': 12, 'font-weight': 700 });
    mk('line', { x1: G0, y1: GY, x2: G1 + 6, y2: GY, class: 'ln' }, svg);
    mk('line', { x1: G0, y1: GY - GA - 10, x2: G0, y2: GY + GA + 6, class: 'ln' }, svg);
    var dF = '', dE = '';
    for (var s = 0; s <= 120; s++) { var a = s / 120 * 2 * Math.PI; dF += (s ? ' L' : 'M') + gxa(a).toFixed(1) + ' ' + (GY - GA * Math.cos(a)).toFixed(1); dE += (s ? ' L' : 'M') + gxa(a).toFixed(1) + ' ' + (GY - GA * 0.75 * Math.sin(a)).toFixed(1); }
    mk('path', { d: dE, fill: 'none', style: 'stroke:var(--red);stroke-width:1.6;stroke-dasharray:5 4' }, svg);
    mk('path', { d: dF, fill: 'none', style: 'stroke:var(--amber);stroke-width:2.6' }, svg);
    tx(svg, 'Φ', { x: G0 - 8, y: GY - GA + 5, 'text-anchor': 'end', class: 't-i fillI', 'font-size': 16, 'font-weight': 700 });
    tx(svg, 'BS', { x: G0 + 6, y: GY - GA - 2, class: 't-s', 'font-size': 12 });
    tx(svg, 'ε', { x: gxa(Math.PI / 2) + 8, y: GY - GA * 0.75 - 4, class: 't-i fillR', 'font-size': 16, 'font-weight': 700 });
    [[0, '0'], [0.5, 'T/4'], [1, 'T/2'], [1.5, '3T/4'], [2, 'T']].forEach(function (p) { tx(svg, p[1], { x: gxa(p[0] * Math.PI), y: GY + GA + 22, 'text-anchor': 'middle', class: 't-s', 'font-size': 12 }); });
    var mLine = mk('line', { y1: GY - GA - 6, y2: GY + GA + 6, style: 'stroke:var(--ink);stroke-width:1.2' }, svg);
    var mDot = mk('circle', { r: 5.5, class: 'fillI', style: 'stroke:var(--sheet);stroke-width:2' }, svg);
    var alpha = 0.5, mode = 'run', W = 2 * Math.PI / 7;
    function draw() {
      var a = ((alpha % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), ca = Math.cos(a), sa = Math.sin(a);
      var u = [-sa, ca, 0], h = 0.8;
      frame.setAttribute('points', pts([P(u[0], u[1], h), P(-u[0], -u[1], h), P(-u[0], -u[1], -h), P(u[0], u[1], -h)]));
      var o = P(0, 0, 0), e = P(ca * 1.1, sa * 1.1, 0), dx = e[0] - o[0], dy = e[1] - o[1], L = Math.hypot(dx, dy) || 1;
      nLn.setAttribute('x1', o[0]); nLn.setAttribute('y1', o[1]); nLn.setAttribute('x2', e[0] - dx / L * 8); nLn.setAttribute('y2', e[1] - dy / L * 8);
      nHd.setAttribute('points', arrowHead(e[0], e[1], dx / L, dy / L, 11));
      nT.setAttribute('x', e[0] + dx / L * 10); nT.setAttribute('y', e[1] + dy / L * 10 + 5);
      var hw = Math.abs(ca) * 50, hh = 0.8 * 50, n = 0;
      proj.setAttribute('x', (RX - hw).toFixed(1)); proj.setAttribute('width', (2 * hw).toFixed(1));
      proj.setAttribute('y', RY - hh); proj.setAttribute('height', 2 * hh);
      dots.forEach(function (d) {
        var inn = Math.abs(d.y) < hw && Math.abs(d.z) < hh;
        if (inn) n++;
        d.e.setAttribute('r', inn ? 3.6 : 2.2);
        d.e.setAttribute('class', inn ? 'fillH' : '');
        d.e.style.fill = inn ? '' : 'var(--ink-3)'; d.e.style.opacity = inn ? 1 : 0.45;
      });
      cnt.textContent = 'сквозь рамку линий: ' + n;
      var mx = gxa(a); mLine.setAttribute('x1', mx); mLine.setAttribute('x2', mx);
      mDot.setAttribute('cx', mx.toFixed(1)); mDot.setAttribute('cy', (GY - GA * ca).toFixed(1));
      var inQ = a >= 1.5 * Math.PI - 1e-6;
      band.style.opacity = bandT.style.opacity = mode === 'run' ? 0.55 : inQ ? 1 : 0.55;
      if (mode === 'run') info.textContent = 'поворот ' + Math.round(a * 180 / Math.PI) + '°, поток Φ = ' + sgn(ca, 2) + '·BS';
    }
    var L = loop(box, function (dt) {
      if (mode === 'run') alpha += W * dt;
      else if (mode === 'q') {
        alpha += W * 0.6 * dt;
        if (alpha >= 2 * Math.PI) { alpha = 2 * Math.PI - 1e-6; mode = 'stop'; info.textContent = 'рамка повернулась на 90°: поток вырос от 0 до BS за T/4'; }
      }
      draw();
    });
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-f]'); if (!b) return;
      var tb = $('[data-f="toggle"]', box);
      if (b.getAttribute('data-f') === 'toggle') {
        if (mode === 'run') { mode = 'pause'; tb.textContent = 'Пуск'; } else { if (mode === 'stop' || mode === 'q') alpha = 0; mode = 'run'; tb.textContent = 'Пауза'; }
      } else {
        alpha = 1.5 * Math.PI; tb.textContent = 'Пуск';
        if (reduce) { alpha = 2 * Math.PI - 1e-6; mode = 'stop'; info.textContent = 'рамка повернулась на 90°: поток вырос от 0 до BS за T/4'; }
        else { mode = 'q'; info.textContent = 'рамка стоит ребром к полю: поток 0…'; }
      }
      draw();
    });
    if (reduce) { mode = 'pause'; $('[data-f="toggle"]', box).textContent = 'Пуск'; }
    draw();
  }

  document.addEventListener('DOMContentLoaded', function () { initBalls(); initCircuit(); initPipe(); initFrame(); });
})();
