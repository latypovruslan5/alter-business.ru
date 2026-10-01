/* Шапка копии alter-business.ru на самостоятельных страницах (промо, служебные).

   На dc-страницах меню открывает рантайм, здесь — этот файл. Разметку собирает
   alter-business/shapka_kopii.py: выпадающие панели помечены data-shk-panel, пункты меню
   data-shk-drop, мобильное меню data-shk-mmenu. Поведение повторяет dc-логику главной:
   панель открывается наведением и закрывается с задержкой 220 мс, чтобы курсор успел
   дойти от пункта до панели. */
(function () {
  'use strict';
  var header = document.getElementById('siteHeader');
  if (!header) return;
  var timers = {};

  function q(sel) { return header.querySelector(sel); }

  function setDrop(key, open) {
    var panel = q('[data-shk-panel="' + key + '"]');
    var chev = q('[data-shk-chev="' + key + '"]');
    if (panel) panel.style.display = open ? 'flex' : 'none';
    if (chev) chev.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  }

  header.querySelectorAll('[data-shk-drop]').forEach(function (item) {
    var key = item.getAttribute('data-shk-drop');
    item.addEventListener('mouseenter', function () {
      clearTimeout(timers[key]);
      header.querySelectorAll('[data-shk-drop]').forEach(function (other) {
        var k = other.getAttribute('data-shk-drop');
        if (k !== key) { clearTimeout(timers[k]); setDrop(k, false); }
      });
      setDrop(key, true);
    });
    item.addEventListener('mouseleave', function () {
      clearTimeout(timers[key]);
      timers[key] = setTimeout(function () { setDrop(key, false); }, 220);
    });
  });

  var mmenu = q('[data-shk-mmenu]');
  function setMenu(open) { if (mmenu) mmenu.style.display = open ? 'flex' : 'none'; }

  header.addEventListener('click', function (e) {
    var t = e.target.closest('[data-shk-burger-btn], [data-shk-msub], [data-shk-close]');
    if (!t || !header.contains(t)) return;
    if (t.hasAttribute('data-shk-burger-btn')) {
      e.preventDefault();
      setMenu(!mmenu || mmenu.style.display !== 'flex');
    } else if (t.hasAttribute('data-shk-msub')) {
      e.preventDefault();
      var key = t.getAttribute('data-shk-msub');
      var sub = q('[data-shk-mpanel="' + key + '"]');
      var chev = q('[data-shk-mchev="' + key + '"]');
      var open = sub && sub.style.display !== 'flex';
      if (sub) sub.style.display = open ? 'flex' : 'none';
      if (chev) chev.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
    } else {
      setMenu(false);
    }
  });
})();
