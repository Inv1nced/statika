/* КР 2 по ТЗ: точность, оформление, кулисный шестизвенник, пробная КР */
(function () {
'use strict';
const K = window.KRC;
const { NICE_PHI, readable, add, sub, mul, dot, crs, len, unit, rot, dirv, angd, mid, lerp, ll, lineAng, omegaOf, qsin, spanOf, fz, f1, fs, fa, fmu, fnum, dirW, Vh, Vs, Lh, UNIT, el, hh, pth, C, Scene, drawItems, fitPts, bestAng, pivAng, omegaSpec, Kon, mountKon, TYPES } = K;
const D2R = Math.PI / 180;

/* ---------- масштабы «на всю площадь» ---------- */
const NICE = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8];
function niceUp(x) {
  if (!(x > 0)) return 1; const e = Math.floor(Math.log10(x));
  for (let k = e; k <= e + 1; k++) for (const n of NICE) { const v = +(n * Math.pow(10, k)).toPrecision(4); if (v >= x * (1 - 1e-9)) return v; }
  return Math.pow(10, e + 1);
}
const ZONE = { w: 175, h: 125 };
function bb(pts) { let x0 = 1e18, x1 = -1e18, y0 = 1e18, y1 = -1e18; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 }; }
const fitScale = (pts, k) => { const b = bb(pts); return niceUp(Math.max(b.w * k / ZONE.w, b.h * k / ZONE.h)); };
const vecScale = (mech, vs) => { const sp = spanOf(mech); let mx = 1e-9; vs.forEach(v => { mx = Math.max(mx, len(v)); }); return 0.24 * sp / mx; };
const mm = (x, mu) => f1(Math.abs(x) / mu);

/* ---------- углы: как строить φ точно ---------- */
function phiHow(phi, rS) {
  const a = ((phi % 360) + 360) % 360, c = Math.cos(a * D2R), s = Math.sin(a * D2R);
  const xs = f1(Math.abs(c * 100)), ys = f1(Math.abs(s * 100));
  const coord = `<b>По координатам (точнее транспортира):</b> на горизонтали от O<sub>1</sub> циркулем откладываем ${xs} мм ${c >= 0 ? 'вправо' : 'влево'}, угольником восстанавливаем перпендикуляр и откладываем на нём ${ys} мм ${s >= 0 ? 'вверх' : 'вниз'} (это 100·cos φ и 100·sin φ). Луч из O<sub>1</sub> через эту точку идёт точно под ${fa(a)}.`;
  let comp = '';
  if (a % 60 === 0 && a % 180 !== 0) comp = `<b>Циркулем, без транспортира:</b> ${fa(a)} — «шестидесятиградусный» угол. Дуга из O<sub>1</sub> любым радиусом пересекает горизонталь ${a === 60 || a === 300 ? 'справа' : 'слева'} в точке P; тем же радиусом — дуга из P до пересечения с первой ${a < 180 ? 'сверху' : 'снизу'}. Получился равносторонний треугольник — угол ровно 60° от ${a === 60 || a === 300 ? 'правой' : 'левой'} горизонтали. `;
  else if (a % 90 === 0) comp = `<b>Без транспортира:</b> это ${a === 0 || a === 180 ? 'сама горизонталь' : 'вертикаль — перпендикуляр угольником'}. `;
  else if (a % 45 === 0) comp = '<b>Без транспортира:</b> 45° — биссектриса прямого угла (перпендикуляр угольником, затем две равные засечки). ';
  else if (a % 30 === 0) comp = '<b>Без транспортира:</b> 30° — строим 60° засечками и делим его пополам биссектрисой. ';
  else if (a % 15 === 0) comp = '<b>Без транспортира:</b> кратный 15° угол — 60° или 90° засечками, затем биссектрисы. ';
  return comp + coord;
}

/* =========================================================
   Кулисный шестизвенник (как в презентации «Диады с кулисой»)
   ========================================================= */
