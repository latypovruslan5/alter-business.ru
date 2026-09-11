/* Ближайшие вебинары в мега-меню шапки: подменяет запечённый список живым из контент-CMS.

   Зачем вообще: список вебинаров в разметке собирает menyu-obnovit.py на момент выката, а
   вебинары проходят. Между выкатами в шапке висел бы вчерашний.

   Почему отдельным файлом, а не через dc-runtime: шапка одинаковая у 68 страниц, и у
   каждой свой класс Component. Заводить в каждом состояние и метод — это 68 мест, которые
   разъедутся при первом же ре-экспорте из дизайн-инструмента. Здесь всё в одном месте и
   правится обычным DOM.

   Запрос уходит не при загрузке страницы, а при первом наведении на шапку: большинство
   посетителей меню не открывают, и платить за них лишним запросом незачем. Ответ живёт в
   sessionStorage, поэтому при переходе по сайту запрос ровно один.

   Источник — тот же, что у страницы мероприятий: POST /api/content/webinars. Он отдаёт в
   upcoming и уже прошедшие события, поэтому отбор по дате делаем сами. */
(function () {
  'use strict';

  var KLYUCH = 'alter_menyu_vebinary';
  var SKOLKO = 1;   /* столько строк в макете; менять вместе с menyu-obnovit.py */
  var MESYACY = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
                 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var zapros = null;

  function endpoint() {
    var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    return window.ALTER_CAB_ENDPOINT || (local ? 'http://127.0.0.1:8787' : 'https://alter.ru/crm-api');
  }

  function segodnya() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function otobrat(spisok) {
    var den = segodnya();
    return (spisok || []).filter(function (v) { return v && v.date && v.date >= den; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; })
      .slice(0, SKOLKO);
  }

  /* Строка списка. Разметка повторяет menyu-sobrat.py: если правите там — правьте и тут,
     иначе после первого наведения список дёрнется. */
  function stroka(v, prefix) {
    var chasti = v.date.split('-');
    var a = document.createElement('a');
    a.href = prefix + (v.href || 'meropriyatiya-dlya-hr.html');
    a.setAttribute('style', 'display:flex; align-items:center; gap:14px; text-decoration:none;' +
      ' padding:9px 10px; border-radius:14px; transition:background .15s;');
    a.addEventListener('mouseenter', function () { a.style.background = '#F5F9F6'; });
    a.addEventListener('mouseleave', function () { a.style.background = ''; });

    var data = document.createElement('span');
    data.setAttribute('style', 'flex:0 0 auto; width:50px; display:flex; flex-direction:column;' +
      ' align-items:center; gap:1px; background:#EAF7F0; border-radius:12px; padding:8px 0;');
    var den = document.createElement('span');
    den.setAttribute('style', "font-family:'Futura PT'; font-weight:700; font-size:17px;" +
      ' line-height:1; color:#239266;');
    den.textContent = String(parseInt(chasti[2], 10));
    var mes = document.createElement('span');
    mes.setAttribute('style', 'font-size:10px; text-transform:uppercase; letter-spacing:0.8px;' +
      ' color:#5FA98A;');
    mes.textContent = MESYACY[parseInt(chasti[1], 10) - 1];
    data.appendChild(den);
    data.appendChild(mes);

    var text = document.createElement('span');
    text.setAttribute('style', 'display:flex; flex-direction:column; gap:3px; min-width:0;');
    var zag = document.createElement('span');
    zag.setAttribute('style', 'font-size:14.5px; font-weight:600; line-height:1.3; color:#282C3E;');
    zag.textContent = v.title || '';
    var pod = document.createElement('span');
    pod.setAttribute('style', 'font-size:12.5px; line-height:1.35; color:#6A7088;');
    pod.textContent = (v.type || 'Вебинар') + (v.speaker ? ' · ' + v.speaker : '');
    text.appendChild(zag);
    text.appendChild(pod);

    a.appendChild(data);
    a.appendChild(text);
    return a;
  }

  function narisovat(spisok) {
    var gnezda = document.querySelectorAll('[data-menyu-vebinary]');
    for (var i = 0; i < gnezda.length; i++) {
      var g = gnezda[i];
      /* Тот же ../, что у запечённых ссылок: на страницах кейсов шапка лежит в подпапке. */
      var obrazec = g.querySelector('a');
      var prefix = obrazec && obrazec.getAttribute('href').indexOf('../') === 0 ? '../' : '';
      /* Будущих событий нет — прячем блок целиком, вместе с заголовком «Ближайшие вебинары
         для HR» и ссылкой «Все мероприятия». Раньше чистился только список, и в меню
         оставался заголовок над пустотой. */
      if (!spisok.length) {
        var blok = g.closest ? g.closest('[data-menyu-vebinary-blok]') : null;
        if (blok) { blok.style.display = 'none'; } else { g.textContent = ''; }
        continue;
      }
      var novoe = document.createDocumentFragment();
      for (var j = 0; j < spisok.length; j++) novoe.appendChild(stroka(spisok[j], prefix));
      g.textContent = '';
      g.appendChild(novoe);
    }
  }

  function zagruzit() {
    if (zapros) return zapros;
    var sohranyonnoe = null;
    try { sohranyonnoe = JSON.parse(sessionStorage.getItem(KLYUCH) || 'null'); } catch (e) {}
    if (sohranyonnoe && sohranyonnoe.den === segodnya()) {
      zapros = Promise.resolve(sohranyonnoe.spisok);
      return zapros;
    }
    zapros = fetch(endpoint() + '/api/content/webinars', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok) return null;
      var spisok = otobrat(d.upcoming);
      try {
        sessionStorage.setItem(KLYUCH, JSON.stringify({ den: segodnya(), spisok: spisok }));
      } catch (e) {}
      return spisok;
    }).catch(function () { return null; });
    return zapros;
  }

  /* Слушаем mouseover, а не mouseenter: mouseenter не всплывает, а шапку dc-runtime
     перерисовывает — навешивать обработчик на сам пункт меню пришлось бы заново после
     каждой перерисовки. */
  function podpisatsya() {
    var odin = false;
    document.addEventListener('mouseover', function (ev) {
      if (odin) return;
      var el = ev.target;
      while (el && el !== document.body) {
        if (el.tagName === 'HEADER') break;
        el = el.parentNode;
      }
      if (!el || el.tagName !== 'HEADER') return;
      odin = true;
      zagruzit().then(function (spisok) { if (spisok) narisovat(spisok); });
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', podpisatsya);
  } else {
    podpisatsya();
  }
})();
