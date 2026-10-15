/* Электричество и магнетизм — интерактив */
(function () {
  'use strict';

  /* ---------- безопасное хранилище ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* приватный режим */ } }
  };
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function fmt(x, d) { if (!isFinite(x)) return '—'; return x.toLocaleString('ru-RU', { maximumSignificantDigits: d || 3 }); }
  function sci(x, d) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    var e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= -2 && e < 5) return fmt(x, d);
    var m = x / Math.pow(10, e), sup = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    if (Math.abs(Math.round(m * 100) / 100) >= 10) { m /= 10; e += 1; }
    return fmt(m, d) + '·10' + String(e).split('').map(function (c) { return sup[c]; }).join('');
  }
  function signed(v) { return v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0'; }

  /* ---------- формулы ---------- */
  /* $$…$$ превращаем в «строчную» формулу в стиле display: KaTeX умеет
     переносить такие формулы по знакам «=», «+» и пробелам \qquad на узком экране */
  function prepDisplayMath(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, nodes = [];
    while ((n = walker.nextNode())) { if (n.nodeValue.indexOf('$$') >= 0) nodes.push(n); }
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split('$$');
      if (parts.length < 3) return;
      var frag = document.createDocumentFragment();
      parts.forEach(function (p, i) {
        if (i % 2 === 0) { if (p.trim()) frag.appendChild(document.createTextNode(p)); return; }
        var d = document.createElement('div');
        d.className = 'dm';
        d.textContent = '\\(\\displaystyle ' + p.replace(/\\qquad/g, '\\qquad\\allowbreak ').replace(/\\quad(?![a-zA-Z])/g, '\\quad\\allowbreak ') + '\\)';
        frag.appendChild(d);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  function renderMath() {
    if (window.renderMathInElement) {
      prepDisplayMath(document.querySelector('main'));
      renderMathInElement(document.body, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }],
        throwOnError: false
      });
    }
  }

  /* ---------- тема ---------- */
  function initTheme() {
    var btn = document.getElementById('themeBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var root = document.documentElement;
      var cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('elmag-theme', next); } catch (e) {}
      document.dispatchEvent(new Event('themechange'));
    });
  }

  /* ---------- навигация ---------- */
  function initNav() {
    var t = document.getElementById('navToggle');
    if (t) {
      t.addEventListener('click', function () {
        var open = document.body.classList.toggle('nav-open');
        t.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    document.querySelectorAll('.sidebar a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('nav-open'); if (t) t.setAttribute('aria-expanded', 'false'); });
    });
    var links = {};
    document.querySelectorAll('.sidebar a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
          links[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(links).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- прогресс ---------- */
  var done = store.get('elmag-done', {});
  var solved = store.get('elmag-solved', {});
  function updateProgress() {
    var blocks = ['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'];
    var n = 0;
    blocks.forEach(function (b) {
      var a = document.querySelector('.sidebar a[data-nav="' + b + '"]');
      if (done[b]) { n++; if (a) a.classList.add('done'); } else if (a) a.classList.remove('done');
    });
    var s = Object.keys(solved).filter(function (k) { return solved[k]; }).length;
    var lbl = document.getElementById('progLbl');
    if (lbl) lbl.textContent = n + ' из 8 блоков, задач решено: ' + s;
    var bar = document.getElementById('progBar');
    if (bar) bar.style.width = (n / 8 * 100) + '%';
  }
  function initProgress() {
    document.querySelectorAll('input[data-done]').forEach(function (cb) {
      var k = cb.getAttribute('data-done');
      cb.checked = !!done[k];
      cb.addEventListener('change', function () { done[k] = cb.checked; store.set('elmag-done', done); updateProgress(); });
    });
    Object.keys(solved).forEach(function (id) {
      var art = document.getElementById(id);
      if (art && solved[id]) art.classList.add('solved');
    });
    updateProgress();
  }

  /* ---------- проверка ответов ---------- */
  function parseNum(s) {
    s = String(s).trim().replace(/\s+/g, '').replace(',', '.').replace('−', '-').replace('×10^', 'e').replace('*10^', 'e');
    if (!s) return NaN;
    return Number(s);
  }
  function initChecks() {
    document.querySelectorAll('.check').forEach(function (box) {
      var input = box.querySelector('input');
      var btn = box.querySelector('button');
      var out = box.querySelector('.verdict');
      var ans = parseFloat(box.getAttribute('data-ans'));
      var tol = parseFloat(box.getAttribute('data-tol') || '0.02');
      var art = box.closest('article');
      function check() {
        var v = parseNum(input.value);
        if (isNaN(v)) { out.textContent = 'Впиши число, например 4,5'; out.className = 'verdict no'; return; }
        var ok = ans === 0 ? Math.abs(v) < tol : Math.abs(v - ans) / Math.abs(ans) <= tol;
        if (ok) {
          out.textContent = 'Верно';
          out.className = 'verdict ok';
          if (art) { art.classList.add('solved'); solved[art.id] = true; store.set('elmag-solved', solved); updateProgress(); }
        } else {
          var hint = '';
          if (Math.abs(v + ans) / Math.abs(ans) <= tol) hint = ' — похоже, перепутан знак';
          else if (v !== 0 && [1e3, 1e-3, 1e6, 1e-6, 1e9, 1e-9, 100, 0.01].some(function (m) { return Math.abs(v * m - ans) / Math.abs(ans) <= tol; })) hint = ' — похоже, ошибка в приставке или в переводе в СИ';
          out.textContent = 'Не сходится' + hint + '. Открой подсказку.';
          out.className = 'verdict no';
        }
      }
      btn.addEventListener('click', check);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    });
  }

  /* ---------- общие помощники для canvas ---------- */
  function setupCanvas(cv, ratio) {
    var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
    var w = cv.parentElement.clientWidth - 0;
    var cw = Math.max(260, Math.round(cv.clientWidth || w));
    var ch = Math.round(cw * ratio);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    cv.style.height = ch + 'px';
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: cw, h: ch };
  }
  function arrow(ctx, x1, y1, x2, y2, color, width, head) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 2) return;
    head = Math.min(head || 10, L * 0.6);
    var ux = dx / L, uy = dy / L;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * head * 0.8, y2 - uy * head * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * head - uy * head * 0.45, y2 - uy * head + ux * head * 0.45);
    ctx.lineTo(x2 - ux * head + uy * head * 0.45, y2 - uy * head - ux * head * 0.45);
    ctx.closePath(); ctx.fill();
  }
  function bindDrag(cv, hitTest, onMove, onEnd) {
    var drag = null;
    function pos(ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
    cv.addEventListener('mousedown', function (e) { var p = pos(e); drag = hitTest(p); if (drag) { cv.classList.add('dragging'); e.preventDefault(); } });
    window.addEventListener('mousemove', function (e) { if (drag) onMove(drag, pos(e)); });
    window.addEventListener('mouseup', function () { if (drag) { drag = null; cv.classList.remove('dragging'); if (onEnd) onEnd(); } });
    cv.addEventListener('touchstart', function (e) { var p = pos(e.touches[0]); drag = hitTest(p, true); if (drag) e.preventDefault(); }, { passive: false });
    cv.addEventListener('touchmove', function (e) { if (drag) { e.preventDefault(); onMove(drag, pos(e.touches[0])); } }, { passive: false });
    cv.addEventListener('touchend', function () { if (drag) { drag = null; if (onEnd) onEnd(); } });
  }

  /* ---------- силовые линии двух зарядов ---------- */
  function initField() {
    var cv = document.getElementById('fieldCanvas');
    if (!cv) return;
    var s1 = document.getElementById('q1'), s2 = document.getElementById('q2');
    var o1 = document.getElementById('q1o'), o2 = document.getElementById('q2o');
    var readout = document.getElementById('fieldReadout');
    var st = { c: [{ fx: 0.3, fy: 0.55, q: +s1.value }, { fx: 0.7, fy: 0.55, q: +s2.value }], p: { fx: 0.52, fy: 0.24 } };
    var G = null, raf = 0;
    var K = 9e9;

    function resize() { G = setupCanvas(cv, 380 / 560); draw(); }
    function req() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; draw(); }); }
    function px(o) { return { x: o.fx * G.w, y: o.fy * G.h }; }
    function cmPerPx() { return 10 / (0.4 * G.w); }

    function E(x, y, charges) {
      var ex = 0, ey = 0;
      for (var i = 0; i < charges.length; i++) {
        var c = charges[i]; if (!c.q) continue;
        var dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
        if (r < 1e-6) continue;
        var f = c.q / (r2 * r); ex += f * dx; ey += f * dy;
      }
      return [ex, ey];
    }
    function trace(sx, sy, dir, charges, rStop) {
      var pts = [[sx, sy]], x = sx, y = sy, h = Math.max(1.6, G.w / 280);
      var endCharge = null;
      for (var i = 0; i < 1600; i++) {
        var e1 = E(x, y, charges), n1 = Math.hypot(e1[0], e1[1]) || 1;
        var mx = x + dir * e1[0] / n1 * h / 2, my = y + dir * e1[1] / n1 * h / 2;
        var e2 = E(mx, my, charges), n2 = Math.hypot(e2[0], e2[1]) || 1;
        x += dir * e2[0] / n2 * h; y += dir * e2[1] / n2 * h;
        pts.push([x, y]);
        if (x < -30 || y < -30 || x > G.w + 30 || y > G.h + 30) break;
        var hit = false;
        for (var k = 0; k < charges.length; k++) {
          var c = charges[k];
          if (c.q && Math.hypot(x - c.x, y - c.y) < rStop) { endCharge = c; hit = true; break; }
        }
        if (hit) break;
      }
      return { pts: pts, end: endCharge };
    }
    function drawLine(ctx, pts, col, dir) {
      if (pts.length < 3) return;
      ctx.strokeStyle = col; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      var m = Math.min(pts.length - 2, Math.max(8, Math.floor(pts.length * 0.35)));
      var a = pts[m], b = pts[m + 1];
      var dx = (b[0] - a[0]) * dir, dy = (b[1] - a[1]) * dir, L = Math.hypot(dx, dy) || 1;
      var ux = dx / L, uy = dy / L, hd = 6;
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(a[0] + ux * hd, a[1] + uy * hd);
      ctx.lineTo(a[0] - ux * hd * 0.6 - uy * hd * 0.6, a[1] - uy * hd * 0.6 + ux * hd * 0.6);
      ctx.lineTo(a[0] - ux * hd * 0.6 + uy * hd * 0.6, a[1] - uy * hd * 0.6 - ux * hd * 0.6);
      ctx.closePath(); ctx.fill();
    }

    function draw() {
      if (!G) return;
      var ctx = G.ctx, w = G.w, h = G.h;
      var ink = css('--ink'), ink3 = css('--ink-3'), red = css('--red'), blue = css('--blue'), sheet = css('--sheet'), line = css('--line');
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = sheet; ctx.fillRect(0, 0, w, h);
      // клетка
      ctx.strokeStyle = line; ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
      var step = w / 25;
      for (var gx = step; gx < w; gx += step) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (var gy = step; gy < h; gy += step) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
      ctx.globalAlpha = 1;

      var charges = st.c.map(function (c) { var p = px(c); return { x: p.x, y: p.y, q: c.q }; });
      var rStop = Math.max(8, w / 60);
      ctx.globalAlpha = 0.75;
      charges.forEach(function (c) {
        if (c.q > 0) {
          var n = 6 + 2 * Math.abs(c.q);
          for (var i = 0; i < n; i++) {
            var ang = (i + 0.5) / n * Math.PI * 2;
            var r0 = rStop + 2;
            var t = trace(c.x + r0 * Math.cos(ang), c.y + r0 * Math.sin(ang), +1, charges, rStop);
            drawLine(ctx, t.pts, ink3, +1);
          }
        }
      });
      charges.forEach(function (c) {
        if (c.q < 0) {
          var n = 6 + 2 * Math.abs(c.q);
          for (var i = 0; i < n; i++) {
            var ang = (i + 0.5) / n * Math.PI * 2;
            var r0 = rStop + 2;
            var t = trace(c.x + r0 * Math.cos(ang), c.y + r0 * Math.sin(ang), -1, charges, rStop);
            if (t.end && t.end.q > 0) continue; // уже нарисована от плюса
            drawLine(ctx, t.pts, ink3, -1);
          }
        }
      });
      ctx.globalAlpha = 1;

      // точка, где E = 0
      var c1 = charges[0], c2 = charges[1];
      if (c1.q && c2.q) {
        var d = Math.hypot(c2.x - c1.x, c2.y - c1.y), ux = (c2.x - c1.x) / d, uy = (c2.y - c1.y) / d, zx = null, zy = null;
        if (c1.q * c2.q > 0) {
          var x = d / (1 + Math.sqrt(Math.abs(c2.q / c1.q))); zx = c1.x + ux * x; zy = c1.y + uy * x;
        } else if (Math.abs(c1.q) !== Math.abs(c2.q)) {
          var small = Math.abs(c1.q) < Math.abs(c2.q) ? c1 : c2, big = small === c1 ? c2 : c1;
          var k = Math.sqrt(Math.abs(big.q / small.q)), xs = d / (k - 1);
          var vx = (small.x - big.x) / d, vy = (small.y - big.y) / d;
          zx = small.x + vx * xs; zy = small.y + vy * xs;
        }
        if (zx !== null && zx > 8 && zx < w - 8 && zy > 8 && zy < h - 8) {
          ctx.setLineDash([4, 3]); ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(zx, zy, 9, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = ink; ctx.font = '600 12px Onest, system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('E = 0', zx, zy - 14);
        }
      }

      // заряды
      charges.forEach(function (c, i) {
        var R = Math.max(11, w / 42);
        ctx.fillStyle = c.q > 0 ? red : c.q < 0 ? blue : ink3;
        ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.round(R * 1.3) + 'px Onest, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(c.q > 0 ? '+' : c.q < 0 ? '−' : '0', c.x, c.y + 1);
        ctx.fillStyle = ink; ctx.font = 'italic 600 14px "PT Serif", Georgia, serif'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('q' + (i === 0 ? '₁' : '₂'), c.x, c.y - R - 6);
      });

      // пробник и векторы
      var p = px(st.p), cm = cmPerPx();
      var parts = charges.map(function (c) {
        var dx = p.x - c.x, dy = p.y - c.y, rpx = Math.hypot(dx, dy) || 1, rm = rpx * cm / 100;
        var mag = c.q ? K * Math.abs(c.q) * 1e-9 / (rm * rm) : 0;
        var sgn = c.q >= 0 ? 1 : -1;
        return { ex: sgn * mag * dx / rpx, ey: sgn * mag * dy / rpx, mag: mag, rcm: rpx * cm, q: c.q };
      });
      var sx = parts[0].ex + parts[1].ex, sy = parts[0].ey + parts[1].ey, smag = Math.hypot(sx, sy);
      var mx = Math.max(parts[0].mag, parts[1].mag, smag);
      if (mx > 0) {
        var Lmax = w * 0.17, sc = Lmax / mx;
        ctx.setLineDash([3, 4]); ctx.strokeStyle = ink3; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x + parts[0].ex * sc, p.y + parts[0].ey * sc); ctx.lineTo(p.x + sx * sc, p.y + sy * sc);
        ctx.moveTo(p.x + parts[1].ex * sc, p.y + parts[1].ey * sc); ctx.lineTo(p.x + sx * sc, p.y + sy * sc);
        ctx.stroke(); ctx.setLineDash([]);
        parts.forEach(function (pt) { if (pt.mag) arrow(ctx, p.x, p.y, p.x + pt.ex * sc, p.y + pt.ey * sc, pt.q > 0 ? red : blue, 2, 9); });
        arrow(ctx, p.x, p.y, p.x + sx * sc, p.y + sy * sc, ink, 3, 12);
      }
      ctx.fillStyle = sheet; ctx.strokeStyle = ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      if (readout) {
        readout.innerHTML = 'В белой точке: <b>E₁ = ' + fmt(parts[0].mag / 1000) + ' кВ/м</b> (r₁ = ' + fmt(parts[0].rcm, 2) + ' см), <b>E₂ = ' + fmt(parts[1].mag / 1000) + ' кВ/м</b> (r₂ = ' + fmt(parts[1].rcm, 2) + ' см), сумма <b>E = ' + fmt(smag / 1000) + ' кВ/м</b>. Стрелки в одном масштабе.';
      }
    }

    function hit(pt, touch) {
      var R = touch ? 30 : 20;
      var p = px(st.p);
      if (Math.hypot(pt.x - p.x, pt.y - p.y) < R) return st.p;
      for (var i = 0; i < 2; i++) { var c = px(st.c[i]); if (Math.hypot(pt.x - c.x, pt.y - c.y) < R + 4) return st.c[i]; }
      return null;
    }
    bindDrag(cv, hit, function (obj, pt) {
      obj.fx = Math.min(0.97, Math.max(0.03, pt.x / G.w));
      obj.fy = Math.min(0.96, Math.max(0.04, pt.y / G.h));
      req();
    });
    function sync() {
      st.c[0].q = +s1.value; st.c[1].q = +s2.value;
      o1.textContent = signed(st.c[0].q); o2.textContent = signed(st.c[1].q);
      req();
    }
    s1.addEventListener('input', sync); s2.addEventListener('input', sync);
    sync();
    if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); }).observe(cv.parentElement); else window.addEventListener('resize', resize);
    document.addEventListener('themechange', function () { req(); });
    resize();
  }

  /* ---------- электрон в конденсаторе ---------- */
  function initElectron() {
    var cv = document.getElementById('eCanvas');
    if (!cv) return;
    var sU = document.getElementById('eU'), sV = document.getElementById('eV');
    var oU = document.getElementById('eUo'), oV = document.getElementById('eVo'), out = document.getElementById('eOut');
    var G = null, EM = 1.76e11, L = 0.05, D = 0.02;
    function resize() { G = setupCanvas(cv, 250 / 640); draw(); }
    function draw() {
      if (!G) return;
      var ctx = G.ctx, w = G.w, h = G.h;
      var ink = css('--ink'), ink3 = css('--ink-3'), red = css('--red'), blue = css('--blue'), sheet = css('--sheet'), line = css('--line');
      var U = +sU.value, v0 = +sV.value * 1e7;
      oU.textContent = U; oV.textContent = (+sV.value).toLocaleString('ru-RU', { minimumFractionDigits: 1 });
      ctx.fillStyle = sheet; ctx.fillRect(0, 0, w, h);
      var s = (w * 0.64) / L;                // пикселей на метр, одинаково по x и y
      var x0 = w * 0.17, x1 = x0 + L * s, yc = h / 2, half = D / 2 * s;
      // пластины
      ctx.fillStyle = red; ctx.globalAlpha = 0.85; ctx.fillRect(x0, yc - half - 7, x1 - x0, 7);
      ctx.fillStyle = blue; ctx.fillRect(x0, yc + half, x1 - x0, 7); ctx.globalAlpha = 1;
      ctx.font = '700 15px Onest, system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillStyle = red; ctx.fillText('+', x1 + 8, yc - half + 2);
      ctx.fillStyle = blue; ctx.fillText('−', x1 + 8, yc + half + 10);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, yc); ctx.lineTo(w, yc); ctx.stroke(); ctx.setLineDash([]);
      // поле
      if (U > 0) for (var fx = x0 + 30; fx < x1; fx += 60) arrow(ctx, fx, yc - half + 10, fx, yc + half - 10, ink3, 1.2, 7);
      // траектория
      var a = EM * U / D;
      var xHit = a > 0 ? v0 * Math.sqrt(D / a) : Infinity; // где y = d/2
      var hits = xHit < L;
      ctx.strokeStyle = ink; ctx.lineWidth = 2.4; ctx.beginPath();
      ctx.moveTo(0, yc); ctx.lineTo(x0, yc);
      var xEnd = hits ? xHit : L, N = 80;
      for (var i = 1; i <= N; i++) { var xx = xEnd * i / N, yy = a * xx * xx / (2 * v0 * v0); ctx.lineTo(x0 + xx * s, yc - yy * s); }
      var yExit = a * L * L / (2 * v0 * v0), vy = a * L / v0, tg = vy / v0, alpha = Math.atan(tg) * 180 / Math.PI;
      if (!hits) {
        var ex = x0 + L * s, ey = yc - yExit * s, far = w - ex;
        ctx.lineTo(w, ey - far * tg);
        ctx.stroke();
        // вектор скорости и угол
        var vl = Math.min(90, w * 0.14), ang = Math.atan(tg);
        arrow(ctx, ex, ey, ex + vl * Math.cos(ang), ey - vl * Math.sin(ang), ink, 2.2, 10);
        ctx.setLineDash([3, 3]); ctx.strokeStyle = ink3; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + vl, ey); ctx.stroke(); ctx.setLineDash([]);
        if (alpha > 0.5) { ctx.beginPath(); ctx.arc(ex, ey, 34, -ang, 0); ctx.stroke(); ctx.fillStyle = ink; ctx.font = 'italic 14px "PT Serif", serif'; ctx.fillText('α', ex + 40, ey - 6); }
      } else {
        ctx.stroke();
        ctx.fillStyle = red; ctx.beginPath(); ctx.arc(x0 + xHit * s, yc - half, 5, 0, Math.PI * 2); ctx.fill();
      }
      // электрон
      ctx.fillStyle = blue; ctx.beginPath(); ctx.arc(18, yc, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 12px Onest, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('−', 18, yc + 4); ctx.textAlign = 'left';
      if (U === 0) {
        out.innerHTML = 'Напряжения нет — поля нет, электрон летит прямо.';
      } else if (hits) {
        out.innerHTML = 'Ускорение <b>a = ' + sci(a) + ' м/с²</b>. Электрон попадает в <b>положительную</b> пластину на расстоянии <b>' + fmt(xHit * 100, 2) + ' см</b> от входа и из конденсатора не вылетает.';
      } else {
        out.innerHTML = 'a = eU/(md) = <b>' + sci(a) + ' м/с²</b>, время пролёта t = L/v₀ = <b>' + fmt(L / v0 * 1e9) + ' нс</b>, v_y = <b>' + sci(vy) + ' м/с</b>, смещение <b>' + fmt(yExit * 1000, 2) + ' мм</b>, tg α = <b>' + fmt(tg) + '</b>, α = <b>' + fmt(alpha) + '°</b>.';
      }
    }
    sU.addEventListener('input', draw); sV.addEventListener('input', draw);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv.parentElement); else window.addEventListener('resize', resize);
    document.addEventListener('themechange', draw);
    resize();
  }

  /* ---------- график тока ---------- */
  function initCurrent() {
    var cv = document.getElementById('iCanvas');
    if (!cv) return;
    var ids = ['iI0', 'iI1', 'iT', 'iR'], el = {}, mode = 'q', G = null;
    ids.forEach(function (id) { el[id] = document.getElementById(id); el[id + 'o'] = document.getElementById(id + 'o'); });
    var out = document.getElementById('iOut');
    var segBtns = document.querySelectorAll('#iWidget .seg button');
    function resize() { G = setupCanvas(cv, 260 / 640); draw(); }
    function val(id) { return +el[id].value; }
    function draw() {
      if (!G) return;
      ids.forEach(function (id) { el[id + 'o'].textContent = (+el[id].value).toLocaleString('ru-RU'); });
      var I0 = val('iI0'), I1 = val('iI1'), T = val('iT'), R = val('iR');
      var ctx = G.ctx, w = G.w, h = G.h;
      var ink = css('--ink'), ink2 = css('--ink-2'), ink3 = css('--ink-3'), sheet = css('--sheet'), line = css('--line'), amber = css('--amber'), red = css('--red');
      ctx.fillStyle = sheet; ctx.fillRect(0, 0, w, h);
      var L = 54, Rm = 18, Tp = 18, B = 34, pw = w - L - Rm, ph = h - Tp - B;
      var f = function (t) { var I = I0 + (I1 - I0) * t / T; return mode === 'q' ? I : I * I * R; };
      var ymax = mode === 'q' ? Math.max(I0, I1, 1) : Math.max(I0 * I0 * R, I1 * I1 * R, 1);
      ymax *= 1.12;
      var X = function (t) { return L + t / T * pw; }, Y = function (v) { return Tp + ph - v / ymax * ph; };
      // сетка
      ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.font = '12px Onest, system-ui, sans-serif'; ctx.fillStyle = ink2;
      for (var k = 0; k <= 4; k++) {
        var yv = ymax / 1.12 * k / 4, yy = Y(yv);
        ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(L + pw, yy); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(fmt(yv, 3), L - 6, yy + 4);
      }
      for (var j = 0; j <= 4; j++) { var tt = T * j / 4; ctx.textAlign = 'center'; ctx.fillText(fmt(tt, 3), X(tt), Tp + ph + 16); }
      ctx.textAlign = 'left'; ctx.fillStyle = ink;
      ctx.fillText(mode === 'q' ? 'I, А' : 'P = I²R, Вт', 6, 12);
      ctx.textAlign = 'right'; ctx.fillText('t, с', L + pw, Tp + ph + 30);
      // площадь
      var col = mode === 'q' ? amber : red;
      ctx.beginPath(); ctx.moveTo(X(0), Y(0));
      for (var i = 0; i <= 100; i++) { var t = T * i / 100; ctx.lineTo(X(t), Y(f(t))); }
      ctx.lineTo(X(T), Y(0)); ctx.closePath();
      ctx.globalAlpha = 0.18; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath();
      for (i = 0; i <= 100; i++) { t = T * i / 100; if (i === 0) ctx.moveTo(X(t), Y(f(t))); else ctx.lineTo(X(t), Y(f(t))); }
      ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.strokeStyle = ink3; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, Tp + ph); ctx.lineTo(L + pw, Tp + ph); ctx.stroke();
      // числа
      var q = (I0 + I1) / 2 * T;
      var Q = R * T * (I0 * I0 + I0 * I1 + I1 * I1) / 3;
      var Iav = (I0 + I1) / 2, Qwrong = Iav * Iav * R * T;
      var html = 'Заряд q = (I₀ + I₁)/2 · t = <b>' + fmt(q) + ' Кл</b>. Теплота Q = Rt(I₀² + I₀I₁ + I₁²)/3 = <b>' + fmt(Q) + ' Дж</b>.';
      if (Math.abs(Q - Qwrong) > 1e-9 && Q > 0) html += ' Если ошибочно взять средний ток, вышло бы ' + fmt(Qwrong) + ' Дж — на ' + fmt((1 - Qwrong / Q) * 100, 2) + '% меньше.';
      out.innerHTML = html + (mode === 'q' ? ' Сейчас закрашен заряд.' : ' Сейчас закрашена теплота.');
    }
    segBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-mode');
        segBtns.forEach(function (x) { x.classList.toggle('on', x === b); });
        draw();
      });
    });
    document.querySelectorAll('#iWidget [data-preset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-preset') === 'v2' ? { iI0: 5, iI1: 0, iT: 10, iR: 12, m: 'Q' } : { iI0: 0, iI1: 5, iT: 8, iR: 3, m: 'q' };
        ids.forEach(function (id) { el[id].value = p[id]; });
        mode = p.m; segBtns.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-mode') === mode); });
        draw();
      });
    });
    ids.forEach(function (id) { el[id].addEventListener('input', draw); });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv.parentElement); else window.addEventListener('resize', resize);
    document.addEventListener('themechange', draw);
    resize();
  }

  /* ---------- таймер пробника ---------- */
  function initTimer() {
    var clock = document.getElementById('clock'), bs = document.getElementById('tStart'), br = document.getElementById('tReset');
    if (!clock) return;
    var total = 60 * 60, left = total, id = null;
    function show() { var m = Math.floor(left / 60), s = left % 60; clock.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
    bs.addEventListener('click', function () {
      if (id) { clearInterval(id); id = null; bs.textContent = 'Продолжить'; return; }
      bs.textContent = 'Пауза';
      id = setInterval(function () {
        left = Math.max(0, left - 1); show();
        if (!left) { clearInterval(id); id = null; bs.textContent = 'Старт'; clock.textContent = 'Время вышло'; }
      }, 1000);
    });
    br.addEventListener('click', function () { if (id) clearInterval(id); id = null; left = total; bs.textContent = 'Старт'; show(); });
    show();
  }

  /* ---------- печать: раскрыть решения ---------- */
  window.addEventListener('beforeprint', function () { document.querySelectorAll('details').forEach(function (d) { d.open = true; }); });

  document.addEventListener('DOMContentLoaded', function () {
    renderMath();
    initTheme(); initNav(); initProgress(); initChecks();
    initField(); initElectron(); initCurrent(); initTimer();
  });
})();