const KUL6 = {
  key: 'kul6', title: 'Кулисный механизм с шатуном и ползуном',
  solve(p) {
    const k = UNIT[p.u], O1 = [0, 0], O2 = p.O2, A = mul(dirv(p.phi), p.r), uA = sub(A, O2), lA = len(uA);
    if (lA < 1e-9 || p.l3 <= lA + 1e-6) return null;
    const u = mul(uA, 1 / lA), B = add(O2, mul(u, p.l3)), dy = p.h - B[1];
    if (Math.abs(dy) >= p.l4) return null;
    const Cp = [B[0] + (p.side || 1) * Math.sqrt(p.l4 * p.l4 - dy * dy), p.h];
    const a = mul(rot(A), p.w1 * k), a3 = ll(a, u, [0, 0], rot(u)); if (!a3) return null;
    const b = mul(a3, p.l3 / lA), c = ll(b, rot(sub(Cp, B)), [0, 0], [1, 0]); if (!c) return null;
    const S = { type: 'kul6', p, k, O1, O2, A, B, C: Cp, u, lA, a, a3, b, c, slip: sub(a3, a) };
    S.w3 = omegaOf(O2, A, [0, 0], a3, k); S.w4 = omegaOf(B, Cp, b, c, k);
    S.S1 = mid(O1, A); S.S3 = mid(O2, B); S.S4 = mid(B, Cp); S.s1 = mul(a, 0.5); S.s3 = mul(b, 0.5); S.s4 = mid(b, c);
    S.vA = len(a);
    S.mpts = [O1, O2, A, B, Cp, [-p.r, -p.r], [p.r, p.r], add(Cp, [p.l4 * 0.12, 0])];
    S.ml = fitScale(S.mpts, k);
    S.ppts = [[0, 0], a, a3, b, c];
    S.mv = fitScale(S.ppts, 1);
    S.q = qsin(rot(sub(Cp, B)), [1, 0]);
    S.cosA = Math.abs(dot(unit(A), u));
    return S;
  },
  draw(Kk, n, S, o) {
    o = o || {}; const m = (k, pr) => Kk.add(n, Object.assign({ k: k, s: o.s }, pr)), p = S.p;
    m('ray', { a: S.O1, d: [1, 0], l: 44 });
    m('guide', { p: S.C, d: [1, 0], l1: 60, l2: 44, side: 1 });
    m('link', { a: S.O2, b: S.B, col: C.l2 }); m('link', { a: S.O1, b: S.A, col: C.l1 }); m('link', { a: S.B, b: S.C, col: C.l4 });
    m('slider', { p: S.A, d: S.u, col: C.l3 }); m('slider', { p: S.C, d: [1, 0] });
    m('ground', { p: S.O1 }); m('ground', { p: S.O2 });
    [S.O1, S.O2, S.A, S.B, S.C].forEach(q => m('joint', { p: q }));
    const ua = angd(S.u);
    m('lbl', { p: S.O1, t: 'O_{1}', ang: pivAng(S.O1, [S.A], [0, 250, 290, p.phi / 2], [S.A, add(S.O1, [1, 0])]), dist: 20 });
    m('lbl', { p: S.O2, t: 'O_{2}', ang: pivAng(S.O2, [S.B], [250, 270, 290], [S.B]), dist: 20 });
    const aA = bestAng(S.A, [S.O1, S.O2, S.B, S.S3, S.S1], [ua + 90, ua - 90]);
    m('lbl', { p: S.A, t: 'A', ang: aA, dist: 22 });
    m('lbl', { p: S.B, t: 'B', ang: bestAng(S.B, [S.O2, S.C]) });
    m('lbl', { p: S.C, t: 'C', ang: bestAng(S.C, [S.B], [0, 180, 270]), dist: 21 });
    const spK = spanOf([S.O1, S.O2, S.A, S.B, S.C]), nearK = [];
    [[S.O2, S.B], [S.B, S.C]].forEach(sg => { for (let t = 0; t <= 1.0001; t += 0.05) { const q = lerp(sg[0], sg[1], t); if (len(sub(q, S.O1)) < 0.3 * spK) nearK.push(q); } });
    if (o.w1 !== false) m('omega', omegaSpec(S.O1, [S.A, add(S.O1, [1, 0]), add(S.O1, dirv(p.phi / 2)), S.S3].concat(nearK), p.w1, 'ω_{1}', C.known, true, 34));
    if (o.phi !== false) m('ang', { c: S.O1, a0: 0, a1: p.phi, r: 18, t: 'φ', col: C.muted, td: 10 });
    if (o.cm) [['S1', 'S_{1}', [S.O1, S.A, S.S3], [aA]], ['S3', 'S_{3}', [S.O2, S.B, S.A, S.S1, S.O1], [aA]], ['S4', 'S_{4}', [S.B, S.C]]].forEach(z => { m('dot', { p: S[z[0]], r: 2.8 }); m('lbl', { p: S[z[0]], t: z[1], ang: bestAng(S[z[0]], z[2], z[3]), size: 12, col: C.muted }); });
  },
  pos(S) {
    const Kk = new Kon(), p = S.p, k = S.k, ml = S.ml, L = x => f1(Math.abs(x) * k / ml), m = Kk.fn('mech'); Kk.scene('mech', { maxH: 430 });
    const b = bb(S.mpts), wS = f1(b.w * k / ml), hS = f1(b.h * k / ml), xL = f1((0 - b.x0) * k / ml), yT = f1((b.y1 - 0) * k / ml);
    const dx = p.O2[0], dyO = -p.O2[1];
    Kk.step(`<b>Шаг 1. Масштаб на всю площадь.</b> Механизм с запасом занимает ${fnum(b.w)} × ${fnum(b.h)} ${p.u}. Под схему у нас верхняя половина листа ≈ ${ZONE.w} × ${ZONE.h} мм. Самый крупный удобный масштаб, при котором всё влезает: <b>μ<sub>l</sub> = ${fmu(ml)} м/мм</b> — схема выйдет ≈ ${wS} × ${hS} мм. На листе: O<sub>1</sub>A = ${L(p.r)}, O<sub>2</sub>B = ${L(p.l3)}, BC = ${L(p.l4)} мм. Ставим O<sub>1</sub> в ${xL} мм от левого и ${yT} мм от верхнего края зоны и проводим через неё длинную горизонталь.`);
    m('cl', { a: [b.x0, 0], b: [b.x1, 0], e1: 0, e2: 0 }); m('ground', { p: S.O1 }); m('joint', { p: S.O1 }); m('lbl', { p: S.O1, t: 'O_{1}', ang: pivAng(S.O1, [S.A], [0, 180, 250, 290, p.phi / 2], [S.A, add(S.O1, [1, 0])]), dist: 20 });
    Kk.step(`<b>Шаг 2. Опора кулисы O<sub>2</sub>.</b> ${dx ? `Циркулем откладываем по горизонтали ${L(dx)} мм ${dx > 0 ? 'вправо' : 'влево'}. ` : ''}Угольник катетом на горизонталь — по второму катету проводим вертикаль: прямой угол без транспортира. На ней ${L(dyO)} мм ${dyO > 0 ? 'вниз' : 'вверх'} — это O<sub>2</sub>.`);
    if (dx) m('seg', { a: S.O1, b: [dx, 0], dash: '4 3' });
    m('seg', { a: [dx, 0], b: S.O2, dash: '4 3' }); m('ra', { p: [dx, 0], d1: [Math.sign(-dx) || 1, 0], d2: [0, -Math.sign(dyO)], col: C.muted });
    m('ground', { p: S.O2 }); m('joint', { p: S.O2 }); m('lbl', { p: S.O2, t: 'O_{2}', ang: bestAng(S.O2, [S.B], [250, 270, 290]), dist: 20 });
    const hy = p.h;
    Kk.step(`<b>Шаг 3. Направляющая ползуна C</b> — горизонталь на ${L(hy)} мм ${hy >= 0 ? 'выше' : 'ниже'} O<sub>1</sub>. Точно: отложи ${L(hy)} мм циркулем на двух вертикалях подальше друг от друга и соедини точки длинной линейкой. Или сдвинь угольник по линейке от первой горизонтали (раздел 3).`);
    m('cl', { a: [Math.min(S.A[0], S.B[0], 0) - p.r * 0.2, hy], b: [b.x1, hy], e1: 0, e2: 0 });
    m('dim', { a: [b.x1 - p.r * 0.15, 0], b: [b.x1 - p.r * 0.15, hy], off: -12, t: 'h' });
    Kk.step(`<b>Шаг 4. Угол φ = ${fa(p.phi)}.</b> ${phiHow(p.phi)} Транспортир — только если ничего из этого не подходит.`);
    const a = ((p.phi % 360) + 360) % 360;
    if (a % 60 === 0 && a % 180 !== 0) {
      const Rr = p.r * 0.75, P0 = [(a === 60 || a === 300 ? 1 : -1) * Rr, 0], Q = mul(dirv(a), Rr), aQ = angd(sub(Q, P0));
      m('arc', { c: S.O1, r: Rr, a0: a < 180 ? (a === 60 ? -12 : 108) : (a === 300 ? -72 : 168), a1: a < 180 ? (a === 60 ? 72 : 192) : (a === 300 ? 12 : 252) });
      m('arc', { c: P0, r: Rr, a0: aQ - 14, a1: aQ + 14 }); m('dot', { p: P0, r: 2.6 }); m('dot', { p: Q, r: 2.8, col: C.found });
    } else {
      const X = [S.A[0], 0];
      m('seg', { a: S.O1, b: X, dash: '4 3', col: C.found }); m('seg', { a: X, b: S.A, dash: '4 3', col: C.found });
    }
    m('cl', { a: S.O1, b: S.A, e1: 0, e2: 36 }); m('ang', { c: S.O1, a0: 0, a1: p.phi, r: 18, t: 'φ', col: C.muted, td: 10 });
    Kk.step(`<b>Шаг 5. Кривошип.</b> Раствор циркуля ${L(p.r)} мм ставим по линейке <b>от отметки 10 мм</b> (до ${f1(10 + Math.abs(p.r) * k / ml)}): край линейки бывает стёрт. Засечка на луче — точка A.`);
    m('arc', { c: S.O1, r: p.r, a0: p.phi - 12, a1: p.phi + 12 }); m('link', { a: S.O1, b: S.A, col: C.l1 }); m('joint', { p: S.A });
    m('omega', omegaSpec(S.O1, [S.A, add(S.O1, [1, 0])], p.w1, 'ω_{1}', C.known, true));
    m('lbl', { p: S.A, t: 'A', ang: bestAng(S.A, [S.O1, S.O2, S.B], [angd(S.u) + 90, angd(S.u) - 90]), dist: 22 });
    Kk.step(`<b>Шаг 6. Кулиса и точка B.</b> Самой длинной линейкой — прямая через центры O<sub>2</sub> и A. Это самое опасное место: B в ${f1(p.l3 / S.lA)} раза дальше от O<sub>2</sub>, чем A, и перекос у A увеличится у B во столько же раз. Раствор ${L(p.l3)} мм — засечка из O<sub>2</sub> на этой прямой — точка B. Камень рисуем в A вдоль кулисы.`);
    m('cl', { a: S.O2, b: S.B, e1: 0, e2: 20 }); m('arc', { c: S.O2, r: p.l3, a0: angd(S.u) - 6, a1: angd(S.u) + 6 });
    m('link', { a: S.O2, b: S.B, col: C.l2 }); m('slider', { p: S.A, d: S.u, col: C.l3 }); m('joint', { p: S.A }); m('joint', { p: S.B }); m('lbl', { p: S.B, t: 'B', ang: bestAng(S.B, [S.O2, S.C]) });
    const aC = angd(sub(S.C, S.B));
    Kk.step(`<b>Шаг 7. Ползун C.</b> Раствор ${L(p.l4)} мм, игла в B. Дуга пересекает направляющую — берём точку ${(p.side || 1) > 0 ? 'справа' : 'слева'}, как на схеме задания. Сразу <b>измерь O<sub>2</sub>A</b>: ≈ ${L(S.lA)} мм → l<sub>O2A</sub> = ${L(S.lA)}·${fmu(ml)} = ${fs(S.lA * k)} м. Это переменная длина, она понадобится для ω<sub>3</sub>.`);
    m('arc', { c: S.B, r: p.l4, a0: aC - 10, a1: aC + 10 }); m('link', { a: S.B, b: S.C, col: C.l4 }); m('slider', { p: S.C, d: [1, 0] }); m('joint', { p: S.C }); m('lbl', { p: S.C, t: 'C', ang: bestAng(S.C, [S.B], [0, 180, 270]), dist: 21 });
    m('dim', { a: S.O2, b: S.A, off: -14, t: 'O₂A' });
    Kk.step('<b>Шаг 8. Центры масс.</b> S<sub>1</sub>, S<sub>3</sub>, S<sub>4</sub> — середины O<sub>1</sub>A, O<sub>2</sub>B, BC. Точно — засечками циркулем (серединный перпендикуляр), а не «на глаз». Центр масс ползуна — сама точка C.');
    [['S1', 'S_{1}', [S.O1, S.A, S.S3]], ['S3', 'S_{3}', [S.O2, S.B, S.A, S.S1, S.O1]], ['S4', 'S_{4}', [S.B, S.C]]].forEach(z => { m('dot', { p: S[z[0]], r: 3 }); m('lbl', { p: S[z[0]], t: z[1], ang: bestAng(S[z[0]], z[2]), size: 12, col: C.muted }); });
    return Kk;
  },
  plan(S) {
    const Kk = new Kon(), p = S.p, mv = S.mv, Lp = v => mm(len(v), mv), o = [0, 0];
    Kk.scene('mech', { maxH: 280, title: 'Механизм' }); Kk.scene('plan', { maxH: 420, title: 'План скоростей' });
    KUL6.draw(Kk, 'mech', S, { s: -1, cm: true });
    const P = Kk.fn('plan'), M = Kk.fn('mech'), kv = vecScale([S.O1, S.O2, S.A, S.B, S.C], [S.a, S.a3, S.b, S.c]);
    const pb = bb(S.ppts), xL = f1(-pb.x0 / mv), yT = f1(pb.y1 / mv), wP = f1(pb.w / mv), hP = f1(pb.h / mv);
    const kul = '<i>кулису</i> O<sub>2</sub>B';
    Kk.step(`<b>Шаг 1. Скорость A и масштаб на всю площадь.</b> ${Vs('A1')} = ${Vs('A2')} = ω<sub>1</sub>·${Lh('O₁A')} = ${fnum(Math.abs(p.w1))}·${fnum(p.r * S.k)} = <b>${fs(S.vA)} м/с</b> (камень на пальце кривошипа). Берём <b>μ<sub>V</sub> = ${fmu(mv)} (м/с)/мм</b> → pa<sub>1</sub> = ${Lp(S.a)} мм: при нём весь план (≈ ${wP} × ${hP} мм) займёт нижнюю половину листа. Полюс p — в ${xL} мм от левого и ${yT} мм от верхнего края зоны плана.`);
    P('dot', { p: o }); P('lbl', { p: o, t: 'p', ang: bestAng(o, [S.a, S.a3, S.b, S.c]) });
    Kk.step(`<b>Шаг 2. pa<sub>1</sub> ⊥ O<sub>1</sub>A.</b> Угольник катетом вдоль O<sub>1</sub>A на схеме, линейку к гипотенузе. Держим линейку, двигаем угольник, пока второй катет не пройдёт через p, и проводим. Стрелка — в сторону ω<sub>1</sub> (${dirW(p.w1)}). Откладываем ${Lp(S.a)} мм циркулем.`);
    P('vec', { a: o, b: S.a, col: C.known }); P('lbl', { p: S.a, t: 'a_{1}, a_{2}', ang: bestAng(S.a, [o, S.a3, S.b]) });
    M('hl', { a: S.O1, b: S.A, col: C.l1, only: true }); M('vec', { a: S.A, b: add(S.A, mul(S.a, kv)), col: C.known, only: true });
    Kk.step(`<b>Шаг 3.</b> ${Vh('A3')} = ${Vh('A2')} + ${Vh('A3A2')}. Скольжение ${Vh('A3A2')} идёт вдоль кулисы. Кладём угольник катетом вдоль ${kul}, линейку к гипотенузе, сдвигаем до a<sub>1</sub> и проводим <b>по тому же катету</b>: прямая ∥ O<sub>2</sub>B.`);
    P('cl', { a: S.a, b: S.a3, e1: 34, e2: 40 }); M('hl', { a: S.O2, b: S.B, col: C.l2, only: true });
    const alpha = Math.acos(Math.min(1, S.cosA)) / D2R;
    Kk.step(`<b>Шаг 4.</b> Линейку не трогаем — сдвигаем угольник дальше, до полюса p, и проводим <b>по второму катету</b>: ⊥ O<sub>2</sub>B (точка A<sub>3</sub> вращается вокруг O<sub>2</sub>). Одна установка угольника — две прямые, угол между ними ровно 90°. Пересечение — a<sub>3</sub>: pa<sub>3</sub> ≈ ${Lp(S.a3)} мм → ${Vs('A3')} = <b>${fs(len(S.a3))} м/с</b>; a<sub>1</sub>a<sub>3</sub> ≈ ${Lp(S.slip)} мм → ${Vs('A3A2')} = ${fs(len(S.slip))} м/с. <i>Проверка без плана:</i> ${Vs('A3')} = ${Vs('A')}·cos α, где α ≈ ${f1(alpha)}° — угол между O<sub>1</sub>A и кулисой: ${fs(S.vA)}·${fs(S.cosA)} = ${fs(S.vA * S.cosA)} м/с.`);
    P('cl', { a: o, b: S.a3, e1: 34, e2: 40 }); P('dot', { p: S.a3 }); P('lbl', { p: S.a3, t: 'a_{3}', ang: bestAng(S.a3, [o, S.a, S.b]) });
    P('vec', { a: o, b: S.a3, col: C.found }); P('vec', { a: S.a, b: S.a3, col: C.rel });
    if (len(S.a3) > 1e-9 && len(S.slip) > 1e-9) P('ra', { p: S.a3, d1: mul(S.a3, -1), d2: mul(S.slip, -1), col: C.found });
    Kk.step(`<b>Шаг 5. Точка b.</b> B лежит на той же кулисе, скорости её точек пропорциональны расстоянию до O<sub>2</sub>: pb = pa<sub>3</sub>·O<sub>2</sub>B/O<sub>2</sub>A = ${Lp(S.a3)}·${fnum(p.l3)}/${f1(S.lA)} = <b>${Lp(S.b)} мм</b>, на продолжении луча pa<sub>3</sub> (раздел 6 — как отложить без калькулятора, по Фалесу). ${Vs('B')} = ${fs(len(S.b))} м/с.`);
    P('cl', { a: o, b: S.b, e1: 0, e2: 30 }); P('vec', { a: o, b: S.b, col: C.found }); P('dot', { p: S.b }); P('lbl', { p: S.b, t: 'b', ang: bestAng(S.b, [o, S.a3, S.c]) });
    M('hl', { a: S.O2, b: S.B, col: C.l2, only: true });
    Kk.step(`<b>Шаг 6. Точка c.</b> ${Vh('C')} = ${Vh('B')} + ${Vh('CB')}. Угольник катетом вдоль BC → сдвиг до b → по второму катету: ⊥ BC. Ползун на горизонтальной направляющей: угольник катетом по направляющей → сдвиг до p → по тому же катету: горизонталь через p. Пересечение — c: pc ≈ ${Lp(S.c)} мм → ${Vs('C')} = <b>${fs(len(S.c))} м/с</b>; bc ≈ ${Lp(sub(S.c, S.b))} мм → ${Vs('CB')} = ${fs(len(sub(S.c, S.b)))} м/с.`);
    P('cl', { a: S.b, b: S.c, e1: 30, e2: 34 }); P('cl', { a: o, b: S.c, e1: 30, e2: 34 }); P('dot', { p: S.c }); P('lbl', { p: S.c, t: 'c, s_{5}', ang: bestAng(S.c, [o, S.b, S.a3]) });
    P('vec', { a: o, b: S.c, col: C.found }); P('vec', { a: S.b, b: S.c, col: C.rel });
    M('hl', { a: S.B, b: S.C, col: C.l4, only: true });
    Kk.step(`<b>Шаг 7. Центры масс</b> (середины — засечками циркулем): s<sub>1</sub> — середина pa<sub>1</sub>, s<sub>3</sub> — середина pb, s<sub>4</sub> — середина bc, s<sub>5</sub> = c. ${Vs('S1')} = ${fs(len(S.s1))}, ${Vs('S3')} = ${fs(len(S.s3))}, ${Vs('S4')} = ${fs(len(S.s4))}, ${Vs('S5')} = ${Vs('C')} = ${fs(len(S.c))} м/с.`);
    [['s1', 's_{1}', [o, S.a]], ['s3', 's_{3}', [o, S.b, S.a3]], ['s4', 's_{4}', [S.b, S.c, o]]].forEach(z => { P('dot', { p: S[z[0]], r: 2.8, col: C.text }); P('vec', { a: o, b: S[z[0]], col: C.found, w: 1.5, dash: '5 3' }); P('lbl', { p: S[z[0]], t: z[1], ang: bestAng(S[z[0]], z[2]), size: 12 }); });
    Kk.step(`<b>Шаг 8. Угловые скорости.</b> ω<sub>3</sub> = ${Vs('A3')}/${Lh('O₂A')} = ${fs(len(S.a3))}/${fs(S.lA * S.k)} = <b>${fs(Math.abs(S.w3))} рад/с, ${dirW(S.w3)}</b> (pa<sub>3</sub> переносим в A, кулиса вокруг O<sub>2</sub>; проверка: ${Vs('B')}/${Lh('O₂B')} = ${fs(len(S.b) / (p.l3 * S.k))}). ω<sub>2</sub> = ω<sub>3</sub> — камень поворачивается вместе с кулисой. ω<sub>4</sub> = ${Vs('CB')}/${Lh('BC')} = ${fs(len(sub(S.c, S.b)))}/${fnum(p.l4 * S.k)} = <b>${fs(Math.abs(S.w4))} рад/с, ${dirW(S.w4)}</b> (bc переносим в C, закрепляем B).`);
    M('vec', { a: S.A, b: add(S.A, mul(S.a3, kv)), col: C.found }); M('vec', { a: S.C, b: add(S.C, mul(sub(S.c, S.b), kv)), col: C.rel });
    M('omega', omegaSpec(S.O2, [S.B], S.w3, 'ω_{3}', C.found, true, 26)); M('omega', omegaSpec(S.B, [S.O2, S.C], S.w4, 'ω_{4}', C.rel, false, 22));
    return Kk;
  },
  ans(S) { return [{ id: 'va3', h: Vs('A3'), v: len(S.a3), u: 'м/с' }, { id: 'vb', h: Vs('B'), v: len(S.b), u: 'м/с' }, { id: 'vc', h: Vs('C'), v: len(S.c), u: 'м/с' }, { id: 'vs4', h: Vs('S4'), v: len(S.s4), u: 'м/с' }, { id: 'w3', h: 'ω<sub>3</sub> = ω<sub>2</sub>', v: Math.abs(S.w3), u: 'рад/с', dir: S.w3 < 0 ? 0 : 1 }, { id: 'w4', h: 'ω<sub>4</sub>', v: Math.abs(S.w4), u: 'рад/с', dir: S.w4 < 0 ? 0 : 1 }]; },
  rows(S) {
    const mv = S.mv; return [['V<sub>A1</sub> = V<sub>A2</sub>', 'pa<sub>1</sub>', S.a], ['V<sub>A3</sub>', 'pa<sub>3</sub>', S.a3], ['V<sub>A3A2</sub>', 'a<sub>1</sub>a<sub>3</sub>', S.slip], ['V<sub>B</sub>', 'pb', S.b], ['V<sub>C</sub> = V<sub>S5</sub>', 'pc', S.c], ['V<sub>CB</sub>', 'bc', sub(S.c, S.b)], ['V<sub>S1</sub>', 'ps<sub>1</sub>', S.s1], ['V<sub>S3</sub>', 'ps<sub>3</sub>', S.s3], ['V<sub>S4</sub>', 'ps<sub>4</sub>', S.s4]].map(x => [x[0], x[1], len(x[2]) / mv, len(x[2])])
      .concat([['ω<sub>1</sub>', 'задана', null, Math.abs(S.p.w1), dirW(S.p.w1)], ['ω<sub>2</sub> = ω<sub>3</sub> = V<sub>A3</sub>/l<sub>O2A</sub>', '', null, Math.abs(S.w3), dirW(S.w3)], ['ω<sub>4</sub> = V<sub>CB</sub>/l<sub>BC</sub>', '', null, Math.abs(S.w4), dirW(S.w4)], ['ω<sub>5</sub> (ползун)', 'не вращается', null, 0, '—']]);
  },
  given(p) {
    const dx = p.O2[0], dy = -p.O2[1], u = p.u;
    return `O<sub>1</sub>A = ${fnum(p.r)} ${u}; опора кулисы O<sub>2</sub> — на ${fnum(Math.abs(dy))} ${u} ${dy > 0 ? 'ниже' : 'выше'} O<sub>1</sub>${dx ? ' и на ' + fnum(Math.abs(dx)) + ' ' + u + ' ' + (dx > 0 ? 'правее' : 'левее') : ''}; длина кулисы O<sub>2</sub>B = ${fnum(p.l3)} ${u}; шатун BC = ${fnum(p.l4)} ${u}; направляющая ползуна C — горизонталь на ${fnum(Math.abs(p.h))} ${u} ${p.h >= 0 ? 'выше' : 'ниже'} O<sub>1</sub>, ползун ${(p.side || 1) > 0 ? 'правее' : 'левее'} B; φ = ${fa(p.phi)} (от горизонтали вправо, против часовой); ω<sub>1</sub> = ${fnum(Math.abs(p.w1))} рад/с ${dirW(p.w1)}. Камень 2 — на пальце кривошипа в A, скользит по кулисе 3. Центры масс S<sub>1</sub>, S<sub>3</sub>, S<sub>4</sub> — середины звеньев.`;
  },
  find: 'скорости кинематических пар (A<sub>3</sub>, B, C) и центров масс, ω<sub>3</sub> (= ω<sub>2</sub>) и ω<sub>4</sub> с направлениями',
  struct: 'Звенья: 0 — стойка, 1 — кривошип O<sub>1</sub>A, 2 — камень, 3 — кулиса O<sub>2</sub>B, 4 — шатун BC, 5 — ползун C. n<sub>Σ</sub> = 6; p<sub>1</sub> = 7 (вращательные O<sub>1</sub>, A, O<sub>2</sub>, B, C и поступательные «камень — кулиса», «ползун — стойка»). W = 3·5 − 2·7 = 1. Формула строения: I(0,1) ← II(2,3) ← II(4,5): сначала диада ВПВ (камень + кулиса), потом ВВП (шатун + ползун).',
  hint(S) { return `1) ${Vs('A1')} = ${Vs('A2')} = ω<sub>1</sub>·${Lh('O₁A')} ⊥ O<sub>1</sub>A. 2) a<sub>3</sub>: через a<sub>1</sub> ∥ кулисе, через p ⊥ кулисе. 3) pb = pa<sub>3</sub>·O<sub>2</sub>B/O<sub>2</sub>A на том же луче. 4) c: через b ⊥ BC, через p горизонтально. 5) ω<sub>3</sub> = ${Vs('A3')}/${Lh('O₂A')}, ω<sub>4</sub> = ${Vs('CB')}/${Lh('BC')}.`; },
  gen(Rn) {
    for (let t = 0; t < 500; t++) {
      const Lv = Rn.ri(100, 160, 10), r = Rn.ri(Math.ceil(0.5 * Lv / 5) * 5, Math.floor(0.72 * Lv / 5) * 5, 5), dx = Rn.pick([1, -1]) * Rn.ri(Math.ceil(0.15 * Lv / 5) * 5, Math.floor(0.35 * Lv / 5) * 5, 5);
      const l3 = Math.ceil((Lv + r + 10) * Rn.rf(1.1, 1.25) / 10) * 10, l4 = Math.round(r * Rn.rf(1.3, 2) / 10) * 10;
      const phi = Rn.pick(NICE_PHI), w1 = Rn.ri(4, 15, 1) * Rn.pick([1, -1]);
      const A = mul(dirv(phi), r), u = unit(sub(A, [dx, -Lv])), By = -Lv + u[1] * l3;
      const h = Math.round((By + Rn.rf(-0.45, 0.25) * l4) / 5) * 5;
      const p = { u: 'мм', r, O2: [dx, -Lv], l3, l4, h, side: 1, phi, w1 };
      const S = KUL6.solve(p); if (!S || S.q < 0.35 || len(S.a3) < 0.2 * S.vA || len(S.c) < 0.15 * len(S.b) || len(S.slip) < 0.1 * S.vA) continue;
      if (!readable([S.O1, S.O2, S.A, S.B, S.C], [[0, 2], [1, 3, 2], [3, 4]], { pt: 0.11 })) continue;
      const J = [S.O1, S.O2, S.A, S.B, S.C], sp = spanOf(J);
      if (p.r < 0.26 * sp) continue;
      if (K.segDist(S.O1, S.O2, S.B) < 0.18 * sp || K.segDist(S.O1, S.B, S.C) < 0.18 * sp) continue;
      if ([S.S1, S.S3, S.S4].some(q => J.some(j => len(sub(q, j)) < 0.07 * sp))) continue;
      if ([S.S3, S.S4].some(q => len(sub(q, S.O1)) < 0.17 * sp)) continue;
      if (len(sub(S.S3, S.O1)) < 0.22 * sp || len(sub(S.S3, S.A)) < 0.18 * sp || len(sub(S.C, S.O1)) < 0.3 * sp) continue;
      if (Math.abs(S.C[1] - S.O1[1]) < 0.15 * sp || Math.abs(S.C[1] - S.A[1]) < 0.1 * sp) continue;
      return p;
    }
    return null;
  }
};
TYPES.kul6 = KUL6;
const EX6 = { u: 'мм', r: 60, O2: [10, -130], l3: 240, l4: 110, h: 80, side: 1, phi: 60, w1: -10 };

