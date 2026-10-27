/* Задание 3: определить по фото ПЭМ / электронограмме, какая структура */
(function () {
  const root = $('#m-tem');

  const CLS = [
    { id: 'one', name: 'Одно зерно', why: 'На электронограмме — правильная сетка острых точечных рефлексов, колец нет. Это один кристалл (одна ориентация). При высоком разрешении видны ряды атомных плоскостей.' },
    { id: 'sub', name: 'Субзёренная (полигонизованная) структура', why: 'Электронограмма — «кольца», собранные из отдельных точек и коротких дуг: ориентировки соседних субзёрен близки, но не одинаковы, поэтому рефлексы размазаны в дуги. Сплошных колец нет. На тёмном поле светятся отдельные участки-кластеры.' },
    { id: 'nano', name: 'Много зёрен (нанозёренная)', why: 'Электронограмма — сплошные ровные тонкие кольца: зёрен много, ориентации случайные. На тёмном поле — множество мелких светящихся зёрен по всему полю (масштаб порядка 200 нм).' },
    { id: 'mixed', name: 'Смешанная (зёрна + субзёрна)', why: 'Кольца сплошные, но с неравномерной яркостью: утолщения и яркие дуги/точки на кольцах. Значит, есть и мелкие зёрна (дают кольцо), и субзёрна/более крупные зёрна (дают яркие пятна и дуги). Правило преподавателя: кольцо с утолщениями — смешанная структура.' },
    { id: 'multi', name: 'Несколько рефлексов', why: 'Вместо колец — несколько отдельных рефлексов (разные ориентации или двойники). На тёмном поле в одном выбранном рефлексе светятся только пластины/рейки с этой ориентацией.' },
    { id: 'disl', name: 'Дислокации', why: 'На светлом поле — тонкие тёмные извилистые линии и сетки (линии дислокаций). При очень большом разрешении видны оборванные атомные плоскости.' },
    { id: 'phase', name: 'Фазовый анализ', why: 'На одной электронограмме есть рефлексы разных фаз (α, β, ω). Тёмное поле, снятое в рефлексе нужной фазы, подсвечивает только участки этой фазы — так находят, где какая фаза.' },
    { id: 'pre', name: 'Предпереходные явления', why: 'Между основными рефлексами — диффузные тяжи и слабые дополнительные пятна, на изображении — тонкая полосчатая (модулированная) структура. Это «зародыши» будущей фазы перед превращением.' }
  ];
  const IMGS = {
    one: [['one-saed.jpg', 'one-hr.jpg']], sub: [['sub.jpg']], nano: [['nano.jpg']], mixed: [['mixed.jpg']], multi: [['multi.jpg']],
    disl: [['disl-a.jpg'], ['disl-b.jpg'], ['disl-c.jpg']], phase: [['phase.jpg']], pre: [['pre.jpg']]
  };

  /* схемы с доски: шестиугольник рефлексов */
  function schem(kind) {
    const c = 60, r = 40; let g = '';
    const ang = k => (k * 60 + 15) * Math.PI / 180;
    const P = (k, rr = r) => [c + rr * Math.cos(ang(k)), c - rr * Math.sin(ang(k))];
    const lines = [0, 1, 2].map(k => { const a = P(k), b = P(k + 3); return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--mu)" stroke-width=".8"/>`; }).join('');
    g += lines + `<circle cx="${c}" cy="${c}" r="2.5" fill="var(--tx)"/>`;
    const dots = () => [0, 1, 2, 3, 4, 5].map(k => { const p = P(k); return `<circle cx="${p[0]}" cy="${p[1]}" r="3.2" fill="var(--ln)"/>`; }).join('');
    const arcs = (w, len) => [0, 1, 2, 3, 4, 5].map(k => { const a = ang(k), a0 = a - len, a1 = a + len; const x0 = c + r * Math.cos(a0), y0 = c - r * Math.sin(a0), x1 = c + r * Math.cos(a1), y1 = c - r * Math.sin(a1); return `<path d="M${x0} ${y0} A${r} ${r} 0 0 0 ${x1} ${y1}" fill="none" stroke="var(--ln)" stroke-width="${w}" stroke-linecap="round"/>`; }).join('');
    if (kind === 'one') g += dots();
    if (kind === 'sub') g += arcs(3.5, 0.2);
    if (kind === 'nano') g += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--ln)" stroke-width="2"/>`;
    if (kind === 'mixed') g += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--ln)" stroke-width="1.6"/>` + arcs(5, 0.22);
    return `<svg viewBox="0 0 120 120" style="max-width:120px;margin:auto">${g}</svg>`;
  }

  root.innerHTML = `
  <h2>Задание 3 · Определи структуру по фото</h2>
  <details class="card" open><summary>Шпаргалка: как отличить (с доски и слайдов)</summary>
    <div class="schem">
      <div>${schem('one')}<b>Одно зерно</b><br>правильная сетка острых точек</div>
      <div>${schem('sub')}<b>Субзёренная</b><br>разорванное кольцо: точки / дуги</div>
      <div>${schem('nano')}<b>Много зёрен</b><br>сплошное тонкое кольцо</div>
      <div>${schem('mixed')}<b>Смешанная</b><br>сплошное кольцо + утолщения</div>
    </div>
    <ol class="steps" style="margin-top:12px">
      <li>Смотри на <b>электронограмму</b> (справа, тёмная, с центральным пятном). Есть кольца?</li>
      <li>Колец нет, только пятна: сетка из многих острых точек — <b>одно зерно</b>; несколько отдельных рефлексов, на тёмном поле светятся пластины — <b>несколько рефлексов</b>; диффузные тяжи между пятнами — <b>предпереходные явления</b>; рефлексы разных фаз (α, β, ω) — <b>фазовый анализ</b>.</li>
      <li>Кольца есть: сплошные ровные — <b>много зёрен</b>; из отдельных точек/дуг — <b>субзёренная</b>; сплошные, но с яркими утолщениями — <b>смешанная</b>.</li>
      <li>Нет электронограммы, только тонкие тёмные линии на светлом — <b>дислокации</b>.</li>
    </ol>
    <div class="tip">Светлое поле — тёмные детали на светлом фоне. Тёмное поле — светятся только те зёрна (участки), что дают выбранный рефлекс: чем мельче и многочисленнее зёрна, тем больше мелких светящихся точек по всему полю.</div>
  </details>
  <div class="card">
    <div class="row">
      <label>Источник: <select id="tm-src"><option value="lect">фото с лекций</option><option value="gen">электронограммы (случайные, генератор)</option></select></label>
      <span class="score" id="tm-score"></span>
    </div>
    <div class="q" id="tm-q">Определите по фото, какая структура перед нами.</div>
    <div class="imgs" id="tm-img"></div>
    <div class="opts" id="tm-opts"></div>
    <div class="fb" id="tm-fb"></div>
    <div class="row"><button class="pri" id="tm-next" hidden>Следующее →</button></div>
  </div>`;

  const score = makeScore($('#tm-score'), 'tem');
  let st = null, lastId = null;

  /* ---- генератор электронограмм ---- */
  function saed(canvas, cls) {
    const N = 440, c = N / 2; canvas.width = canvas.height = N;
    const g = canvas.getContext('2d');
    g.fillStyle = '#050608'; g.fillRect(0, 0, N, N);
    g.globalCompositeOperation = 'lighter';
    const soft = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
    const arc = (r, a0, a1, w, a) => { [[3, 0.16], [1.8, 0.34], [1, 0.75]].forEach(([k, al]) => { g.beginPath(); g.arc(c, c, r, a0, a1); g.lineWidth = w * k; g.strokeStyle = `rgba(255,255,255,${Math.min(1, a * al)})`; g.lineCap = 'round'; g.stroke(); }); };
    soft(c, c, 90, 0.2); soft(c, c, 38, 0.45); soft(c, c, 15, 1);
    const R0 = rnd(48, 66);
    const ratio = pick([[1, 1.414, 1.732, 2, 2.236, 2.449], [1, 1.155, 1.633, 1.915, 2, 2.309]]);
    const radii = ratio.map(m => R0 * m).filter(r => r < 205);
    const amp = [1, 0.85, 0.7, 0.6, 0.5, 0.4];
    if (cls === 'one') {
      const L1 = R0 * rnd(0.85, 1.15), L2 = L1 * pick([1, 1, 1.15, 1.41, 1.73]), ph = rnd(0, Math.PI), ps = pick([60, 60, 90]) * Math.PI / 180;
      const g1 = [L1 * Math.cos(ph), L1 * Math.sin(ph)], g2 = [L2 * Math.cos(ph + ps), L2 * Math.sin(ph + ps)];
      for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) {
        if (!i && !j) continue;
        const x = c + i * g1[0] + j * g2[0], y = c - (i * g1[1] + j * g2[1]), d = Math.hypot(x - c, y - c);
        if (d > 200) continue;
        soft(x, y, rnd(4, 6), 0.95 * Math.exp(-d / 260) * rnd(0.7, 1));
      }
    } else if (cls === 'sub') {
      const six = Math.random() < 0.35, rot = rnd(0, Math.PI);
      radii.forEach((r, k) => {
        arc(r, 0, 2 * Math.PI, 3, 0.07);
        const n = six ? 6 : rint(10, 36);
        for (let q = 0; q < n; q++) {
          const a = six ? rot + q * Math.PI / 3 + rnd(-0.08, 0.08) : rnd(0, 2 * Math.PI), hw = six ? rnd(0.08, 0.16) : rnd(0.02, 0.07);
          arc(r, a - hw, a + hw, 3.2, amp[k] * rnd(0.6, 1.1));
        }
      });
    } else if (cls === 'nano') {
      radii.forEach((r, k) => {
        arc(r, 0, 2 * Math.PI, rnd(2.4, 4.2), amp[k] * rnd(0.75, 1.0));
        for (let q = 0; q < 50; q++) { const a = rnd(0, 2 * Math.PI); soft(c + r * Math.cos(a), c - r * Math.sin(a), 2.2, 0.08); }
      });
    } else if (cls === 'mixed') {
      radii.forEach((r, k) => {
        arc(r, 0, 2 * Math.PI, 3, amp[k] * 0.5);
        if (k < 3 || Math.random() < 0.3) { const m = rint(2, 6); for (let q = 0; q < m; q++) { const a = rnd(0, 2 * Math.PI), hw = rnd(0.1, 0.4); arc(r, a - hw, a + hw, rnd(3.5, 6), amp[k] * rnd(0.7, 1.1)); } }
      });
    }
    g.globalCompositeOperation = 'lighter';
    for (let q = 0; q < 500; q++) soft(rnd(0, N), rnd(0, N), 1.6, 0.05);
    if (cls !== 'one' && Math.random() < 0.55) {
      g.globalCompositeOperation = 'source-over'; g.save(); g.translate(c, c); g.rotate(rnd(0, 2 * Math.PI)); g.fillStyle = '#0a0a0c'; g.fillRect(10, -9, N, 18); g.restore();
    }
    g.globalCompositeOperation = 'source-over';
  }

  function render(sel) {
    const wrap = $('#tm-opts'); const opts = sel;
    wrap.innerHTML = opts.map(o => `<button class="sec" data-id="${o.id}">${o.name}</button>`).join('');
    $$('button', wrap).forEach(b => b.onclick = () => answer(b.dataset.id));
  }

  function newTask() {
    const src = $('#tm-src').value;
    const pool = src === 'gen' ? CLS.slice(0, 4) : CLS;
    let c; do { c = pick(pool); } while (c.id === lastId && pool.length > 1);
    lastId = c.id; st = { src, cls: c, counted: false, done: false };
    $('#tm-fb').className = 'fb'; $('#tm-next').hidden = true;
    const box = $('#tm-img'); box.innerHTML = '';
    if (src === 'gen') {
      $('#tm-q').textContent = 'Электронограмма (микродифракция). Какая это структура?';
      const cv = document.createElement('canvas'); cv.style.width = 'min(440px,100%)'; box.appendChild(cv); saed(cv, c.id);
    } else {
      $('#tm-q').textContent = 'Определите по фото, какая структура перед нами.';
      const set = pick(IMGS[c.id]);
      set.forEach(f => { const im = document.createElement('img'); im.src = 'img/' + f; im.alt = 'снимок ПЭМ'; im.loading = 'lazy'; if (set.length > 1) im.style.maxWidth = 'min(440px,100%)'; box.appendChild(im); });
    }
    render(pool);
  }

  function answer(id) {
    if (st.done) return;
    const ok = id === st.cls.id;
    $$('#tm-opts button').forEach(b => { b.disabled = true; if (b.dataset.id === st.cls.id) b.classList.add('right'); else if (b.dataset.id === id) b.classList.add('wrong'); });
    st.done = true; if (!st.counted) { st.counted = true; score.add(ok); }
    const fb = $('#tm-fb'); fb.className = 'fb show ' + (ok ? 'ok' : 'no');
    fb.innerHTML = `${ok ? '✓ Верно' : '✗ Нет'}: <b>${st.cls.name}</b>.<br>${st.cls.why}`;
    $('#tm-next').hidden = false;
  }

  $('#tm-next').onclick = newTask;
  $('#tm-src').onchange = newTask;
  newTask();
  window.__tem = { saed, CLS };
})();
