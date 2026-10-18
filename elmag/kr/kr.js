/* Режим КР — анимации, разборы по шагам, тренажёр, карточки */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function fmt(x, d) { return x.toLocaleString('ru-RU', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: d == null ? 0 : 0 }); }
  var COL = { R: ['vecR', 'fillR'], B: ['vecB', 'fillB'], H: ['vecH', 'fillH'], K: ['vecE', 'fillInk'], I: ['vecI', 'fillI'] };

  /* цикл анимации, который работает только когда блок виден */
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

  /* ---------- стрелки из data-arrow ---------- */
  function buildArrow(g) {
    var p = g.getAttribute('data-arrow').split(/\s+/).map(Number);
    var c = COL[g.getAttribute('data-c') || 'K'], w = +(g.getAttribute('data-w') || 2.4);
    var dx = p[2] - p[0], dy = p[3] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, h = 8 + w * 1.5;
    var ln = mk('line', { x1: p[0], y1: p[1], x2: p[2] - ux * h * 0.8, y2: p[3] - uy * h * 0.8, class: c[0], 'stroke-width': w }, g);
    if (g.hasAttribute('data-dash')) ln.setAttribute('stroke-dasharray', '5 4');
    else { ln.setAttribute('pathLength', '1'); ln.classList.add('draw'); }
    mk('polygon', { points: [p[2], p[3], p[2] - ux * h - uy * h * 0.45, p[3] - uy * h + ux * h * 0.45, p[2] - ux * h + uy * h * 0.45, p[3] - uy * h - ux * h * 0.45].join(' '), class: c[1] + ' head' }, g);
  }

  /* ---------- пошаговые анимации ---------- */
  function initSteppers() {
    $$('.anim.stepper').forEach(function (box) {
      $$('[data-arrow]', box).forEach(buildArrow);
      var els = $$('svg .el', box), items = $$('.say-list li', box), n = items.length, step = 0;
      var count = $('.count', box);
      function render() {
        els.forEach(function (e) {
          var s = +(e.getAttribute('data-s') || 0), en = e.getAttribute('data-e');
          var on = step >= s && (en == null || step <= +en);
          e.classList.toggle('on', on);
          var mv = e.getAttribute('data-move');
          if (mv) {
            var at = +(e.getAttribute('data-mv') || s), d = mv.split(/\s+/);
            e.style.transform = step >= at ? 'translate(' + d[0] + 'px,' + d[1] + 'px)' : 'translate(0px,0px)';
          }
        });
        items.forEach(function (li, i) { li.classList.toggle('cur', i === step); });
        if (count) count.textContent = 'Шаг ' + step + ' из ' + (n - 1);
        $('[data-act="prev"]', box).disabled = step === 0;
        $('[data-act="next"]', box).disabled = step === n - 1;
      }
      box.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-act]'); if (!b) return;
        var a = b.getAttribute('data-act');
        if (a === 'next' && step < n - 1) step++;
        if (a === 'prev' && step > 0) step--;
        if (a === 'reset') step = 0;
        render();
      });
      render();
    });
  }

  /* ---------- разборы по шагам ---------- */
  function initWalks() {
    $$('.walk').forEach(function (w) {
      var st = $$('.wstep', w), i = 0, nb = $('[data-act="wnext"]', w);
      function show() {
        st.forEach(function (s, k) { s.classList.toggle('show', k <= i); });
        if (nb) { nb.disabled = i >= st.length - 1; nb.textContent = i >= st.length - 1 ? 'Это все шаги' : 'Следующий шаг'; }
      }
      w.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-act]'); if (!b) return;
        if (b.getAttribute('data-act') === 'wnext' && i < st.length - 1) i++;
        if (b.getAttribute('data-act') === 'wall') i = st.length - 1;
        show();
      });
      show();
    });
  }

  /* ---------- тип 2: точка вокруг провода ---------- */
  function initOrbit() {
    var box = $('#orbit'); if (!box) return;
    var R = $('#orbR'), B = $('#orbB'), P = $('#orbP'), BL = $('#orbBL'), SQ = $('#orbSq'), dot = $('#orbDot'), X = $('#orbX'), txt = $('#orbTxt');
    var th = 0.3, dir = 1, cx = 160, cy = 110, r = 75;
    function draw() {
      var px = cx + r * Math.cos(th), py = cy - r * Math.sin(th);
      var tx = -Math.sin(th) * dir, ty = -Math.cos(th) * dir; // касательная (экран)
      R.setAttribute('x2', px); R.setAttribute('y2', py);
      P.setAttribute('cx', px); P.setAttribute('cy', py);
      B.setAttribute('x1', px); B.setAttribute('y1', py); B.setAttribute('x2', px + tx * 52); B.setAttribute('y2', py + ty * 52);
      BL.setAttribute('x', px + tx * 58 + 4); BL.setAttribute('y', py + ty * 58 + 5);
      var ix = -Math.cos(th), iy = Math.sin(th), s = 10; // внутрь
      SQ.setAttribute('d', 'M' + (px + ix * s) + ' ' + (py + iy * s) + ' L' + (px + ix * s + tx * s) + ' ' + (py + iy * s + ty * s) + ' L' + (px + tx * s) + ' ' + (py + ty * s));
    }
    var L = loop(box, function (dt) { th += dir * dt * 0.9; draw(); });
    if (reduce) L.set(false);
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-orb]'); if (!b) return;
      if (b.getAttribute('data-orb') === 'toggle') { L.set(!L.running); b.textContent = L.running ? 'Пауза' : 'Пуск'; }
      else {
        dir = -dir;
        dot.style.display = dir > 0 ? '' : 'none'; X.style.display = dir > 0 ? 'none' : '';
        b.textContent = dir > 0 ? 'Ток от нас' : 'Ток к нам';
        txt.textContent = dir > 0 ? 'ток к нам — поле против часовой' : 'ток от нас — поле по часовой';
        draw();
      }
    });
    draw();
  }

  /* ---------- тип 3: точка внутри и снаружи сферы ---------- */
  function initSphere() {
    var box = $('#sphere'); if (!box) return;
    var sl = $('#sphR'), out = $('#sphRo'), P = $('#sphP'), M = $('#sphM'), txt = $('#sphTxt'), cv = $('#sphCurve');
    var X = function (r) { return 290 + r * 70; }, Y = function (f) { return 180 - f * 1.75; }, phi = function (r) { return r <= 1 ? 80 : 80 / r; };
    var pts = []; for (var r = 0; r <= 3.0001; r += 0.05) pts.push(X(r) + ',' + Y(phi(r)));
    cv.setAttribute('points', pts.join(' '));
    function upd() {
      var r = +sl.value, f = phi(r);
      out.textContent = r.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      P.setAttribute('cx', 80 + r * 50); M.setAttribute('cx', X(r)); M.setAttribute('cy', Y(f));
      if (r < 0.99) txt.innerHTML = '<b>Внутри сферы</b> ( r = ' + out.textContent + ' м меньше R = 1 м): φ = kq/R = <b>80 В</b>. Двигай точку — внутри число не меняется.' + (r > 0.05 ? ' Если по ошибке взять kq/r, вышло бы ' + fmt(80 / r, 0) + ' В — это неверно.' : '');
      else if (r <= 1.01) txt.innerHTML = '<b>На поверхности:</b> φ = kq/R = <b>80 В</b>.';
      else txt.innerHTML = '<b>Снаружи сферы:</b> сфера ведёт себя как точечный заряд, φ = kq/r = 80/' + out.textContent + ' = <b>' + fmt(80 / r, 1) + ' В</b>.';
    }
    sl.addEventListener('input', upd); upd();
  }

  /* ---------- тип 4: горка потенциала ---------- */
  function initHill() {
    var box = $('#hill'); if (!box) return;
    var ball = $('#hillBall'), K = $('#hillK'), U = $('#hillU'), txt = $('#hillTxt'), s = 0, run = false;
    function bez(t) {
      var a = [30, 60], b = [120, 60], c = [200, 190], d = [330, 190], u = 1 - t;
      return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
    }
    function draw() {
      var p = bez(s), ph = 600 * (1 - (p[1] - 60) / 130), u = 0.01 * ph, k = 20 - u;
      ball.setAttribute('cx', p[0]); ball.setAttribute('cy', p[1] - 11);
      K.setAttribute('height', k * 6); K.setAttribute('y', 200 - k * 6);
      U.setAttribute('height', u * 6); U.setAttribute('y', 200 - u * 6);
      var v = Math.sqrt(2 * k * 1e-6 / 1e-3) * 100;
      txt.textContent = 'φ = ' + fmt(ph, 0) + ' В, скорость ' + fmt(v, 1) + ' см/с';
    }
    var L = loop(box, function (dt) { if (!run) return; s = Math.min(1, s + dt / 2.6 * (0.4 + 1.2 * s)); draw(); if (s >= 1) run = false; });
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-hill]'); if (!b) return;
      if (b.getAttribute('data-hill') === 'go') { if (s >= 1) s = 0; run = true; if (reduce) { s = 1; run = false; } draw(); L.set(true); }
      else { s = 0; run = false; draw(); }
    });
    draw();
  }

  /* ---------- тип 4: разлёт двух зарядов ---------- */
  function initRepel() {
    var box = $('#repel'); if (!box) return;
    var A = $('#repA'), B = $('#repB'), W = $('#repW'), Kb = $('#repK'), txt = $('#repTxt');
    var r0 = 60, r = r0, v = 0, C = 1.2e6, run = false;
    function draw() {
      A.setAttribute('cx', 260 - r / 2); B.setAttribute('cx', 260 + r / 2);
      var w = 300 * r0 / r; W.setAttribute('width', w); Kb.setAttribute('width', 300 - w);
      txt.textContent = r >= 470 ? 'v ≈ 38 м/с у каждого' : '';
    }
    var L = loop(box, function (dt) {
      if (!run) return;
      for (var i = 0; i < 8; i++) { var h = dt / 8; v += C / (r * r) * h; r += v * h; }
      if (r >= 470) { r = 470; run = false; }
      draw();
    });
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-rep]'); if (!b) return;
      r = r0; v = 0;
      if (b.getAttribute('data-rep') === 'go') { run = true; if (reduce) { r = 470; run = false; } L.set(true); } else run = false;
      draw();
    });
    draw();
  }

  /* ---------- тип 5: фокусировка в магнитном поле ---------- */
  function initFocus() {
    var box = $('#focus'); if (!box) return;
    var grid = $('#focGrid');
    for (var gx = 30; gx < 360; gx += 55) for (var gy = 25; gy < 250; gy += 55) {
      if (Math.abs(gx - 120) < 30 && Math.abs(gy - 220) < 30) continue;
      mk('path', { d: 'M' + (gx - 4) + ' ' + (gy - 4) + ' l8 8 m0 -8 l-8 8' }, grid);
    }
    var P = [$('#focP0'), $('#focP1'), $('#focP2')], T = [$('#focT0'), $('#focT1'), $('#focT2')], F = $('#focF'), E = $('#focE'), txt = $('#focTxt');
    var base = [30, 55, 85], ex = 120, ey = 220, ph = 0, k = 1, trail = [[], [], []], flash = 0;
    var sl = $('#focB'), out = $('#focBo');
    function draw() {
      for (var i = 0; i < 3; i++) {
        var R = base[i] / k, cx = ex, cy = ey - R;
        var x = cx + R * Math.sin(ph), y = cy + R * Math.cos(ph);
        P[i].setAttribute('cx', x); P[i].setAttribute('cy', y);
        trail[i].push(x.toFixed(1) + ',' + y.toFixed(1));
        T[i].setAttribute('points', trail[i].join(' '));
        if (i === 2) {
          var dx = cx - x, dy = cy - y, L = Math.hypot(dx, dy) || 1;
          F.setAttribute('x1', x); F.setAttribute('y1', y); F.setAttribute('x2', x + dx / L * 28); F.setAttribute('y2', y + dy / L * 28);
        }
      }
      E.style.strokeWidth = flash > 0 ? 5 : 2;
      txt.textContent = 'прошла доля оборота: ' + Math.round(ph / (2 * Math.PI) * 100) + '%' + (flash > 0 ? ' — все снова в точке влёта!' : '');
    }
    var Lp = loop(box, function (dt) {
      ph += dt * (2 * Math.PI / 4) * k;
      if (flash > 0) flash -= dt;
      if (ph >= 2 * Math.PI) { ph -= 2 * Math.PI; trail = [[], [], []]; flash = 1.2; }
      draw();
    });
    if (reduce) Lp.set(false);
    sl.addEventListener('input', function () { k = +sl.value; out.textContent = '×' + k.toLocaleString('ru-RU', { minimumFractionDigits: 1 }); ph = 0; trail = [[], [], []]; draw(); });
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-foc]'); if (!b) return;
      Lp.set(!Lp.running); b.textContent = Lp.running ? 'Пауза' : 'Пуск';
    });
    draw();
  }

  /* ---------- тип 6: полоски под графиком ---------- */
  function initStrips() {
    var box = $('#strips'); if (!box) return;
    var G = $('#strG'), cv = $('#strCurve'), yl = $('#strYl'), txt = $('#strTxt'), mode = 'q', N = 4;
    var I = function (t) { return 5 * t / 8; };
    var f = function (t) { return mode === 'q' ? I(t) : 3 * I(t) * I(t); };
    var X = function (t) { return 50 + t * 50; }, Y = function (v) { return 210 - v * (mode === 'q' ? 32 : 160 / 75); };
    function draw() {
      while (G.firstChild) G.removeChild(G.firstChild);
      var d = 8 / N, sum = 0;
      for (var i = 0; i < N; i++) {
        var t = i * d, v = f(t); sum += v * d;
        var rc = mk('rect', { x: X(t), y: Y(v), width: d * 50, height: 210 - Y(v), class: mode === 'q' ? 'softA' : 'softB' }, G);
        rc.style.fill = mode === 'q' ? 'var(--soft-amber)' : 'var(--soft-red)';
        rc.style.stroke = mode === 'q' ? 'var(--amber)' : 'var(--red)';
        rc.style.strokeWidth = '1';
        if (!reduce) { rc.style.opacity = '0'; rc.style.transition = 'opacity .3s ease ' + (i * 700 / N) + 'ms'; (function (e) { requestAnimationFrame(function () { requestAnimationFrame(function () { e.style.opacity = '1'; }); }); })(rc); }
      }
      var pts = []; for (var s = 0; s <= 8.001; s += 0.1) pts.push(X(s) + ',' + Y(f(s)));
      cv.setAttribute('points', pts.join(' '));
      cv.style.stroke = mode === 'q' ? 'var(--amber)' : 'var(--red)';
      yl.textContent = mode === 'q' ? 'I, А' : 'I²R, Вт';
      var exact = mode === 'q' ? 20 : 200, unit = mode === 'q' ? 'Кл' : 'Дж';
      txt.innerHTML = 'Сумма ' + N + ' полосок: <b>' + fmt(sum, 1) + ' ' + unit + '</b>. Точный ответ (интеграл): <b>' + exact + ' ' + unit + '</b>' +
        (mode === 'q' ? ' = площадь треугольника 5·8/2.' : ' = I²Rt/3 = 25·3·8/3.') + ' Чем тоньше полоски, тем ближе сумма к точному ответу — это и есть интеграл.';
    }
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-str')) { mode = b.getAttribute('data-str'); $$('[data-str]', box).forEach(function (x) { x.classList.toggle('on', x === b); }); }
      if (b.hasAttribute('data-n')) { N = +b.getAttribute('data-n'); $$('[data-n]', box).forEach(function (x) { x.classList.toggle('on', x === b); }); }
      draw();
    });
    draw();
  }

  /* ---------- тип 7: маятники ---------- */
  function initPend() {
    var box = $('#pend'); if (!box) return;
    var dL = $('#pdL'), bL = $('#pbL'), dR = $('#pdR'), bR = $('#pbR'), mg = $('#pMg'), qe = $('#pQe'), fld = $('#pFld'), txt = $('#pTxt');
    var T0 = 2.2, mode = 1, t = 0, th0 = 0.35, Lp = 150;
    function fieldLines() {
      while (fld.firstChild) fld.removeChild(fld.firstChild);
      if (!mode) return;
      [470, 500].forEach(function (x) {
        var l = mk('line', mode > 0 ? { x1: x, y1: 40, x2: x, y2: 200 } : { x1: x, y1: 200, x2: x, y2: 40 }, fld);
        l.setAttribute('marker-end', 'url(#aR)');
      });
    }
    function gratio() { return mode > 0 ? 4 : mode < 0 ? 0.5 : 1; }
    function draw() {
      var a = th0 * Math.cos(2 * Math.PI * t / T0), TR = T0 / Math.sqrt(gratio()), b = th0 * Math.cos(2 * Math.PI * t / TR);
      var x1 = 140 + Lp * Math.sin(a), y1 = 30 + Lp * Math.cos(a), x2 = 380 + Lp * Math.sin(b), y2 = 30 + Lp * Math.cos(b);
      dL.setAttribute('x2', x1); dL.setAttribute('y2', y1); bL.setAttribute('cx', x1); bL.setAttribute('cy', y1);
      dR.setAttribute('x2', x2); dR.setAttribute('y2', y2); bR.setAttribute('cx', x2); bR.setAttribute('cy', y2);
      mg.setAttribute('x1', x2 - 6); mg.setAttribute('x2', x2 - 6); mg.setAttribute('y1', y2 + 12); mg.setAttribute('y2', y2 + 44);
      qe.style.display = mode ? '' : 'none';
      qe.setAttribute('x1', x2 + 6); qe.setAttribute('x2', x2 + 6);
      if (mode > 0) { qe.setAttribute('y1', y2 + 12); qe.setAttribute('y2', y2 + 60); }
      else { qe.setAttribute('y1', y2 - 12); qe.setAttribute('y2', y2 - 44); }
    }
    function label() {
      txt.textContent = mode > 0 ? 'g_эф = g + qE/m = 4g → период в 2 раза меньше' : mode < 0 ? 'g_эф = g − qE/m = g/2 → период в √2 раза больше' : 'поля нет — периоды одинаковые';
    }
    var L = loop(box, function (dt) { t += dt; draw(); });
    if (reduce) L.set(false);
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-pf]'); if (!b) return;
      mode = +b.getAttribute('data-pf');
      $$('[data-pf]', box).forEach(function (x) { x.classList.toggle('on', x === b); });
      fieldLines(); label(); draw();
    });
    fieldLines(); label(); draw();
  }

  /* ---------- тип 7: электрон в конденсаторе ---------- */
  function initEflight() {
    var box = $('#eflight'); if (!box) return;
    var e = $('#efE'), tr = $('#efTrail'), V = $('#efV'), x = 20, run = false, pts = [];
    function yAt(x) { return x < 120 ? 100 : x <= 400 ? 100 - 40 * Math.pow((x - 120) / 280, 2) : 60 - 0.2857 * (x - 400); }
    function draw() { e.setAttribute('cx', x); e.setAttribute('cy', yAt(x)); tr.setAttribute('points', pts.join(' ')); }
    var L = loop(box, function (dt) {
      if (!run) return;
      x = Math.min(510, x + dt * 200); pts.push(x.toFixed(1) + ',' + yAt(x).toFixed(1));
      if (x >= 400) V.style.opacity = '1';
      if (x >= 510) run = false;
      draw();
    });
    box.addEventListener('click', function (ev) {
      if (!ev.target.closest('[data-ef]')) return;
      x = 20; pts = []; V.style.opacity = '0'; run = true;
      if (reduce) { for (var s = 20; s <= 510; s += 5) pts.push(s + ',' + yAt(s)); x = 510; run = false; V.style.opacity = '1'; }
      L.set(true); draw();
    });
    draw();
  }

  /* ---------- тип 8: конденсатор ---------- */
  function initCap() {
    var box = $('#cap'); if (!box) return;
    var slabEl = $('#capSlab'), plus = $('#capPlus'), minus = $('#capMinus'), gap = $('#capGap'), flow = $('#capFlow'), U = $('#capU'), txt = $('#capTxt');
    var bat = true, slab = false, q = 4, flowT = 0, msg = '';
    function eps() { return slab ? 2 : 1; }
    function draw() {
      slabEl.style.x = (slab ? 222 : 380) + 'px';
      while (plus.firstChild) plus.removeChild(plus.firstChild);
      while (minus.firstChild) minus.removeChild(minus.firstChild);
      for (var i = 0; i < q; i++) {
        var xx = 228 + (i + 0.5) * (124 / q);
        var a = mk('text', { x: xx, y: 46, 'text-anchor': 'middle', class: 'fillR' }, plus); a.textContent = '+';
        var b = mk('text', { x: xx, y: 168, 'text-anchor': 'middle', class: 'fillB' }, minus); b.textContent = '−';
      }
      gap.style.display = bat ? 'none' : '';
      var u = q / (4 * eps());
      U.textContent = 'q = ' + q / 4 + '·q₀,  U = ' + fmt(u, 1) + '·ℰ';
      $('[data-cap="bat"]', box).textContent = bat ? 'Отключить батарею' : 'Подключить батарею';
      $('[data-cap="slab"]', box).textContent = slab ? 'Вынуть диэлектрик' : 'Вставить диэлектрик (ε = 2)';
      txt.innerHTML = msg || 'Батарея подключена: напряжение на конденсаторе равно ЭДС. Попробуй вставить диэлектрик — сначала с батареей, потом без неё.';
    }
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-cap]'); if (!b) return;
      var old = q;
      if (b.getAttribute('data-cap') === 'bat') {
        bat = !bat;
        if (bat) q = 4 * eps();
        msg = bat ? 'Батарею подключили снова — она установила напряжение ℰ и выровняла заряд: q = εCℰ.' : 'Батарею отключили — теперь заряду некуда деться, он «заперт» на пластинах.';
      } else {
        slab = !slab;
        if (bat) { q = 4 * eps(); msg = slab ? '<b>С батареей:</b> напряжение держит батарея, ёмкость выросла в ε = 2 раза — батарея докачала заряд, он удвоился. Через батарею протёк Δq = (ε − 1)Cℰ.' : 'Вынули диэлектрик при подключённой батарее — лишний заряд ушёл обратно в батарею.'; }
        else msg = slab ? '<b>Без батареи:</b> заряд тот же, ёмкость выросла в 2 раза — значит, напряжение упало в 2 раза: U = q/(εC).' : 'Вынули диэлектрик без батареи — заряд тот же, ёмкость уменьшилась, напряжение выросло.';
      }
      flow.style.opacity = (bat && q !== old) ? '1' : '0';
      clearTimeout(flowT); flowT = setTimeout(function () { flow.style.opacity = '0'; }, 2200);
      draw();
    });
    draw();
  }

  /* ---------- тренажёр «узнай тип» ---------- */
  var TYPES = ['1. Поле нескольких зарядов', '2. Магнитное поле проводов', '3. Потенциал и сферы', '4. Энергия: «горки»', '5. Заряд в магнитном поле', '6. Ток меняется', '7. Маятник или электрон в поле', '8. Стержень или конденсатор'];
  var QUIZ = [
    ['Два точечных заряда 40 нКл и −10 нКл на расстоянии 10 см. Определить напряжённость поля в точке, удалённой от них на 8 и 6 см.', 1, 'Несколько точечных зарядов и «найти напряжённость» — складываем стрелки.'],
    ['Два положительных заряда 9 и 4 нКл. Точка, где напряжённость равна нулю, находится в 33 см от первого. Найти расстояние между зарядами.', 1, '«Напряжённость равна нулю» — тоже тип 1: приравниваем два поля.'],
    ['Три одинаковых заряда −1 мкКл в трёх вершинах квадрата. Найти напряжённость в свободной вершине.', 1, 'Несколько зарядов, найти E — складываем стрелки.'],
    ['По двум параллельным проводам текут токи 20 А и 30 А. Найти индукцию в точке, удалённой от каждого провода на расстояние d.', 2, 'Провода, токи, найти B — магнитное поле токов.'],
    ['Два круговых витка в перпендикулярных плоскостях с общим центром, токи по 5 А. Найти напряжённость H в центре.', 2, 'Витки с током, найти H — магнитное поле токов. Поле в центре витка I/(2R).'],
    ['В вершинах квадрата заряды −2, −4, 6 и 8 нКл. Найти потенциал в центре квадрата.', 3, 'Спрашивают потенциал — складываем числа kq/r, без стрелок.'],
    ['Две концентрические сферы с зарядами −10 и 10 нКл. Найти потенциал в центре сфер.', 3, 'Сферы и потенциал. В центре — внутри обеих: kq/R для каждой.'],
    ['Шарик массой 1 г с зарядом 10 нКл перемещается из точки с потенциалом 600 В в точку с потенциалом 0. Найти скорость в первой точке, если во второй она 20 см/с.', 4, 'Скорость и два потенциала — закон сохранения энергии.'],
    ['Два шарика с зарядами 4 мкКл держат на расстоянии 1 м и отпускают. Какую скорость они приобретут, разлетевшись далеко?', 4, '«Отпускают», «разлетятся», «скорость» — энергия взаимодействия переходит в кинетическую.'],
    ['Найти изменение кинетической энергии электрона, пролетевшего 1 м вдоль силовой линии поля 12 В/м.', 4, '«Изменение кинетической энергии» — это работа поля, тип 4.'],
    ['Ион влетает в магнитное поле 0,02 Тл со скоростью 10⁴ м/с перпендикулярно линиям индукции. Радиус кривизны 1 см. Найти удельный заряд.', 5, '«Влетает в магнитное поле», «радиус» — сила Лоренца, движение по окружности.'],
    ['Узкий пучок электронов влетает в перпендикулярное магнитное поле и через 2·10⁻⁸ с фокусируется в точке. Найти B.', 5, 'Магнитное поле и движущиеся электроны — тип 5. Фокус — через один период.'],
    ['Ток в проводнике 12 Ом равномерно убывает от 5 А до нуля за 10 с. Какое количество теплоты выделится?', 6, '«Равномерно убывает», «теплота» — площадь под графиком, «тепло — треть».'],
    ['Ток в проводнике 3 Ом равномерно растёт с нуля, за 8 с выделилось 200 Дж. Найти протекший заряд.', 6, '«Равномерно растёт», «заряд» — тип 6. Сначала найди конечный ток из теплоты.'],
    ['Заряженный грузик на нити в поле 3 кВ/м, направленном вниз. Период колебаний 0,5 с. Найти заряд.', 7, 'Маятник в электрическом поле — «новое g».'],
    ['Электрон влетает в плоский конденсатор параллельно пластинам. На какой угол отклонится скорость при вылете?', 7, 'Электрон в конденсаторе — «бросок горизонтально», tg α = v_y/v₀.'],
    ['Тонкий длинный стержень заряжен с плотностью 10 мкКл/м. На продолжении оси в 20 см от конца — заряд 10 нКл. Найти силу.', 8, 'Стержень с плотностью τ — цепочка точечных зарядов, F = kQτ/a.'],
    ['Конденсатор подключён к батарее. Какой заряд протечёт через батарею, если пространство между пластинами заполнить диэлектриком?', 8, 'Конденсатор и диэлектрик у батареи — Δq = (ε − 1)Cℰ.']
  ];
  function initQuiz() {
    var text = $('#qText'); if (!text) return;
    var opts = $('#qOpts'), fb = $('#qFb'), next = $('#qNext'), score = $('#qScore');
    var order = QUIZ.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; });
    var pos = 0, ok = 0, tried = 0, answered = false;
    TYPES.forEach(function (t, i) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.setAttribute('data-t', i + 1); opts.appendChild(b);
    });
    function show() {
      var q = QUIZ[order[pos % order.length]];
      text.textContent = q[0]; fb.textContent = ''; answered = false;
      $$('button', opts).forEach(function (b) { b.classList.remove('right', 'wrong'); });
      score.textContent = tried ? 'Верно: ' + ok + ' из ' + tried : 'Задача ' + (pos % order.length + 1) + ' из ' + order.length;
    }
    opts.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b || answered) return;
      var q = QUIZ[order[pos % order.length]], t = +b.getAttribute('data-t');
      answered = true; tried++;
      if (t === q[1]) { ok++; b.classList.add('right'); fb.innerHTML = '<b style="color:var(--teal)">Верно!</b> ' + q[2]; }
      else { b.classList.add('wrong'); $('[data-t="' + q[1] + '"]', opts).classList.add('right'); fb.innerHTML = '<b style="color:var(--red)">Это тип ' + q[1] + '.</b> ' + q[2]; }
      score.textContent = 'Верно: ' + ok + ' из ' + tried;
    });
    next.addEventListener('click', function () { pos++; show(); });
    show();
  }

  /* ---------- карточки ---------- */
  var CARDS = [
    ['Напряжённость поля точечного заряда', 'E = \\dfrac{k|q|}{r^2}', 'Стрелка от «+», к «−». k = 9·10⁹'],
    ['Потенциал точечного заряда', '\\varphi = \\dfrac{kq}{r}', 'Число со знаком, без стрелки'],
    ['Сложение двух перпендикулярных стрелок', 'E = \\sqrt{E_1^2 + E_2^2}', 'Подсказка в условии: стороны 3-4-5'],
    ['Потенциал внутри заряженной сферы', '\\varphi = \\dfrac{kq}{R},\\quad E = 0', 'Внутри «пол ровный» — везде одно значение'],
    ['Работа поля при перемещении заряда', 'A = q(\\varphi_1 - \\varphi_2)', 'Работа против поля — с минусом'],
    ['Закон сохранения энергии в поле', '\\dfrac{mv_1^2}{2} + q\\varphi_1 = \\dfrac{mv_2^2}{2} + q\\varphi_2', '«До» = «после»'],
    ['Энергия взаимодействия двух зарядов', 'W = \\dfrac{kq_1q_2}{r}', 'При разлёте уходит в кинетическую'],
    ['Индукция поля прямого провода', 'B = \\dfrac{\\mu_0 I}{2\\pi r} = 2\\cdot10^{-7}\\dfrac{I}{r}', 'Стрелка перпендикулярна линии «провод — точка»'],
    ['Поле в центре кругового витка', 'B = \\dfrac{\\mu_0 I}{2R},\\quad H = \\dfrac{I}{2R}', 'Направлено по оси витка'],
    ['Связь B и H', 'B = \\mu_0 H,\\quad \\mu_0 = 4\\pi\\cdot10^{-7}', 'H — в А/м, B — в теслах'],
    ['Заряд в магнитном поле: главная строчка', 'qvB = \\dfrac{mv^2}{R}', 'Сила Лоренца = центростремительная'],
    ['Радиус и период в магнитном поле', 'R = \\dfrac{mv}{qB},\\quad T = \\dfrac{2\\pi m}{qB}', 'Период не зависит от скорости'],
    ['Заряд при токе от 0 до Iₘ за время t', 'q = \\dfrac{I_m t}{2}', '«Заряд — половина»'],
    ['Теплота при токе от 0 до Iₘ за время t', 'Q = \\dfrac{I_m^2 R t}{3}', '«Тепло — треть»'],
    ['Маятник в электрическом поле', 'T = 2\\pi\\sqrt{\\dfrac{l}{g_{эф}}},\\quad g_{эф} = g \\pm \\dfrac{qE}{m}', 'Сила вниз — плюс, вверх — минус'],
    ['Угол отклонения электрона в конденсаторе', '\\operatorname{tg}\\alpha = \\dfrac{eUL}{m d v_0^2}', 'Как горизонтальный бросок'],
    ['Сила от длинного заряженного стержня', 'F = \\dfrac{kQ\\tau}{a}', 'a — расстояние от конца стержня'],
    ['Конденсатор у батареи, внесли диэлектрик', '\\Delta q = (\\varepsilon - 1)\\,C\\mathcal{E}', 'Батарея держит U, заряд растёт в ε раз'],
    ['Заряд и масса электрона', 'e = 1{,}6\\cdot10^{-19}\\ \\text{Кл},\\quad m = 9{,}1\\cdot10^{-31}\\ \\text{кг}', 'e/m = 1,76·10¹¹ Кл/кг']
  ];
  function tex(el, s) {
    if (window.katex) { try { el.innerHTML = katex.renderToString(s, { displayMode: true, throwOnError: false }); return; } catch (e) {} }
    el.textContent = s;
  }
  function initFlash() {
    var card = $('#fCard'); if (!card) return;
    var Q = $('#fQ'), A = $('#fA'), M = $('#fM'), left = $('#fLeft'), yes = $('#fYes'), no = $('#fNo'), rs = $('#fReset');
    var queue = [];
    function reset() { queue = CARDS.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; }); show(); }
    function show() {
      card.classList.remove('flip');
      if (!queue.length) { Q.textContent = 'Все карточки пройдены!'; A.textContent = ''; M.textContent = 'Нажми «Начать заново», чтобы повторить.'; left.textContent = ''; yes.disabled = no.disabled = true; return; }
      yes.disabled = no.disabled = false;
      var c = CARDS[queue[0]];
      setTimeout(function () { Q.textContent = c[0]; tex(A, c[1]); M.textContent = c[2]; }, 150);
      left.textContent = 'Осталось: ' + queue.length;
    }
    function flip() { card.classList.toggle('flip'); }
    card.addEventListener('click', flip);
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    yes.addEventListener('click', function () { queue.shift(); show(); });
    no.addEventListener('click', function () { queue.push(queue.shift()); show(); });
    rs.addEventListener('click', reset);
    reset();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSteppers(); initWalks(); initOrbit(); initSphere(); initHill(); initRepel();
    initFocus(); initStrips(); initPend(); initEflight(); initCap(); initQuiz(); initFlash();
  });
})();