/* ---------- таблица и лист формул ---------- */
function rowsTable(T, S) {
  let h = '<div class="tw"><table class="rt"><tr><th>Величина</th><th>На плане</th><th>Значение</th></tr>';
  for (const r of T.rows(S)) {
    if (r[2] != null) h += `<tr><td>${r[0]}</td><td>${r[1]} = ${f1(r[2])} мм</td><td><b>${fs(r[3])} м/с</b></td></tr>`;
    else h += `<tr><td>${r[0]}</td><td>${r[1] || '—'}</td><td><b>${fs(r[3])} рад/с</b>${r[4] && r[4] !== '—' ? ', ' + r[4] : ''}</td></tr>`;
  }
  return h + `</table></div><p class="small">μ<sub>l</sub> = ${fmu(S.ml)} м/мм, μ<sub>V</sub> = ${fmu(S.mv)} (м/с)/мм. Отрезки плана даны до 0,1 мм — сравни со своим чертежом.</p>`;
}
function formulas6(S) {
  const p = S.p, k = S.k, v = x => fs(len(x));
  return `<ol class="fl">
<li>Структура: n<sub>Σ</sub> = 6, p<sub>1</sub> = 7, p<sub>2</sub> = 0; W = 3·(6 − 1) − 2·7 = 1. I(0,1) ← II(2,3) ← II(4,5).</li>
<li>μ<sub>l</sub> = ${Lh('O₁A')}/O<sub>1</sub>A = ${fnum(p.r * k)}/${f1(p.r * k / S.ml)} = ${fmu(S.ml)} м/мм.</li>
<li>${Vs('A1')} = ${Vs('A2')} = ω<sub>1</sub>·${Lh('O₁A')} = ${fnum(Math.abs(p.w1))}·${fnum(p.r * k)} = ${fs(S.vA)} м/с; ${Vh('A1')} ⊥ O<sub>1</sub>A.</li>
<li>μ<sub>V</sub> = ${Vs('A1')}/pa<sub>1</sub> = ${fs(S.vA)}/${mm(len(S.a), S.mv)} = ${fmu(S.mv)} (м/с)/мм.</li>
<li><span class="vu1">${Vh('A3')}</span> = <span class="vu2">${Vh('A2')}</span> + <span class="vu1">${Vh('A3A2')}</span>;&nbsp; ${Vh('A3')} ⊥ O<sub>2</sub>B,&nbsp; ${Vh('A3A2')} ∥ O<sub>2</sub>B.</li>
<li>pb = pa<sub>3</sub>·${Lh('O₂B')}/${Lh('O₂A')} (подобие);&nbsp; ${Lh('O₂A')} = O<sub>2</sub>A·μ<sub>l</sub> = ${fs(S.lA * k)} м.</li>
<li><span class="vu1">${Vh('C')}</span> = <span class="vu2">${Vh('B')}</span> + <span class="vu1">${Vh('CB')}</span>;&nbsp; ${Vh('C')} ∥ x–x,&nbsp; ${Vh('CB')} ⊥ BC.</li>
<li>V = μ<sub>V</sub>·(отрезок): ${Vs('A3')} = ${v(S.a3)}, ${Vs('A3A2')} = ${v(S.slip)}, ${Vs('B')} = ${v(S.b)}, ${Vs('C')} = ${v(S.c)}, ${Vs('CB')} = ${v(sub(S.c, S.b))} м/с.</li>
<li>Центры масс: ${Vs('S1')} = ½${Vs('A')} = ${v(S.s1)}; ${Vs('S3')} = ½${Vs('B')} = ${v(S.s3)}; ${Vh('S4')} = ${Vh('B')} + ½${Vh('CB')} → ${v(S.s4)}; ${Vs('S5')} = ${Vs('C')} = ${v(S.c)} м/с.</li>
<li>ω<sub>2</sub> = ω<sub>3</sub> = ${Vs('A3')}/${Lh('O₂A')} = ${fs(Math.abs(S.w3))} рад/с (${dirW(S.w3)});&nbsp; ω<sub>4</sub> = ${Vs('CB')}/${Lh('BC')} = ${fs(Math.abs(S.w4))} рад/с (${dirW(S.w4)}).</li>
</ol>`;
}

