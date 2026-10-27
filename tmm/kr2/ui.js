/* План скоростей: виджеты страницы */
(function () {
'use strict';
const K = window.KRC;
const { add, sub, mul, len, unit, rot, dirv, angd, mid, lerp, cen, rotBy, cc, ll, lineAng, omegaOf, fz, f1, fs, fa, fmu, fnum, dirW, Vh, Vs, el, hh, rich, pth, C, Scene, drawItems, Kon, mountKon, bestAng, omegaSpec, sArc, txt, TYPES, SIX } = K;
const D2R = Math.PI / 180;

const EX = {
  r1: { type: 'ks', p: { u: 'мм', r: 80, l: 240, e: 0, phi: 45, w1: 10 } },
  r2: { type: 'rrr', p: { u: 'мм', r1: 60, l2: 180, l3: 130, O3: [170, 0], phi: 60, w1: 8, br: 1 } },
  r3: { type: 'kul', p: { u: 'мм', r: 40, O3: [0, -100], phi: 30, w1: 6 } },
  r4: { type: 'cam', p: { u: 'мм', e: 25, R: 60, rr: 15, s: 0, phi: 40, w1: 15 } },
  r5: { type: 'six', p: { u: 'см', a: 80, b: 40, c: 40, O1A: 30, AC: 80, AB: 50, BC: 60, BD: 40, O2D: 70, phiT: 60, w1: -3 } }
};
const TASKS = [
  { type: 'ks', lv: 'разминка', p: { u: 'мм', r: 100, l: 350, e: 0, phi: 120, w1: -12 } },
  { type: 'ks', lv: 'разминка', p: { u: 'мм', r: 60, l: 200, e: 30, phi: 225, w1: 15 } },
  { type: 'rrr', lv: 'средняя', p: { u: 'мм', r1: 50, l2: 160, l3: 120, O3: [150, -30], phi: 110, w1: -10, br: 1 } },
  { type: 'cam', lv: 'средняя', p: { u: 'мм', e: 20, R: 50, rr: 12, s: 10, phi: 120, w1: -20 } },
  { type: 'kul', lv: 'средняя', p: { u: 'мм', r: 50, O3: [0, -120], phi: 150, w1: -5 } },
  { type: 'rrr', lv: 'посложнее', p: { u: 'мм', r1: 40, l2: 150, l3: 110, O3: [140, 20], phi: 300, w1: 12, br: 1, M: { AM: 90, BM: 100 } } },
  { type: 'six', lv: 'как на КР', p: { u: 'см', a: 80, b: 40, c: 40, O1A: 30, AC: 80, AB: 50, BC: 60, BD: 40, O2D: 70, phiT: 120, w1: -4 } },
  { type: 'six', lv: 'как на КР', p: { u: 'см', a: 90, b: 50, c: 30, O1A: 25, AC: 90, AB: 55, BC: 60, BD: 45, O2D: 75, phiT: 30, w1: 5 } }
];
const Rn = { ri: (a, b, s) => a + s * Math.floor(Math.random() * (Math.floor((b - a) / s) + 1)), rf: (a, b) => a + Math.random() * (b - a), pick: a => a[Math.floor(Math.random() * a.length)] };
const shim = arr => ({ add: (n, it) => { arr.push(it); return it; } });

/* ---------- таблица результатов ---------- */
function resTable(rows, S) {
  let h = `<div class="tw"><table class="rt"><tr><th>Величина</th><th>На плане</th><th>Значение</th></tr>`;
  for (const r of rows) {
    if (r[2] != null) h += `<tr><td>${r[0]}</td><td>${r[1]} = ${f1(r[2])} мм</td><td><b>${fs(r[3])} м/с</b></td></tr>`;
    else h += `<tr><td>${r[0]}</td><td>${r[1] || '—'}</td><td><b>${fs(r[3])} рад/с</b>${r[4] && r[4] !== '—' ? ', ' + r[4] : ''}</td></tr>`;
  }
  return h + `</table></div><p class="small">Масштабы: μ<sub>l</sub> = ${fmu(S.ml)} м/мм, μ<sub>V</sub> = ${fmu(S.mv)} (м/с)/мм. Отрезки на твоём чертеже могут отличаться на 1–2 мм — это нормально.</p>`;
}
function schemeKon(T, S, o) { const Ks = new Kon(); Ks.scene('mech', { maxH: (o && o.maxH) || 300 }); T.draw(Ks, 'mech', S, Object.assign({ s: -1, cm: true }, o || {})); return Ks; }

/* ---------- разбор ---------- */
function mountEx(host, key) {
  const d = EX[key], T = TYPES[d.type], S = T.solve(d.p);
  host.innerHTML = `<div class="given"><div><span class="lbl">Дано</span> ${T.given(d.p)}</div><div><span class="lbl">Найти</span> ${T.find}</div></div>
  <div class="fig"><div class="ttl">Схема в заданном положении</div><div class="sch"></div></div>
  <h4>Структура</h4><p>${T.struct}</p>
  <h4>1. Строим положение механизма</h4><p class="small">Жми «Дальше» и повторяй в тетради. Серым — тонкие линии построения, цветным — звенья.</p><div class="kpos"></div>
  <h4>2. Строим план скоростей</h4><p class="small">Сверху механизм: подсвечено звено, к которому сейчас строим перпендикуляр. Синий — известный вектор, оранжевый — найденная абсолютная скорость, розовый — относительная.</p><div class="kplan"></div>
  <h4>3. Ответ</h4><div class="res"></div>`;
  mountKon(host.querySelector('.sch'), schemeKon(T, S), { static: true });
  mountKon(host.querySelector('.kpos'), T.pos(S));
  mountKon(host.querySelector('.kplan'), T.plan(S));
  host.querySelector('.res').innerHTML = resTable(T.rows(S), S);
}

/* ---------- инструменты ---------- */
function toolAngle(host) {
  const Kk = new Kon(); Kk.scene('t', { maxH: 300, pad: 40 }); const m = Kk.fn('t'), O = [0, 0], A = dirv(35), B = dirv(120);
  Kk.step('<b>1.</b> Есть точка O и горизонтальная линия через неё. Нужно провести луч под 35° к горизонтали.');
  m('cl', { a: [-1.25, 0], b: [1.25, 0], e1: 0, e2: 0 }); m('dot', { p: O }); m('lbl', { p: O, t: 'O', ang: 270 });
  Kk.step('<b>2.</b> Кладём транспортир: его центр (метка посередине нижнего края) — ровно в O, нулевая линия — по горизонтали. У транспортира две шкалы. Читаем ту, у которой ноль лежит на нашей горизонтали справа.');
  m('protr', { c: O, r: 110, only: true });
  Kk.step('<b>3.</b> Находим деление 35 и ставим карандашом маленькую отметку у края транспортира.');
  m('protr', { c: O, r: 110, mark: 35, only: true });
  Kk.step('<b>4.</b> Убираем транспортир и линейкой соединяем O с отметкой. Получили луч под 35°.');
  m('seg', { a: O, b: mul(A, 1.2), col: C.found, w: 2 }); m('ang', { c: O, a0: 0, a1: 35, r: 34, t: '35°', col: C.found });
  Kk.step('<b>5.</b> Если угол отсчитан от <b>левой</b> половины горизонтали (так задан φ в КР 2), есть два пути: читать по второй шкале или вычесть из 180°. Здесь 60° слева = 120° справа.');
  m('seg', { a: O, b: mul(B, 1.2), col: C.l1, w: 2 }); m('ang', { c: O, a0: 120, a1: 180, r: 46, t: '60°', col: C.l1 }); m('ang', { c: O, a0: 0, a1: 120, r: 22, t: '120°', col: C.muted, td: 16 });
  mountKon(host, Kk);
}
function toolZas(host) {
  const Kk = new Kon(); Kk.scene('t', { maxH: 320 }); const m = Kk.fn('t'), A = [0, 0], B = [1.6, 0.2], rA = 1.15, rB = 0.95, X = cc(A, rA, B, rB), P = X[0], Q = X[1];
  const aP = angd(sub(P, A)), aQ = angd(sub(Q, A)), bP = angd(sub(P, B)), bQ = angd(sub(Q, B));
  Kk.step('<b>1. Задача.</b> Известны точки A и B. Нужна точка P, которая на 57 мм от A и на 47 мм от B. Так находят любой шарнир, соединяющий два звена известной длины.');
  m('dot', { p: A }); m('dot', { p: B }); m('lbl', { p: A, t: 'A', ang: 200 }); m('lbl', { p: B, t: 'B', ang: 340 });
  Kk.step('<b>2.</b> Раствор циркуля 57 мм — по линейке: иглу на 0, грифель на 57. Иглу в A и проводим дугу там, где примерно ожидаем точку.');
  m('arc', { c: A, r: rA, a0: aP - 14, a1: aP + 14 }); m('arc', { c: A, r: rA, a0: aQ - 14, a1: aQ + 14 });
  Kk.step('<b>3.</b> Раствор 47 мм, иглу в B — вторая дуга.');
  m('arc', { c: B, r: rB, a0: bP - 16, a1: bP + 16 }); m('arc', { c: B, r: rB, a0: bQ - 16, a1: bQ + 16 });
  Kk.step('<b>4.</b> Дуги пересекаются в двух точках. Обе честно удалены на 57 и 47 мм — это две разные сборки механизма. Выбираем ту, что совпадает со схемой в задании: здесь верхнюю P.');
  m('dot', { p: P, col: C.found }); m('lbl', { p: P, t: 'P', ang: 90 }); m('dot', { p: Q, col: C.muted }); m('lbl', { p: Q, t: 'P′', ang: 270, col: C.muted });
  Kk.step('<b>5.</b> Обводим звенья AP и BP. Засечки не стираем — преподаватели обычно хотят видеть построение.');
  m('link', { a: A, b: P, col: C.l2 }); m('link', { a: B, b: P, col: C.l4 });
  mountKon(host, Kk);
}
function toolPerp(host) {
  const Kk = new Kon(); Kk.scene('t', { maxH: 340 }); const m = Kk.fn('t');
  const A = [0, 0], B = mul(dirv(25), 0.95), a = [1.85, -0.15], d = dirv(25), n = dirv(115), r1 = 0.55, X = add(a, mul(d, r1)), Y = add(a, mul(d, -r1)), r2 = 0.82;
  const Z = cc(X, r2, Y, r2)[0], aX = angd(sub(Z, X)), aY = angd(sub(Z, Y));
  Kk.step('<b>1.</b> Слева на схеме механизма звено AB, справа на плане точка a. Нужна прямая через a, перпендикулярная AB. Сначала меряем угол AB транспортиром: 25°.');
  m('link', { a: A, b: B, col: C.l2 }); m('joint', { p: A }); m('joint', { p: B }); m('lbl', { p: A, t: 'A', ang: 225 }); m('lbl', { p: B, t: 'B', ang: 45 }); m('cl', { a: A, b: [1.05, 0], e1: 6, e2: 6 });
  m('protr', { c: A, r: 46, mark: 25, only: true }); m('dot', { p: a }); m('lbl', { p: a, t: 'a', ang: 300 }); m('pad', { p: [-0.3, -0.55] }); m('pad', { p: [2.55, 0.95] });
  Kk.step('<b>2. Способ 1 — транспортир.</b> Перпендикуляр повёрнут на 90°: 25° + 90° = 115°. Транспортир в a, ноль по горизонтали, отметка 115°, линия через a. Главное правило: угол звена ± 90°, чтобы получилось от 0 до 180°.');
  m('protr', { c: a, r: 46, mark: 115, only: true }); m('cl', { a: a, b: add(a, mul(n, 0.95)), e1: 50, e2: 8, col: C.found, dash: '7 4' });
  Kk.step('<b>3. Способ 2 — угольник.</b> Если есть угольник: катет — вдоль AB, к гипотенузе прикладываем линейку, сдвигаем угольник по линейке до точки a и проводим линию по второму катету. Самый быстрый и точный способ.');
  Kk.step('<b>4. Способ 3 — только циркуль (проверка).</b> Через a проводим прямую ∥ AB (тот же угол 25°). Из a одним раствором делаем две засечки X и Y на этой прямой.');
  m('cl', { a: Y, b: X, e1: 40, e2: 40 }); m('arc', { c: a, r: r1, a0: 15, a1: 35 }); m('arc', { c: a, r: r1, a0: 195, a1: 215 }); m('dot', { p: X, r: 3 }); m('dot', { p: Y, r: 3 }); m('lbl', { p: X, t: 'X', ang: 330, size: 12 }); m('lbl', { p: Y, t: 'Y', ang: 210, size: 12 });
  Kk.step('<b>5.</b> Раствор побольше. Дуги из X и из Y пересекаются в точке Z.');
  m('arc', { c: X, r: r2, a0: aX - 12, a1: aX + 12 }); m('arc', { c: Y, r: r2, a0: aY - 12, a1: aY + 12 }); m('dot', { p: Z, col: C.found }); m('lbl', { p: Z, t: 'Z', ang: 90 });
  Kk.step('<b>6.</b> Прямая aZ перпендикулярна AB и совпадает с прямой из способа 1. Значит, транспортир не подвёл.');
  m('seg', { a: a, b: Z, col: C.found, w: 2 }); m('ra', { p: a, d1: d, d2: n, col: C.found });
  mountKon(host, Kk);
}
function toolMid(host) {
  const Kk = new Kon(); Kk.scene('t', { maxH: 320 }); const m = Kk.fn('t');
  const A = [0, 0], B = [1.6, 0], r = 1.05, X = cc(A, r, B, r), M = mid(A, B), T = [0.5, 1.15], mAB = M, mAT = mid(A, T), G = cen(A, B, T);
  Kk.step('<b>1. Середина отрезка.</b> Раствор циркуля больше половины AB. Дуги из A — сверху и снизу.');
  m('link', { a: A, b: B, col: C.l2 }); m('joint', { p: A }); m('joint', { p: B }); m('lbl', { p: A, t: 'A', ang: 200 }); m('lbl', { p: B, t: 'B', ang: 340 });
  m('arc', { c: A, r: r, a0: 30, a1: 70 }); m('arc', { c: A, r: r, a0: -70, a1: -30 });
  Kk.step('<b>2.</b> Тем же раствором — дуги из B. Получаем две точки пересечения.');
  m('arc', { c: B, r: r, a0: 110, a1: 150 }); m('arc', { c: B, r: r, a0: 210, a1: 250 }); m('dot', { p: X[0], r: 3 }); m('dot', { p: X[1], r: 3 });
  Kk.step('<b>3.</b> Прямая через эти точки делит AB пополам (и заодно перпендикулярна AB). Это середина M — так ищут центры масс стержней S<sub>1</sub>, S<sub>4</sub>, S<sub>5</sub>. Можно и проще: измерить AB линейкой и поделить на 2.');
  m('cl', { a: X[1], b: X[0], e1: 10, e2: 10 }); m('dot', { p: M, col: C.found }); m('lbl', { p: M, t: 'M', ang: 300 });
  Kk.step('<b>4. Центр масс треугольника.</b> Для пластины ABC нужны середины двух сторон. Соединяем каждую середину с противоположной вершиной — это медианы.');
  m('link', { a: A, b: T, col: C.l2, w: 2.4 }); m('link', { a: B, b: T, col: C.l2, w: 2.4 }); m('tri', { p: [A, B, T], col: C.l2 }); m('joint', { p: T }); m('lbl', { p: T, t: 'C', ang: 90 });
  m('dot', { p: mAT, r: 3 }); m('cl', { a: T, b: mAB, e1: 0, e2: 4, col: C.found }); m('cl', { a: B, b: mAT, e1: 0, e2: 4, col: C.found });
  Kk.step('<b>5.</b> Медианы пересекаются в центре тяжести S. Он делит каждую медиану в отношении 2 : 1, считая от вершины. Это и есть S<sub>2</sub> для треугольного звена.');
  m('dot', { p: G, col: C.found, r: 4 }); m('lbl', { p: G, t: 'S', ang: 20 });
  mountKon(host, Kk);
}

/* ---------- теория: вращение стержня ---------- */
function wRod(host) {
  host.innerHTML = `<svg class="wsvg" role="img" aria-label="Скорости точек вращающегося стержня"></svg>
  <div class="wctl"><button class="pl">❚❚ Пауза</button><span class="wl">ω</span><input type="range" min="-2" max="2" step="0.1" value="1.2" aria-label="Угловая скорость"><b class="wv"></b></div>
  <div class="rd rd1"></div>`;
  const svg = host.querySelector('svg'), sc = new Scene(svg, { maxH: 330, pad: 24 }); sc.fit([[-0.37, -0.37], [0.37, 0.37]]);
  const inp = host.querySelector('input'), wv = host.querySelector('.wv'), rd = host.querySelector('.rd'), pl = host.querySelector('.pl');
  let th = 0.6, w = 1.2, run = true, last = 0; const rs = [0.1, 0.2, 0.3], kv = 0.32;
  function draw() {
    sc.clear(); const u = dirv(th / D2R), items = [];
    for (const r of rs) { const S = sc.X([0, 0]); el('circle', { cx: S[0], cy: S[1], r: (r * sc.k).toFixed(1), fill: 'none', stroke: C.muted, 'stroke-dasharray': '3 5', 'stroke-width': 1 }, sc.L.cons); }
    items.push({ k: 'link', a: [0, 0], b: mul(u, 0.3), col: C.l1 }, { k: 'ground', p: [0, 0] }, { k: 'joint', p: [0, 0] });
    rs.forEach((r, i) => { const P = mul(u, r), v = mul(rot(u), w * r * kv); items.push({ k: 'dot', p: P, col: C.text, r: 3.2 }); if (Math.abs(w) > 0.04) items.push({ k: 'vec', a: P, b: add(P, v), col: C.found }); items.push({ k: 'lbl', p: P, t: String(i + 1), ang: angd(u) + 180 + (i === 2 ? -30 : 30), size: 12, col: C.muted }); });
    if (Math.abs(w) > 0.04) items.push(Object.assign({ k: 'omega' }, omegaSpec([0, 0], [mul(u, 0.3)], w, 'ω', C.known, true, 22)));
    drawItems(sc, items);
  }
  function upd() { wv.textContent = fs(w, 2) + ' рад/с'; rd.innerHTML = rs.map((r, i) => `<div><span>точка ${i + 1}, r = ${fz(r)} м</span><b>V = ${fz(Math.abs(w).toFixed(1))} · ${fz(r)} = ${fz((Math.abs(w) * r).toFixed(2))} м/с</b></div>`).join(''); }
  inp.oninput = () => { w = +inp.value; upd(); draw(); };
  pl.onclick = () => { run = !run; pl.textContent = run ? '❚❚ Пауза' : '▶ Пуск'; if (run) { last = 0; requestAnimationFrame(tick); } };
  function tick(t) { if (!run) return; if (last) th += w * (t - last) / 1000; last = t; draw(); requestAnimationFrame(tick); }
  upd(); draw(); onVisible(host, () => requestAnimationFrame(tick));
}

/* ---------- теория: четырёхзвенник для пояснений ---------- */
function fb4(phi) {
  const r1 = 45, l2 = 150, l3 = 100, O1 = [0, 0], O3 = [150, 0], A = mul(dirv(phi), r1), X = cc(A, l2, O3, l3); if (!X) return null; const B = X[0];
  const a = mul(rot(A), 1), b = ll(a, rot(sub(B, A)), [0, 0], rot(sub(B, O3)));
  return { O1, O3, A, B, a, b, w2: omegaOf(A, B, a, b, 1), w3: omegaOf(O3, B, [0, 0], b, 1) };
}
function fbItems(F, o) {
  o = o || {}; const it = [
    { k: 'link', a: F.O1, b: F.A, col: C.l1 }, { k: 'link', a: F.A, b: F.B, col: C.l2 }, { k: 'link', a: F.O3, b: F.B, col: C.l4 },
    { k: 'ground', p: F.O1 }, { k: 'ground', p: F.O3 }, { k: 'joint', p: F.O1 }, { k: 'joint', p: F.O3 }, { k: 'joint', p: F.A }, { k: 'joint', p: F.B }];
  if (o.lbl !== false) it.push({ k: 'lbl', p: F.O1, t: 'O_{1}', ang: bestAng(F.O1, [F.A], [250, 290]) }, { k: 'lbl', p: F.O3, t: 'O_{3}', ang: bestAng(F.O3, [F.B], [250, 290]) }, { k: 'lbl', p: F.A, t: 'A', ang: bestAng(F.A, [F.O1, F.B]) }, { k: 'lbl', p: F.B, t: 'B', ang: bestAng(F.B, [F.A, F.O3]) });
  return it;
}
function wPlane(host) {
  host.innerHTML = `<svg class="wsvg" role="img" aria-label="Скорости точек шатуна"></svg>
  <div class="wctl"><button class="pl">❚❚ Пауза</button><label class="ck"><input type="checkbox" checked> разложить V<sub>B</sub></label></div>
  <div class="wctl"><span class="wl">φ</span><input class="ph" type="range" min="0" max="359" step="1" value="60" aria-label="Угол кривошипа"><b class="wv"></b></div><div class="rd"></div>`;
  const svg = host.querySelector('svg'), sc = new Scene(svg, { maxH: 330, pad: 28 }), kv = 1.25, pts = [];
  for (let p = 0; p < 360; p += 6) { const F = fb4(p); pts.push(F.A, F.B, add(F.A, mul(F.a, kv)), add(F.B, mul(F.b, kv)), add(F.B, mul(F.a, kv))); }
  pts.push([0, -22]); sc.fit(pts);
  const ck = host.querySelector('input[type=checkbox]'), ph = host.querySelector('.ph'), wv = host.querySelector('.wv'), rd = host.querySelector('.rd'), pl = host.querySelector('.pl');
  let phi = 60, run = true, last = 0;
  function draw() {
    const F = fb4(phi); sc.clear(); const it = fbItems(F);
    const tA = add(F.B, mul(F.a, kv)), tB = add(F.B, mul(F.b, kv));
    it.push({ k: 'vec', a: F.A, b: add(F.A, mul(F.a, kv)), col: C.known }, { k: 'lbl', p: add(F.A, mul(F.a, kv)), t: 'V_{A}', ang: bestAng(add(F.A, mul(F.a, kv)), [F.A]), col: C.known, size: 13 });
    if (ck.checked) {
      it.push({ k: 'vec', a: F.B, b: tA, col: C.known, dash: '5 4', w: 2 }, { k: 'vec', a: tA, b: tB, col: C.rel }, { k: 'ra', p: tA, d1: sub(F.B, F.A), d2: sub(tB, tA), col: C.rel, size: 7 });
      it.push({ k: 'lbl', p: mid(tA, tB), t: 'V_{BA}', ang: bestAng(mid(tA, tB), [tA, tB, F.B]), col: C.rel, size: 13 });
    }
    it.push({ k: 'vec', a: F.B, b: tB, col: C.found }, { k: 'lbl', p: tB, t: 'V_{B}', ang: bestAng(tB, [F.B, tA]), col: C.found, size: 13 });
    drawItems(sc, it); const w1 = 10, kk = 0.001;
    wv.textContent = Math.round(phi) + '°';
    rd.innerHTML = `<div><span>V<sub>A</sub> = ω<sub>1</sub>·O<sub>1</sub>A</span><b>${fs(len(F.a) * w1 * kk)} м/с</b></div><div><span>V<sub>BA</sub> = ω<sub>2</sub>·AB</span><b>${fs(len(sub(F.b, F.a)) * w1 * kk)} м/с</b></div><div><span>V<sub>B</sub></span><b>${fs(len(F.b) * w1 * kk)} м/с</b></div><div><span>ω<sub>2</sub></span><b>${fs(Math.abs(F.w2) * w1)} рад/с, ${dirW(F.w2)}</b></div>`;
  }
  ck.onchange = draw; ph.oninput = () => { phi = +ph.value; draw(); };
  pl.onclick = () => { run = !run; pl.textContent = run ? '❚❚ Пауза' : '▶ Пуск'; if (run) { last = 0; requestAnimationFrame(tick); } };
  function tick(t) { if (!run) return; if (last) { phi = (phi + (t - last) * 0.03) % 360; ph.value = Math.round(phi); } last = t; draw(); requestAnimationFrame(tick); }
  draw(); onVisible(host, () => requestAnimationFrame(tick));
}
function wTransfer(host) {
  host.innerHTML = `<svg class="wsvg" role="img" aria-label="Перенос векторов скоростей в полюс"></svg>
  <div class="wctl"><button class="go">▶ Перенести в полюс</button><button class="rs">Сначала</button></div><div class="cap"></div>`;
  const svg = host.querySelector('svg'), sc = new Scene(svg, { maxH: 380, pad: 34 }), F = fb4(70), kv = 2.5, P0 = [215, -120];
  const a = add(P0, mul(F.a, kv)), b = add(P0, mul(F.b, kv)), Ad = add(F.A, mul(F.a, kv)), Bd = add(F.B, mul(F.b, kv));
  sc.fit([F.O1, F.O3, F.A, F.B, Ad, Bd, P0, a, b, [0, -20]]);
  const cap = host.querySelector('.cap'); let t = 0, raf = 0;
  const C0 = 'Векторы V<sub>A</sub> и V<sub>B</sub> нарисованы прямо на механизме. Неудобно: они налезают на звенья, а разницу V<sub>B</sub> − V<sub>A</sub> не видно.';
  const C1 = 'Переносим оба вектора параллельно самим себе так, чтобы они начинались в одной точке p — полюсе. Это и есть план скоростей. Отрезок ab между концами — относительная скорость V<sub>BA</sub>, и он перпендикулярен AB.';
  function draw() {
    sc.clear(); const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, sA = lerp(F.A, P0, e), sB = lerp(F.B, P0, e);
    const it = fbItems(F); it.push({ k: 'vec', a: sA, b: add(sA, mul(F.a, kv)), col: C.known }, { k: 'vec', a: sB, b: add(sB, mul(F.b, kv)), col: C.found });
    if (t < 0.05) it.push({ k: 'lbl', p: Ad, t: 'V_{A}', ang: bestAng(Ad, [F.A]), col: C.known, size: 13 }, { k: 'lbl', p: Bd, t: 'V_{B}', ang: bestAng(Bd, [F.B]), col: C.found, size: 13 });
    it.push({ k: 'dot', p: P0, col: C.text }, { k: 'lbl', p: P0, t: 'p', ang: bestAng(P0, [a, b]) });
    if (t >= 1) {
      it.push({ k: 'vec', a: a, b: b, col: C.rel }, { k: 'lbl', p: a, t: 'a', ang: bestAng(a, [P0, b]) }, { k: 'lbl', p: b, t: 'b', ang: bestAng(b, [P0, a]) });
      it.push({ k: 'cl', a: sub(a, mul(unit(sub(F.B, F.A)), 30)), b: add(a, mul(unit(sub(F.B, F.A)), 30)), e1: 0, e2: 0 }, { k: 'ra', p: a, d1: sub(F.B, F.A), d2: sub(b, a), col: C.rel });
    }
    drawItems(sc, it); cap.innerHTML = t >= 1 ? C1 : C0;
  }
  host.querySelector('.go').onclick = () => { cancelAnimationFrame(raf); const t0 = performance.now(); const f = now => { t = Math.min(1, (now - t0) / 1400); draw(); if (t < 1) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); };
  host.querySelector('.rs').onclick = () => { cancelAnimationFrame(raf); t = 0; draw(); };
  draw();
}
function wSimilar(host) {
  host.innerHTML = `<svg class="wsvg" role="img" aria-label="Теорема подобия"></svg>
  <div class="wctl"><button class="go">▶ Повернуть на 90° и сжать</button><button class="dw">ω: против часовой</button><button class="rs">Сначала</button></div><div class="cap small"></div>`;
  const svg = host.querySelector('svg'), sc = new Scene(svg, { maxH: 330, pad: 30 });
  const A = [0, 0], B = [115, 20], Cc = [40, 85], VA = [34, 22], P0 = [190, -40];
  let w = 0.6, t = 0, raf = 0; const cap = host.querySelector('.cap'), dw = host.querySelector('.dw');
  const plan = () => { const a = add(P0, VA); return { a: a, b: add(a, mul(rot(sub(B, A)), w)), c: add(a, mul(rot(sub(Cc, A)), w)) }; };
  const fitAll = () => { const pts = [A, B, Cc, P0]; for (const ww of [0.6, -0.6]) { const a = add(P0, VA); pts.push(a, add(a, mul(rot(sub(B, A)), ww)), add(a, mul(rot(sub(Cc, A)), ww))); } sc.fit(pts); };
  fitAll();
  function draw() {
    sc.clear(); const p = plan(), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, th = 90 * Math.sign(w) * e, s = 1 + (Math.abs(w) - 1) * e, an = lerp(A, p.a, e);
    const T = q => add(an, mul(rotBy(sub(q, A), th), s)), it = [];
    it.push({ k: 'tri', p: [A, B, Cc], col: C.l2 }, { k: 'link', a: A, b: B, col: C.l2 }, { k: 'link', a: B, b: Cc, col: C.l2 }, { k: 'link', a: Cc, b: A, col: C.l2 });
    [[A, 'A'], [B, 'B'], [Cc, 'C']].forEach(z => it.push({ k: 'joint', p: z[0] }, { k: 'lbl', p: z[0], t: z[1], ang: bestAng(z[0], [A, B, Cc].filter(q => q !== z[0])) }));
    it.push(Object.assign({ k: 'omega' }, omegaSpec(cen(A, B, Cc), [], w, 'ω', C.rel, false, 16)));
    it.push({ k: 'dot', p: P0 }, { k: 'lbl', p: P0, t: 'p', ang: bestAng(P0, [p.a, p.b, p.c]) }, { k: 'poly', p: [p.a, p.b, p.c], col: C.found, op: 0.12 });
    it.push({ k: 'vec', a: P0, b: p.a, col: C.known, w: 2 }, { k: 'vec', a: P0, b: p.b, col: C.found, w: 2 }, { k: 'vec', a: P0, b: p.c, col: C.found, w: 2 });
    it.push({ k: 'seg', a: p.a, b: p.b, col: C.found }, { k: 'seg', a: p.b, b: p.c, col: C.found }, { k: 'seg', a: p.c, b: p.a, col: C.found });
    [[p.a, 'a'], [p.b, 'b'], [p.c, 'c']].forEach(z => it.push({ k: 'lbl', p: z[0], t: z[1], ang: bestAng(z[0], [P0, p.a, p.b, p.c].filter(q => q !== z[0])) }));
    if (t > 0) { const q = [T(A), T(B), T(Cc)]; it.push({ k: 'poly', p: q, col: C.rel, op: 0.08, stroke: C.rel }); }
    drawItems(sc, it);
    cap.innerHTML = t >= 1 ? `Копия звена ABC, повёрнутая на 90° ${w > 0 ? 'против' : 'по'} часовой и уменьшенная в нужное число раз, легла точно на abc. Это теорема подобия: <b>фигура на плане подобна звену и повёрнута на 90° в сторону его ω</b>.` : 'Слева звено ABC, справа его план скоростей abc. Похожи? Жми кнопку: повернём копию звена на 90° и уменьшим.';
  }
  host.querySelector('.go').onclick = () => { cancelAnimationFrame(raf); const t0 = performance.now(); const f = now => { t = Math.min(1, (now - t0) / 1600); draw(); if (t < 1) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); };
  host.querySelector('.rs').onclick = () => { cancelAnimationFrame(raf); t = 0; draw(); };
  dw.onclick = () => { w = -w; dw.textContent = 'ω: ' + (w > 0 ? 'против часовой' : 'по часовой'); cancelAnimationFrame(raf); t = 0; draw(); };
  draw();
}
function wCam(host) {
  host.innerHTML = `<svg class="wsvg" role="img" aria-label="Кулачок-эксцентрик и заменяющий механизм"></svg>
  <div class="wctl"><button class="pl">❚❚ Пауза</button><label class="ck"><input type="checkbox" checked> заменяющий механизм</label></div>`;
  const svg = host.querySelector('svg'), sc = new Scene(svg, { maxH: 360, pad: 30 }), e = 28, R0 = 70, rr = 16, kv = 0.75;
  const solve = phi => { const A = mul(dirv(phi), e), X = K.lc([0, 0], [0, 1], A, R0 + rr), B = X[1], a = mul(rot(A), 1), b = ll(a, rot(sub(B, A)), [0, 0], [0, 1]); return { A, B, a, b, top: add(B, [0, 95]) }; };
  const pts = []; for (let p = 0; p < 360; p += 10) { const s = solve(p); pts.push(add(s.A, [-R0, -R0]), add(s.A, [R0, R0]), add(s.top, [0, 10]), add(s.top, mul(s.b, kv))); } sc.fit(pts);
  const ck = host.querySelector('input'), pl = host.querySelector('.pl'); let phi = 20, run = true, last = 0;
  function draw() {
    const s = solve(phi), O = [0, 0]; sc.clear(); const it = [];
    it.push({ k: 'circ', c: s.A, r: R0, col: C.l1, fill: C.l1, op: 0.12, w: 2.4, layer: 'under' }, { k: 'link', a: s.B, b: s.top, col: C.l4, w: 4 }, { k: 'bush', p: add(s.B, [0, 60]), d: [0, 1] }, { k: 'circ', c: s.B, r: rr, col: C.l3, w: 2.2 });
    it.push({ k: 'ground', p: O }, { k: 'joint', p: O }, { k: 'dot', p: s.A, r: 3, col: C.l1 });
    if (ck.checked) {
      const u = unit(sub(s.B, s.A)); it.push({ k: 'seg', a: sub(s.A, mul(u, 45)), b: add(s.B, mul(u, 40)), col: C.muted, dash: '3 4' }, { k: 'lbl', p: add(s.B, mul(u, 40)), t: 'n', ang: angd(u), col: C.muted, size: 12, dist: 10 });
      it.push({ k: 'link', a: O, b: s.A, col: C.rel, w: 2.4, dash: '6 4' }, { k: 'link', a: s.A, b: s.B, col: C.rel, w: 2.4, dash: '6 4' }, { k: 'joint', p: s.A, r: 3.6, col: C.rel }, { k: 'joint', p: s.B, r: 3.6, col: C.rel });
      it.push({ k: 'lbl', p: s.A, t: 'A', ang: bestAng(s.A, [O, s.B]), col: C.rel, size: 13 }, { k: 'lbl', p: s.B, t: 'B', ang: bestAng(s.B, [s.A, s.top], [0, 180]), col: C.rel, size: 13, dist: 24 });
    }
    it.push({ k: 'lbl', p: O, t: 'O', ang: K.pivAng(O, [s.A], [250, 290], [s.A]), size: 13, dist: 20 });
    it.push({ k: 'vec', a: s.top, b: add(s.top, mul(s.b, kv)), col: C.found });
    it.push(Object.assign({ k: 'omega' }, omegaSpec(O, [s.A], 1, 'ω_{1}', C.known, true, 18)));
    drawItems(sc, it);
  }
  pl.onclick = () => { run = !run; pl.textContent = run ? '❚❚ Пауза' : '▶ Пуск'; if (run) { last = 0; requestAnimationFrame(tick); } };
  ck.onchange = draw;
  function tick(t) { if (!run) return; if (last) phi = (phi + (t - last) * 0.05) % 360; last = t; draw(); requestAnimationFrame(tick); }
  draw(); onVisible(host, () => requestAnimationFrame(tick));
}
function wDyads(host) {
  const cards = [
    { t: 'ВВВ — два стержня, три шарнира', eq: '<span class="vv">V</span><sub>B</sub> = <span class="vv">V</span><sub>A</sub> + <span class="vv">V</span><sub>BA</sub> = <span class="vv">V</span><sub>C</sub> + <span class="vv">V</span><sub>BC</sub>', pl: 'через a — прямая ⊥ AB, через c — прямая ⊥ CB. Если C неподвижна, c = p.', f: m => { const A = [0, 0], Cc = [2, -0.1], B = cc(A, 1.3, Cc, 1.1)[0]; m('link', { a: A, b: B, col: C.l2 }); m('link', { a: Cc, b: B, col: C.l4 }); m('joint', { p: A, col: C.known }); m('joint', { p: Cc, col: C.known }); m('joint', { p: B, col: C.found }); m('lbl', { p: A, t: 'A', ang: 210, col: C.known }); m('lbl', { p: Cc, t: 'C', ang: 330, col: C.known }); m('lbl', { p: B, t: 'B', ang: 90, col: C.found }); } },
    { t: 'ВВП — шатун и ползун', eq: '<span class="vv">V</span><sub>B</sub> = <span class="vv">V</span><sub>A</sub> + <span class="vv">V</span><sub>BA</sub>, <span class="vv">V</span><sub>B</sub> ∥ направляющей', pl: 'через a — прямая ⊥ AB, через p — прямая ∥ направляющей.', f: m => { const A = [0, 0.6], B = [1.9, 0]; m('guide', { p: B, d: [1, 0], l1: 50, l2: 40, side: 1 }); m('link', { a: A, b: B, col: C.l2 }); m('slider', { p: B, d: [1, 0] }); m('joint', { p: A, col: C.known }); m('joint', { p: B, col: C.found }); m('lbl', { p: A, t: 'A', ang: 150, col: C.known }); m('lbl', { p: B, t: 'B', ang: 90, col: C.found, dist: 20 }); } },
    { t: 'ВПВ — кулиса и камень', eq: '<span class="vv">V</span><sub>A3</sub> = <span class="vv">V</span><sub>A2</sub> + <span class="vv">V</span><sub>A3A2</sub>, <span class="vv">V</span><sub>A3A2</sub> ∥ кулисе', pl: 'через a<sub>2</sub> — прямая ∥ кулисе, через p — прямая ⊥ кулисе (кулиса вращается вокруг O<sub>3</sub>).', f: m => { const O3 = [0, -0.4], A = [0.9, 0.9], u = unit(sub(A, O3)), E = add(O3, mul(u, 2.1)); m('link', { a: O3, b: E, col: C.l2 }); m('slider', { p: A, d: u }); m('ground', { p: O3 }); m('joint', { p: O3 }); m('joint', { p: A, col: C.known }); m('lbl', { p: O3, t: 'O_{3}', ang: 180 }); m('lbl', { p: A, t: 'A', ang: 160, col: C.known, dist: 22 }); } }
  ];
  host.classList.add('dy');
  for (const c of cards) {
    const box = hh('div', 'dyc', host), Kk = new Kon(); Kk.scene('t', { maxH: 170, minH: 120, pad: 30 }); c.f(Kk.fn('t'));
    hh('div', 'dyt', box, c.t); const fig = hh('div', 'dyf', box); mountKon(fig, Kk, { static: true });
    hh('p', 'small', box, '<b>Уравнения:</b> ' + c.eq); hh('p', 'small', box, '<b>На плане:</b> ' + c.pl);
  }
}

/* ---------- живой план варианта 25 ---------- */
function wHero(host) {
  host.innerHTML = `<div class="duo hero-duo"><div class="scb"><div class="sct">Механизм (вариант 25)</div><svg class="wsvg"></svg></div><div class="scb"><div class="sct">План скоростей</div><svg class="wsvg"></svg></div></div>
  <div class="wctl"><button class="pl">▶ Пуск</button><button class="g60">φ = 60° (как в задании)</button><span class="wv"></span></div>
  <input class="ph" type="range" min="0" max="359" step="1" value="60" aria-label="Угол кривошипа"><div class="rd rd4"></div>`;
  const svgs = host.querySelectorAll('svg'), sm = new Scene(svgs[0], { maxH: 330, pad: 30 }), sp = new Scene(svgs[1], { maxH: 300, H: 300, pad: 34 });
  const base = { u: 'см', a: 80, b: 40, c: 40, O1A: 30, AC: 80, AB: 50, BC: 60, BD: 40, O2D: 70, w1: -3 };
  const mp = [], pp = [[0, 0]]; let prev = null;
  for (let t = 0; t < 360; t += 3) { const S = SIX.solve(Object.assign({ phiT: t }, base), prev); prev = S.D; mp.push(S.O1, S.O2, S.A, S.B, S.C, S.D, add(S.C, [14, 0]), add(S.C, [-12, 0])); pp.push(S.a, S.b, S.c, S.d); }
  sm.fit(mp); let pv = null;
  const ph = host.querySelector('.ph'), pl = host.querySelector('.pl'), wv = host.querySelector('.wv'), rd = host.querySelector('.rd');
  let phiT = 60, run = false, last = 0, pD = null;
  function draw() {
    const S = SIX.solve(Object.assign({ phiT: phiT }, base), pD); if (!S) return; pD = S.D;
    sp.fit([[0, 0], S.a, S.b, S.c, S.d]); if (pv && run) { const q = 0.12; sp.k = pv.k + (sp.k - pv.k) * q; sp.ox = pv.ox + (sp.ox - pv.ox) * q; sp.oy = pv.oy + (sp.oy - pv.oy) * q; } pv = { k: sp.k, ox: sp.ox, oy: sp.oy };
    sm.clear(); sp.clear(); const mi = []; SIX.draw(shim(mi), 'm', S, { phi: false }); drawItems(sm, mi);
    const o = [0, 0], it = [{ k: 'poly', p: [S.a, S.b, S.c], col: C.l2, op: 0.12 },
      { k: 'seg', a: S.a, b: S.c, col: C.rel, w: 1.4 }, { k: 'seg', a: S.a, b: S.b, col: C.rel, w: 1.4 }, { k: 'seg', a: S.c, b: S.b, col: C.rel, w: 1.4 }, { k: 'seg', a: S.b, b: S.d, col: C.rel, w: 1.4 },
      { k: 'vec', a: o, b: S.a, col: C.known }, { k: 'vec', a: o, b: S.c, col: C.found }, { k: 'vec', a: o, b: S.b, col: C.found }, { k: 'vec', a: o, b: S.d, col: C.found }, { k: 'dot', p: o }];
    [[o, 'p', [S.a, S.b, S.c, S.d]], [S.a, 'a', [o, S.b, S.c]], [S.b, 'b', [o, S.a, S.c, S.d]], [S.c, 'c', [o, S.a, S.b]], [S.d, 'd', [o, S.b]]].forEach(z => it.push({ k: 'lbl', p: z[0], t: z[1], ang: bestAng(z[0], z[2]) }));
    drawItems(sp, it);
    wv.textContent = 'φ = ' + Math.round(phiT) + '°';
    const row = (h, v) => `<div><span>${h}</span><b>${v}</b></div>`;
    rd.innerHTML = row('V<sub>C</sub>', fs(len(S.c)) + ' м/с') + row('V<sub>B</sub>', fs(len(S.b)) + ' м/с') + row('V<sub>D</sub>', fs(len(S.d)) + ' м/с') + row('V<sub>S2</sub>', fs(len(S.s2)) + ' м/с') + row('ω<sub>2</sub>, рад/с', fs(Math.abs(S.w2)) + ' ' + (S.w2 < 0 ? 'по час.' : 'против')) + row('ω<sub>4</sub>, рад/с', fs(Math.abs(S.w4)) + ' ' + (S.w4 < 0 ? 'по час.' : 'против')) + row('ω<sub>5</sub>, рад/с', fs(Math.abs(S.w5)) + ' ' + (S.w5 < 0 ? 'по час.' : 'против')) + row('V<sub>A</sub>', '0,9 м/с всегда');
  }
  ph.oninput = () => { phiT = +ph.value; draw(); };
  host.querySelector('.g60').onclick = () => { phiT = 60; ph.value = 60; if (run) pl.click(); draw(); };
  pl.onclick = () => { run = !run; pl.textContent = run ? '❚❚ Пауза' : '▶ Пуск'; if (run) { last = 0; requestAnimationFrame(tick); } };
  function tick(t) { if (!run) return; if (last) { phiT = (phiT + (t - last) * 0.03) % 360; ph.value = Math.round(phiT); } last = t; draw(); requestAnimationFrame(tick); }
  draw();
}

/* ---------- тренажёр направлений ---------- */
function wDrill1(host) {
  host.innerHTML = `<svg class="wsvg" role="img" aria-label="Куда направлена скорость"></svg><div class="opts"></div><div class="fb"></div><div class="wctl"><button class="nx">Следующий →</button><span class="score"></span></div>`;
  const sc = new Scene(host.querySelector('svg'), { maxH: 320, pad: 22 }); sc.fit([[-1.75, -1.75], [1.75, 1.75]]);
  const opts = host.querySelector('.opts'), fb = host.querySelector('.fb'), score = host.querySelector('.score'); let ok = 0, tot = 0, st;
  function newQ() {
    const th = Math.floor(Math.random() * 24) * 15 + 7, w = Math.random() < 0.5 ? 1 : -1, u = dirv(th), A = mul(u, 1), good = mul(rot(u), w);
    const dirs = [good, mul(good, -1), u, unit(add(good, u))], perm = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    st = { th, w, u, A, dirs, perm, done: false }; draw(-1); fb.innerHTML = 'Звено OA вращается вокруг O. Какая стрелка — скорость точки A?';
    opts.innerHTML = perm.map((_, i) => `<button data-i="${i}">${i + 1}</button>`).join('');
    opts.querySelectorAll('button').forEach(b => b.onclick = () => answer(+b.dataset.i));
  }
  function draw(pick) {
    sc.clear(); const it = [{ k: 'link', a: [0, 0], b: st.A, col: C.l1 }, { k: 'ground', p: [0, 0] }, { k: 'joint', p: [0, 0] }, { k: 'joint', p: st.A }, { k: 'lbl', p: [0, 0], t: 'O', ang: bestAng([0, 0], [st.A], [250, 290]) }];
    it.push(Object.assign({ k: 'omega' }, omegaSpec([0, 0], [st.A], st.w, 'ω', C.known, true, 26)));
    st.perm.forEach((di, i) => { const d = st.dirs[di], T = add(st.A, mul(d, 0.72)); let col = C.soft; if (pick >= 0) { if (di === 0) col = C.ok; else if (i === pick) col = C.bad; } it.push({ k: 'vec', a: st.A, b: T, col: col }, { k: 'lbl', p: T, t: String(i + 1), ang: angd(d), dist: 13, col: col }); });
    it.push({ k: 'lbl', p: st.A, t: 'A', ang: bestAng(st.A, st.dirs.map(d => add(st.A, d)).concat([[0, 0]])), dist: 15, size: 13 });
    drawItems(sc, it);
  }
  function answer(i) {
    if (st.done) return; st.done = true; tot++; const right = st.perm[i] === 0; if (right) ok++;
    draw(i); fb.innerHTML = (right ? '<b class="okc">Верно.</b> ' : '<b class="badc">Не та.</b> Правильная — зелёная. ') + 'Скорость точки вращающегося звена всегда ⊥ радиусу OA, а стрелка смотрит туда, куда ω поворачивает звено. Стрелка вдоль OA или наискосок невозможна: тогда точка A удалялась бы от O, а длина звена не меняется.';
    score.textContent = `верно ${ok} из ${tot}`;
  }
  host.querySelector('.nx').onclick = newQ; newQ();
}
function wDrill2(host) {
  host.innerHTML = `<svg class="wsvg" role="img" aria-label="Куда вращается звено"></svg><div class="opts"><button data-a="0">↻ по часовой</button><button data-a="1">↺ против часовой</button></div><div class="fb"></div><div class="wctl"><button class="nx">Следующий →</button><span class="score"></span></div>`;
  const sc = new Scene(host.querySelector('svg'), { maxH: 250, pad: 20 }); sc.fit([[-1.8, -1.3], [1.8, 1.3]]);
  const fb = host.querySelector('.fb'), score = host.querySelector('.score'); let ok = 0, tot = 0, st;
  function newQ() {
    const th = Math.floor(Math.random() * 24) * 15 + 4, u = dirv(th), A = mul(u, -0.75), B = mul(u, 0.75), sg = Math.random() < 0.5 ? 1 : -1, v = mul(rot(u), 0.75 * sg);
    st = { A, B, v, ccw: sg > 0, done: false }; fb.innerHTML = 'Вектор V<sub>BA</sub> (с плана, отрезок ab) перенесли в точку B звена AB. Куда вращается звено?'; draw(null);
  }
  function draw(res) {
    sc.clear(); const it = [{ k: 'link', a: st.A, b: st.B, col: C.l2 }, { k: 'joint', p: st.A }, { k: 'joint', p: st.B }, { k: 'vec', a: st.B, b: add(st.B, st.v), col: C.rel }, { k: 'lbl', p: st.A, t: 'A', ang: bestAng(st.A, [st.B]) }, { k: 'lbl', p: st.B, t: 'B', ang: bestAng(st.B, [st.A, add(st.B, st.v)]) }, { k: 'lbl', p: add(st.B, st.v), t: 'V_{BA}', ang: bestAng(add(st.B, st.v), [st.B]), col: C.rel, size: 13 }];
    if (res != null) it.push(Object.assign({ k: 'omega' }, omegaSpec(st.A, [st.B], st.ccw ? 1 : -1, 'ω', C.ok, false, 30)));
    drawItems(sc, it);
  }
  host.querySelectorAll('.opts button').forEach(b => b.onclick = () => {
    if (st.done) return; st.done = true; tot++; const right = (+b.dataset.a === 1) === st.ccw; if (right) ok++; draw(1);
    fb.innerHTML = (right ? '<b class="okc">Верно.</b> ' : `<b class="badc">Нет, ${st.ccw ? 'против' : 'по'} часовой.</b> `) + 'Мысленно прибей точку A гвоздём и толкни точку B по стрелке — звено повернётся туда, куда указывает зелёная дуга.';
    score.textContent = `верно ${ok} из ${tot}`;
  });
  host.querySelector('.nx').onclick = newQ; newQ();
}
const QUIZ = [
  { q: 'Ползун B ездит по горизонтальной направляющей, шатун AB. Скорость A уже на плане. Какие две прямые проводим, чтобы найти b?', o: ['Через a ⊥ AB, через p горизонтально', 'Через a ∥ AB, через p вертикально', 'Через p ⊥ AB, через a горизонтально'], a: 0, e: '<span class="vv">V</span><sub>B</sub> = <span class="vv">V</span><sub>A</sub> + <span class="vv">V</span><sub>BA</sub>: относительная V<sub>BA</sub> ⊥ AB и начинается в a. Абсолютная V<sub>B</sub> идёт вдоль направляющей и начинается в p.' },
  { q: 'Шарнир B соединяет шатун AB и коромысло O<sub>3</sub>B (O<sub>3</sub> неподвижна). Какие прямые?', o: ['Через a ⊥ AB, через p ⊥ O<sub>3</sub>B', 'Через a ⊥ O<sub>3</sub>B, через p ⊥ AB', 'Через a ∥ AB, через p ∥ O<sub>3</sub>B'], a: 0, e: 'Для шатуна: V<sub>BA</sub> ⊥ AB от точки a. Для коромысла: V<sub>B</sub> ⊥ O<sub>3</sub>B, а неподвижная O<sub>3</sub> на плане сидит в полюсе p.' },
  { q: 'Где на плане скоростей неподвижные точки — шарниры стойки O<sub>1</sub>, O<sub>2</sub>?', o: ['В полюсе p', 'Там же, где на схеме', 'Их на плане нет'], a: 0, e: 'Их скорость ноль, а нулевой вектор из p заканчивается в самом p.' },
  { q: 'Камень A<sub>2</sub> на кулисе, которая качается вокруг O<sub>3</sub>. Какие прямые для точки кулисы a<sub>3</sub>?', o: ['Через a<sub>2</sub> ∥ кулисе, через p ⊥ кулисе', 'Через a<sub>2</sub> ⊥ кулисе, через p ∥ кулисе', 'Через a<sub>2</sub> ⊥ O<sub>1</sub>A, через p ∥ кулисе'], a: 0, e: 'Относительно камня кулиса может только скользить вдоль себя → ∥. Абсолютно точка кулисы вращается вокруг O<sub>3</sub> → ⊥ кулисе, из p.' },
  { q: 'Что изображает отрезок ab на плане скоростей?', o: ['Скорость B относительно A, V<sub>BA</sub>', 'Абсолютную скорость B', 'Длину звена AB'], a: 0, e: 'Абсолютные скорости — лучи из p. Отрезки между концами лучей — относительные скорости.' },
  { q: 'Как найти ω звена AB по плану?', o: ['ω = ab·μ<sub>V</sub> / l<sub>AB</sub>', 'ω = pb·μ<sub>V</sub> / l<sub>AB</sub>', 'ω = ab / AB на чертеже'], a: 0, e: 'ab·μ<sub>V</sub> — это V<sub>BA</sub> в м/с, а V<sub>BA</sub> = ω·l<sub>AB</sub>. pb брать нельзя: в pb сидит и поступательная часть движения. Исключение — звено вращается вокруг неподвижной точки, тогда эта точка в p.' },
  { q: 'Нужна скорость точки M на шатуне AB (M — вершина треугольника ABM). Как найти m?', o: ['Через a ⊥ AM и через b ⊥ BM', 'Через p ⊥ AM и через p ⊥ BM', 'Середина ab'], a: 0, e: 'M принадлежит тому же звену: <span class="vv">V</span><sub>M</sub> = <span class="vv">V</span><sub>A</sub> + <span class="vv">V</span><sub>MA</sub> = <span class="vv">V</span><sub>B</sub> + <span class="vv">V</span><sub>MB</sub>. Треугольник abm подобен ABM (теорема подобия).' },
  { q: 'Круглый кулачок (центр A, вращается вокруг O) толкает ролик с центром B. Как построить план?', o: ['Заменить на кривошип OA и шатун AB = R + r', 'Взять скорость точки касания K кулачка как скорость толкателя', 'Считать AB перпендикулярным толкателю'], a: 0, e: 'Расстояние между центрами A и B не меняется (R + r), поэтому механизм ведёт себя как кривошипно-ползунный O–A–B. Скорость точки K кулачка и скорость толкателя совпадают только по нормали, не целиком.' },
  { q: 'Масштаб скоростей μ<sub>V</sub> = 0,01 (м/с)/мм, отрезок pb = 74 мм. Чему равна V<sub>B</sub>?', o: ['0,74 м/с', '7,4 м/с', '0,074 м/с'], a: 0, e: 'V = отрезок · μ<sub>V</sub> = 74 · 0,01 = 0,74 м/с.' },
  { q: 'На плане треугольник abc «вывернут»: обход a → b → c идёт в другую сторону, чем A → B → C. Что это значит?', o: ['Где-то ошибка в направлении перпендикуляра или в выборе точки', 'Так и должно быть', 'Механизм в мёртвой точке'], a: 0, e: 'Фигура на плане — это звено, повёрнутое на 90° и сжатое. При повороте порядок обхода сохраняется. Зеркальная фигура — признак ошибки.' }
];
function wQuiz(host) {
  let i = 0, ok = 0, done = false;
  host.innerHTML = `<div class="qz-n"></div><div class="qz-q"></div><div class="qz-o"></div><div class="fb"></div><div class="wctl"><button class="nx">Следующий →</button><span class="score"></span></div>`;
  const qn = host.querySelector('.qz-n'), qq = host.querySelector('.qz-q'), qo = host.querySelector('.qz-o'), fb = host.querySelector('.fb'), sc = host.querySelector('.score');
  function show() {
    const Q = QUIZ[i]; done = false; qn.textContent = `Вопрос ${i + 1} из ${QUIZ.length}`; qq.innerHTML = Q.q; fb.innerHTML = '';
    const ord = Q.o.map((_, j) => j).sort(() => Math.random() - 0.5);
    qo.innerHTML = ord.map(j => `<button data-j="${j}">${Q.o[j]}</button>`).join('');
    qo.querySelectorAll('button').forEach(b => b.onclick = () => {
      if (done) return; done = true; const j = +b.dataset.j, right = j === Q.a; if (right) ok++;
      qo.querySelectorAll('button').forEach(x => { if (+x.dataset.j === Q.a) x.classList.add('ok'); else if (x === b) x.classList.add('bad'); });
      fb.innerHTML = (right ? '<b class="okc">Верно.</b> ' : '<b class="badc">Не совсем.</b> ') + Q.e; sc.textContent = `верно ${ok}`;
    });
  }
  host.querySelector('.nx').onclick = () => { i = (i + 1) % QUIZ.length; if (i === 0) ok = 0; show(); };
  show();
}

/* ---------- задачи ---------- */
function parseNum(s) { s = String(s).trim().replace(/\s/g, '').replace(',', '.').replace('−', '-'); if (!s) return NaN; return parseFloat(s); }
function mountTask(host, def, n, gen) {
  const T = TYPES[def.type], S = T.solve(def.p); if (!S) { host.innerHTML = '<p>Не удалось собрать механизм.</p>'; return; }
  const ans = T.ans(S);
  host.classList.add('tk');
  host.innerHTML = `<div class="tk-h"><span class="tk-n">${gen ? 'Случайная задача' : 'Задача ' + n}</span><span class="tk-t">${T.title}</span>${def.lv ? '<span class="tk-lv">' + def.lv + '</span>' : ''}</div>
  <p class="tk-g"><b>Дано:</b> ${T.given(def.p)}</p><div class="fig"><div class="sch"></div></div><p><b>Найти:</b> ${T.find}.</p>
  <div class="tk-in">${ans.map((a, j) => `<div class="ir" data-j="${j}"><span class="in-l">${a.h}</span><input inputmode="decimal" autocomplete="off" placeholder="число" aria-label="ответ"><span class="in-u">${a.u}</span>${a.dir != null ? `<select aria-label="направление"><option value="">направление?</option>${(a.opts || ['по часовой', 'против часовой']).map((o, k) => `<option value="${k}">${o}</option>`).join('')}</select>` : ''}<span class="mk"></span></div>`).join('')}</div>
  <div class="tk-b"><button class="b-chk">Проверить</button><button class="b-hint">Подсказка</button><button class="b-ans">Ответы</button><button class="b-sol">Решение по шагам</button></div>
  <div class="tk-msg"></div><div class="tk-hint" hidden></div><div class="tk-ans" hidden></div><div class="tk-sol" hidden></div>`;
  mountKon(host.querySelector('.sch'), schemeKon(T, S, { maxH: 280 }), { static: true });
  const msg = host.querySelector('.tk-msg');
  host.querySelector('.b-chk').onclick = () => {
    let good = 0, filled = 0;
    host.querySelectorAll('.ir').forEach(r => {
      const a = ans[+r.dataset.j], inp = r.querySelector('input'), sel = r.querySelector('select'), mk = r.querySelector('.mk'), v = parseNum(inp.value);
      r.classList.remove('ok', 'bad'); mk.textContent = '';
      if (isNaN(v)) { mk.textContent = 'введи число'; return; } filled++;
      let okv = Math.abs(v - a.v) <= Math.max(0.05 * a.v, 0.01), okd = true;
      if (a.dir != null) okd = sel.value !== '' && +sel.value === a.dir;
      if (okv && okd) { good++; r.classList.add('ok'); mk.textContent = '✓'; } else { r.classList.add('bad'); mk.textContent = !okv ? '✗ число' : '✗ направление'; }
    });
    msg.innerHTML = filled ? `Верно ${good} из ${ans.length}. Допуск ±5 % — графика всегда чуть неточна.${good === ans.length ? ' Отлично, план построен верно.' : ' Посмотри подсказку или решение по шагам.'}` : 'Сначала введи хотя бы один ответ.';
  };
  host.querySelector('.b-hint').onclick = () => { const h = host.querySelector('.tk-hint'); h.hidden = !h.hidden; h.innerHTML = '<b>Как решать:</b> ' + T.hint(S); };
  host.querySelector('.b-ans').onclick = () => { const h = host.querySelector('.tk-ans'); h.hidden = !h.hidden; h.innerHTML = '<b>Ответы:</b> ' + ans.map(a => `${a.h} ≈ ${fs(a.v)} ${a.u}${a.dir != null ? ', ' + (a.opts || ['по часовой', 'против часовой'])[a.dir] : ''}`).join('; ') + '.'; };
  host.querySelector('.b-sol').onclick = () => {
    const box = host.querySelector('.tk-sol'); box.hidden = !box.hidden;
    if (!box.hidden && !box.dataset.ok) { box.dataset.ok = 1; box.innerHTML = '<h4>Положение</h4><div class="kp"></div><h4>План скоростей</h4><div class="kv"></div><h4>Ответ</h4><div class="res"></div>'; mountKon(box.querySelector('.kp'), T.pos(S)); mountKon(box.querySelector('.kv'), T.plan(S)); box.querySelector('.res').innerHTML = resTable(T.rows(S), S); }
  };
}
function wTasks(host) { TASKS.forEach((d, i) => { const b = hh('div', null, host); mountTask(b, d, i + 1); }); }
function wGen(host) {
  host.innerHTML = `<div class="wctl gen"><select aria-label="Тип механизма"><option value="any">любой механизм</option><option value="ks">кривошипно-ползунный</option><option value="rrr">четырёхзвенник</option><option value="kul">кулисный</option><option value="cam">кулачок-эксцентрик</option><option value="six">шестизвенник как в КР</option></select><button class="nx">Новая задача</button></div><div class="gt"></div>`;
  const sel = host.querySelector('select'), box = host.querySelector('.gt');
  function make() { let t = sel.value; if (t === 'any') t = Rn.pick(['ks', 'rrr', 'kul', 'cam', 'six', 'six']); const p = TYPES[t].gen(Rn); box.innerHTML = ''; box.className = 'gt'; if (p) mountTask(box, { type: t, p: p }, 0, true); }
  host.querySelector('.nx').onclick = make; make();
}

/* ---------- лист А4 ---------- */
function wA4(host) {
  const S = SIX.solve(EX.r5.p), P = S.p, PAP = '#fbfaf5', INK = '#23252b', GR = '#9aa0ad', BL = '#2350c8', OR = '#d4500b', PK = '#c2185b', TE = '#0e8f78';
  host.innerHTML = '<div class="wctl" style="padding:0 0 10px"><button class="zm">Крупнее</button><span class="small">на телефоне удобнее смотреть крупно и листать вбок</span></div><div class="a4wrap"><svg viewBox="0 0 210 297" class="a4" role="img" aria-label="Пример листа А4"></svg></div>';
  const zm = host.querySelector('.zm'), wr = host.querySelector('.a4wrap'); zm.onclick = () => { wr.classList.toggle('big'); zm.textContent = wr.classList.contains('big') ? 'Целиком' : 'Крупнее'; };
  const svg = host.querySelector('svg'), g = el('g', null, svg);
  el('rect', { x: 0, y: 0, width: 210, height: 297, fill: PAP }, g); el('rect', { x: 20, y: 5, width: 185, height: 287, fill: 'none', stroke: INK, 'stroke-width': 0.5 }, g);
  const T = (x, y, s, size, col, anchor, wt) => { const t = el('text', { x: x, y: y, 'font-size': size || 3, fill: col || INK, 'text-anchor': anchor || 'start', 'font-weight': wt || 500, 'font-family': 'Manrope, system-ui, sans-serif' }, g); rich(t, s, size || 3); return t; };
  const ln = (a, b, col, w, dash) => el('path', { d: pth([a, b]), stroke: col || INK, 'stroke-width': w || 0.5, fill: 'none', 'stroke-dasharray': dash || null, 'stroke-linecap': 'round' }, g);
  const ci = (p, r, col, fill) => el('circle', { cx: p[0].toFixed(2), cy: p[1].toFixed(2), r: r, fill: fill || PAP, stroke: col || INK, 'stroke-width': 0.35 }, g);
  const mk = {}; const arrow = col => { if (mk[col]) return mk[col]; const id = 'a4m' + Object.keys(mk).length; const defs = svg.querySelector('defs') || el('defs', null, svg); const m = el('marker', { id: id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 2.6, markerHeight: 2.6, markerUnits: 'userSpaceOnUse', orient: 'auto' }, defs); el('path', { d: 'M0 1L10 5L0 9z', fill: col }, m); return (mk[col] = 'url(#' + id + ')'); };
  const vec = (a, b, col, w) => el('path', { d: pth([a, b]), stroke: col, 'stroke-width': w || 0.5, fill: 'none', 'marker-end': arrow(col) }, g);
  T(112.5, 13, 'КР 2 «План скоростей». Вариант 25', 4.2, INK, 'middle', 700);
  const M = q => [78 + q[0], 134 - q[1]];
  ln(M([-48, 0]), M([80, 0]), GR, 0.2, '1.5 1'); ln(M([-25, P.c]), M([82, P.c]), GR, 0.2, '1.5 1');
  ln(M([S.C[0] - 8, P.c]), M([S.C[0] + 16, P.c]), INK, 0.45); for (let x = S.C[0] - 7; x < S.C[0] + 16; x += 2.4) ln(M([x, P.c]), M([x - 1.3, P.c - 1.8]), INK, 0.2);
  const arc = (c, r, a0, a1) => { const pts = []; for (let i = 0; i <= 16; i++) { const a = (a0 + (a1 - a0) * i / 16) * D2R; pts.push(M([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)])); } el('path', { d: pth(pts), stroke: GR, 'stroke-width': 0.2, fill: 'none' }, g); };
  arc(S.A, P.AC, angd(sub(S.C, S.A)) - 8, angd(sub(S.C, S.A)) + 6); arc(S.A, P.AB, angd(sub(S.B, S.A)) - 8, angd(sub(S.B, S.A)) + 8); arc(S.C, P.BC, angd(sub(S.B, S.C)) - 7, angd(sub(S.B, S.C)) + 7); arc(S.B, P.BD, angd(sub(S.D, S.B)) - 10, angd(sub(S.D, S.B)) + 10); arc(S.O2, P.O2D, angd(sub(S.D, S.O2)) - 6, angd(sub(S.D, S.O2)) + 6);
  el('path', { d: pth([M(S.A), M(S.B), M(S.C)]) + 'Z', fill: TE, 'fill-opacity': 0.1, stroke: 'none' }, g);
  [[S.O1, S.A], [S.A, S.C], [S.A, S.B], [S.B, S.C], [S.B, S.D], [S.O2, S.D]].forEach(z => ln(M(z[0]), M(z[1]), INK, 0.8));
  const Cs = M(S.C); el('rect', { x: (Cs[0] - 4).toFixed(2), y: (Cs[1] - 2.2).toFixed(2), width: 8, height: 4.4, fill: PAP, stroke: INK, 'stroke-width': 0.45 }, g);
  for (const q of [S.O1, S.O2]) { const s = M(q); ln([s[0], s[1] + 0.8], [s[0] - 2, s[1] + 3.5], INK, 0.35); ln([s[0], s[1] + 0.8], [s[0] + 2, s[1] + 3.5], INK, 0.35); ln([s[0] - 3.4, s[1] + 3.5], [s[0] + 3.4, s[1] + 3.5], INK, 0.4); for (let i = 0; i < 4; i++) ln([s[0] - 2.8 + i * 1.8, s[1] + 3.5], [s[0] - 3.8 + i * 1.8, s[1] + 4.8], INK, 0.2); }
  [S.O1, S.O2, S.A, S.B, S.C, S.D].forEach(q => ci(M(q), 0.9));
  [[S.O1, 'O_{1}', 3, 4.5], [S.O2, 'O_{2}', -7, -1.5], [S.A, 'A', -4.5, 1], [S.B, 'B', -4.8, -0.5], [S.C, 'C', 1.5, -3], [S.D, 'D', 2, -1.5]].forEach(z => { const s = M(z[0]); T(s[0] + z[2], s[1] + z[3], z[1], 3.2); });
  [S.S1, S.S2, S.S4, S.S5].forEach((q, i) => { const s = M(q); el('circle', { cx: s[0], cy: s[1], r: 0.6, fill: INK }, g); T(s[0] + 1.2, s[1] - 0.8, ['S_{1}', 'S_{2}', 'S_{4}', 'S_{5}'][i], 2.4, GR); });
  const o1 = M(S.O1); el('path', { d: pth(sArc(o1, 6, 160, 110, 12)), stroke: BL, 'stroke-width': 0.35, fill: 'none', 'marker-end': arrow(BL) }, g); T(o1[0] - 11, o1[1] - 6, 'ω_{1}', 2.8, BL);
  el('path', { d: pth(sArc(o1, 4, 120, 180, 10)), stroke: GR, 'stroke-width': 0.25, fill: 'none' }, g); T(o1[0] - 9, o1[1] - 1, 'φ', 2.6, GR);
  const ow = (c, w, lab, col) => { const s = M(c); const a0 = w < 0 ? 60 : -30, a1 = w < 0 ? -30 : 60; el('path', { d: pth(sArc(s, 4.2, a0, a1, 10)), stroke: col, 'stroke-width': 0.35, fill: 'none', 'marker-end': arrow(col) }, g); T(s[0] + 5, s[1] + 1, lab, 2.6, col); };
  ow(S.A, S.w2, 'ω_{2}', PK); ow(S.B, S.w4, 'ω_{4}', PK); ow(S.O2, S.w5, 'ω_{5}', OR);
  let y = 26; const tx = 150; T(tx, y, 'Масштабы', 3.2, INK, 'start', 700); y += 5;
  T(tx, y, 'μ_{l} = 0,01 м/мм', 2.8); y += 4.2; T(tx, y, 'μ_{V} = 0,01 (м/с)/мм', 2.8); y += 7;
  T(tx, y, 'Структура', 3.2, INK, 'start', 700); y += 5; T(tx, y, 'W = 3·5 − 2·7 = 1', 2.6); y += 4; T(tx, y, 'I(0,1) ← II(2,3) ← II(4,5)', 2.6); y += 7;
  T(tx, y, 'Дано', 3.2, INK, 'start', 700); y += 5; ['O_{1}A = 30, AC = 80 см', 'AB = 50, BC = 60 см', 'BD = 40, O_{2}D = 70 см', 'a = 80, b = 40, c = 40 см', 'φ = 60°, ω_{1} = 3 рад/с'].forEach(s => { T(tx, y, s, 2.5); y += 3.8; });
  const Q = v => [72 + v[0] * 100, 232 - v[1] * 100];
  T(24, 146, 'План скоростей', 3.2, INK, 'start', 700);
  const cl = (p, q) => { const u = unit(sub(q, p)); ln(sub(p, mul(u, 6)), add(q, mul(u, 6)), GR, 0.18, '1.2 0.8'); };
  cl(Q(S.a), Q(S.c)); cl(Q([0, 0]), Q(S.c)); cl(Q(S.a), Q(S.b)); cl(Q(S.c), Q(S.b)); cl(Q(S.b), Q(S.d)); cl(Q([0, 0]), Q(S.d));
  el('path', { d: pth([Q(S.a), Q(S.b), Q(S.c)]) + 'Z', fill: TE, 'fill-opacity': 0.08, stroke: 'none' }, g);
  vec(Q([0, 0]), Q(S.a), BL); [S.c, S.b, S.d].forEach(v => vec(Q([0, 0]), Q(v), OR)); vec(Q(S.a), Q(S.c), PK, 0.4); vec(Q(S.a), Q(S.b), PK, 0.4); vec(Q(S.c), Q(S.b), PK, 0.4); vec(Q(S.b), Q(S.d), PK, 0.4);
  [S.s2, S.s4, S.s5].forEach(v => ln(Q([0, 0]), Q(v), OR, 0.22, '0.8 0.6'));
  [[[0, 0], 'p', -3, 3], [S.a, 'a', -1.5, -2], [S.b, 'b', 1.5, 0.5], [S.c, 'c', 1.2, 3.4], [S.d, 'd', -3.5, -1], [S.s2, 's_{2}', 1, -1], [S.s4, 's_{4}', -2, -2], [S.s5, 's_{5}', -4, 0]].forEach(z => { const s = Q(z[0]); T(s[0] + z[2], s[1] + z[3], z[1], z[1].length > 1 ? 2.4 : 3.1, z[1].length > 1 ? GR : INK); });
  y = 247; T(24, y, 'Векторные уравнения и формулы', 3, INK, 'start', 700); y += 4.6;
  ['V_{A} = ω_{1}·l_{O1A} = 3·0,3 = 0,9 м/с, ⊥O_{1}A', 'V_{C} = V_{A} + V_{CA};  V_{C} ∥ x–x,  V_{CA} ⊥ AC', 'V_{B} = V_{A} + V_{BA} = V_{C} + V_{BC};  ⊥AB, ⊥BC', 'V_{D} = V_{B} + V_{DB} = V_{O2} + V_{DO2};  ⊥BD, ⊥O_{2}D', 'V = (отрезок)·μ_{V};  ω_{2} = V_{CA}/l_{AC}', 'ω_{4} = V_{DB}/l_{BD};  ω_{5} = V_{D}/l_{O2D}'].forEach(s => { T(24, y, s, 2.35); y += 3.7; });
  const rows = [['V_{A}', fs(len(S.a))], ['V_{C}', fs(len(S.c))], ['V_{B}', fs(len(S.b))], ['V_{D}', fs(len(S.d))], ['V_{S1}', fs(len(S.s1))], ['V_{S2}', fs(len(S.s2))], ['V_{S4}', fs(len(S.s4))], ['V_{S5}', fs(len(S.s5))], ['ω_{2}', fs(Math.abs(S.w2)) + (S.w2 < 0 ? ' по час.' : ' против')], ['ω_{4}', fs(Math.abs(S.w4)) + (S.w4 < 0 ? ' по час.' : ' против')], ['ω_{5}', fs(Math.abs(S.w5)) + (S.w5 < 0 ? ' по час.' : ' против')]];
  T(128, 247, 'Результаты', 3, INK, 'start', 700);
  rows.forEach((r, i) => { const col = i < 6 ? 0 : 1, row = i < 6 ? i : i - 6, x = 128 + col * 38, yy = 252 + row * 4.4; T(x, yy, r[0] + ' = ' + r[1], 2.5); });
  T(128, 252 + 5 * 4.4 + 2, '', 2); T(166, 252 + 5 * 4.4, 'V в м/с, ω в рад/с', 2.1, GR);
}

/* ---------- запуск ---------- */
function onVisible(node, cb) { if (!('IntersectionObserver' in window)) { cb(); return; } const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); cb(); } }, { rootMargin: '100px' }); io.observe(node); }
const W = { hero: wHero, rod: wRod, plane: wPlane, transfer: wTransfer, similar: wSimilar, cam: wCam, dyads: wDyads, 'tool-angle': toolAngle, 'tool-zas': toolZas, 'tool-perp': toolPerp, 'tool-mid': toolMid, dr1: wDrill1, dr2: wDrill2, quiz: wQuiz, tasks: wTasks, gen: wGen, a4: wA4 };
function boot() {
  document.querySelectorAll('[data-w]').forEach(n => { try { W[n.dataset.w](n); } catch (e) { console.error('widget', n.dataset.w, e); n.innerHTML = '<p class="small">Не удалось показать этот блок.</p>'; } });
  document.querySelectorAll('[data-ex]').forEach(n => { try { mountEx(n, n.dataset.ex); } catch (e) { console.error('ex', n.dataset.ex, e); } });
}
window.KRUI = { EX, TASKS, mountTask };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
