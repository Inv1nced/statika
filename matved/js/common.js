/* Общие функции тренажёра «Матвед» */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const nf = (v, d = 2) => (Number.isFinite(v) ? (+v).toFixed(d).replace('.', ',').replace('-', '−') : '∞');

/* безопасный localStorage */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
};

/* разбор числа из строки: 1/3, -1/2, 0,5, ∞ */
function parseVal(s) {
  s = String(s == null ? '' : s).trim().toLowerCase().replace(/[−–—]/g, '-').replace(/,/g, '.').replace(/[%°]/g, '').replace(/\s+/g, '');
  if (!s) return NaN;
  if (/^[+-]?(∞|inf|infinity|oo|беск.*|бесконечность)$/.test(s)) return Infinity;
  let m = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
  if (m) return parseFloat(m[1]) / parseFloat(m[2]);
  if (/^[+-]?\d*\.?\d+$/.test(s)) return parseFloat(s);
  return NaN;
}
const close = (a, b, tol) => (a === Infinity && b === Infinity) || (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol);

/* индексы с чертой сверху */
const ob = n => (n < 0 ? `<span class="ob">${-n}</span>` : `${n}`);
const idxHtml = (h, k, l, br = '()') => `${br[0] || ''}${ob(h)} ${ob(k)} ${ob(l)}${br[1] || ''}`;
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };

/* граница феррита (общая настройка для двух страниц) */
const FE = {
  S: 0.8, C: 6.67,
  get A() { const v = parseFloat(store.get('matved.A', '0.025')); return Number.isFinite(v) && v > 0 && v < 0.5 ? v : 0.025; },
  set A(v) { store.set('matved.A', String(v)); document.dispatchEvent(new CustomEvent('fe-change')); }
};

/* счётчик результатов */
function makeScore(el, key) {
  let ok = +store.get('sc.' + key + '.ok', 0) || 0, tot = +store.get('sc.' + key + '.tot', 0) || 0;
  const draw = () => { el.textContent = `решено с первой попытки: ${ok} из ${tot}`; };
  draw();
  return {
    add(good) { tot++; if (good) ok++; store.set('sc.' + key + '.ok', ok); store.set('sc.' + key + '.tot', tot); draw(); },
    reset() { ok = 0; tot = 0; store.set('sc.' + key + '.ok', 0); store.set('sc.' + key + '.tot', 0); draw(); }
  };
}

/* оформление результата проверки */
function mark(el, ok) {
  el.classList.remove('okf', 'badf');
  if (ok === true) el.classList.add('okf');
  if (ok === false) el.classList.add('badf');
}

/* график: линейки, сетка, перевод координат */
function Plot(o) {
  const W = o.W || 700, H = o.H || 430, L = o.L || 66, R = 18, T = 16, B = 54;
  const X = v => L + (v - o.x0) / (o.x1 - o.x0) * (W - L - R);
  const Y = v => H - B - (v - o.y0) / (o.y1 - o.y0) * (H - T - B);
  const iX = p => o.x0 + (p - L) / (W - L - R) * (o.x1 - o.x0);
  const iY = p => o.y0 + (H - B - p) / (H - T - B) * (o.y1 - o.y0);
  let g = '';
  const steps = (a, b, st) => { const r = []; const n = Math.round((b - a) / st); for (let i = 0; i <= n; i++) r.push(a + i * st); return r; };
  if (o.xMin) steps(o.x0, o.x1, o.xMin).forEach(v => g += `<line class="gm" x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${H - B}"/>`);
  if (o.yMin) steps(o.y0, o.y1, o.yMin).forEach(v => g += `<line class="gm" x1="${L}" y1="${Y(v)}" x2="${W - R}" y2="${Y(v)}"/>`);
  steps(o.x0, o.x1, o.xMaj).forEach(v => { g += `<line class="gj" x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${H - B}"/><text x="${X(v)}" y="${H - B + 18}" text-anchor="middle">${(o.xf || nf)(v)}</text>`; });
  steps(o.y0, o.y1, o.yMaj).forEach(v => { g += `<line class="gj" x1="${L}" y1="${Y(v)}" x2="${W - R}" y2="${Y(v)}"/><text x="${L - 7}" y="${Y(v) + 4}" text-anchor="end">${(o.yf || nf)(v)}</text>`; });
  g += `<rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" class="frame"/>`;
  g += `<text x="${(L + W - R) / 2}" y="${H - 10}" text-anchor="middle" class="axl">${o.xl || ''}</text>`;
  g += `<text x="14" y="${(T + H - B) / 2}" text-anchor="middle" class="axl" transform="rotate(-90 14 ${(T + H - B) / 2})">${o.yl || ''}</text>`;
  return { W, H, L, R, T, B, X, Y, iX, iY, grid: g };
}
const pathOf = (pts, P) => 'M' + pts.map(p => `${P.X(p[0]).toFixed(1)} ${P.Y(p[1]).toFixed(1)}`).join('L');

/* подсказка с координатами при наведении на график */
function hoverReadout(svg, P, out, fmtX, fmtY) {
  const cross = svg.querySelector('.cross');
  const move = e => {
    const r = svg.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const sx = (t.clientX - r.left) * (P.W / r.width), sy = (t.clientY - r.top) * (P.H / r.height);
    if (sx < P.L || sx > P.W - P.R || sy < P.T || sy > P.H - P.B) { return; }
    if (cross) {
      cross.innerHTML = `<line x1="${sx}" y1="${P.T}" x2="${sx}" y2="${P.H - P.B}"/><line x1="${P.L}" y1="${sy}" x2="${P.W - P.R}" y2="${sy}"/>`;
    }
    out.textContent = `курсор: ${fmtX(P.iX(sx))}  ·  ${fmtY(P.iY(sy))}`;
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
}

/* вкладки */
function initTabs() {
  const tabs = $$('#tabs button');
  const show = id => {
    $$('.mode').forEach(s => s.hidden = s.id !== 'm-' + id);
    tabs.forEach(b => b.classList.toggle('on', b.dataset.m === id));
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('mode-show', { detail: id }));
  };
  tabs.forEach(b => b.onclick = () => show(b.dataset.m));
  const h = (location.hash || '').slice(1);
  show(tabs.some(b => b.dataset.m === h) ? h : 'miller');
}