/* ---------- задача с оценкой точности ---------- */
function parseNum(s) { s = String(s).trim().replace(/\s/g, '').replace(',', '.').replace('−', '-'); return s ? parseFloat(s) : NaN; }
function taskBox(host, def, opt) {
  opt = opt || {}; const T = TYPES[def.type], S = T.solve(def.p);
  if (!S) { host.innerHTML = '<p>Механизм не собрался — нажми «Новый вариант».</p>'; return; }
  const ans = T.ans(S), tolOf = opt.tol || (() => 5);
  host.classList.add('tk');
  host.innerHTML = `<div class="tk-h"><span class="tk-n">${opt.title || 'Задача'}</span><span class="tk-t">${T.title}</span></div>
  <p class="tk-g"><b>Дано:</b> ${T.given(def.p)}</p><div class="fig"><div class="sch"></div></div><p><b>Найти:</b> ${T.find}.</p>
  <div class="tk-in">${ans.map((a, j) => `<div class="ir" data-j="${j}"><span class="in-l">${a.h}</span><input inputmode="decimal" autocomplete="off" placeholder="число" aria-label="ответ"><span class="in-u">${a.u}</span>${a.dir != null ? `<select aria-label="направление"><option value="">направление?</option>${(a.opts || ['по часовой', 'против часовой']).map((o, k) => `<option value="${k}">${o}</option>`).join('')}</select>` : ''}<span class="mk"></span></div>`).join('')}</div>
  <div class="tk-b"><button class="b-chk">Проверить точность</button><button class="b-ans">Ответы и отрезки плана</button><button class="b-sol">Решение по шагам</button></div>
  <div class="tk-msg"></div><div class="tk-ans" hidden></div><div class="tk-sol" hidden></div>`;
  const Ks = new Kon(); Ks.scene('mech', { maxH: 360 }); T.draw(Ks, 'mech', S, { s: -1, cm: true }); mountKon(host.querySelector('.sch'), Ks, { static: true });
  host.querySelector('.b-chk').onclick = () => {
    const tol = tolOf(); let good = 0, filled = 0, errs = [];
    host.querySelectorAll('.ir').forEach(r => {
      const a = ans[+r.dataset.j], v = parseNum(r.querySelector('input').value), sel = r.querySelector('select'), mk = r.querySelector('.mk');
      r.classList.remove('ok', 'bad'); mk.textContent = '';
      if (isNaN(v)) { mk.textContent = 'введи число'; return; } filled++;
      const e = Math.abs(v - a.v) / Math.max(a.v, 1e-9) * 100, okd = a.dir == null || (sel.value !== '' && +sel.value === a.dir);
      errs.push(e);
      const g = e <= 1 ? 'точно' : (e <= 2.5 ? 'хорошо' : (e <= tol ? 'в допуске' : 'мимо'));
      if (e <= tol && okd) { good++; r.classList.add('ok'); } else r.classList.add('bad');
      mk.textContent = `${fz(e.toFixed(1))} % · ${g}${okd ? '' : ' · направление ✗'}`;
    });
    if (!filled) { host.querySelector('.tk-msg').textContent = 'Сначала введи хотя бы один ответ.'; return; }
    const avg = errs.reduce((x, y) => x + y, 0) / errs.length;
    host.querySelector('.tk-msg').innerHTML = `В допуске ±${tol} %: <b>${good} из ${ans.length}</b>. Средняя ошибка — <b>${fz(avg.toFixed(1))} %</b>. ${avg <= 1.5 ? 'Чертёж очень точный.' : (avg <= 3 ? 'Хорошая точность; ищи, где теряются доли миллиметра.' : 'Где-то ошибка в построении или серьёзная неточность — сверь отрезки плана в «Ответах».')}`;
  };
  host.querySelector('.b-ans').onclick = () => { const b = host.querySelector('.tk-ans'); b.hidden = !b.hidden; if (!b.dataset.ok) { b.dataset.ok = 1; b.innerHTML = rowsTable(T, S); } };
  host.querySelector('.b-sol').onclick = () => {
    const box = host.querySelector('.tk-sol'); box.hidden = !box.hidden;
    if (!box.hidden && !box.dataset.ok) { box.dataset.ok = 1; box.innerHTML = `<p class="small">${T.struct}</p><h4>Положение</h4><div class="kp"></div><h4>План скоростей</h4><div class="kv"></div>`; mountKon(box.querySelector('.kp'), T.pos(S)); mountKon(box.querySelector('.kv'), T.plan(S)); }
  };
}

