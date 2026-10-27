/* Задание 3: диаграмма растяжения σ(ε) */
(function () {
  const root = $('#m-tension');
  root.innerHTML = `
  <h2>Задание 3 · Диаграмма растяжения</h2>
  <details class="card" open><summary>Как читать диаграмму σ–ε</summary>
    <ol class="steps">
      <li><b>σ<sub>в</sub> — предел прочности</b>: самая высокая точка кривой. От неё горизонталь влево до оси σ.</li>
      <li><b>σ<sub>у</sub> — предел упругости</b>: конец начального прямолинейного участка (там, где кривая «отрывается» от прямой). От этой точки тоже горизонталь до оси σ.</li>
      <li><b>E — модуль упругости</b> = наклон прямого участка: E = Δσ/Δε. Деформацию бери <b>в долях</b> (2 % = 0,02), тогда МПа / 1000 = ГПа.</li>
      <li><b>δ — запас пластичности</b>: из точки разрыва проведи линию, <b>параллельную упругому участку</b>, до оси ε. Расстояние от нуля до пересечения — δ в %.</li>
    </ol>
    <div class="tip">Единицы: σ — МПа, ε — %, E — ГПа. Наведи курсор (или палец) на график — внизу покажутся координаты.</div>
  </details>
  <div class="card">
    <div class="row"><button class="sec" id="te-new">Новая диаграмма</button><span class="score" id="te-score"></span></div>
    <div class="q">Определите предел упругости и предел прочности по диаграмме деформации.</div>
    <div id="te-plot"></div>
    <div class="hint" id="te-read">&nbsp;</div>
    <div class="ans">
      <label><span>σ<sub>у</sub>, МПа</span><input type="text" id="te-sy" inputmode="decimal" autocomplete="off"></label>
      <label><span>σ<sub>в</sub>, МПа</span><input type="text" id="te-su" inputmode="decimal" autocomplete="off"></label>
      <label>E, ГПа (бонус)<input type="text" id="te-e" inputmode="decimal" autocomplete="off"></label>
      <label>δ, % (бонус)<input type="text" id="te-d" inputmode="decimal" autocomplete="off"></label>
    </div>
    <div class="row"><button class="pri" id="te-check">Проверить</button><button class="sec" id="te-show">Показать решение</button><span class="hint">бонусные поля можно не заполнять</span></div>
    <div class="fb" id="te-fb"></div>
    <div class="sol" id="te-sol"></div>
  </div>`;

  const score = makeScore($('#te-score'), 'tension');
  let st = null;

  function gen() {
    let E, sigY, epsY;
    for (;;) { E = rint(40, 110); sigY = rint(6, 22) * 50; epsY = sigY / (10 * E); if (epsY >= 0.8 && epsY <= 2.8) break; }
    const shape = pick([1, 2]);
    const slope = 10 * E; /* МПа на 1 % */
    const sigU = Math.round(sigY * rnd(1.2, 1.65) / 50) * 50;
    const epsU = epsY + rnd(2.2, 5.5), epsF = epsU + rnd(0.9, 2.2);
    const D = sigU * rnd(0.05, 0.13);
    const pre = e => {
      if (e <= epsY) return slope * e;
      const s = e - epsY, su = epsU - epsY, dd = sigU - sigY;
      if (shape === 1) { const d1 = 0.3 * dd, tau = d1 / (0.35 * slope); return sigY + d1 * (1 - Math.exp(-s / tau)) + (dd - d1) * Math.pow(s / su, 0.7); }
      const d1 = 0.15 * dd, tau = d1 / (0.35 * slope), s0 = 0.25 * su, w = su - s0;
      const t = Math.min(1, Math.max(0, (s - s0) / w)), sm = t * t * (3 - 2 * t);
      return sigY + d1 * (1 - Math.exp(-s / tau)) + (dd - d1) * sm;
    };
    const top = pre(epsU);
    const sig = e => e <= epsU ? pre(e) : top - D * Math.pow((e - epsU) / (epsF - epsU), 2.2);
    const pts = []; const n = 420;
    for (let i = 0; i <= n; i++) { const e = epsF * i / n; pts.push([e, sig(e)]); }
    const sigF = sig(epsF);
    const xmax = [8, 10, 12, 15, 20].find(v => v >= epsF + 0.8) || 20;
    const ymax = Math.ceil(top * 1.07 / 200) * 200;
    return { E, sigY, epsY, sigU: top, epsU, epsF, sigF, slope, pts, xmax, ymax, delta: epsF - sigF / slope };
  }

  function plot(t, solved) {
    const yMaj = t.ymax <= 1600 ? 200 : 400;
    const P = Plot({ x0: 0, x1: t.xmax, y0: 0, y1: t.ymax, xMaj: t.xmax <= 12 ? 2 : 5, xMin: t.xmax <= 12 ? 0.5 : 1, yMaj, yMin: yMaj / 4, xf: v => nf(v, 0), yf: v => nf(v, 0), xl: 'ε, %', yl: 'σ, МПа' });
    let s = P.grid + `<path class="curve" d="${pathOf(t.pts, P)}"/>`;
    if (solved) {
      const lab = (txt, x, y, anchor = 'start') => `<text class="solt" x="${x}" y="${y}" text-anchor="${anchor}">${txt}</text>`;
      /* σу */
      s += `<line class="ovl" x1="${P.L}" y1="${P.Y(t.sigY)}" x2="${P.X(t.epsY)}" y2="${P.Y(t.sigY)}"/><line class="ovl" x1="${P.X(t.epsY)}" y1="${P.Y(t.sigY)}" x2="${P.X(t.epsY)}" y2="${P.Y(0)}"/>`;
      s += `<circle cx="${P.X(t.epsY)}" cy="${P.Y(t.sigY)}" r="5" fill="var(--ln)"/>` + lab(`σу = ${nf(t.sigY, 0)}`, P.L + 8, P.Y(t.sigY) - 6);
      /* σв */
      const eu = t.pts.reduce((a, p) => p[1] > a[1] ? p : a, [0, 0]);
      s += `<line class="ovl" x1="${P.L}" y1="${P.Y(eu[1])}" x2="${P.X(eu[0])}" y2="${P.Y(eu[1])}"/><line class="ovl" x1="${P.X(eu[0])}" y1="${P.Y(eu[1])}" x2="${P.X(eu[0])}" y2="${P.Y(0)}"/>`;
      s += `<circle cx="${P.X(eu[0])}" cy="${P.Y(eu[1])}" r="5" fill="var(--ln)"/>` + lab(`σв = ${nf(eu[1], 0)}`, P.L + 8, P.Y(eu[1]) - 6);
      /* касательная (упругий участок) */
      const eT = Math.min(t.xmax, t.ymax / t.slope);
      s += `<line class="ovl" style="stroke:var(--mu)" x1="${P.X(0)}" y1="${P.Y(0)}" x2="${P.X(Math.min(eT, t.epsY * 1.8))}" y2="${P.Y(Math.min(eT, t.epsY * 1.8) * t.slope)}"/>`;
      /* δ */
      const ed = t.delta;
      s += `<circle cx="${P.X(t.epsF)}" cy="${P.Y(t.sigF)}" r="4.5" fill="var(--ln)"/><line class="ovl" x1="${P.X(t.epsF)}" y1="${P.Y(t.sigF)}" x2="${P.X(ed)}" y2="${P.Y(0)}"/>`;
      s += `<circle cx="${P.X(ed)}" cy="${P.Y(0)}" r="4.5" fill="var(--ln)"/>` + lab(`δ = ${nf(ed, 1)} %`, P.X(ed), P.Y(0) - 10, 'middle');
    }
    s += '<g class="cross"></g>';
    return { svg: `<svg viewBox="0 0 ${P.W} ${P.H}" role="img" aria-label="Диаграмма растяжения">${s}</svg>`, P };
  }

  function draw(solved) {
    const r = plot(st, solved);
    $('#te-plot').innerHTML = r.svg;
    hoverReadout($('#te-plot svg'), r.P, $('#te-read'), v => `ε = ${nf(v, 2)} %`, v => `σ = ${nf(v, 0)} МПа`);
  }

  function steps(t) {
    const Eg = t.sigY / (t.epsY / 100) / 1000;
    return `<ol class="steps">
      <li><b>σ<sub>в</sub></b> — максимум кривой: <b>≈ ${nf(t.sigU, 0)} МПа</b> (при ε ≈ ${nf(t.epsU, 1)} %).</li>
      <li><b>σ<sub>у</sub></b> — конец прямого участка: <b>≈ ${nf(t.sigY, 0)} МПа</b> (при ε ≈ ${nf(t.epsY, 1)} %).</li>
      <li><b>E</b> = σ/ε по прямому участку: ${nf(t.sigY, 0)} МПа / ${nf(t.epsY / 100, 4)} = ${nf(Eg * 1000, 0)} МПа = <b>${nf(Eg, 0)} ГПа</b>.</li>
      <li><b>δ</b>: из точки разрыва (ε = ${nf(t.epsF, 1)} %, σ = ${nf(t.sigF, 0)} МПа) линия параллельно упругому участку. Она режет ось ε в точке <b>δ ≈ ${nf(t.delta, 1)} %</b> (это ${nf(t.epsF, 1)} − ${nf(t.sigF, 0)}/${nf(t.slope, 0)} в процентах — упругая часть деформации после разрыва исчезает).</li></ol>
      <div class="hint">Красные пунктиры на рисунке — как это строится. Серая линия — продолжение упругого участка.</div>`;
  }

  function newTask() {
    st = gen(); st.counted = false;
    ['te-sy', 'te-su', 'te-e', 'te-d'].forEach(id => { const el = $('#' + id); el.value = ''; mark(el, null); });
    $('#te-fb').className = 'fb'; $('#te-sol').className = 'sol'; $('#te-sol').innerHTML = '';
    draw(false);
  }
  const count = good => { if (!st.counted) { st.counted = true; score.add(good); } };

  $('#te-check').onclick = () => {
    const tol = {
      sy: Math.max(0.1 * st.sigY, 40), su: Math.max(0.03 * st.sigU, 30)
    };
    const chk = (id, exp, t, req) => {
      const el = $('#' + id), raw = el.value.trim();
      if (!raw && !req) { mark(el, null); return null; }
      const ok = Number.isFinite(parseVal(raw)) && Math.abs(parseVal(raw) - exp) <= t; mark(el, ok); return ok;
    };
    const r = [chk('te-sy', st.sigY, tol.sy, true), chk('te-su', st.sigU, tol.su, true),
      chk('te-e', st.sigY / (st.epsY / 100) / 1000, Math.max(0.12 * st.E, 4), false), chk('te-d', st.delta, 0.7, false)];
    const main = r[0] && r[1], extra = r.slice(2).every(v => v !== false);
    const fb = $('#te-fb');
    fb.className = 'fb show ' + (main && extra ? 'ok' : 'no');
    fb.innerHTML = main && extra ? '✓ Верно (в допуске чтения графика). Разбор ниже.' :
      '✗ Не совпало (красные поля). Допуск: σ<sub>у</sub> ±10 %, σ<sub>в</sub> ±3 %, E ±12 %, δ ±0,7 %. Проверь, что σ<sub>у</sub> — конец прямой, а σ<sub>в</sub> — верхушка кривой.';
    count(main && extra);
    if (main && extra) { draw(true); $('#te-sol').innerHTML = steps(st); $('#te-sol').className = 'sol show'; }
  };
  $('#te-show').onclick = () => {
    count(false); draw(true);
    $('#te-sy').value = nf(st.sigY, 0); $('#te-su').value = nf(st.sigU, 0);
    $('#te-e').value = nf(st.sigY / (st.epsY / 100) / 1000, 0); $('#te-d').value = nf(st.delta, 1);
    ['te-sy', 'te-su', 'te-e', 'te-d'].forEach(id => mark($('#' + id), null));
    $('#te-sol').innerHTML = steps(st); $('#te-sol').className = 'sol show';
  };
  $('#te-new').onclick = newTask;
  newTask();
  window.__tension = { gen };
})();
