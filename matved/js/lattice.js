/* Задание 3: параметр решётки по линии и положение линии по параметру */
(function () {
  const root = $('#m-lattice');
  root.innerHTML = `
  <h2>Задание 3 · Параметр решётки и положение линии</h2>
  <details class="card" open><summary>Формулы (кубическая решётка)</summary>
    <span class="f">a = λ · √(H² + K² + L²) / (2 sin θ)</span>
    <span class="f">sin θ = λ · √(H² + K² + L²) / (2a)  →  2θ = 2 · arcsin(…)</span>
    <ol class="steps">
      <li>На графике по оси стоит <b>2θ</b> → в формулу идёт <b>θ = 2θ / 2</b>.</li>
      <li>H K L — индексы линии: для 110 это √(1+1+0) = √2, для 200 — √4 = 2, для 211 — √6, для 220 — √8.</li>
      <li>λ (Cu K<sub>α</sub>) = 1,54178 Å. Ответ — в ангстремах (1 Å = 10<sup>−10</sup> м).</li>
      <li>Обратная задача: сначала sin θ, потом arcsin, потом <b>умножить на 2</b>.</li>
    </ol>
    <div class="tip">Какие линии бывают: ОЦК — только где H+K+L чётно (110, 200, 211, 220, 310…). ГЦК — только когда все индексы чётные или все нечётные (111, 200, 220, 311…).</div>
  </details>
  <div class="card">
    <div class="row"><label>Тип: <select id="la-type"><option value="rand">случайный</option><option value="peak">по пику найти a</option><option value="calc">по a найти положение линии</option></select></label>
      <button class="sec" id="la-new">Новая задача</button><span class="score" id="la-score"></span></div>
    <div class="q" id="la-q"></div>
    <div id="la-plot"></div><div class="hint" id="la-read">&nbsp;</div>
    <div class="ans" id="la-ans"></div>
    <div class="row"><button class="pri" id="la-check">Проверить</button><button class="sec" id="la-show">Показать решение</button></div>
    <div class="fb" id="la-fb"></div>
    <div class="sol" id="la-sol"></div>
  </div>`;

  const score = makeScore($('#la-score'), 'lattice');
  let st = null;
  const LINES = { bcc: [[1, 1, 0], [2, 0, 0], [2, 1, 1], [2, 2, 0], [3, 1, 0]], fcc: [[1, 1, 1], [2, 0, 0], [2, 2, 0], [3, 1, 1]] };
  const hkl = l => l.join('');
  const N = l => l[0] * l[0] + l[1] * l[1] + l[2] * l[2];

  function gen(mode) {
    for (;;) {
      const lt = pick(['bcc', 'bcc', 'fcc']);
      const a = lt === 'bcc' ? rint(286, 345) / 100 : rint(352, 410) / 100;
      const co = Math.random() < 0.2;
      const lam = co ? 1.79026 : 1.54178;
      const line = pick(LINES[lt]);
      const s = lam * Math.sqrt(N(line)) / (2 * a);
      if (s > 0.93 || s < 0.15) continue;
      const tt = 2 * Math.asin(s) * 180 / Math.PI;
      if (mode === 'peak' && (tt < 20 || tt > 120)) continue;
      return { mode, lt, a, lam, co, line, tt, s };
    }
  }
  const phaseName = t => t.lt === 'bcc' ? 'ОЦК решётки β-фазы' : 'ГЦК решётки γ-фазы';
  const lamTxt = t => `${t.co ? 'Co' : 'Cu'}K<sub>α</sub>-излучении (λ = ${nf(t.lam, 5)} Å)`;

  function peakData(t) {
    const ws = Math.round((t.tt - 2.5 + rnd(-0.8, 0.8)) * 2) / 2;
    const H = rint(20, 90) * 1000, fw = rnd(0.22, 0.42), bg = rint(14, 24) * 100;
    const pts = [];
    for (let x = ws; x <= ws + 5 + 1e-9; x += 0.02) {
      const u = (x - t.tt) / fw;
      const y = bg + 0.04 * bg * Math.max(0, 4 - Math.abs(x - t.tt)) + H * (0.35 / (1 + 4 * u * u) + 0.65 * Math.exp(-4 * Math.LN2 * u * u)) + 0.04 * bg * gauss();
      pts.push([x, Math.max(0, y)]);
    }
    return { ws, H, pts };
  }

  function plot(t, solved) {
    const d = t.pd, ymax = Math.ceil(d.H * 1.12 / 10000) * 10000, yMaj = ymax > 50000 ? 10000 : 5000;
    const P = Plot({ x0: d.ws, x1: d.ws + 5, y0: 0, y1: ymax, xMaj: 0.5, xMin: 0.1, yMaj, yMin: yMaj / 5, xf: v => nf(v, 1), yf: v => nf(v, 0), xl: '2θ, °', yl: 'Интенсивность, имп.', L: 76 });
    let s = P.grid + `<path class="curve" style="stroke-width:1.8" d="${pathOf(d.pts, P)}"/>`;
    if (solved) s += `<line class="ovl" x1="${P.X(t.tt)}" y1="${P.T}" x2="${P.X(t.tt)}" y2="${P.Y(0)}"/><text class="solt" x="${P.X(t.tt) + 8}" y="${P.T + 16}">2θ ≈ ${nf(t.tt, 2)}°</text>`;
    s += '<g class="cross"></g>';
    return { svg: `<svg viewBox="0 0 ${P.W} ${P.H}" role="img" aria-label="Дифракционная линия">${s}</svg>`, P };
  }
  function draw(solved) {
    const r = plot(st, solved); $('#la-plot').innerHTML = r.svg;
    hoverReadout($('#la-plot svg'), r.P, $('#la-read'), v => `2θ = ${nf(v, 2)}°`, v => `I = ${nf(v, 0)}`);
  }

  function steps(t) {
    const sq = Math.sqrt(N(t.line)), th = t.tt / 2, sn = Math.sin(th * Math.PI / 180);
    if (t.mode === 'peak') return `<ol class="steps"><li>Положение пика по графику: 2θ ≈ <b>${nf(t.tt, 2)}°</b> → θ = ${nf(th, 2)}°.</li>
      <li>sin θ = ${nf(sn, 4)}; для линии ${hkl(t.line)}: √(${t.line.map(v => v + '²').join(' + ')}) = √${N(t.line)} = ${nf(sq, 4)}.</li>
      <li>a = ${nf(t.lam, 5)} · ${nf(sq, 4)} / (2 · ${nf(sn, 4)}) = <b>${nf(t.a, 3)} Å</b>.</li>
      <li>Погрешность чтения пика даёт малую ошибку: Δa = a·ctg θ·Δθ — например, ±0,05° по 2θ → ±${nf(t.a / Math.tan(th * Math.PI / 180) * (0.025 * Math.PI / 180), 3)} Å.</li></ol>`;
    return `<ol class="steps"><li>Линия ${hkl(t.line)}: √(${t.line.map(v => v + '²').join(' + ')}) = √${N(t.line)} = ${nf(sq, 4)}.</li>
      <li>sin θ = λ·√N / (2a) = ${nf(t.lam, 5)} · ${nf(sq, 4)} / (2 · ${nf(t.a, 2)}) = ${nf(t.s, 4)}.</li>
      <li>θ = arcsin(${nf(t.s, 4)}) = ${nf(th, 2)}°.</li>
      <li>2θ = 2 · ${nf(th, 2)}° = <b>${nf(t.tt, 1)}°</b>.</li></ol>`;
  }

  function newTask() {
    let m = $('#la-type').value; if (m === 'rand') m = pick(['peak', 'calc']);
    st = gen(m); st.counted = false;
    $('#la-fb').className = 'fb'; $('#la-sol').className = 'sol'; $('#la-sol').innerHTML = '';
    if (m === 'peak') {
      st.pd = peakData(st);
      $('#la-q').innerHTML = `Определите параметр ${phaseName(st)} по линии <b>${hkl(st.line)}</b> в ${lamTxt(st)}.`;
      $('#la-ans').innerHTML = `<label>2θ по графику, °<input type="text" id="la-t" inputmode="decimal" autocomplete="off"></label><label>a, Å<input type="text" id="la-a" inputmode="decimal" autocomplete="off"></label>`;
      draw(false);
    } else {
      $('#la-plot').innerHTML = ''; $('#la-read').innerHTML = '&nbsp;';
      $('#la-q').innerHTML = `Определите ориентировочное положение линии <b>${hkl(st.line)}</b> ${st.lt === 'bcc' ? 'β' : 'γ'}-фазы при периоде решётки <b>a = ${nf(st.a, 2)} Å</b> в ${lamTxt(st)}.`;
      $('#la-ans').innerHTML = `<label>2θ, °<input type="text" id="la-t" inputmode="decimal" autocomplete="off"></label>`;
    }
  }
  const count = g => { if (!st.counted) { st.counted = true; score.add(g); } };

  $('#la-check').onclick = () => {
    const tEl = $('#la-t'), tv = parseVal(tEl.value);
    const okT = Number.isFinite(tv) && Math.abs(tv - st.tt) <= (st.mode === 'peak' ? 0.1 : 0.15); mark(tEl, okT);
    let all = okT, extra = '';
    if (st.mode === 'peak') {
      const aEl = $('#la-a'), av = parseVal(aEl.value);
      const okA = Number.isFinite(av) && Math.abs(av - st.a) <= 0.015; mark(aEl, okA);
      const own = st.lam * Math.sqrt(N(st.line)) / (2 * Math.sin(tv / 2 * Math.PI / 180));
      if (!okA && Number.isFinite(own) && Math.abs(av - own) <= 0.004) extra = ' По твоему 2θ формула применена верно — значит, ошибка в чтении пика.';
      all = okT && okA;
    }
    const fb = $('#la-fb'); fb.className = 'fb show ' + (all ? 'ok' : 'no');
    fb.innerHTML = (all ? '✓ Верно! Разбор ниже.' : '✗ Не совпало. Помни: в формулу идёт θ = 2θ/2, и под корнем — сумма квадратов индексов линии.') + extra;
    count(all);
    if (all) { if (st.mode === 'peak') draw(true); $('#la-sol').innerHTML = steps(st); $('#la-sol').className = 'sol show'; }
  };
  $('#la-show').onclick = () => {
    count(false);
    $('#la-t').value = nf(st.tt, st.mode === 'peak' ? 2 : 1); mark($('#la-t'), null);
    if (st.mode === 'peak') { $('#la-a').value = nf(st.a, 3); mark($('#la-a'), null); draw(true); }
    $('#la-sol').innerHTML = steps(st); $('#la-sol').className = 'sol show';
  };
  $('#la-new').onclick = newTask; $('#la-type').onchange = newTask;
  newTask();
  window.__lattice = { gen };
})();