/* ---------- виджет: угольник по линейке ---------- */
function sqWidget(host) {
  host.innerHTML = `<div class="wctl seg"><button data-m="perp" class="on">⊥ перпендикуляр</button><button data-m="par">∥ параллель</button></div><svg class="wsvg" role="img" aria-label="Угольник и линейка"></svg><div class="ctl"><span class="cnt"></span><div class="bar"><i></i></div><button class="bp" aria-label="Назад">‹</button><button class="bn">Дальше ›</button></div><div class="cap"></div>`;
  const svg = host.querySelector('svg'), sc = new Scene(svg, { maxH: 380, pad: 22 });
  const A = [0, 0], B = [64, 34], u = unit(sub(B, A)), n = rot(u), L1 = 82, L2 = 54, R0 = add(A, mul(u, -6));
  const hyp = unit(sub(mul(n, L2), mul(u, L1)));
  const AP = { perp: add(add(R0, mul(hyp, -125)), mul(n, -42)), par: add(add(R0, mul(hyp, -120)), mul(u, 46)) };
  let a = AP.perp;
  let nh = rot(hyp); const hm = add(R0, mul(add(mul(u, L1), mul(n, L2)), 0.5)); if (dot(nh, sub(R0, hm)) > 0) nh = mul(nh, -1);
  const tFor = m => m === 'perp' ? crs(n, sub(AP.perp, R0)) / crs(n, hyp) : crs(u, sub(AP.par, R0)) / crs(u, hyp);
  const tri = R => [R, add(R, mul(u, L1)), add(R, mul(n, L2))];
  const allT = [0, tFor('perp'), tFor('par')], tmin = Math.min(...allT) - 20, tmax = Math.max(...allT) + 20;
  const H0 = add(R0, mul(u, L1));
  const rulerPts = [add(H0, mul(hyp, tmin - L1 * 0.2)), add(H0, mul(hyp, tmax + Math.hypot(L1, L2) + 10)), add(add(H0, mul(hyp, tmax + Math.hypot(L1, L2) + 10)), mul(nh, 13)), add(add(H0, mul(hyp, tmin - L1 * 0.2)), mul(nh, 13))];
  const fit = rulerPts.concat(tri(add(R0, mul(hyp, tFor('perp'))))).concat(tri(add(R0, mul(hyp, tFor('par'))))).concat(tri(R0)).concat([AP.perp, AP.par, add(AP.perp, mul(n, -60)), add(AP.par, mul(u, 60)), B, A]);
  sc.fit(fit);
  const CAPS = {
    perp: ['<b>Задача.</b> Звено AB — на схеме, точка a — на плане, в другом месте листа. Нужна прямая через a, перпендикулярная AB. Транспортир не нужен: угол мы не измеряем, а переносим.',
      '<b>1.</b> Прикладываем угольник <b>катетом точно вдоль AB</b>. Совмещай по центрам шарниров, а не по краю толстой линии.',
      '<b>2.</b> Прикладываем линейку к <b>гипотенузе</b> угольника и крепко прижимаем её к листу. Теперь линейка — направляющая.',
      '<b>3.</b> Держим линейку и двигаем угольник вдоль неё, пока <b>второй катет</b> не пройдёт через a. Угольник не поворачивается, значит его катеты всё время сохраняют своё направление.',
      '<b>4.</b> Проводим прямую по второму катету — она перпендикулярна AB точно. Ошибка — только от толщины линии, а не ±0,5° транспортира.'],
    par: ['<b>Задача.</b> Через точку a на плане провести прямую, параллельную звену AB на схеме (так строятся все «∥»: скольжение камня вдоль кулисы, направляющая ползуна).',
      '<b>1.</b> Прикладываем угольник <b>катетом точно вдоль AB</b>.',
      '<b>2.</b> Прикладываем линейку к гипотенузе и прижимаем.',
      '<b>3.</b> Двигаем угольник вдоль линейки, пока <b>тот же катет</b> не пройдёт через a.',
      '<b>4.</b> Проводим прямую по этому катету — она параллельна AB. Тот же приём работает и <b>двумя линейками</b>: вторая линейка — направляющая, к ней прижат <i>торец</i> первой (он должен быть ровным, угол не важен).']
  };
  let mode = 'perp', st = 0, t = 0, raf = 0;
  const cap = host.querySelector('.cap'), cnt = host.querySelector('.cnt'), fill = host.querySelector('.bar i');
  function polyPath(pts) { return pth(pts.map(q => sc.X(q))) + 'Z'; }
  function draw() {
    sc.clear();
    const it = [{ k: 'link', a: A, b: B, col: C.l2 }, { k: 'joint', p: A }, { k: 'joint', p: B }, { k: 'lbl', p: A, t: 'A', ang: angd(mul(u, -1)) - 30 }, { k: 'lbl', p: B, t: 'B', ang: angd(u) + 30 }, { k: 'dot', p: a, r: 3.6, col: C.found }, { k: 'lbl', p: a, t: 'a', ang: angd(mul(add(u, n), -1)), col: C.found }];
    drawItems(sc, it);
    if (st >= 2) el('path', { d: polyPath(rulerPts), fill: 'rgba(255,209,102,0.10)', stroke: '#ffd166', 'stroke-width': 1.2 }, sc.L.under);
    if (st >= 2) { let tk = ''; const LL = len(sub(rulerPts[1], rulerPts[0])); for (let s = 0; s <= LL; s += 5) { const q = add(rulerPts[0], mul(hyp, s)), q2 = add(q, mul(nh, s % 25 === 0 ? 6 : 3)); tk += pth([sc.X(q), sc.X(q2)]); } el('path', { d: tk, stroke: '#ffd166', 'stroke-width': 0.8, fill: 'none' }, sc.L.under); }
    if (st >= 1) {
      const R = add(R0, mul(hyp, t)), T3 = tri(R), inner = T3.map(q => lerp(q, add(add(T3[0], T3[1]), T3[2]).map(x => x / 3), 0.5));
      if (st >= 3 && t !== 0) el('path', { d: polyPath(tri(R0)), fill: 'none', stroke: '#7aa2ff', 'stroke-width': 1, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.6 }, sc.L.under);
      el('path', { d: polyPath(T3) + polyPath(inner), fill: 'rgba(122,162,255,0.20)', 'fill-rule': 'evenodd', stroke: '#7aa2ff', 'stroke-width': 1.4 }, sc.L.cons);
      const leg = mode === 'perp' ? [R, T3[2]] : [R, T3[1]];
      el('path', { d: pth([sc.X(leg[0]), sc.X(leg[1])]), stroke: C.found, 'stroke-width': 3, 'stroke-opacity': 0.75, fill: 'none' }, sc.L.cons);
    }
    if (st >= 4) {
      const d = mode === 'perp' ? n : u;
      drawItems(sc, [{ k: 'seg', a: add(a, mul(d, mode === 'perp' ? -60 : -95)), b: add(a, mul(d, mode === 'perp' ? 95 : 60)), col: C.found, w: 2 }]);
      drawItems(sc, [{ k: 'seg', a: A, b: add(A, mul(u, 150)), col: C.muted, dash: '3 5', w: 1 }]);
    }
  }
  function show(i, anim) {
    cancelAnimationFrame(raf); st = Math.max(0, Math.min(4, i));
    const tt = tFor(mode);
    if (st < 3) t = 0; else if (st > 3 || !anim) t = tt;
    if (st === 3 && anim) { const t0 = performance.now(); const fr = now => { const x = Math.min(1, (now - t0) / 1600), e = x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; t = tt * e; draw(); if (x < 1) raf = requestAnimationFrame(fr); }; raf = requestAnimationFrame(fr); }
    cap.innerHTML = CAPS[mode][st]; cnt.textContent = (st + 1) + ' / 5'; fill.style.width = ((st + 1) / 5 * 100) + '%';
    draw();
  }
  host.querySelector('.bp').onclick = () => show(st - 1, false);
  host.querySelector('.bn').onclick = () => show(st + 1, true);
  host.querySelectorAll('.seg button').forEach(b => b.onclick = () => { host.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b)); mode = b.dataset.m; a = AP[mode]; show(0, false); });
  show(0, false);
}

