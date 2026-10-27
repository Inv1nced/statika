/* Задание 3: соотношение фаз по дифрактограмме */
(function () {
  const root = $('#m-phases');
  root.innerHTML = `
  <h2>Задание 3 · Соотношение фаз A/B</h2>
  <details class="card" open><summary>Как решать</summary>
    <ol class="steps">
      <li>Для <b>каждой</b> линии считаем интегральную интенсивность: <span class="f">I<sub>int</sub> = (I<sub>пика</sub> − I<sub>фона</sub>) / I<sub>фона</sub> · B</span> (B — ширина, в таблице «ширина, 2θ°»).</li>
      <li>Линии разделяем по фазам (по подписи: 110<b>β</b> — фаза β, 020<b>α″</b> — фаза α″).</li>
      <li>Складываем отдельно: ΣI<sub>int</sub><sup>A</sup> и ΣI<sub>int</sub><sup>B</sup>.</li>
      <li><span class="f">A / B = ΣI<sub>int</sub><sup>A</sup> / ΣI<sub>int</sub><sup>B</sup></span> Отношение, а не доля. Доля фазы A = A/(A+B).</li>
    </ol>
    <div class="tip">Частая ошибка — арифметика при сложении (в твоей тетради была 32,325 вместо 32,925). Пиши сумму столбиком.</div>
  </details>
  <div class="card">
    <div class="row">
      <label>Тип: <select id="ph-type"><option value="rand">случайный набор</option><option value="lect">пример со слайда</option></select></label>
      <button class="sec" id="ph-new">Новая задача</button><span class="score" id="ph-score"></span>
    </div>
    <div class="q" id="ph-q"></div>
    <div id="ph-table"></div>
    <div class="ans">
      <label><span>ΣI<sub>int</sub> фазы A (<span id="ph-na"></span>)</span><input type="text" id="ph-sa" inputmode="decimal" autocomplete="off"></label>
      <label><span>ΣI<sub>int</sub> фазы B (<span id="ph-nb"></span>)</span><input type="text" id="ph-sb" inputmode="decimal" autocomplete="off"></label>
      <label>A / B<input type="text" id="ph-r" inputmode="decimal" autocomplete="off"></label>
    </div>
    <div class="row"><button class="pri" id="ph-check">Проверить</button><button class="sec" id="ph-show">Показать решение</button><span class="hint">суммы — необязательно; считается ответ A/B (допуск ±3 %)</span></div>
    <div class="fb" id="ph-fb"></div>
    <div class="sol" id="ph-sol"></div>
  </div>`;

  const score = makeScore($('#ph-score'), 'phases');
  let st = null;
  const A_POOLS = [
    { n: 'α″', l: ['110', '020', '021', '111', '112', '022', '200', '130', '131', '202', '220'] },
    { n: 'α', l: ['100', '002', '101', '102', '110', '103'] },
    { n: 'ω', l: ['100', '002', '110', '101', '102'] }
  ];
  const B_LINES = ['110', '200', '211', '220'];

  function gen(kind) {
    if (kind === 'lect') {
      const rows = [['110', 'α″', 1300, 1.1], ['020', 'α″', 2900, 1.2], ['110', 'β', 15400, 0.8], ['111', 'α″', 4200, 1.6], ['021', 'α″', 1200, 1.5], ['200', 'β', 4200, 1.4], ['130', 'α″', 800, 2.0], ['131', 'α″', 900, 2.2], ['211', 'β', 6500, 1.8]];
      return { A: 'α″', B: 'β', bg: 400, rows: rows.map(r => ({ hkl: r[0], ph: r[1], h: r[2], w: r[3] })) };
    }
    const bg = pick([300, 350, 400, 450, 500]);
    const pool = pick(A_POOLS);
    const nA = rint(3, 6), nB = rint(2, 3);
    const aL = shuffle(pool.l).slice(0, nA), bL = B_LINES.slice(0, nB);
    const hb = rint(60, 160) * 100;
    const rows = [];
    bL.forEach((l, i) => rows.push({ hkl: l, ph: 'β', h: Math.round(hb * [1, rnd(0.25, 0.4), rnd(0.35, 0.55)][i] / 100) * 100, w: Math.round(rnd(0.6, 1.9) * 10) / 10 }));
    aL.forEach(l => rows.push({ hkl: l, ph: pool.n, h: Math.round(rnd(bg * 1.8, 5000) / 100) * 100, w: Math.round(rnd(0.9, 2.4) * 10) / 10 }));
    return { A: pool.n, B: 'β', bg, rows: shuffle(rows) };
  }
  const iint = (r, bg) => (r.h - bg) / bg * r.w;
  function calc(t) {
    let sa = 0, sb = 0;
    t.rows.forEach(r => { const v = iint(r, t.bg); if (r.ph === t.A) sa += v; else sb += v; });
    return { sa, sb, ratio: sa / sb };
  }
  function table(t, solved) {
    let h = `<div style="overflow-x:auto"><table><tr><th>Линия</th>${t.rows.map(r => `<th>${r.hkl}${r.ph}</th>`).join('')}</tr>
      <tr><th>Высота пика</th>${t.rows.map(r => `<td>${r.h}</td>`).join('')}</tr>
      <tr><th>Ширина, 2θ°</th>${t.rows.map(r => `<td>${nf(r.w, 1)}</td>`).join('')}</tr>`;
    if (solved) h += `<tr><th>I<sub>int</sub></th>${t.rows.map(r => `<td><b>${nf(iint(r, t.bg), 2)}</b></td>`).join('')}</tr>
      <tr><th>фаза</th>${t.rows.map(r => `<td style="color:${r.ph === t.A ? 'var(--p)' : 'var(--c)'};font-weight:600">${r.ph === t.A ? 'A' : 'B'}</td>`).join('')}</tr>`;
    return h + '</table></div>';
  }
  function steps(t) {
    const c = calc(t);
    const aR = t.rows.filter(r => r.ph === t.A), bR = t.rows.filter(r => r.ph !== t.A);
    const fm = r => `(${r.h} − ${t.bg})/${t.bg} · ${nf(r.w, 1)} = ${nf(iint(r, t.bg), 3)}`;
    return `<ol class="steps"><li>Фон = ${t.bg}. I<sub>int</sub> каждой линии:<br>${t.rows.map(r => `${r.hkl}${r.ph}: ${fm(r)}`).join('<br>')}</li>
      <li>Фаза A (${t.A}): ${aR.map(r => nf(iint(r, t.bg), 3)).join(' + ')} = <b>${nf(c.sa, 3)}</b></li>
      <li>Фаза B (${t.B}): ${bR.map(r => nf(iint(r, t.bg), 3)).join(' + ')} = <b>${nf(c.sb, 3)}</b></li>
      <li>A/B = ${nf(c.sa, 3)} / ${nf(c.sb, 3)} = <b>${nf(c.ratio, 2)}</b>. Доля фазы ${t.A} ≈ ${nf(c.sa / (c.sa + c.sb) * 100, 1)} %, фазы ${t.B} ≈ ${nf(c.sb / (c.sa + c.sb) * 100, 1)} %.</li></ol>`;
  }
  function newTask() {
    st = gen($('#ph-type').value === 'lect' ? 'lect' : 'rand'); st.counted = false;
    $('#ph-q').innerHTML = `Определите соотношение <b>${st.A}</b>- и <b>${st.B}</b>-фаз (A = ${st.A}, B = ${st.B}), если они представлены следующими пиками. Интенсивность фона: <b>${st.bg}</b>.`;
    $('#ph-table').innerHTML = table(st, false);
    $('#ph-na').textContent = st.A; $('#ph-nb').textContent = st.B;
    ['ph-sa', 'ph-sb', 'ph-r'].forEach(id => { const e = $('#' + id); e.value = ''; mark(e, null); });
    $('#ph-fb').className = 'fb'; $('#ph-sol').className = 'sol'; $('#ph-sol').innerHTML = '';
  }
  const count = g => { if (!st.counted) { st.counted = true; score.add(g); } };
  $('#ph-check').onclick = () => {
    const c = calc(st);
    const chk = (id, exp, tol, req) => { const e = $('#' + id), raw = e.value.trim(); if (!raw && !req) { mark(e, null); return true; } const v = parseVal(raw); const ok = Number.isFinite(v) && Math.abs(v - exp) <= tol; mark(e, ok); return ok; };
    const okR = chk('ph-r', c.ratio, Math.max(0.012, 0.03 * c.ratio), true);
    const okA = chk('ph-sa', c.sa, Math.max(0.08, 0.02 * c.sa), false), okB = chk('ph-sb', c.sb, Math.max(0.08, 0.02 * c.sb), false);
    const all = okR && okA && okB;
    const fb = $('#ph-fb'); fb.className = 'fb show ' + (all ? 'ok' : 'no');
    fb.innerHTML = all ? '✓ Верно! Разбор — ниже.' : '✗ Не совпало. Проверь I<sub>int</sub> каждой линии (высота − фон, делим на фон, умножаем на ширину) и особенно сложение сумм. A/B — это сумма A делить на сумму B.';
    count(all);
    if (all) { $('#ph-table').innerHTML = table(st, true); $('#ph-sol').innerHTML = steps(st); $('#ph-sol').className = 'sol show'; }
  };
  $('#ph-show').onclick = () => {
    count(false); const c = calc(st);
    $('#ph-sa').value = nf(c.sa, 3); $('#ph-sb').value = nf(c.sb, 3); $('#ph-r').value = nf(c.ratio, 2);
    ['ph-sa', 'ph-sb', 'ph-r'].forEach(id => mark($('#' + id), null));
    $('#ph-table').innerHTML = table(st, true); $('#ph-sol').innerHTML = steps(st); $('#ph-sol').className = 'sol show';
  };
  $('#ph-new').onclick = newTask; $('#ph-type').onchange = newTask;
  newTask();
  window.__phases = { gen, calc };
})();
