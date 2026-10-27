/* Задание 1: направление и плоскость по индексам Миллера */
(function () {
  const root = $('#m-miller');
  root.innerHTML = `
  <h2>Задание 1. Направление и плоскость в кубической решётке</h2>
  <details class="card" open><summary>Алгоритм (как в тетради)</summary>
    <ol class="steps">
      <li>Плоскость (h k l): берём <b>обратные величины</b> 1/h, 1/k, 1/l. Это отрезки, которые плоскость отсекает на осях x, y, z (в долях параметра решётки a).</li>
      <li>Если индекс <b>0</b> → отрезок ∞: плоскость <b>параллельна</b> этой оси. Если индекс <b>с чертой</b> (минус) → откладываем на отрицательной полуоси.</li>
      <li>Отмечаем точки на осях и соединяем их — получилась плоскость.</li>
      <li>Направление [u v w]: <b>без обратных</b>. Точка (u; v; w), вектор идёт из начала координат в эту точку (удобно: u по x, потом v по y, потом w по z).</li>
    </ol>
    <div class="tip">Проверка: в кубической решётке направление [h k l] перпендикулярно плоскости (h k l) с теми же числами.</div>
  </details>
  <div class="card" id="mi-card">
    <div class="row"><label>Режим:
      <select id="mi-mode"><option value="idx">по индексам → построить</option><option value="pic">по рисунку → найти индексы</option></select></label>
      <button class="sec" id="mi-new">Новая задача</button>
      <span class="score" id="mi-score"></span>
    </div>
    <div class="q" id="mi-q"></div>
    <div class="ans" id="mi-ans"></div>
    <div class="row"><button class="pri" id="mi-check">Проверить</button><button class="sec" id="mi-show">Показать решение</button>
      <span class="hint" id="mi-hint"></span></div>
    <div class="fb" id="mi-fb"></div>
    <div class="sol" id="mi-sol"></div>
  </div>`;

  const score = makeScore($('#mi-score'), 'miller');
  let st = null;

  function gen() {
    for (;;) {
      const v = [rint(-3, 3), rint(-3, 3), rint(-3, 3)];
      const z = v.filter(x => x === 0).length;
      if (z === 3) continue;
      if (z === 2 && Math.random() > 0.08) continue;
      if (z === 1 && Math.random() > 0.3) continue;
      if (gcd(gcd(v[0], v[1]), v[2]) !== 1) continue;
      const neg = v.some(x => x < 0);
      if (!neg && Math.random() > 0.35) continue;
      return v;
    }
  }

  const fracLab = n => n === 0 ? '∞' : (Math.abs(n) === 1 ? (n < 0 ? '−1' : '1') : (n < 0 ? '−' : '') + '1/' + Math.abs(n));
  const sgn = v => (v < 0 ? '−' : '') + Math.abs(v);

  /* рисунок: косоугольная проекция, x вниз-влево как в тетради */
  function figure(h, k, l, o) {
    const W = 560, H = 430, m = 40;
    const ic = [h ? 1 / h : null, k ? 1 / k : null, l ? 1 / l : null];
    let ext = 1.25;
    ic.forEach(v => { if (v !== null) ext = Math.max(ext, Math.abs(v) + 0.4); });
    if (o.dir) [h, k, l].forEach(v => { ext = Math.max(ext, Math.abs(v) + 0.45); });
    const proj = (x, y, z) => [y - 0.5 * x, -(z - 0.36 * x)];
    const e = Math.min(0.8, ext - 0.3);
    /* многоугольник плоскости */
    let poly = [];
    if (o.plane) {
      const nulls = ic.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
      const fin = ic.map((v, i) => v === null ? null : i).filter(i => i !== null);
      const pt = (i, t) => { const p = [0, 0, 0]; p[i] = t; return p; };
      if (nulls.length === 0) poly = fin.map(i => pt(i, ic[i]));
      else if (nulls.length === 1) {
        const ax = nulls[0], p1 = pt(fin[0], ic[fin[0]]), p2 = pt(fin[1], ic[fin[1]]);
        const sh = (p, d) => { const q = p.slice(); q[ax] = d; return q; };
        poly = [sh(p1, -e), sh(p2, -e), sh(p2, e), sh(p1, e)];
      } else {
        const ax = fin[0], t = ic[ax], o1 = (ax + 1) % 3, o2 = (ax + 2) % 3;
        const mk = (a, b) => { const q = [0, 0, 0]; q[ax] = t; q[o1] = a; q[o2] = b; return q; };
        poly = [mk(-e, -e), mk(e, -e), mk(e, e), mk(-e, e)];
      }
    }
    const keys = [[ext, 0, 0], [-ext, 0, 0], [0, ext, 0], [0, -ext, 0], [0, 0, ext], [0, 0, -ext]];
    if (o.dir) keys.push([h, k, l]);
    poly.forEach(p => keys.push(p));
    const pr = keys.map(p => proj(...p));
    const minX = Math.min(...pr.map(p => p[0])), maxX = Math.max(...pr.map(p => p[0]));
    const minY = Math.min(...pr.map(p => p[1])), maxY = Math.max(...pr.map(p => p[1]));
    const s = Math.min((W - 2 * m) / (maxX - minX), (H - 2 * m) / (maxY - minY));
    const ox = (W - s * (maxX + minX)) / 2, oy = (H - s * (maxY + minY)) / 2;
    const T = (x, y, z) => { const p = proj(x, y, z); return [ox + s * p[0], oy + s * p[1]]; };
    const pp = a => T(...a).map(v => v.toFixed(1)).join(',');

    let g = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--tx)"/></marker>
      <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--ln)"/></marker></defs>`;
    /* оси */
    const names = ['x', 'y', 'z'];
    for (let i = 0; i < 3; i++) {
      const a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0]; a[i] = ext; b[i] = -ext; c[i] = ext + 0.08;
      g += `<line class="axn" x1="${T(...[0, 0, 0])[0]}" y1="${T(...[0, 0, 0])[1]}" x2="${T(...b)[0]}" y2="${T(...b)[1]}"/>`;
      g += `<line class="ax" x1="${T(0, 0, 0)[0]}" y1="${T(0, 0, 0)[1]}" x2="${T(...a)[0]}" y2="${T(...a)[1]}" marker-end="url(#ah)"/>`;
      const lp = T(...c);
      g += `<text x="${lp[0] + (i === 0 ? -14 : 8)}" y="${lp[1] + (i === 2 ? -4 : 14)}" style="font-weight:700;font-size:15px">${names[i]}</text>`;
      /* деления по целым */
      for (let t = -Math.floor(ext); t <= Math.floor(ext); t++) {
        if (t === 0) continue;
        const q = [0, 0, 0]; q[i] = t;
        const hit = ic[i] !== null && Math.abs(ic[i] - t) < 1e-9 && o.plane;
        const tp = T(...q);
        g += `<circle cx="${tp[0]}" cy="${tp[1]}" r="2.2" fill="var(--mu)"/>`;
        if (!hit) {
          const dx = i === 0 ? -12 : 0, dy = i === 0 ? 12 : (i === 1 ? 16 : 4), ax = i === 2 ? -9 : 0;
          g += `<text class="mu" x="${tp[0] + dx + ax}" y="${tp[1] + dy}" text-anchor="middle">${t < 0 ? '−' : ''}${Math.abs(t)}</text>`;
        }
      }
    }
    /* плоскость */
    if (o.plane) {
      g += `<polygon class="pl" points="${poly.map(pp).join(' ')}"/>`;
      ic.forEach((v, i) => {
        if (v === null) return;
        const q = [0, 0, 0]; q[i] = v; const tp = T(...q);
        const n = [h, k, l][i];
        const dx = i === 0 ? -16 : (i === 1 ? 4 : -22), dy = i === 0 ? 18 : (i === 1 ? 20 : 5);
        g += `<circle cx="${tp[0]}" cy="${tp[1]}" r="5" fill="var(--ac)"/><text x="${tp[0] + dx}" y="${tp[1] + dy}" style="fill:var(--ac);font-weight:700">${fracLab(n)}</text>`;
      });
    }
    /* направление */
    if (o.dir) {
      const o0 = T(0, 0, 0), p1 = T(h, 0, 0), p2 = T(h, k, 0), p3 = T(h, k, l);
      g += `<polyline class="guide" points="${o0.join(',')} ${p1.join(',')} ${p2.join(',')} ${p3.join(',')}"/>`;
      g += `<line class="dir" x1="${o0[0]}" y1="${o0[1]}" x2="${p3[0]}" y2="${p3[1]}" marker-end="url(#ar)"/>`;
      g += `<circle cx="${p3[0]}" cy="${p3[1]}" r="4.5" fill="var(--ln)"/>`;
      g += `<text x="${p3[0] + 8}" y="${p3[1] - 8}" class="solt">[${sgn(h)} ${sgn(k)} ${sgn(l)}]</text>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Рисунок плоскости и направления">${g}</svg>`;
  }

  function stepsIdx(h, k, l) {
    const inv = (n, a) => n === 0 ? `1/0 → <b>∞</b> (плоскость ∥ оси ${a})` : `1/${sgn(n)} = <b>${fracLab(n).replace('−', '−')}</b>`;
    return `<ol class="steps">
      <li>Индексы ${idxHtml(h, k, l)}: h = ${sgn(h)}, k = ${sgn(k)}, l = ${sgn(l)}.</li>
      <li>Обратные величины — отрезки на осях:<br>x: ${inv(h, 'x')}<br>y: ${inv(k, 'y')}<br>z: ${inv(l, 'z')}</li>
      <li>Отмечаем точки на осях${[h, k, l].some(v => v < 0) ? ' (отрицательные — на отрицательной полуоси)' : ''} и соединяем: ${[h, k, l].filter(v => v === 0).length === 0 ? 'получился треугольник' : 'так как есть ноль, плоскость тянется вдоль соответствующей оси (рисуем полосу)'}.</li>
      <li>Направление ${idxHtml(h, k, l, '[]')}: берём числа <b>без</b> обратных → точка (${sgn(h)}; ${sgn(k)}; ${sgn(l)}). Идём ${sgn(h)} по x, ${sgn(k)} по y, ${sgn(l)} по z (пунктир) и проводим вектор из начала координат.</li>
    </ol>`;
  }

  function stepsPic(h, k, l) {
    return `<ol class="steps">
      <li>Читаем отрезки с рисунка: x: ${fracLab(h)}, y: ${fracLab(k)}, z: ${fracLab(l)}${[h, k, l].includes(0) ? ' (где плоскость не пересекает ось — ∞)' : ''}.</li>
      <li>Берём обратные величины: ${[h, k, l].map(n => n === 0 ? '1/∞ = 0' : `1/(${fracLab(n)}) = <b>${sgn(n)}</b>`).join(', ')}.</li>
      <li>Индексы — целые числа без общего делителя. Ответ: ${idxHtml(h, k, l)}.</li>
    </ol>`;
  }

  function newTask() {
    const mode = $('#mi-mode').value;
    const [h, k, l] = gen();
    st = { mode, h, k, l, done: false, counted: false };
    $('#mi-fb').className = 'fb'; $('#mi-sol').className = 'sol'; $('#mi-sol').innerHTML = '';
    $('#mi-check').disabled = false;
    if (mode === 'idx') {
      $('#mi-q').innerHTML = `Постройте направление и плоскость <b>${idxHtml(h, k, l, '')}</b> в кубической решётке. Сначала найди отрезки на осях:`;
      $('#mi-ans').innerHTML = ['x', 'y', 'z'].map(a => `<label>отрезок на ${a}<input type="text" id="mi-${a}" autocomplete="off" placeholder="напр. 1/3"></label>`).join('') +
        `<label>&nbsp;<button class="sec" id="mi-inf" type="button">вставить ∞</button></label>`;
      $('#mi-hint').textContent = 'дроби пиши как 1/3 или −1/2; бесконечность — ∞ или inf';
      let last = $('#mi-x');
      ['x', 'y', 'z'].forEach(a => $('#mi-' + a).addEventListener('focus', e => { last = e.target; }));
      $('#mi-inf').onclick = () => { last.value = '∞'; last.focus(); };
    } else {
      $('#mi-q').innerHTML = 'По рисунку определите индексы Миллера плоскости (три целых числа, минус — знак «−»):';
      $('#mi-ans').innerHTML = ['h', 'k', 'l'].map(a => `<label>${a}<input type="text" id="mi-${a}" autocomplete="off" style="width:70px"></label>`).join('');
      $('#mi-hint').textContent = 'подписи на осях — отрезки; индексы — обратные величины';
      $('#mi-sol').innerHTML = `<div style="max-width:560px;margin:auto">${figure(h, k, l, { plane: true, dir: false })}</div><div class="hint">Рисунок плоскости (на осях подписаны отрезки). Разбор появится после проверки.</div>`;
      $('#mi-sol').className = 'sol show';
    }
  }

  function reveal(good) {
    const { h, k, l, mode } = st;
    $('#mi-sol').className = 'sol show';
    const figs = mode === 'idx'
      ? `<div class="two2"><div><div class="figcap">Плоскость ${idxHtml(h, k, l)}</div>${figure(h, k, l, { plane: true, dir: false })}</div>
         <div><div class="figcap">Направление ${idxHtml(h, k, l, '[]')}</div>${figure(h, k, l, { plane: false, dir: true })}</div></div>`
      : `<div style="max-width:560px;margin:auto">${figure(h, k, l, { plane: true, dir: false })}</div>`;
    $('#mi-sol').innerHTML = figs + `<div style="margin-top:10px">${mode === 'idx' ? stepsIdx(h, k, l) : stepsPic(h, k, l)}</div>
      ${mode === 'idx' ? '<div class="hint">Синяя плоскость отсекает на осях подписанные отрезки. Красная стрелка — вектор из начала координат; пунктир показывает путь по x, y, z.</div>' : ''}`;
  }

  function count(good) { if (!st.counted) { st.counted = true; score.add(good); } }

  $('#mi-check').onclick = () => {
    if (!st) return;
    const { h, k, l, mode } = st;
    let allOk = true;
    if (mode === 'idx') {
      [['x', h], ['y', k], ['z', l]].forEach(([a, n]) => {
        const el = $('#mi-' + a), v = parseVal(el.value), exp = n === 0 ? Infinity : 1 / n;
        const ok = close(v, exp, 1e-6); mark(el, ok); if (!ok) allOk = false;
      });
    } else {
      [['h', h], ['k', k], ['l', l]].forEach(([a, n]) => {
        const el = $('#mi-' + a), v = parseVal(el.value); const ok = v === n || (n === 0 && v === 0); mark(el, ok); if (!ok) allOk = false;
      });
    }
    const fb = $('#mi-fb');
    fb.className = 'fb show ' + (allOk ? 'ok' : 'no');
    fb.innerHTML = allOk ? '✓ Верно! Ниже рисунок и разбор — сверь со своим.' : '✗ Есть ошибка (красные поля). Подумай ещё раз или нажми «Показать решение». Подсказка: отрезок = 1/индекс, ноль даёт ∞.';
    if (allOk) { count(true); reveal(true); }
    else count(false);
  };
  $('#mi-show').onclick = () => {
    if (!st) return;
    count(false); reveal(false);
    if (st.mode === 'idx') {
      [['x', st.h], ['y', st.k], ['z', st.l]].forEach(([a, n]) => { $('#mi-' + a).value = n === 0 ? '∞' : fracLab(n); mark($('#mi-' + a), null); });
    } else {
      [['h', st.h], ['k', st.k], ['l', st.l]].forEach(([a, n]) => { $('#mi-' + a).value = n; mark($('#mi-' + a), null); });
    }
  };
  $('#mi-new').onclick = newTask;
  $('#mi-mode').onchange = newTask;
  newTask();
  window.__miller = { figure, gen };
})();