/* ---------- виджет: погрешность пересечения ---------- */
function errWidget(host) {
  host.innerHTML = `<svg class="wsvg" role="img" aria-label="Погрешность точки пересечения"></svg>
  <div class="wctl"><span class="wl">угол между прямыми</span><input class="th" type="range" min="6" max="90" step="1" value="60" aria-label="Угол"><b class="wv tv"></b></div>
  <div class="wctl"><span class="wl">точность линии δ</span><select class="dl" aria-label="Точность линии"><option value="0.15">±0,15 мм — тонкий грифель, всё аккуратно</option><option value="0.25" selected>±0,25 мм — аккуратно</option><option value="0.5">±0,5 мм — толстая линия</option></select></div>
  <div class="wctl"><span class="wl">длина вектора на плане</span><input class="lnv" type="range" min="30" max="160" step="5" value="80" aria-label="Длина"><b class="wv lv"></b></div>
  <div class="rd"></div>`;
  const sc = new Scene(host.querySelector('svg'), { maxH: 300, H: 260, pad: 10 }); sc.fit([[-120, -70], [120, 70]]);
  const th = host.querySelector('.th'), dl = host.querySelector('.dl'), ln = host.querySelector('.lnv'), rd = host.querySelector('.rd');
  function draw() {
    const t = +th.value, d = +dl.value, Lv = +ln.value, D = 10 * d / 0.25, d1 = [1, 0], d2 = dirv(t), n1 = rot(d1), n2 = rot(d2), S = 140;
    sc.clear();
    const strip = (dd, nn, col) => { const pts = [add(mul(nn, D), mul(dd, -S)), add(mul(nn, D), mul(dd, S)), add(mul(nn, -D), mul(dd, S)), add(mul(nn, -D), mul(dd, -S))]; el('path', { d: pth(pts.map(q => sc.X(q))) + 'Z', fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-opacity': 0.5, 'stroke-width': 0.8 }, sc.L.under); el('path', { d: pth([sc.X(mul(dd, -S)), sc.X(mul(dd, S))]), stroke: col, 'stroke-width': 1.6, fill: 'none' }, sc.L.main); };
    strip(d1, n1, '#7aa2ff'); strip(d2, n2, '#2ee6c5');
    const V = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(s => ll(mul(n1, s[0] * D), d1, mul(n2, s[1] * D), d2));
    el('path', { d: pth(V.map(q => sc.X(q))) + 'Z', fill: '#ff9f43', 'fill-opacity': 0.55, stroke: '#ff9f43', 'stroke-width': 1.2 }, sc.L.top);
    const e = d / Math.sin(t * D2R / 2), rel = e / Lv * 100;
    host.querySelector('.tv').textContent = t + '°'; host.querySelector('.lv').textContent = Lv + ' мм';
    rd.innerHTML = `<div><span>точка «плавает» до</span><b>±${fz(e.toFixed(2))} мм</b></div><div><span>ошибка скорости</span><b class="${rel <= 1 ? 'okc' : (rel <= 2.5 ? '' : 'badc')}">до ${fz(rel.toFixed(1))} %</b></div>`;
  }
  [th, dl, ln].forEach(x => x.oninput = draw); dl.onchange = draw; draw();
}

/* ---------- построения: углы, координаты, Фалес ---------- */
function ang60Kon() {
  const Kk = new Kon(); Kk.scene('t', { maxH: 320, pad: 36 }); const m = Kk.fn('t'), O = [0, 0], P = [1, 0], Q = dirv(60), P2 = [-1, 0], Q2 = dirv(120), Tm = mul(dirv(30), 1.2);
  Kk.step('<b>1.</b> Точка O и длинная горизонталь через неё. Нужен угол 60° — без транспортира, точно.');
  m('cl', { a: [-1.35, 0], b: [1.35, 0], e1: 0, e2: 0 }); m('dot', { p: O, r: 3.4 }); m('lbl', { p: O, t: 'O', ang: 270 });
  Kk.step('<b>2.</b> Любым радиусом R — дуга из O. Она пересекает горизонталь в точке P.');
  m('arc', { c: O, r: 1, a0: -12, a1: 78 }); m('dot', { p: P, r: 3 }); m('lbl', { p: P, t: 'P', ang: 300 });
  Kk.step('<b>3.</b> <b>Тем же радиусом</b> — дуга из P. Пересечение с первой дугой — точка Q.');
  m('arc', { c: P, r: 1, a0: 105, a1: 135 }); m('dot', { p: Q, r: 3, col: C.found }); m('lbl', { p: Q, t: 'Q', ang: 75 });
  Kk.step('<b>4.</b> OP = PQ = OQ = R — треугольник равносторонний, поэтому ∠POQ = <b>60° точно</b>. Проводим луч OQ.');
  m('seg', { a: O, b: mul(Q, 1.35), col: C.found, w: 2 }); m('ang', { c: O, a0: 0, a1: 60, r: 34, t: '60°', col: C.found, td: 16 });
  Kk.step('<b>5.</b> 30° — биссектриса: равными растворами дуги из P и из Q, через их пересечение — луч. Так же 15°, а 45° — биссектриса прямого угла (прямой — угольником).');
  m('arc', { c: P, r: 0.75, a0: 100, a1: 125 }); m('arc', { c: Q, r: 0.75, a0: -25, a1: -5 }); m('seg', { a: O, b: Tm, col: C.l2, w: 1.6, dash: '6 4' }); m('lbl', { p: Tm, t: '30°', ang: 20, col: C.l2, size: 12 });
  Kk.step('<b>6.</b> Угол от <b>левой</b> горизонтали (как φ в вариантах КР): ровно то же, только дугу ведём из точки P′ слева. Получаем 60° слева = 120° справа.');
  m('arc', { c: O, r: 1, a0: 102, a1: 192 }); m('arc', { c: P2, r: 1, a0: 45, a1: 75 }); m('dot', { p: P2, r: 3 }); m('lbl', { p: P2, t: 'P′', ang: 250 }); m('seg', { a: O, b: mul(Q2, 1.35), col: C.l1, w: 2 }); m('ang', { c: O, a0: 120, a1: 180, r: 48, t: '60°', col: C.l1, td: 16 });
  return Kk;
}
function coordKon() {
  const Kk = new Kon(); Kk.scene('t', { maxH: 320, pad: 38 }); const m = Kk.fn('t'), O = [0, 0], phi = 37, X = [100 * Math.cos(phi * D2R), 0], Yp = [X[0], 100 * Math.sin(phi * D2R)], A = mul(dirv(phi), 55);
  Kk.step(`<b>1.</b> Угол φ = ${phi}° не строится циркулем. Транспортир даёт ±0,5° — на кривошипе 60 мм это ±0,5 мм у точки A, а дальше ошибка растёт. Точнее — по катетам. Считаем: 100·cos ${phi}° = <b>${f1(X[0])} мм</b>, 100·sin ${phi}° = <b>${f1(Yp[1])} мм</b>.`);
  m('cl', { a: [-10, 0], b: [118, 0], e1: 0, e2: 0 }); m('dot', { p: O, r: 3.4 }); m('lbl', { p: O, t: 'O', ang: 250 });
  Kk.step(`<b>2.</b> Циркулем откладываем ${f1(X[0])} мм по горизонтали (раствор ставим по линейке от отметки 10 до ${f1(10 + X[0])}).`);
  m('arc', { c: O, r: X[0], a0: -8, a1: 8 }); m('dot', { p: X, r: 3 }); m('lbl', { p: X, t: 'X', ang: 300 });
  Kk.step(`<b>3.</b> Угольником — перпендикуляр в X. На нём циркулем ${f1(Yp[1])} мм вверх → точка Y.`);
  m('seg', { a: X, b: add(Yp, [0, 12]), col: C.muted, dash: '5 4' }); m('ra', { p: X, d1: [-1, 0], d2: [0, 1], col: C.muted }); m('arc', { c: X, r: Yp[1], a0: 82, a1: 98 }); m('dot', { p: Yp, r: 3, col: C.found }); m('lbl', { p: Yp, t: 'Y', ang: 45 });
  Kk.step(`<b>4.</b> Луч OY — точно под ${phi}°. Ошибка ±0,2 мм на 100 мм — это ±0,1°, в пять раз лучше транспортира. На луче откладываем длину кривошипа — точка A.`);
  m('seg', { a: O, b: mul(dirv(phi), 118), col: C.found, w: 2 }); m('ang', { c: O, a0: 0, a1: phi, r: 22, t: phi + '°', col: C.found }); m('arc', { c: O, r: 55, a0: phi - 8, a1: phi + 8 }); m('link', { a: O, b: A, col: C.l1 }); m('joint', { p: A }); m('lbl', { p: A, t: 'A', ang: phi + 90 });
  return Kk;
}
function thalesKon() {
  const Kk = new Kon(); Kk.scene('t', { maxH: 300, pad: 34 }); const m = Kk.fn('t'), a = [0, 0], b = [100, 0], AC = 36, AB = 90, d = dirv(34), C1 = mul(d, AC), B1 = mul(d, AB), c = [100 * AC / AB, 0];
  Kk.step('<b>1.</b> На плане есть отрезок ab, нужна точка c: ac/ab = AC/AB (точка C на звене AB). Считать ничего не нужно.');
  m('seg', { a: a, b: b, col: C.rel, w: 2 }); m('dot', { p: a, r: 3 }); m('dot', { p: b, r: 3 }); m('lbl', { p: a, t: 'a', ang: 225 }); m('lbl', { p: b, t: 'b', ang: 315 });
  Kk.step('<b>2.</b> Из a — вспомогательный луч под любым удобным углом (≈ 30°).');
  m('seg', { a: a, b: mul(d, 108), col: C.muted, dash: '5 4' });
  Kk.step('<b>3.</b> Циркулем снимаем AC <b>прямо со схемы</b> и откладываем от a: точка C′. Затем снимаем AB и откладываем от a: B′.');
  m('arc', { c: a, r: AC, a0: 26, a1: 42 }); m('arc', { c: a, r: AB, a0: 29, a1: 39 }); m('dot', { p: C1, r: 3 }); m('dot', { p: B1, r: 3 }); m('lbl', { p: C1, t: 'C′', ang: 124 }); m('lbl', { p: B1, t: 'B′', ang: 124 });
  Kk.step('<b>4.</b> Соединяем B′ и b.');
  m('seg', { a: B1, b: b, col: C.l2, w: 1.6 });
  Kk.step('<b>5.</b> Через C′ — прямая ∥ B′b (угольник по линейке). Она пересекает ab в точке c, и ac/ab = AC′/AB′ = AC/AB <b>точно</b> (теорема Фалеса). Так же делят и для центров масс, и для точки на треугольном звене.');
  m('seg', { a: C1, b: c, col: C.found, w: 1.8 }); m('dot', { p: c, r: 3.4, col: C.found }); m('lbl', { p: c, t: 'c', ang: 290, col: C.found });
  return Kk;
}
function thales2Kon() {
  const Kk = new Kon(); Kk.scene('t', { maxH: 300, pad: 34 }); const m = Kk.fn('t'), p = [0, 0], a3 = [62, 0], OA = 50, OB = 82, d = dirv(38), A1 = mul(d, OA), B1 = mul(d, OB), b = [62 * OB / OA, 0];
  Kk.step('<b>1.</b> Кулиса: известна pa<sub>3</sub>, нужна b на продолжении: pb = pa<sub>3</sub>·O<sub>2</sub>B/O<sub>2</sub>A. Без калькулятора.');
  m('vec', { a: p, b: a3, col: C.found }); m('cl', { a: p, b: b, e1: 0, e2: 14 }); m('dot', { p: p, r: 3 }); m('lbl', { p: p, t: 'p', ang: 225 }); m('lbl', { p: a3, t: 'a_{3}', ang: 300 });
  Kk.step('<b>2.</b> Из p — луч под любым углом. Циркулем со схемы: O<sub>2</sub>A → точка A′, O<sub>2</sub>B → точка B′ (обе от p).');
  m('seg', { a: p, b: mul(d, 92), col: C.muted, dash: '5 4' }); m('arc', { c: p, r: OA, a0: 30, a1: 46 }); m('arc', { c: p, r: OB, a0: 33, a1: 43 }); m('dot', { p: A1, r: 3 }); m('dot', { p: B1, r: 3 }); m('lbl', { p: A1, t: 'A′', ang: 128 }); m('lbl', { p: B1, t: 'B′', ang: 128 });
  Kk.step('<b>3.</b> Соединяем A′ с a<sub>3</sub>, через B′ — параллель (угольник по линейке). Пересечение с продолжением pa<sub>3</sub> — точка b.');
  m('seg', { a: A1, b: a3, col: C.l2, w: 1.6 }); m('seg', { a: B1, b: b, col: C.found, w: 1.8 }); m('vec', { a: p, b: b, col: C.found, w: 2 }); m('dot', { p: b, r: 3.4, col: C.found }); m('lbl', { p: b, t: 'b', ang: 300, col: C.found });
  return Kk;
}

/* ---------- калькуляторы масштабов ---------- */
const ZN = { p: { w: 175, h: 125, t: 'лист вертикально, схема сверху, план снизу (≈ 175 × 125 мм на каждую)' }, l: { w: 125, h: 180, t: 'лист горизонтально, схема слева, план справа (≈ 125 × 180 мм)' } };
function mlCalc(host) {
  host.innerHTML = `<div class="calc"><div class="cr"><label>Ширина механизма, мм</label><input class="w" inputmode="decimal" value="210"></div><div class="cr"><label>Высота механизма, мм</label><input class="h" inputmode="decimal" value="250"></div><div class="cr"><label>Раскладка</label><select class="z"><option value="p">${ZN.p.t}</option><option value="l">${ZN.l.t}</option></select></div><div class="out"></div></div>`;
  const out = host.querySelector('.out');
  const go = () => {
    const w = parseNum(host.querySelector('.w').value), h = parseNum(host.querySelector('.h').value), z = ZN[host.querySelector('.z').value];
    if (!(w > 0) || !(h > 0)) { out.innerHTML = '<span class="badc">Введи размеры механизма числами.</span>'; return; }
    const need = Math.max(w / z.w, h / z.h) / 1000, mu = niceUp(need), W = w / 1000 / mu, H = h / 1000 / mu;
    out.innerHTML = `Минимально возможный μ<sub>l</sub> = ${fs(need, 3)} м/мм → берём удобный <b>μ<sub>l</sub> = ${fmu(mu)} м/мм</b>. Схема выйдет ${f1(W)} × ${f1(H)} мм и займёт ${Math.round(W * H / (z.w * z.h) * 100)} % своей зоны. Длина на листе = длина в метрах / ${fmu(mu)}.`;
  };
  host.querySelectorAll('input,select').forEach(x => { x.oninput = go; x.onchange = go; }); go();
}
function mvCalc(host) {
  host.innerHTML = `<div class="calc"><div class="cr"><label>V<sub>A</sub>, м/с</label><input class="va" inputmode="decimal" value="0,6"></div><div class="cr"><label>pa на наброске, мм</label><input class="ps" inputmode="decimal" value="20"></div><div class="cr"><label>Набросок плана: ширина, мм</label><input class="w" inputmode="decimal" value="34"></div><div class="cr"><label>высота, мм</label><input class="h" inputmode="decimal" value="30"></div><div class="cr"><label>Зона плана</label><select class="z"><option value="p">${ZN.p.t}</option><option value="l">${ZN.l.t}</option></select></div><div class="out"></div></div>`;
  const out = host.querySelector('.out');
  const go = () => {
    const va = parseNum(host.querySelector('.va').value), ps = parseNum(host.querySelector('.ps').value), w = parseNum(host.querySelector('.w').value), h = parseNum(host.querySelector('.h').value), z = ZN[host.querySelector('.z').value];
    if (![va, ps, w, h].every(x => x > 0)) { out.innerHTML = '<span class="badc">Заполни все поля числами.</span>'; return; }
    const kmax = Math.min(z.w / w, z.h / h), paMax = ps * kmax, need = va / paMax, mu = niceUp(need), pa = va / mu, kk = pa / ps;
    out.innerHTML = `Набросок можно увеличить в ${fz(kmax.toFixed(2))} раза: pa до ${f1(paMax)} мм. Берём <b>μ<sub>V</sub> = ${fmu(mu)} (м/с)/мм</b> → <b>pa = ${f1(pa)} мм</b>, план ≈ ${f1(w * kk)} × ${f1(h * kk)} мм.`;
  };
  host.querySelectorAll('input,select').forEach(x => { x.oninput = go; x.onchange = go; }); go();
}

/* ---------- пробная КР ---------- */
const Rn = { ri: (a, b, s) => a + s * Math.floor(Math.random() * (Math.floor((b - a) / s) + 1)), rf: (a, b) => a + Math.random() * (b - a), pick: a => a[Math.floor(Math.random() * a.length)] };
const LS = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
function mockWidget(host) {
  host.innerHTML = `<div class="mk-top"><div class="tmr" aria-live="polite">90:00</div><button class="st">▶ Старт</button><button class="rs">Сброс</button><button class="nv">Новый вариант</button><label class="small">допуск <select class="tol"><option value="2">±2 % — строго</option><option value="5">±5 %</option></select></label></div><div class="mk1"></div><div class="mk2"></div>`;
  const tmr = host.querySelector('.tmr'), stb = host.querySelector('.st'), tolSel = host.querySelector('.tol');
  let T = LS.get('kr2tz-timer') || { acc: 0, start: null }, iv = 0;
  const left = () => 90 * 60 - (T.acc + (T.start ? (Date.now() - T.start) / 1000 : 0));
  function tick() {
    const s = Math.max(0, left()), mn = Math.floor(s / 60), sc = Math.floor(s % 60);
    tmr.textContent = String(mn).padStart(2, '0') + ':' + String(sc).padStart(2, '0'); tmr.classList.toggle('low', s < 10 * 60); tmr.classList.toggle('end', s <= 0);
    stb.textContent = T.start ? '❚❚ Пауза' : '▶ Старт';
    if (s <= 0 && T.start) { T.acc = 90 * 60; T.start = null; LS.set('kr2tz-timer', T); tmr.textContent = 'Время вышло'; }
  }
  stb.onclick = () => { if (T.start) { T.acc += (Date.now() - T.start) / 1000; T.start = null; } else T.start = Date.now(); LS.set('kr2tz-timer', T); tick(); };
  host.querySelector('.rs').onclick = () => { T = { acc: 0, start: null }; LS.set('kr2tz-timer', T); tick(); };
  clearInterval(iv); iv = setInterval(tick, 1000); tick();
  function make(v) {
    taskBox(host.querySelector('.mk1'), v.m1, { title: 'Механизм 1', tol: () => +tolSel.value });
    taskBox(host.querySelector('.mk2'), v.m2, { title: 'Механизм 2 (кулисный)', tol: () => +tolSel.value });
  }
  function fresh() { const t1 = Rn.pick(['six', 'six', 'rrr', 'ks']); const v = { m1: { type: t1, p: TYPES[t1].gen(Rn) }, m2: { type: 'kul6', p: KUL6.gen(Rn) } }; LS.set('kr2tz-var2', v); return v; }
  let v = LS.get('kr2tz-var2'); if (!v || !v.m1 || !v.m2 || !TYPES[v.m1.type]) v = fresh();
  make(v);
  host.querySelector('.nv').onclick = () => make(fresh());
}

/* ---------- запуск ---------- */
function boot() {
  const W = {
    sq: sqWidget, err: errWidget, ml: mlCalc, mv: mvCalc, mock: mockWidget,
    a60: n => mountKon(n, ang60Kon()), crd: n => mountKon(n, coordKon()), th1: n => mountKon(n, thalesKon()), th2: n => mountKon(n, thales2Kon()),
    ex6: n => {
      const S = KUL6.solve(EX6);
      n.innerHTML = `<div class="given"><div><span class="lbl">Дано</span> ${KUL6.given(EX6)}</div><div><span class="lbl">Найти</span> ${KUL6.find}</div></div><div class="fig"><div class="ttl">Схема в заданном положении</div><div class="sch"></div></div><h4>Структура</h4><p>${KUL6.struct}</p><h4>1. Схема в масштабе (лист 2, верх)</h4><div class="kp"></div><h4>2. План скоростей (лист 2, низ)</h4><div class="kv"></div><h4>3. Ответ</h4><div class="res"></div><h4>4. Лист с формулами — что написать</h4><div class="fls"></div>`;
      const Ks = new Kon(); Ks.scene('mech', { maxH: 300 }); KUL6.draw(Ks, 'mech', S, { s: -1, cm: true }); mountKon(n.querySelector('.sch'), Ks, { static: true });
      mountKon(n.querySelector('.kp'), KUL6.pos(S)); mountKon(n.querySelector('.kv'), KUL6.plan(S));
      n.querySelector('.res').innerHTML = rowsTable(KUL6, S); n.querySelector('.fls').innerHTML = formulas6(S);
    }
  };
  document.querySelectorAll('[data-tz]').forEach(n => { try { W[n.dataset.tz](n); } catch (e) { console.error('tz', n.dataset.tz, e); n.innerHTML = '<p class="small">Не удалось показать этот блок.</p>'; } });
}
window.KTZ = { KUL6, EX6, niceUp, taskBox };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
