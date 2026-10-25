/* Защита ИДЗ — тренажёр-карточки из списка вопросов на странице */
(function () {
  'use strict';
  var KEY = 'elmagzash-known';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  var NAMES = { g: 'Общие вопросы', w: 'Отдалённый вопрос', 1: 'ИДЗ 1 · кольцо (3-04)', 2: 'ИДЗ 2 · шары (3-19)', 3: 'ИДЗ 3 · батареи (4-01)', 4: 'ИДЗ 4 · труба (5-05)', 5: 'ИДЗ 5 · рамка (5-22)', k1: 'КР 1 · стержень', k2: 'КР 2 · два заряда', k3: 'КР 3 · конденсатор', k4: 'КР 4 · теплота', k5: 'КР 5 · провода' };

  /* id для каждого вопроса — сразу, до отрисовки формул */
  var items = Array.prototype.slice.call(document.querySelectorAll('details.qcard')), cnt = {};
  items.forEach(function (d) { var t = d.getAttribute('data-t'); cnt[t] = (cnt[t] || 0) + 1; d.id = 'q' + t + '-' + cnt[t]; });
  Array.prototype.forEach.call(document.querySelectorAll('section.ktype'), function (s) {
    var n = s.querySelectorAll('details.qcard').length, h = s.querySelector('.qtitle');
    if (h && n) h.textContent += ' · ' + n;
  });
  function openHash() {
    var id = location.hash.slice(1); if (!id) return;
    var d = document.getElementById(id); if (d && d.tagName === 'DETAILS') d.open = true;
  }
  window.addEventListener('hashchange', openHash);

  document.addEventListener('DOMContentLoaded', function () {
    openHash();
    var cards = items.map(function (d) { return { id: d.id, t: d.getAttribute('data-t'), q: d.querySelector('summary').innerHTML, a: d.querySelector('.inner').innerHTML }; });
    var known = load(), filter = 'all', queue = [], shown = false;
    function $(id) { return document.getElementById(id); }
    var tag = $('zTag'), Q = $('zQ'), A = $('zA'), bs = $('zShow'), by = $('zYes'), bn = $('zNo'), left = $('zLeft'), kn = $('zKnown');
    function pool() { return cards.filter(function (c) { return filter === 'all' || c.t === filter; }); }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
    function stat() {
      var p = pool(), k = p.filter(function (c) { return known[c.id]; }).length;
      left.textContent = 'В стопке: ' + queue.length;
      kn.textContent = 'Знаю: ' + k + ' из ' + p.length;
    }
    function show() {
      shown = false; A.hidden = true; by.hidden = bn.hidden = true; bs.hidden = false;
      if (!queue.length) {
        tag.textContent = ''; Q.innerHTML = '<b>Стопка пройдена!</b> Выбери другую задачу или нажми «Начать заново».'; bs.hidden = true; stat(); return;
      }
      var c = queue[0];
      tag.innerHTML = NAMES[c.t] + ' · <a href="#' + c.id + '">в списке</a>';
      Q.innerHTML = c.q; A.innerHTML = c.a; stat();
    }
    function start() { var p = pool(), un = p.filter(function (c) { return !known[c.id]; }); queue = shuffle(un.length ? un : p.slice()); show(); }
    function reveal() { if (!queue.length || shown) return; shown = true; A.hidden = false; bs.hidden = true; by.hidden = bn.hidden = false; try { by.focus({ preventScroll: true }); } catch (e) {} }
    function yes() { if (!shown) return; var c = queue.shift(); known[c.id] = 1; save(known); show(); bs.focus({ preventScroll: true }); }
    function no() { if (!shown) return; var c = queue.shift(); delete known[c.id]; save(known); queue.splice(Math.min(3, queue.length), 0, c); show(); bs.focus({ preventScroll: true }); }
    bs.addEventListener('click', reveal); by.addEventListener('click', yes); bn.addEventListener('click', no);
    $('zReset').addEventListener('click', function () { pool().forEach(function (c) { delete known[c.id]; }); save(known); start(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-f]'), function (b) {
      b.addEventListener('click', function () {
        filter = b.getAttribute('data-f');
        Array.prototype.forEach.call(document.querySelectorAll('[data-f]'), function (x) { x.classList.toggle('on', x === b); });
        start();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.target.closest && e.target.closest('input,textarea,summary')) return;
      var r = $('trainer').getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      if ((e.key === ' ' || e.key === 'Enter') && !shown && queue.length) { e.preventDefault(); reveal(); }
      else if (e.key === 'ArrowRight') yes();
      else if (e.key === 'ArrowLeft') no();
    });
    start();
  });
})();
