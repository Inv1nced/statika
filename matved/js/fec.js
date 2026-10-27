/* Задание 2: диаграмма Fe–C, правило рычага, обратная задача */
(function () {
  const root = $('#m-fec');
  root.innerHTML = `
  <h2>Задание 2. Сталь после медленного охлаждения (Fe–C)</h2>
  <details class="card" open><summary>Алгоритм (одинаковый для всех задач)</summary>
    <ol class="steps">
      <li>Где точка x относительно <b>0,8 % C</b>? Левее — доэвтектоидная: структура <b>Ф + П</b>. Правее — заэвтектоидная: структура <b>П + Ц<sub>II</sub></b> (Ц<sub>II</sub> — вторичный цементит).</li>
      <li>Правило рычага: <span class="f">доля = противоположный отрезок / вся длина</span> Для структур: Ф+П — рычаг (<span class="gA">0,025</span> … 0,8), П+Ц — рычаг (0,8 … 6,67).</li>
      <li>Для <b>фаз</b> (всегда Ф и Ц): рычаг (<span class="gA">0,025</span> … 6,67).</li>
      <li><b>Обратная задача</b> (дана доля → найти %C): %C = Σ(доля × %C компонента): Ф = <span class="gA">0,025</span>, П = 0,8, Ц = 6,67.</li>
    </ol>
    <div class="tip">«Свободный феррит» — феррит, который не входит в перлит (тот, что в структуре Ф + П отдельно). «Вторичный цементит» — цементит, выделившийся из аустенита в заэвтектоидной стали (структура П + Ц<sub>II</sub>).</div>
  </details>
  <div class="card">
    <div class="row">
      <label>Тип задачи:
        <select id="fe-type">
          <option value="rand">случайная</option>
          <option value="v16">Вариант 16: C по 90 % свободного феррита</option>
          <option value="v11">Вариант 11: вторичный цементит при 1,5 % C</option>
          <option value="hypo">структура Ф + П по x</option>
          <option value="hyper">структура П + Ц по x</option>
          <option value="phases">фазы Ф и Ц по x</option>
          <option value="rev_f">C по доле свободного феррита</option>
          <option value="rev_c">C по доле вторичного цементита</option>
          <option value="rev_p">C по доле перлита (Ф+П)</option>
        </select></label>
      <button class="sec" id="fe-new">Новая задача</button>
      <span class="score" id="fe-score"></span>
    </div>
    <div class="q" id="fe-q"></div>
    <div id="fe-fig"></div>
    <div class="ans" id="fe-ans"></div>
    <div class="row"><button class="pri" id="fe-check">Проверить</button><button class="sec" id="fe-show">Показать решение</button><span class="hint" id="fe-hint"></span></div>
    <div class="fb" id="fe-fb"></div>
    <div class="sol" id="fe-sol"></div>
  </div>`;

  const score = makeScore($('#fe-score'), 'fec');
  const dec = v => parseFloat(v.toFixed(3)).toString().replace('.', ',');
  const pc = v => nf(v, 1) + ' %';
  const syncA = () => $$('.gA', root).forEach(e => e.textContent = dec(FE.A));

  function feSvg(x) {
    const A = FE.A, S = FE.S, C = FE.C;
    const px = c => c <= A ? 60 + c / A * 50 : c <= S ? 110 + (c - A) / (S - A) * 170 : 280 + (c - S) / (C - S) * 320;
    const m = x == null ? null : px(x);
    return `<svg viewBox="0 0 660 330" role="img" aria-label="Диаграмма Fe–C">
 <polygon points="60,40 600,40 600,60 280,160 60,60" fill="#ffd8a8" opacity=".55"/>
 <polygon points="60,60 280,160 110,160" fill="#ffe8cc" opacity=".6"/>
 <polygon points="280,160 600,60 600,160" fill="#d0bfff" opacity=".4"/>
 <polygon points="60,60 110,160 110,290 60,290" fill="#b2f2bb" opacity=".6"/>
 <polygon points="110,160 280,160 280,290 110,290" fill="#ffd8a8" opacity=".35"/>
 <polygon points="280,160 600,160 600,290 280,290" fill="#d0bfff" opacity=".3"/>
 <g style="stroke:var(--tx);stroke-width:1.6;fill:none"><line x1="60" y1="290" x2="620" y2="290"/><line x1="60" y1="290" x2="60" y2="30"/>
 <path d="M60 60 L280 160 M280 160 L600 60 M110 160 L600 160 M60 60 L110 160 L110 290 M280 160 L280 290 M600 40 L600 290"/></g>
 <text x="330" y="100" style="font-size:16px">Аустенит (А)</text>
 <text x="118" y="146">А+Ф</text><text x="470" y="140">А+Ц</text><text x="72" y="235">Ф</text>
 <text x="150" y="235">Ф + П</text><text x="420" y="235">П + Ц</text>
 <text x="12" y="165" class="mu">727 °C</text><text x="14" y="38" class="mu">T ↑</text>
 <text x="40" y="308" class="mu">Fe</text><text x="92" y="308" class="mu">${dec(A)}</text><text x="268" y="308" class="mu">0,8</text><text x="570" y="308" class="mu">6,67 % C</text>
 ${m == null ? '' : `<line x1="${m}" y1="38" x2="${m}" y2="290" stroke="var(--ln)" stroke-width="2.5" stroke-dasharray="6 4"/><circle cx="${m}" cy="225" r="5" fill="var(--ln)"/>
 <text x="${Math.min(Math.max(m - 24, 62), 560)}" y="24" style="fill:var(--ln);font-weight:600">x = ${dec(x)} %</text>`}</svg>`;
  }

  const col = { f: 'var(--f)', p: 'var(--p)', c: 'var(--c)' };
  function lever(L, R, x, ln, lc, rn, rc, title) {
    const X = v => 60 + (v - L) / (R - L) * 540, m = X(x);
    const fl = (R - x) / (R - L) * 100, fr = (x - L) / (R - L) * 100;
    return `<svg viewBox="0 0 660 120"><text x="60" y="16" class="mu">${title}</text>
 <rect x="60" y="34" width="${m - 60}" height="26" fill="${col[rc]}" opacity=".85"/><rect x="${m}" y="34" width="${600 - m}" height="26" fill="${col[lc]}" opacity=".85"/>
 <circle cx="${m}" cy="47" r="8" fill="var(--ln)" stroke="var(--card)" stroke-width="2"/><text x="${m - 4}" y="29" style="fill:var(--ln);font-weight:700">x</text>
 <text x="40" y="82">${ln} (${dec(L)})</text><text x="520" y="82">${rn} (${dec(R)})</text>
 <text x="${60 + (m - 60) / 2}" y="104" text-anchor="middle">${rn}: ${nf(fr, 1)} %</text><text x="${m + (600 - m) / 2}" y="104" text-anchor="middle">${ln}: ${nf(fl, 1)} %</text></svg>`;
  }

  const TYPES = ['hypo', 'hyper', 'phases', 'rev_f', 'rev_c', 'rev_p'];
  let st = null;

  function build(type, preset) {
    const A = FE.A, S = FE.S, C = FE.C;
    const p = { type, fields: [], showX: true };
    const mk = (id, label, exp, tol, unit) => p.fields.push({ id, label, exp, tol, unit });
    if (type === 'hypo') {
      const x = pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75].filter(v => v > A + 0.03));
      p.x = x; p.q = `Для стали с <b>${dec(x)} % C</b> после медленного охлаждения опишите структуру и найдите количество структурных составляющих (свободный феррит и перлит).`;
      const f = (S - x) / (S - A) * 100;
      mk('f', 'свободный феррит Ф, %', f, 0.35); mk('p', 'перлит П, %', 100 - f, 0.35);
    } else if (type === 'hyper') {
      const x = preset || pick([0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0]);
      p.x = x; p.q = `Определите количество вторичного цементита в стали с <b>${dec(x)} % углерода</b>.`;
      const c = (x - S) / (C - S) * 100;
      mk('c', 'вторичный цементит Ц, %', c, 0.35);
      if (!preset) { mk('p', 'перлит П, %', 100 - c, 0.35); p.q = `Для стали с <b>${dec(x)} % C</b> определите структуру и количество вторичного цементита и перлита.`; }
    } else if (type === 'phases') {
      const x = pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.4, 1.5, 1.7, 2.0]);
      p.x = x; p.q = `Определите фазовый состав (количество феррита и цементита) стали с <b>${dec(x)} % C</b>.`;
      const f = (C - x) / (C - A) * 100;
      mk('f', 'феррит (фаза) Ф, %', f, 0.35); mk('c', 'цементит (фаза) Ц, %', 100 - f, 0.35);
    } else if (type === 'rev_f') {
      const f = preset || pick([10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95]);
      p.f = f; p.x = S - f / 100 * (S - A); p.showX = false;
      p.q = `Определите содержание углерода в стали с <b>${f} % свободного феррита</b>.`;
      mk('x', 'содержание C, %', p.x, 0.02);
    } else if (type === 'rev_c') {
      const f = pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20]);
      p.f = f; p.x = S + f / 100 * (C - S); p.showX = false;
      p.q = `Определите содержание углерода в стали, в структуре которой <b>${f} % вторичного цементита</b>.`;
      mk('x', 'содержание C, %', p.x, 0.02);
    } else {
      const q = pick([20, 30, 40, 50, 60, 70, 80, 90]);
      p.f = q; p.x = A + q / 100 * (S - A); p.showX = false;
      p.q = `Структура доэвтектоидной стали: феррит + перлит, причём перлита <b>${q} %</b>. Найдите содержание углерода.`;
      mk('x', 'содержание C, %', p.x, 0.02);
    }
    return p;
  }

  function solution(p) {
    const A = FE.A, S = FE.S, C = FE.C, x = p.x, a = dec(A);
    let h = '';
    if (p.type === 'hypo') {
      const f = (S - x) / (S - A) * 100;
      h = `<ol class="steps"><li>${dec(x)} &lt; 0,8 → сталь <b>доэвтектоидная</b>, структура <b>Ф + П</b>.</li>
      <li>Рычаг от ${a} до 0,8. Свободный феррит: Ф = (0,8 − ${dec(x)}) / (0,8 − ${a}) · 100 % = <b>${pc(f)}</b></li>
      <li>Перлит: П = 100 − ${nf(f, 1)} = <b>${pc(100 - f)}</b>.</li>
      <li>Фазы (для справки): Ф = (6,67 − ${dec(x)}) / (6,67 − ${a}) = ${pc((C - x) / (C - A) * 100)}, Ц = ${pc((x - A) / (C - A) * 100)}.</li></ol>`;
    } else if (p.type === 'hyper') {
      const c = (x - S) / (C - S) * 100;
      h = `<ol class="steps"><li>${dec(x)} &gt; 0,8 → <b>заэвтектоидная</b> сталь, структура <b>П + Ц<sub>II</sub></b>.</li>
      <li>Рычаг от 0,8 до 6,67. Вторичный цементит: Ц<sub>II</sub> = (${dec(x)} − 0,8) / (6,67 − 0,8) · 100 % = <b>${pc(c)}</b></li>
      <li>Перлит: П = (6,67 − ${dec(x)}) / (6,67 − 0,8) = <b>${pc(100 - c)}</b>.</li></ol>`;
    } else if (p.type === 'phases') {
      const f = (C - x) / (C - A) * 100;
      h = `<ol class="steps"><li>Фазы в Fe–C ниже 727 °C всегда две: феррит и цементит. Рычаг от ${a} до 6,67.</li>
      <li>Ф = (6,67 − ${dec(x)}) / (6,67 − ${a}) · 100 % = <b>${pc(f)}</b></li>
      <li>Ц = (${dec(x)} − ${a}) / (6,67 − ${a}) · 100 % = <b>${pc(100 - f)}</b>.</li></ol>`;
    } else if (p.type === 'rev_f') {
      h = `<ol class="steps"><li>Свободный феррит есть → структура <b>Ф + П</b>, значит сталь доэвтектоидная.</li>
      <li>Доли: Ф = ${dec(p.f / 100)}, П = ${dec(1 - p.f / 100)}.</li>
      <li>%C = ${a} · Ф + 0,8 · П = ${a} · ${dec(p.f / 100)} + 0,8 · ${dec(1 - p.f / 100)} = <b>${nf(x, 3)} %</b>.</li>
      <li>Проверка: ${nf(x, 3)} лежит между ${a} и 0,8 ✓.</li></ol>`;
    } else if (p.type === 'rev_c') {
      h = `<ol class="steps"><li>Вторичный цементит есть → структура <b>П + Ц<sub>II</sub></b>, сталь заэвтектоидная.</li>
      <li>Доли: Ц = ${dec(p.f / 100)}, П = ${dec(1 - p.f / 100)}.</li>
      <li>%C = 6,67 · Ц + 0,8 · П = 6,67 · ${dec(p.f / 100)} + 0,8 · ${dec(1 - p.f / 100)} = <b>${nf(x, 3)} %</b>.</li>
      <li>Проверка: ${nf(x, 3)} лежит между 0,8 и 6,67 ✓ (и до 2,14 — это сталь).</li></ol>`;
    } else {
      h = `<ol class="steps"><li>Структура Ф + П → доэвтектоидная сталь.</li>
      <li>Доли: П = ${dec(p.f / 100)}, Ф = ${dec(1 - p.f / 100)}.</li>
      <li>%C = ${a} · ${dec(1 - p.f / 100)} + 0,8 · ${dec(p.f / 100)} = <b>${nf(x, 3)} %</b>.</li></ol>`;
    }
    let levers = '';
    if (p.type === 'hypo') levers = lever(A, S, x, 'Ф', 'f', 'П', 'p', 'Структуры: Ф + П');
    else if (p.type === 'hyper') levers = lever(S, C, x, 'П', 'p', 'Ц', 'c', 'Структуры: П + Ц');
    else if (p.type === 'phases') levers = lever(A, C, x, 'Ф', 'f', 'Ц', 'c', 'Фазы: Ф + Ц');
    else if (p.type === 'rev_f' || p.type === 'rev_p') levers = lever(A, S, x, 'Ф', 'f', 'П', 'p', 'Структуры: Ф + П');
    else levers = lever(S, C, x, 'П', 'p', 'Ц', 'c', 'Структуры: П + Ц');
    return `<div class="two"><div>${feSvg(x)}${levers}</div><div>${h}</div></div>`;
  }

  function newTask() {
    let t = $('#fe-type').value, preset = null;
    if (t === 'rand') t = pick(TYPES);
    if (t === 'v16') { t = 'rev_f'; preset = 90; }
    else if (t === 'v11') { t = 'hyper'; preset = 1.5; }
    st = build(t, preset); st.counted = false;
    $('#fe-q').innerHTML = st.q;
    $('#fe-fig').innerHTML = `<div style="max-width:560px">${feSvg(st.showX ? st.x : null)}</div>`;
    $('#fe-ans').innerHTML = st.fields.map(f => `<label>${f.label}<input type="text" id="fe-in-${f.id}" autocomplete="off" inputmode="decimal"></label>`).join('');
    $('#fe-hint').textContent = st.fields[0].tol < 0.1 ? 'ответ с точностью до 0,02 %' : 'ответ в %, с точностью до 0,3';
    $('#fe-fb').className = 'fb'; $('#fe-sol').className = 'sol'; $('#fe-sol').innerHTML = '';
    syncA();
  }
  function count(good) { if (!st.counted) { st.counted = true; score.add(good); } }

  $('#fe-check').onclick = () => {
    let all = true;
    st.fields.forEach(f => {
      const el = $('#fe-in-' + f.id), v = parseVal(el.value);
      const ok = Number.isFinite(v) && Math.abs(v - f.exp) <= f.tol; mark(el, ok); if (!ok) all = false;
    });
    const fb = $('#fe-fb');
    fb.className = 'fb show ' + (all ? 'ok' : 'no');
    fb.innerHTML = all ? '✓ Верно! Сверь ход решения ниже.' : '✗ Не совпало (красные поля). Проверь: с какой стороны от 0,8 твоя точка, и какой отрезок «противоположный». Или нажми «Показать решение».';
    count(all);
    if (all) { $('#fe-sol').innerHTML = solution(st); $('#fe-sol').className = 'sol show'; }
  };
  $('#fe-show').onclick = () => {
    count(false);
    st.fields.forEach(f => { const el = $('#fe-in-' + f.id); el.value = nf(f.exp, f.tol < 0.1 ? 3 : 1); mark(el, null); });
    $('#fe-sol').innerHTML = solution(st); $('#fe-sol').className = 'sol show';
  };
  $('#fe-new').onclick = newTask;
  $('#fe-type').onchange = newTask;
  document.addEventListener('fe-change', newTask);
  newTask();
})();
