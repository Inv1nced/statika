(function () {
  "use strict";

  // ================= ДАННЫЕ =================
  const app = document.getElementById("app");
  const CATS = window.CATS;
  const CAT = {};
  CATS.forEach(c => (CAT[c.id] = c));

  function parseEx(s) {
    const m = s.match(/\[([^\]]+)\]/);
    const alts = m[1].split("|");
    const pre = s.slice(0, m.index), post = s.slice(m.index + m[0].length);
    return { pre, post, a: alts[0], alts, full: pre + alts[0] + post };
  }
  const ITEMS = window.WORDS.map((w, i) =>
    Object.assign({}, w, { b: w.b || w.en, u: CAT[w.c].u, ord: i, ex: w.ex.map(parseEx) })
  );
  const BY = {};
  ITEMS.forEach(i => (BY[i.id] = i));
  const TOTAL = ITEMS.length;
  const LEARNED = 4, MAXL = 5;

  // ================= УТИЛИТЫ =================
  const $ = (s, el) => (el || document).querySelector(s);
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function dayStr(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  const shortRu = it => it.ru.split(/,| \/ |\(/)[0].trim();
  const multi = it => it.b.trim().split(/\s+/).length >= 2;

  // ================= СОХРАНЕНИЕ =================
  const KEY = "evolve4-vocab-v1";
  const S = (function () {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
    return Object.assign({ m: {}, seen: {}, mis: {}, xp: 0, streak: { n: 0, last: "" }, snd: true, tts: true, hideRu: false, sent: 0 }, d || {});
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  const lv = id => S.m[id] || 0;
  const learnedIn = list => list.filter(i => lv(i.id) >= LEARNED).length;

  // ================= ЗВУК И ОЗВУЧКА =================
  let actx = null;
  function beep(kind) {
    if (!S.snd) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime;
      const seq = kind === "ok" ? [[784, 0], [1046, 0.09]] : kind === "tick" ? [[880, 0]] : [[220, 0], [175, 0.11]];
      seq.forEach(([f, d]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = kind === "bad" ? "triangle" : "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + d);
        g.gain.exponentialRampToValueAtTime(kind === "tick" ? 0.08 : 0.16, t + d + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.2);
        o.connect(g); g.connect(actx.destination);
        o.start(t + d); o.stop(t + d + 0.22);
      });
    } catch (e) {}
  }
  let voice = null;
  function getVoice() {
    if (voice) return voice;
    try {
      const vs = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang));
      voice = vs.find(v => /Samantha|Google US English|Aria|Jenny|Ava|Allison/i.test(v.name)) ||
        vs.find(v => /en[-_]US/i.test(v.lang)) || vs[0] || null;
    } catch (e) {}
    return voice;
  }
  function speak(text, force) {
    if ((!S.tts && !force) || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[…—]/g, " "));
      u.lang = "en-US"; u.rate = 0.92;
      const v = getVoice(); if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  if ("speechSynthesis" in window) { try { speechSynthesis.onvoiceschanged = () => { voice = null; }; } catch (e) {} }

  const SPK = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3.5 9.2v5.6h3.8l5 4.2V5l-5 4.2H3.5z"/><path d="M15.6 8.6a4.8 4.8 0 0 1 0 6.8M18.3 6a8.6 8.6 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const spk = (t, cls) => `<button class="spk ${cls || ""}" type="button" data-say="${esc(t)}" aria-label="Послушать">${SPK}</button>`;

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-say]");
    if (b) { e.preventDefault(); e.stopPropagation(); speak(b.getAttribute("data-say"), true); }
  }, true);

  // ================= ОТОБРАЖЕНИЕ ПРЕДЛОЖЕНИЙ =================
  const hl = e => esc(e.pre) + "<mark>" + esc(e.a) + "</mark>" + esc(e.post);
  const blankSent = e => esc(e.pre) + `<span class="blank" style="width:${Math.min(230, 34 + e.a.length * 9)}px"></span>` + esc(e.post);
  function dots(l, prev) {
    let s = `<span class="dots" title="Уровень ${l} из ${MAXL}">`;
    for (let i = 1; i <= MAXL; i++) s += `<i class="${i <= l ? (prev != null && i > prev ? "up" : "on") : ""}"></i>`;
    return s + "</span>";
  }

  // ================= ПРОВЕРКА ВВОДА =================
  const CONTR = [["i'm", "i am"], ["don't", "do not"], ["can't", "cannot"], ["couldn't", "could not"], ["it's", "it is"],
    ["he'll", "he will"], ["you'll", "you will"], ["isn't", "is not"], ["won't", "will not"], ["doesn't", "does not"],
    ["didn't", "did not"], ["i've", "i have"], ["you've", "you have"], ["let's", "let us"], ["we're", "we are"],
    ["they're", "they are"], ["she's", "she is"], ["he's", "he is"], ["you're", "you are"]];
  function norm(s) {
    let t = " " + String(s).toLowerCase().replace(/[’‘`´ʼ]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim() + " ";
    t = t.replace(/ can not /g, " cannot ");
    for (const [c, e] of CONTR) t = t.split(" " + c + " ").join(" " + e + " ");
    return t.trim();
  }
  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  const KNOWN = new Set();
  ITEMS.forEach(i => {
    [i.b, i.en].concat(i.alt || []).forEach(x => KNOWN.add(norm(x)));
    i.ex.forEach(e => e.alts.forEach(a => KNOWN.add(norm(a))));
  });
  function itemForms(it) {
    const s = new Set([norm(it.b), norm(it.en)]);
    (it.alt || []).forEach(a => s.add(norm(a)));
    it.ex.forEach(e => e.alts.forEach(a => s.add(norm(a))));
    return s;
  }
  // ok | typo | form | wrong | empty
  function checkText(typed, answers, it) {
    const t = norm(typed);
    if (!t) return "empty";
    const A = answers.map(norm);
    if (A.includes(t)) return "ok";
    for (const a of A) {
      const allow = a.length >= 12 ? 2 : a.length >= 5 ? 1 : 0;
      if (lev(t, a) <= allow && !KNOWN.has(t)) return "typo";
    }
    for (const a of A) {
      if (a !== t && (a.endsWith(" " + t) || a.startsWith(t + " ")) && t.length >= a.length * 0.35) return "part";
    }
    if (it && itemForms(it).has(t)) return "form";
    if (it && it.p && itemForms(BY[it.p]).has(t)) return "form";
    for (const a of A) {
      const fa = a.split(" "), ft = t.split(" ");
      if (fa.length === ft.length && lev(t, a) <= 5 &&
        fa.every((w, i) => ft[i] === w || ft[i].slice(0, 4) === w.slice(0, 4))) return "form";
    }
    return "wrong";
  }
  const pattern = a => a.split(" ").map(w => w[0] + w.slice(1).replace(/[a-z]/gi, "_")).join("  ");

  // ================= ВЫБОР ВАРИАНТОВ =================
  const sameGroup = (a, b) => a.g && b.g && a.g === b.g;
  function distractors(it, n, withPartner) {
    const out = [], used = new Set([it.id]);
    const ok = o => !used.has(o.id) && !sameGroup(o, it) && norm(o.b) !== norm(it.b) && shortRu(o) !== shortRu(it);
    if (withPartner && it.p && BY[it.p]) { out.push(BY[it.p]); used.add(it.p); }
    const tiers = [
      ITEMS.filter(o => o.c === it.c && (!it.pos || o.pos === it.pos)),
      ITEMS.filter(o => o.c === it.c),
      ITEMS.filter(o => o.u === it.u),
      ITEMS
    ];
    for (const tier of tiers) {
      for (const o of shuffle(tier.slice())) {
        if (out.length >= n) break;
        if (ok(o)) { out.push(o); used.add(o.id); }
      }
      if (out.length >= n) break;
    }
    return out;
  }

  // ================= СБОРКА УРОКА =================
  function sortForLesson(pool) {
    const r = {};
    pool.forEach(i => (r[i.id] = Math.random()));
    return pool.slice().sort((a, b) => {
      const la = lv(a.id), lb = lv(b.id);
      if (la !== lb) return la - lb;
      const sa = S.seen[a.id] ? 0 : 1, sb = S.seen[b.id] ? 0 : 1;
      if (sa !== sb) return sa - sb;
      if (!S.seen[a.id]) return a.ord - b.ord;
      return r[a.id] - r[b.id];
    });
  }
  function pickLessonItems(pool, n, newMax) {
    const sorted = sortForLesson(pool), out = [];
    let nNew = 0;
    for (const it of sorted) {
      if (out.length >= n) break;
      if (!S.seen[it.id]) { if (nNew >= newMax) continue; nNew++; }
      out.push(it);
    }
    for (const it of sorted) { if (out.length >= n) break; if (!out.includes(it)) out.push(it); }
    return out;
  }
  function exIdx(it, avoid) {
    const n = it.ex.length;
    if (n < 2) return 0;
    let k;
    do { k = rnd(n); } while (k === avoid);
    return k;
  }
  function easyType(it) {
    const l = lv(it.id);
    if (l === 0) return pick(multi(it) ? ["ru2en", "choice", "build", "en2ru"] : ["en2ru", "ru2en", "choice"]);
    if (l < 3) return pick(multi(it) ? ["choice", "build", "ru2en"] : ["choice", "ru2en", "en2ru"]);
    return pick(it.p ? ["type", "form", "choice"] : ["type", "choice"]);
  }
  function hardType(it) {
    const l = lv(it.id);
    if (l <= 1) return pick(["choice", "type"]);
    return pick(it.p ? ["type", "type", "form"] : multi(it) ? ["type", "type", "build"] : ["type", "type", "choice"]);
  }
  function matchSet(items) {
    const out = [], gs = new Set(), rus = new Set();
    for (const it of shuffle(items.slice())) {
      if (out.length >= 5) break;
      const r = shortRu(it);
      if ((it.g && gs.has(it.g)) || rus.has(r)) continue;
      if (it.g) gs.add(it.g);
      rus.add(r); out.push(it.id);
    }
    return out.length >= 4 ? out : null;
  }
  function buildLesson(items) {
    const q = [], first = {};
    items.forEach(it => {
      if (!S.seen[it.id]) q.push({ t: "intro", id: it.id });
      const e = exIdx(it, -1); first[it.id] = e;
      q.push({ t: easyType(it), id: it.id, ex: e });
    });
    const m = matchSet(items);
    if (m) q.push({ t: "match", ids: m });
    shuffle(items.slice()).forEach(it => q.push({ t: hardType(it), id: it.id, ex: exIdx(it, first[it.id]) }));
    return q;
  }

  // ================= ЗАПУСК =================
  function startLesson(kind, arg) {
    let pool, title, items;
    if (kind === "cat") { pool = ITEMS.filter(i => i.c === arg); title = CAT[arg].ru; }
    else if (kind === "mis") {
      pool = ITEMS.filter(i => (S.mis[i.id] || 0) > 0)
        .sort((a, b) => (S.mis[b.id] - S.mis[a.id]) || (lv(a.id) - lv(b.id)));
      title = "Работа над ошибками";
      if (!pool.length) return renderHome();
    } else { pool = ITEMS; title = "Тренировка"; }
    items = kind === "mis" ? pool.slice(0, 6) : pickLessonItems(pool, 6, 5);
    runLesson({ mode: "lesson", title, queue: buildLesson(items), items: items.map(i => i.id), again: () => startLesson(kind, arg) });
  }
  function startExam(scope, n) {
    const pool = scope === "all" ? ITEMS : ITEMS.filter(i => String(i.u) === String(scope));
    const items = shuffle(pool.slice()).slice(0, Math.min(n, pool.length));
    const queue = items.map(it => {
      const r = Math.random();
      const t = r < 0.6 ? "type" : r < 0.85 ? "choice" : (it.p ? "form" : "ru2en");
      return { t, id: it.id, ex: rnd(it.ex.length) };
    });
    runLesson({ mode: "exam", title: "Пробный тест", queue, items: items.map(i => i.id), again: () => startExam(scope, n) });
  }

  // ================= УРОК =================
  let L = null;
  function runLesson(cfg) {
    L = Object.assign({ i: 0, correct: 0, wrong: 0, xp: 0, combo: 0, maxCombo: 0, t0: Date.now(), log: [], retries: {}, before: {}, phase: "answer", cur: null }, cfg);
    cfg.items.forEach(id => (L.before[id] = lv(id)));
    app.innerHTML = `<div class="lesson">
      <div class="ltop">
        <button class="iconbtn" id="quit" type="button" aria-label="Выйти">✕</button>
        <div class="bar"><i id="pbar" style="width:0%"></i></div>
        <span class="ltag" id="ltag"></span>
      </div>
      <div class="lbody" id="lbody"></div>
      <div class="lfoot" id="lfoot"></div>
    </div>`;
    $("#quit").onclick = () => {
      if (L.i === 0 || confirm("Выйти из урока? Прогресс по словам уже сохранён.")) { L = null; renderHome(); }
    };
    step();
  }
  function step() {
    const q = L.queue[L.i];
    $("#pbar").style.width = Math.round((100 * L.i) / L.queue.length) + "%";
    $("#ltag").innerHTML = L.combo >= 3 ? `<span class="combo">🔥 ${L.combo}</span>` : `${Math.min(L.i + 1, L.queue.length)}/${L.queue.length}`;
    if (!q) return finish();
    L.phase = "answer"; L.cur = null;
    const body = $("#lbody");
    body.classList.remove("in"); void body.offsetWidth; body.classList.add("in");
    window.scrollTo(0, 0);
    RENDER[q.t](q, BY[q.id]);
  }
  function next() { if (!L) return; L.i++; step(); }

  function padBody() {
    requestAnimationFrame(() => {
      const f = $("#lfoot"), b = $("#lbody");
      if (f && b) b.style.paddingBottom = f.offsetHeight + 28 + "px";
    });
  }
  function footAnswer(o) {
    const f = $("#lfoot");
    f.className = "lfoot";
    f.innerHTML = `<div class="lfoot-in"><div class="frow">
      ${o.skip ? `<button class="btn" id="skip" type="button">Не знаю</button>` : ""}
      ${o.info ? `<div class="finfo">${o.info}</div>` : `<button class="btn primary" id="check" type="button" ${o.enabled ? "" : "disabled"}>${o.label || "Проверить"}</button>`}
    </div></div>`;
    const c = $("#check"); if (c) c.onclick = () => L && L.cur && L.cur.check();
    const s = $("#skip"); if (s) s.onclick = () => L && L.cur && L.cur.skip();
    padBody();
  }
  function setCheck(on) { const b = $("#check"); if (b) b.disabled = !on; }
  const PRAISE = ["Верно!", "Отлично!", "Супер!", "Так держать!", "Точно!", "В яблочко!", "Красиво!"];
  function footFeedback(ok, title, detail, say) {
    L.phase = "fb";
    const f = $("#lfoot");
    f.className = "lfoot " + (ok ? "ok" : "bad");
    f.innerHTML = `<div class="lfoot-in">
      <div class="fb"><div class="fb-ico">${ok ? "✓" : "✕"}</div>
        <div class="fb-txt"><div class="fb-title">${title}</div>${detail ? `<div class="fb-detail">${detail}</div>` : ""}</div>
        ${say ? spk(say, "fb-spk") : ""}
      </div>
      <div class="frow"><button class="btn ${ok ? "primary" : "danger"}" id="next" type="button">Дальше</button></div>
    </div>`;
    $("#next").onclick = next;
    beep(ok ? "ok" : "bad");
    if (say && ok) speak(say);
    padBody();
  }
  function kick(q, text, sub) {
    return `<div class="kicker">${q.retry ? `<span class="retry">↻ Повторяем ошибку</span>` : ""}${text}${sub ? `<small>${sub}</small>` : ""}</div>`;
  }

  function grade(q, ok, hard, extra) {
    const it = BY[q.id], id = it.id, l = lv(id);
    if (ok) {
      L.correct++; L.combo++; L.maxCombo = Math.max(L.maxCombo, L.combo);
      S.m[id] = hard && !q.hinted ? Math.min(MAXL, l + 1) : l < 3 ? l + 1 : l;
      if (hard && !q.hinted && S.mis[id]) { S.mis[id]--; if (!S.mis[id]) delete S.mis[id]; }
      L.xp += hard ? 15 : 10;
    } else {
      L.wrong++; L.combo = 0;
      S.m[id] = Math.max(0, l - 1);
      S.mis[id] = (S.mis[id] || 0) + 1;
      if (L.mode !== "exam") {
        const r = L.retries[id] || 0;
        if (r < 2) { L.retries[id] = r + 1; L.queue.push({ t: q.t, id, ex: exIdx(it, q.ex), retry: true }); }
      }
    }
    S.seen[id] = true;
    if (L.mode === "exam") L.log.push(Object.assign({ id, ok, t: q.t, ex: q.ex }, extra || {}));
    save();
    $("#ltag").innerHTML = L.combo >= 3 ? `<span class="combo">🔥 ${L.combo}</span>` : `${Math.min(L.i + 1, L.queue.length)}/${L.queue.length}`;
  }

  // ---------- общий вид для заданий с вариантами ----------
  function mc(q, it, cfg) {
    const body = $("#lbody");
    body.innerHTML = kick(q, cfg.kicker, cfg.sub) + cfg.prompt +
      `<div class="opts">${cfg.opts.map((o, i) => `<button class="opt" type="button"><span class="num">${i + 1}</span><span class="otx">${esc(o.label)}</span></button>`).join("")}</div>`;
    const btns = Array.from(body.querySelectorAll(".opt"));
    let sel = -1;
    btns.forEach((b, i) => (b.onclick = () => {
      if (L.phase !== "answer") return;
      sel = i;
      btns.forEach(x => x.classList.toggle("sel", x === b));
      setCheck(true);
    }));
    footAnswer({ enabled: false });
    L.cur = {
      select(i) { if (btns[i]) btns[i].click(); },
      check() {
        if (sel < 0 || L.phase !== "answer") return;
        const ok = cfg.opts[sel].id === it.id;
        btns.forEach((b, i) => {
          b.disabled = true; b.classList.remove("sel");
          if (cfg.opts[i].id === it.id) b.classList.add("right");
          else if (i === sel) b.classList.add("wrong");
        });
        grade(q, ok, false, { typed: cfg.opts[sel].label });
        footFeedback(ok, ok ? pick(PRAISE) : "Неправильно", cfg.fb(ok), cfg.say);
      }
    };
  }

  // ---------- ввод с клавиатуры ----------
  function resolveTyped(q, it, res, typed, answer, ctx, say, inp) {
    const ok = res === "ok" || res === "typo";
    grade(q, ok, true, { typed, answer });
    if (inp) { inp.disabled = true; inp.classList.add(ok ? "good" : "badv"); }
    let title, detail;
    if (res === "ok") { title = pick(PRAISE); detail = ctx; }
    else if (res === "typo") { title = "Верно, но с опечаткой"; detail = `Правильно: <b>${esc(answer)}</b><div class="fb-ctx">${ctx}</div>`; }
    else if (res === "form") { title = "Почти! Нужна другая форма"; detail = `Правильно: <b>${esc(answer)}</b><div class="fb-ctx">${ctx}</div>`; }
    else if (res === "part") { title = "Почти! В пропуск идёт всё выражение"; detail = `Правильно: <b>${esc(answer)}</b><div class="fb-ctx">${ctx}</div>`; }
    else { title = typed ? "Неправильно" : "Правильный ответ"; detail = `Правильно: <b>${esc(answer)}</b><div class="fb-ctx">${ctx}</div>`; }
    footFeedback(ok, title, detail, say);
  }
  function bindInput(inp, onEnable) {
    inp.addEventListener("input", () => onEnable(inp.value.trim() !== ""));
    setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } }, 60);
  }

  const RENDER = {
    intro(q, it) {
      $("#lbody").innerHTML = `<div class="kicker new">✨ Новое слово</div>
        <div class="intro">
          <div class="intro-en"><span>${esc(it.en)}</span>${spk(it.b)}</div>
          <div class="intro-ru">${esc(it.ru)}</div>
          ${it.x ? `<div class="note">💡 ${esc(it.x)}</div>` : ""}
          <div class="exs">${it.ex.slice(0, 2).map(e => `<p><span>${hl(e)}</span>${spk(e.full, "sm")}</p>`).join("")}</div>
        </div>`;
      footAnswer({ enabled: true, label: "Понятно" });
      L.cur = { check() { S.seen[it.id] = true; save(); next(); } };
      speak(it.b);
    },

    en2ru(q, it) {
      const opts = shuffle([it].concat(distractors(it, 3, false))).map(o => ({ id: o.id, label: o.ru }));
      mc(q, it, {
        kicker: "Что это значит?",
        prompt: `<div class="prompt"><span>${esc(it.en)}</span>${spk(it.b)}</div>`,
        opts, say: null,
        fb: () => `<b>${esc(it.en)}</b> — ${esc(it.ru)}`
      });
      speak(it.b);
    },

    ru2en(q, it) {
      const opts = shuffle([it].concat(distractors(it, 3, true))).map(o => ({ id: o.id, label: o.b }));
      mc(q, it, {
        kicker: "Как это по-английски?",
        prompt: `<div class="prompt ru">${esc(it.ru)}</div>`,
        opts, say: it.b,
        fb: () => `<b>${esc(it.b)}</b> — ${esc(it.ru)}`
      });
    },

    choice(q, it) {
      const e = it.ex[q.ex];
      const opts = shuffle([it].concat(distractors(it, 3, true))).map(o => ({ id: o.id, label: o.b }));
      const formDiffers = norm(e.a) !== norm(it.b);
      mc(q, it, {
        kicker: "Что подходит по смыслу?",
        sub: formDiffers ? "варианты в начальной форме — в предложении слово может измениться" : "",
        prompt: `<div class="sent">${blankSent(e)}</div>`,
        opts, say: e.full,
        fb: () => `<div class="fb-ctx">${hl(e)}</div><div class="fb-ru">${esc(it.b)} — ${esc(it.ru)}</div>`
      });
    },

    type(q, it) {
      const e = it.ex[q.ex], exam = L.mode === "exam";
      const sub = /^be /i.test(it.b) && /^(is|are|was|were|will|am|i'm|be)\b/i.test(e.a)
        ? "в нужной форме — вместе с is / are / was…" : "в нужной форме, целиком";
      $("#lbody").innerHTML = kick(q, "Впиши пропущенное", sub) +
        `<div class="sent">${blankSent(e)}</div>
        <div class="ruhint"><span>по смыслу:</span> <b>${esc(it.ru)}</b></div>
        <input class="ans" id="ans" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="Пиши по-английски…" aria-label="Ответ">
        ${exam ? "" : `<button class="linkbtn" id="hint" type="button">💡 Показать первые буквы</button><div class="hintline" id="hintline"></div>`}`;
      const inp = $("#ans");
      footAnswer({ enabled: false, skip: true });
      bindInput(inp, setCheck);
      const h = $("#hint");
      if (h) h.onclick = () => { q.hinted = true; $("#hintline").textContent = pattern(e.a); h.remove(); inp.focus(); };
      const ctx = `${hl(e)}`;
      L.cur = {
        check() {
          if (L.phase !== "answer" || !inp.value.trim()) return;
          resolveTyped(q, it, checkText(inp.value, e.alts, it), inp.value.trim(), e.a, ctx, e.full, inp);
        },
        skip() { if (L.phase === "answer") resolveTyped(q, it, "wrong", "", e.a, ctx, e.full, inp); }
      };
    },

    form(q, it) {
      const src = BY[it.p], toN = it.pos === "n";
      $("#lbody").innerHTML = kick(q, toN ? "Образуй существительное" : "Образуй прилагательное") +
        `<div class="formrow"><span class="fsrc">${esc(src.b)}</span><span class="farrow">→</span><span class="fq">?</span></div>
        <div class="ruhint"><span>нужно слово:</span> <b>${esc(it.ru)}</b></div>
        <input class="ans" id="ans" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${toN ? "существительное" : "прилагательное"}…" aria-label="Ответ">`;
      const inp = $("#ans");
      footAnswer({ enabled: false, skip: true });
      bindInput(inp, setCheck);
      const answers = [it.b].concat(it.alt || []);
      const ctx = `${esc(src.b)} → <mark>${esc(it.b)}</mark>`;
      L.cur = {
        check() {
          if (L.phase !== "answer" || !inp.value.trim()) return;
          resolveTyped(q, it, checkText(inp.value, answers, it), inp.value.trim(), it.b, ctx, it.b, inp);
        },
        skip() { if (L.phase === "answer") resolveTyped(q, it, "wrong", "", it.b, ctx, it.b, inp); }
      };
    },

    build(q, it) {
      const words = it.b.split(/\s+/);
      const clean = w => w.toLowerCase().replace(/[^a-z']/g, "");
      const have = new Set(words.map(clean));
      const extraPool = [];
      distractors(it, 5, false).forEach(o => o.b.split(/\s+/).forEach(w => {
        const k = clean(w);
        if (k && !have.has(k) && !extraPool.some(x => clean(x) === k)) extraPool.push(w);
      }));
      const nExtra = Math.min(3, Math.max(2, Math.ceil(words.length / 2)));
      const tiles = shuffle(words.concat(shuffle(extraPool).slice(0, nExtra)));
      const placed = [];
      $("#lbody").innerHTML = kick(q, "Собери выражение") +
        `<div class="prompt ru">${esc(it.ru)}</div>
        <div class="zone" id="zone"></div>
        <div class="bank" id="bank"></div>`;
      const zone = $("#zone"), bank = $("#bank");
      function draw() {
        zone.innerHTML = placed.map((k, i) => `<button class="tile" type="button" data-z="${i}">${esc(tiles[k])}</button>`).join("");
        bank.innerHTML = tiles.map((w, k) => `<button class="tile ${placed.includes(k) ? "ph" : ""}" type="button" data-k="${k}" ${placed.includes(k) ? 'tabindex="-1" aria-hidden="true"' : ""}>${esc(w)}</button>`).join("");
        setCheck(placed.length > 0);
      }
      zone.onclick = ev => {
        const b = ev.target.closest("[data-z]");
        if (!b || L.phase !== "answer") return;
        placed.splice(+b.dataset.z, 1); draw();
      };
      bank.onclick = ev => {
        const b = ev.target.closest("[data-k]");
        if (!b || L.phase !== "answer") return;
        const k = +b.dataset.k;
        if (placed.includes(k)) return;
        placed.push(k); beep("tick"); draw();
      };
      footAnswer({ enabled: false, skip: true });
      draw();
      L.cur = {
        check() {
          if (L.phase !== "answer" || !placed.length) return;
          const got = placed.map(k => tiles[k]).join(" ");
          const ok = norm(got) === norm(it.b);
          grade(q, ok, false, { typed: got });
          zone.classList.add(ok ? "good" : "badv");
          footFeedback(ok, ok ? pick(PRAISE) : "Неправильно", `<b>${esc(it.b)}</b> — ${esc(it.ru)}`, it.b);
        },
        skip() {
          if (L.phase !== "answer") return;
          grade(q, false, false, { typed: "" });
          footFeedback(false, "Правильный ответ", `<b>${esc(it.b)}</b> — ${esc(it.ru)}`, it.b);
        }
      };
    },

    match(q) {
      const its = q.ids.map(id => BY[id]);
      const left = shuffle(its.slice()), right = shuffle(its.slice());
      $("#lbody").innerHTML = kick(q, "Найди пары") +
        `<div class="match">
          <div class="mcol">${left.map(i => `<button class="mt" type="button" data-side="l" data-id="${i.id}">${esc(i.b)}</button>`).join("")}</div>
          <div class="mcol">${right.map(i => `<button class="mt" type="button" data-side="r" data-id="${i.id}">${esc(shortRu(i))}</button>`).join("")}</div>
        </div>`;
      footAnswer({ info: "Нажми на слово, потом на перевод" });
      let selL = null, selR = null, done = 0, miss = 0, lock = false;
      $("#lbody").querySelector(".match").onclick = ev => {
        const b = ev.target.closest(".mt");
        if (!b || lock || b.classList.contains("done") || L.phase !== "answer") return;
        if (b.dataset.side === "l") {
          if (selL) selL.classList.remove("sel");
          selL = b; speak(BY[b.dataset.id].b);
        } else {
          if (selR) selR.classList.remove("sel");
          selR = b;
        }
        b.classList.add("sel");
        if (selL && selR) {
          const a = selL, c = selR;
          selL = selR = null;
          if (a.dataset.id === c.dataset.id) {
            [a, c].forEach(x => { x.classList.remove("sel"); x.classList.add("done"); });
            done++; beep("tick");
            if (done === its.length) {
              L.correct++; L.combo++; L.maxCombo = Math.max(L.maxCombo, L.combo); L.xp += 10;
              footFeedback(true, miss ? "Все пары собраны!" : "Все пары с первого раза!", miss ? `Промахов: ${miss}` : "", null);
            }
          } else {
            miss++; lock = true; beep("bad");
            [a, c].forEach(x => { x.classList.remove("sel"); x.classList.add("bad"); });
            setTimeout(() => { [a, c].forEach(x => x.classList.remove("bad")); lock = false; }, 450);
          }
        }
      };
      L.cur = { check() {} };
    }
  };

  // ================= ИТОГИ =================
  function finish() {
    const exam = L.mode === "exam";
    if (!exam) L.xp += 20 + (L.wrong === 0 ? 10 : 0);
    S.xp += L.xp;
    const t = dayStr(new Date());
    if (S.streak.last !== t) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      S.streak.n = S.streak.last === dayStr(y) ? S.streak.n + 1 : 1;
      S.streak.last = t;
    }
    save();
    const answered = L.correct + L.wrong;
    const acc = answered ? Math.round((100 * L.correct) / answered) : 100;
    const sec = Math.round((Date.now() - L.t0) / 1000);
    const time = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
    exam ? renderExamResult(time) : renderLessonResult(acc, time);
    window.scrollTo(0, 0);
  }

  function renderLessonResult(acc, time) {
    const rows = L.items.map(id => {
      const it = BY[id];
      return `<div class="wrow"><div class="wtxt"><b>${esc(it.en)}</b><small>${esc(it.ru)}</small></div>${dots(lv(id), L.before[id])}</div>`;
    }).join("");
    const learned = learnedIn(ITEMS);
    const again = L.again;
    app.innerHTML = `<div class="res">
      <div class="res-ico">${acc >= 90 ? "🏆" : acc >= 70 ? "🎉" : "💪"}</div>
      <h1>${acc >= 90 ? "Отличный урок!" : acc >= 70 ? "Урок пройден!" : "Урок пройден"}</h1>
      <p class="res-sub">${acc >= 70 ? `Выучено ${learned} из ${TOTAL}. ${L.maxCombo >= 5 ? `Серия без ошибок — ${L.maxCombo} подряд.` : ""}` : "Ошибки ушли в «Работу над ошибками» — они ещё попадутся."}</p>
      <div class="stats3">
        <div class="st xp"><b>+${L.xp}</b><small>опыт</small></div>
        <div class="st acc"><b>${acc}%</b><small>точность</small></div>
        <div class="st tm"><b>${time}</b><small>время</small></div>
      </div>
      <div class="card left"><div class="card-h">Слова урока <span class="legend"><i class="up"></i>выросло</span></div>${rows}</div>
      <div class="res-btns">
        <button class="btn primary wide" id="again" type="button">Ещё урок</button>
        <button class="btn wide" id="home" type="button">На главную</button>
      </div>
    </div>`;
    L = null;
    $("#again").onclick = again;
    $("#home").onclick = renderHome;
  }

  function renderExamResult(time) {
    const N = L.queue.length, ok = L.correct, pct = N ? Math.round((100 * ok) / N) : 0;
    const verdict = pct >= 90 ? "Готов к тесту 💪" : pct >= 75 ? "Почти готов — добей ошибки" : pct >= 50 ? "Неплохо, но ещё пару уроков" : "Надо потренироваться";
    const mistakes = L.log.filter(x => !x.ok).map(x => {
      const it = BY[x.id], e = it.ex[x.ex];
      let ctx;
      if (x.t === "type" || x.t === "choice") ctx = hl(e);
      else if (x.t === "form") ctx = `${esc(BY[it.p].b)} → <mark>${esc(it.b)}</mark>`;
      else ctx = `<mark>${esc(it.b)}</mark> — ${esc(it.ru)}`;
      return `<div class="mis"><div>${ctx}</div><small>Твой ответ: ${x.typed ? esc(x.typed) : "—"} · ${esc(shortRu(it))}</small></div>`;
    }).join("");
    const again = L.again;
    app.innerHTML = `<div class="res">
      <div class="res-ico">${pct >= 90 ? "🏆" : pct >= 75 ? "🎯" : "📚"}</div>
      <h1>${ok} из ${N}</h1>
      <p class="res-sub">${pct}% · ${verdict}</p>
      <div class="stats3">
        <div class="st acc"><b>${pct}%</b><small>верно</small></div>
        <div class="st xp"><b>+${L.xp}</b><small>опыт</small></div>
        <div class="st tm"><b>${time}</b><small>время</small></div>
      </div>
      ${mistakes ? `<div class="card left"><div class="card-h">Ошибки — разбор</div>${mistakes}</div>` : `<div class="card"><b>Ни одной ошибки!</b></div>`}
      <div class="res-btns">
        ${mistakes ? `<button class="btn primary wide" id="fix" type="button">Учить эти ошибки</button>` : ""}
        <button class="btn ${mistakes ? "" : "primary"} wide" id="again" type="button">Пройти ещё раз</button>
        <button class="btn wide" id="home" type="button">На главную</button>
      </div>
    </div>`;
    L = null;
    if ($("#fix")) $("#fix").onclick = () => startLesson("mis");
    $("#again").onclick = again;
    $("#home").onclick = renderHome;
  }

  // ================= ГЛАВНАЯ =================
  function renderHome() {
    L = null;
    const learned = learnedIn(ITEMS);
    const seen = ITEMS.filter(i => S.seen[i.id]).length;
    const misN = ITEMS.filter(i => (S.mis[i.id] || 0) > 0).length;
    const pct = Math.round((100 * learned) / TOTAL);
    const left = TOTAL - learned;
    const hint = learned === TOTAL ? "Всё выучено! Прогони пробный тест пару раз перед парой."
      : seen < TOTAL ? `Новых слов осталось: ${TOTAL - seen}. Урок ≈ 3–4 минуты, по 6 слов.`
      : `Все слова уже видел — осталось закрепить ${left}. Лучше всего — вписывать самому.`;
    const unit = u => {
      const cs = CATS.filter(c => c.u === u);
      const its = ITEMS.filter(i => i.u === u);
      return `<section class="unit">
        <div class="unit-h"><span class="unit-badge">Unit ${u}</span><span class="unit-meta">${learnedIn(its)}/${its.length} выучено</span></div>
        <div class="cats">${cs.map(c => {
          const ci = ITEMS.filter(i => i.c === c.id), lc = learnedIn(ci);
          const prog = Math.round((100 * ci.reduce((s, i) => s + Math.min(lv(i.id), LEARNED), 0)) / (ci.length * LEARNED));
          return `<button class="cat ${lc === ci.length ? "full" : ""}" type="button" data-cat="${c.id}" style="--h:${c.hue}">
            <span class="ci">${c.icon}</span>
            <span class="cb"><b>${esc(c.ru)}</b><small>${esc(c.en)} · ${ci.length} слов</small>
              <span class="bar sm"><i style="width:${prog}%"></i></span></span>
            <span class="cn">${lc === ci.length ? "👑" : `${lc}/${ci.length}`}</span>
          </button>`;
        }).join("")}</div>
      </section>`;
    };
    app.innerHTML = `<div class="home">
      <header class="top">
        <div class="brand"><span class="logo">E4</span><div><b>Английский</b><small>Evolve 4 · Units 1–3</small></div></div>
        <div class="pills"><span class="pill streak" title="Дней подряд">🔥 ${S.streak.n}</span><span class="pill xp" title="Опыт">⚡ ${S.xp}</span></div>
      </header>

      <section class="hero">
        <div class="hero-row">
          <div><div class="hero-num">${learned}<span> / ${TOTAL}</span></div><div class="hero-sub">слов выучено</div></div>
          <div class="hero-pct">${pct}%</div>
        </div>
        <div class="bar big"><i style="width:${pct}%"></i></div>
        <p class="hint">${hint}</p>
        <button class="btn primary wide big" id="smart" type="button">${seen ? "Продолжить" : "Начать"} тренировку</button>
      </section>

      <section class="modes">
        <button class="mode" type="button" id="m-exam"><span class="mi">📝</span><b>Пробный тест</b><span>Как на паре: вставить слова в предложения</span></button>
        <button class="mode" type="button" id="m-sent"><span class="mi">✍️</span><b>Свои предложения</b><span>Придумай предложение со словом</span></button>
        <button class="mode" type="button" id="m-dict"><span class="mi">📖</span><b>Словарь</b><span>Все ${TOTAL} слов с примерами</span></button>
        <button class="mode ${misN ? "" : "off"}" type="button" id="m-mis"><span class="mi">🔁</span><b>Ошибки</b><span>${misN ? `${misN} на повтор` : "Пока пусто"}</span></button>
      </section>

      ${[1, 2, 3].map(unit).join("")}

      <section class="howto card">
        <div class="card-h">Как это работает</div>
        <p>У каждого слова шкала ${dots(3)} из пяти делений. Задания с вариантами поднимают её максимум до трёх, дальше — только когда вписываешь слово сам, без подсказки. Слово считается выученным с четырёх делений. Ошибка отнимает деление и возвращает слово в конец урока.</p>
      </section>

      <footer class="settings">
        <button class="chip ${S.snd ? "on" : ""}" id="t-snd" type="button">${S.snd ? "🔔 Звуки вкл" : "🔕 Звуки выкл"}</button>
        <button class="chip ${S.tts ? "on" : ""}" id="t-tts" type="button">${S.tts ? "🗣 Озвучка вкл" : "🤐 Озвучка выкл"}</button>
      </footer>
    </div>`;
    window.scrollTo(0, 0);
    $("#smart").onclick = () => startLesson("smart");
    $("#m-exam").onclick = renderExamSetup;
    $("#m-sent").onclick = () => renderSentences();
    $("#m-dict").onclick = renderDict;
    $("#m-mis").onclick = () => { if (misN) startLesson("mis"); };
    app.querySelectorAll("[data-cat]").forEach(b => (b.onclick = () => startLesson("cat", b.dataset.cat)));
    $("#t-snd").onclick = () => { S.snd = !S.snd; save(); renderHome(); };
    $("#t-tts").onclick = () => { S.tts = !S.tts; save(); renderHome(); };
  }

  function subHead(title) {
    return `<header class="sub"><button class="iconbtn" id="back" type="button" aria-label="Назад">←</button><h2>${title}</h2></header>`;
  }
  const SCOPES = [["all", "Всё"], ["1", "Unit 1"], ["2", "Unit 2"], ["3", "Unit 3"]];
  const scopeChips = (cur, id) => `<div class="chips" id="${id}">${SCOPES.map(([v, t]) => `<button class="chip ${cur === v ? "on" : ""}" type="button" data-v="${v}">${t}</button>`).join("")}</div>`;

  // ================= ПРОБНЫЙ ТЕСТ =================
  const EX = { scope: "all", n: 20 };
  function renderExamSetup() {
    app.innerHTML = subHead("Пробный тест") + `<div class="card">
      <p class="lead">Как на паре: вставляешь слова в предложения в нужной форме, иногда выбираешь из вариантов или образуешь слово. Подсказок по буквам нет, второго шанса тоже. В конце — разбор ошибок.</p>
      <div class="lbl">Что проверяем</div>${scopeChips(EX.scope, "sc")}
      <div class="lbl">Сколько вопросов</div>
      <div class="chips" id="nc">${[10, 20, 30].map(n => `<button class="chip ${EX.n === n ? "on" : ""}" type="button" data-v="${n}">${n}</button>`).join("")}</div>
      <button class="btn primary wide big" id="go" type="button">Начать тест</button>
    </div>`;
    $("#back").onclick = renderHome;
    $("#sc").onclick = e => { const b = e.target.closest("[data-v]"); if (b) { EX.scope = b.dataset.v; renderExamSetup(); } };
    $("#nc").onclick = e => { const b = e.target.closest("[data-v]"); if (b) { EX.n = +b.dataset.v; renderExamSetup(); } };
    $("#go").onclick = () => startExam(EX.scope, EX.n);
    window.scrollTo(0, 0);
  }

  // ================= СВОИ ПРЕДЛОЖЕНИЯ =================
  function keyRe(it) {
    if (it.k) return new RegExp("(^|[^a-z])(?:" + it.k + ")", "i");
    if (it.pos) return new RegExp("(^|[^a-z])(?:" + [it.b].concat(it.alt || []).map(escRe).join("|") + ")s?($|[^a-z])", "i");
    const w = it.b.toLowerCase();
    const stem = w.length > 5 ? w.slice(0, w.length - 2) : w.replace(/e$/, "");
    return new RegExp("(^|[^a-z])" + escRe(stem), "i");
  }
  let SM = null;
  function renderSentences(scope) {
    scope = scope || (SM && SM.scope) || "all";
    const pool = scope === "all" ? ITEMS : ITEMS.filter(i => String(i.u) === scope);
    const r = {}; pool.forEach(i => (r[i.id] = Math.random()));
    const list = pool.slice().sort((a, b) => ((S.seen[a.id] ? 0 : 1) - (S.seen[b.id] ? 0 : 1)) || (lv(a.id) - lv(b.id)) || (r[a.id] - r[b.id]));
    SM = { scope, list, i: 0, done: SM ? SM.done : 0 };
    drawSentence();
  }
  function drawSentence() {
    const it = SM.list[SM.i % SM.list.length];
    app.innerHTML = subHead("Свои предложения") + scopeChips(SM.scope, "ssc") + `
      <div class="card sm">
        <div class="sm-top"><span class="pill">✍️ ${SM.done} готово</span><span class="muted small">${CAT[it.c].icon} ${esc(CAT[it.c].ru)}</span></div>
        <div class="intro-en"><span>${esc(it.en)}</span>${spk(it.b)}</div>
        <div class="intro-ru">${esc(it.ru)}</div>
        ${it.x ? `<div class="note">💡 ${esc(it.x)}</div>` : ""}
        <textarea class="big" id="st" rows="3" autocapitalize="sentences" spellcheck="false" placeholder="Напиши своё предложение с этим выражением…"></textarea>
        <div id="sfb"></div>
        <div class="frow">
          <button class="btn" id="sskip" type="button">Пропустить</button>
          <button class="btn primary" id="scheck" type="button" disabled>Проверить</button>
        </div>
      </div>
      <p class="muted small center">Проверка смотрит, есть ли выражение в предложении и не слишком ли оно короткое. Грамматику сверь с примерами — они откроются после проверки.</p>`;
    $("#back").onclick = renderHome;
    $("#ssc").onclick = e => { const b = e.target.closest("[data-v]"); if (b) renderSentences(b.dataset.v); };
    const ta = $("#st"), btn = $("#scheck");
    let checked = false;
    ta.addEventListener("input", () => { if (!checked) btn.disabled = !ta.value.trim(); });
    $("#sskip").onclick = () => { SM.i++; drawSentence(); };
    btn.onclick = () => {
      if (checked) { SM.i++; drawSentence(); return; }
      const text = ta.value.replace(/[’‘]/g, "'").trim();
      if (!text) return;
      const has = keyRe(it).test(text);
      const nw = text.split(/\s+/).filter(Boolean).length;
      const tips = [];
      if (nw < 5) tips.push("Коротковато — на тесте лучше 6–12 слов, с деталями.");
      if (!/^[A-Z"«—-]/.test(text)) tips.push("Начни с заглавной буквы.");
      if (!/[.!?…]["»]?$/.test(text)) tips.push("Поставь точку в конце.");
      if (/[а-яё]/i.test(text)) tips.push("В предложении есть русские буквы.");
      $("#sfb").innerHTML = `<div class="sfb ${has ? "ok" : "bad"}">
          <div class="sfb-h">${has ? "✓ Выражение на месте" : `✕ Не вижу «${esc(it.b)}» — проверь написание и форму`}</div>
          ${tips.map(t => `<div class="sfb-t">• ${t}</div>`).join("")}
        </div>
        <div class="sfb-ex"><div class="lbl">Как это звучит в примерах</div>${it.ex.map(e => `<p>${hl(e)}</p>`).join("")}</div>`;
      beep(has ? "ok" : "bad");
      if (has) { SM.done++; S.sent = (S.sent || 0) + 1; S.xp += 5; save(); }
      checked = true;
      btn.textContent = "Следующее слово";
      $("#sskip").textContent = "Ещё раз";
      $("#sskip").onclick = () => drawSentence();
    };
    window.scrollTo(0, 0);
  }

  // ================= СЛОВАРЬ =================
  const DQ = { q: "", u: "all" };
  function renderDict() {
    app.innerHTML = subHead("Словарь") + `
      <input class="search" id="dq" type="search" placeholder="Поиск по-английски или по-русски" value="${esc(DQ.q)}" autocomplete="off" autocapitalize="off" spellcheck="false">
      ${scopeChips(DQ.u, "du")}
      <label class="tgl"><input type="checkbox" id="hr" ${S.hideRu ? "checked" : ""}><span>Прятать перевод — проверь себя, нажми на слово</span></label>
      <div id="dlist"></div>
      <div class="danger"><button class="linkbtn red" id="reset" type="button">Сбросить весь прогресс</button></div>`;
    $("#back").onclick = renderHome;
    $("#dq").addEventListener("input", e => { DQ.q = e.target.value; drawDict(); });
    $("#du").onclick = e => { const b = e.target.closest("[data-v]"); if (b) { DQ.u = b.dataset.v; app.querySelectorAll("#du .chip").forEach(c => c.classList.toggle("on", c === b)); drawDict(); } };
    $("#hr").onchange = e => { S.hideRu = e.target.checked; save(); drawDict(); };
    $("#reset").onclick = () => {
      if (confirm("Точно сбросить весь прогресс? Шкалы слов, опыт и ошибки обнулятся.")) {
        S.m = {}; S.seen = {}; S.mis = {}; S.xp = 0; S.streak = { n: 0, last: "" }; S.sent = 0; save(); renderHome();
      }
    };
    $("#dlist").onclick = e => {
      const lb = e.target.closest("[data-learn]");
      if (lb) { startLesson("cat", lb.dataset.learn); return; }
      const row = e.target.closest(".drow-main");
      if (!row) return;
      const box = row.parentElement, more = box.querySelector(".drow-more");
      const open = more.hidden;
      more.hidden = !open;
      box.classList.toggle("open", open);
      const ru = box.querySelector(".drow-ru");
      if (open) ru.classList.remove("blur"); else if (S.hideRu) ru.classList.add("blur");
    };
    drawDict();
    window.scrollTo(0, 0);
  }
  function drawDict() {
    const q = DQ.q.trim().toLowerCase();
    const html = CATS.filter(c => DQ.u === "all" || String(c.u) === DQ.u).map(c => {
      const its = ITEMS.filter(i => i.c === c.id && (!q || i.en.toLowerCase().includes(q) || i.ru.toLowerCase().includes(q)));
      if (!its.length) return "";
      return `<div class="dgroup">
        <h3><span class="dic" style="--h:${c.hue}">${c.icon}</span><span>${esc(c.ru)}<small>${esc(c.en)} · Unit ${c.u}</small></span><button class="mini" type="button" data-learn="${c.id}">Учить</button></h3>
        ${its.map(it => `<div class="drow">
          <div class="drow-main" role="button" tabindex="0">
            <div class="drow-txt"><div class="drow-en">${esc(it.en)}</div><div class="drow-ru ${S.hideRu ? "blur" : ""}">${esc(it.ru)}</div></div>
            ${dots(lv(it.id))}${spk(it.b)}
          </div>
          <div class="drow-more" hidden>${it.x ? `<div class="note">💡 ${esc(it.x)}</div>` : ""}${it.ex.map(e => `<p>${hl(e)}</p>`).join("")}</div>
        </div>`).join("")}
      </div>`;
    }).join("");
    $("#dlist").innerHTML = html || `<p class="muted center">Ничего не нашлось</p>`;
  }

  // ================= КЛАВИАТУРА =================
  document.addEventListener("keydown", e => {
    if (!L || !$("#lfoot")) {
      if (e.key === "Enter" && e.target && e.target.classList && e.target.classList.contains("drow-main")) e.target.click();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (L.phase === "fb") { const n = $("#next"); if (n) n.click(); }
      else { const c = $("#check"); if (c && !c.disabled) c.click(); }
    } else if (L.phase === "answer" && /^[1-4]$/.test(e.key) && L.cur && L.cur.select && e.target.tagName !== "INPUT") {
      L.cur.select(+e.key - 1);
    }
  });

  // для проверки из консоли
  window.__trainer = { ITEMS, S, checkText, keyRe, distractors, buildLesson, pickLessonItems, lesson: () => L };

  renderHome();
})();
