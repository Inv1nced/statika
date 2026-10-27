/* Задание 3: анализ профиля линии (положение, ширина на половине высоты, интегральная интенсивность) */
(function () {
  const root = $('#m-profile');
  root.innerHTML = `
  <h2>Задание 3 · Профиль линии</h2>
  <details class="card" open><summary>Как решать</summary>
    <ol class="steps">
      <li><b>I<sub>фона</sub></b> — ровный уровень по краям графика (там, где пика нет).</li>
      <li><b>I<sub>пика</sub></b> — высота вершины пика.</li>
      <li>Половина высоты <b>над фоном</b>: I<sub>½</sub> = I<sub>фона</sub> + (I<sub>пика</sub> − I<sub>фона</sub>)/2. Горизонталь на этом уровне пересекает пик слева и справа.</li>
      <li><b>B</b> — расстояние между этими двумя пересечениями по оси 2θ (в градусах).</li>
      <li><b>Положение линии</b> — по оси 2θ в центре пика (вертикаль через «центр тяжести»).</li>
      <li><span class="f">I<sub>int</sub> = (I<sub>пика</sub> − I<sub>фона</sub>) · B / I<sub>фона</sub></span></li>
    </ol>
    <div class="tip">Читать значения на графике нужно «на глаз» между линиями сетки, поэтому допуск есть: положение ±0,25°, I ±2, B ±15 %, I<sub>int</sub> ±25 %.</div>
  </details>
  <div class="card">
    <div class="row"><button class="sec" id="pr-new">Новый профиль</button><span class="score" id="pr-score"></span></div>
    <div class="q">Определите по профилю линии положение пика, ширину на половине высоты и интегральную интенсивность.</div>
    <div id="pr-plot"></div>
    <div class="hint" id="pr-read">&nbsp;</div>
    <div class="ans">
      <label>положение 2θ, °<input type="text" id="pr-x" inputmode="decimal" autocomplete="off"></label>
      <label><span>I<sub>пика</sub></span><input type="text" id="pr-ip" inputmode="decimal" autocomplete="off"></label>
      <label><span>I<sub>фона</sub></span><input type="text" id="pr-if" inputmode="decimal" autocomplete="off"></label>
      <label>B, °<input type="text" id="pr-b" inputmode="decimal" autocomplete="off"></label>
      <label><span>I<sub>int</sub></span><input type="text" id="pr-ii" inputmode="decimal" autocomplete="off"></label>
    </div>
    <div class="row"><button class="pri" id="pr-check">Проверить</button><button class="sec" id="pr-show">Показать решение</button></div>
    <div class="fb" id="pr-fb"></div>
    <div class="sol" id="pr-sol"></div>
  </div>`;

  const score = makeScore($('#pr-score'), 'profile');
  let st = null;
  const IDS = ['pr-x', 'pr-ip', 'pr-if', 'pr-b', 'pr-ii'];

  function gen() {
    const ws = 5 * rint(8, 11), c = ws + rnd(2.8, 7.2);
    const Ib = rint(60, 95), H = rint(18, 55);
    const wl = rnd(0.55, 1.3), wr = wl * rnd(1.0, 1.8), eta = 0.5;
    const f = x => { const w = x < c ? wl : wr, u = (x - c) / w; return H * (eta / (1 + 4 * u * u) + (1 - eta) * Math.exp(-4 * Math.LN2 * u * u)); };
    const pts = []; let prev = 0;
    for (let x = ws; x <= ws + 10 + 1e-9; x += 0.05) {
      const n = 0.38 * gauss(); const nn = 0.5 * (n + prev); prev = n;
      pts.push([x, Ib + f(x) + nn]);
    }
    let im = 0; pts.forEach((p, i) => { if (p[1] > pts[im][1]) im = i; });
    const Ip = pts[im][1];
    const base = pts.filter(p => Math.abs(p[0] - c) > 3.5).map(p => p[1]);
    const If = base.reduce((a, b) => a + b, 0) / base.length;
    const half = If + (Ip - If) / 2;
    let i = im; while (i > 0 && pts[i][1] > half) i--;
    const xl = pts[i][0] + (half - pts[i][1]) / (pts[i + 1][1] - pts[i][1]) * (pts[i + 1][0] - pts[i][0]);
    let j = im; while (j < pts.length - 1 && pts[j][1] > half) j++;
    const xr = pts[j - 1][0] + (half - pts[j - 1][1]) / (pts[j][1] - pts[j - 1][1]) * (pts[j][0] - pts[j - 1][0]);
    const B = xr - xl;
    return { ws, pts, Ip, If, half, xl, xr, B, mid: (xl + xr) / 2, xmax: pts[im][0], Iint: (Ip - If) * B / If };
  }

  function plot(t, solved) {
    const ymin = Math.floor((t.If - 6) / 5) * 5, ymax = Math.ceil((t.Ip + 6) / 5) * 5;
    const P = Plot({ x0: t.ws, x1: t.ws + 10, y0: ymin, y1: ymax, xMaj: 2, xMin: 0.5, yMaj: 5, yMin: 1, xf: v => nf(v, 2), yf: v => nf(v, 2), xl: '2θ, °', yl: 'Интенсивность, усл. ед.', L: 74 });
    let s = P.grid + `<path class="curve" style="stroke-width:2" d="${pathOf(t.pts, P)}"/>`;
    if (solved) {
      const lab = (txt, x, y, a = 'start') => `<text class="solt" x="${x}" y="${y}" text-anchor="${a}">${txt}</text>`;
      s += `<line class="ovl" x1="${P.L}" y1="${P.Y(t.Ip)}" x2="${P.W - P.R}" y2="${P.Y(t.Ip)}"/>` + lab(`I пика ≈ ${nf(t.Ip, 1)}`, P.W - P.R - 4, P.Y(t.Ip) - 5, 'end');
      s += `<line class="ovl" x1="${P.L}" y1="${P.Y(t.If)}" x2="${P.W - P.R}" y2="${P.Y(t.If)}"/>` + lab(`I фона ≈ ${nf(t.If, 1)}`, P.W - P.R - 4, P.Y(t.If) - 5, 'end');
      s += `<line class="ovl" style="stroke-dasharray:none;stroke-width:3" x1="${P.X(t.xl)}" y1="${P.Y(t.half)}" x2="${P.X(t.xr)}" y2="${P.Y(t.half)}"/>` + lab(`B ≈ ${nf(t.B, 2)}°`, P.X(t.xr) + 8, P.Y(t.half) + 4);
      s += `<line class="ovl" x1="${P.X(t.mid)}" y1="${P.Y(t.If)}" x2="${P.X(t.mid)}" y2="${P.T}"/>` + lab(`2θ ≈ ${nf(t.mid, 2)}°`, P.X(t.mid) - 8, P.T + 14, 'end');
    }
    s += '<g class="cross"></g>';
    return { svg: `<svg viewBox="0 0 ${P.W} ${P.H}" role="img" aria-label="Профиль линии">${s}</svg>`, P };
  }
  function draw(solved) {
    const r = plot(st, solved); $('#pr-plot').innerHTML = r.svg;
    hoverReadout($('#pr-plot svg'), r.P, $('#pr-read'), v => `2θ = ${nf(v, 2)}°`, v => `I = ${nf(v, 1)}`);
  }
  function steps(t) {
    return `<ol class="steps">
      <li>I<sub>фона</sub> ≈ <b>${nf(t.If, 1)}</b> (ровный участок у краёв). I<sub>пика</sub> ≈ <b>${nf(t.Ip, 1)}</b>.</li>
      <li>Половина высоты над фоном: ${nf(t.If, 1)} + (${nf(t.Ip, 1)} − ${nf(t.If, 1)})/2 = <b>${nf(t.half, 1)}</b>.</li>
      <li>На этом уровне пик пересекается при 2θ ≈ ${nf(t.xl, 2)}° и ${nf(t.xr, 2)}° → B = <b>${nf(t.B, 2)}°</b>.</li>
      <li>Положение линии ≈ <b>${nf(t.mid, 2)}°</b> (вершина — при ${nf(t.xmax, 2)}°; для несимметричного пика центр на половине высоты чуть сдвигается).</li>
      <li>I<sub>int</sub> = (${nf(t.Ip, 1)} − ${nf(t.If, 1)}) · ${nf(t.B, 2)} / ${nf(t.If, 1)} = <b>${nf(t.Iint, 3)}</b>.</li></ol>`;
  }
  function newTask() {
    st = gen(); st.counted = false;
    IDS.forEach(id => { const e = $('#' + id); e.value = ''; mark(e, null); });
    $('#pr-fb').className = 'fb'; $('#pr-sol').className = 'sol'; $('#pr-sol').innerHTML = '';
    draw(false);
  }
  const count = g => { if (!st.counted) { st.counted = true; score.add(g); } };

  $('#pr-check').onclick = () => {
    const v = id => parseVal($('#' + id).value);
    const near = (id, exp, tol) => { const a = v(id); const ok = Number.isFinite(a) && Math.abs(a - exp) <= tol; mark($('#' + id), ok); return ok; };
    const okx = near('pr-x', st.mid, 0.25) || (Number.isFinite(v('pr-x')) && Math.abs(v('pr-x') - st.xmax) <= 0.25);
    mark($('#pr-x'), okx);
    const okp = near('pr-ip', st.Ip, 2), okf = near('pr-if', st.If, 2), okb = near('pr-b', st.B, Math.max(0.2, 0.15 * st.B));
    const iv = v('pr-ii');
    const own = (v('pr-ip') - v('pr-if')) * v('pr-b') / v('pr-if');
    const okTrue = Number.isFinite(iv) && Math.abs(iv - st.Iint) <= 0.25 * st.Iint;
    const okOwn = Number.isFinite(iv) && Number.isFinite(own) && Math.abs(iv - own) <= 0.03 * Math.abs(own) + 0.005;
    const oki = okTrue || okOwn; mark($('#pr-ii'), oki);
    const all = okx && okp && okf && okb && oki;
    const fb = $('#pr-fb'); fb.className = 'fb show ' + (all ? 'ok' : 'no');
    let msg = all ? '✓ Верно (в допуске чтения графика). Разбор ниже.' : '✗ Не совпало (красные поля). Фон — по краям, высота — над осью, B — на <b>половине высоты над фоном</b>, а не от нуля.';
    if (!okTrue && okOwn && okp && okf && okb) msg += ' I<sub>int</sub> посчитан верно по твоим числам.';
    if (okOwn && !okTrue) msg += ' (I<sub>int</sub> сходится с твоими числами, но отличается от эталона — уточни отсчёты.)';
    fb.innerHTML = msg; count(all);
    if (all) { draw(true); $('#pr-sol').innerHTML = steps(st); $('#pr-sol').className = 'sol show'; }
  };
  $('#pr-show').onclick = () => {
    count(false); draw(true);
    [nf(st.mid, 2), nf(st.Ip, 1), nf(st.If, 1), nf(st.B, 2), nf(st.Iint, 3)].forEach((val, i) => { $('#' + IDS[i]).value = val; mark($('#' + IDS[i]), null); });
    $('#pr-sol').innerHTML = steps(st); $('#pr-sol').className = 'sol show';
  };
  $('#pr-new').onclick = newTask;
  newTask();
  window.__profile = { gen };
})();
