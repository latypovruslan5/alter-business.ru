/* Проверки полей форм для всех страниц. Ставятся один раз через делегирование
   событий на document — поэтому переживают ре-рендер dc-runtime и работают в любой
   форме, включая те, что появляются в модалках уже после загрузки страницы.

   1. Простая маска +7 XXX XXX-XX-XX. Работает только там, где НЕТ phone-intl.js
      (международная маска с выбором страны) — см. isTel(). Сейчас это страницы
      без полей телефона, то есть фактически маска не используется; код оставлен
      как запасной вариант.
   2. Почта: формат, одноразовые сервисы (блокируем, список из disposable-domains.js),
      личная почта вместо корпоративной (не блокируем, показываем подсказку).
   3. Название компании: отсев очевидного мусора — прочерки, «тест», одна буква.

   Проверки телефона на правдоподобность живут в phone-intl.js, рядом с масками
   стран: там есть и код страны, и национальная часть номера. */
(function () {
  /* ---------- phone mask ---------- */
  function digitsOnly(s) { return (s || '').replace(/\D/g, ''); }
  function natDigits(d) {
    if (!d) return '';
    if (d[0] === '8' || d[0] === '7') d = d.slice(1);
    return d.slice(0, 10);
  }
  function formatPhone(r) {
    var out = '+7 ';
    if (!r) return out;
    out += r.slice(0, 3);
    if (r.length > 3) out += ' ' + r.slice(3, 6);
    if (r.length > 6) out += '-' + r.slice(6, 8);
    if (r.length > 8) out += '-' + r.slice(8, 10);
    return out;
  }
  /* Если на странице подключён phone-intl.js (международная маска с выбором страны),
     телефоны ведёт он, а здесь остаётся только проверка почты — иначе две маски
     перетирали бы значение друг друга. Флаг проверяется в момент события, а не при
     загрузке: оба скрипта грузятся с defer, и phone-intl.js выполняется позже. */
  function isTel(el) {
    return el && el.tagName === 'INPUT'
      && (el.getAttribute('type') || '').toLowerCase() === 'tel'
      && !window.__alterPhoneIntl;
  }
  var prevVal = new WeakMap();
  function setVal(el, v) {
    el.value = v;
    try { el.setSelectionRange(v.length, v.length); } catch (_) {}
    prevVal.set(el, v);
  }
  function phoneValidity(el, r) {
    var msg = (r.length > 0 && r.length < 10) ? 'Введите номер полностью' : '';
    try { el.setCustomValidity(msg); } catch (_) {}
  }
  function onPhoneInput(e) {
    var el = e.target;
    if (!isTel(el)) return;
    var before = prevVal.get(el) || '';
    var deleting = e.inputType ? e.inputType.indexOf('delete') === 0 : (el.value.length < before.length);
    var r = natDigits(digitsOnly(el.value));
    if (deleting) {
      var beforeR = natDigits(digitsOnly(before));
      /* deletion removed only a separator (space or dash) —
         drop the digit before it too, so backspace always makes progress */
      if (r && beforeR === r && el.value.length < before.length) r = r.slice(0, -1);
    }
    setVal(el, formatPhone(r));
    phoneValidity(el, r);
  }
  function onPhoneFocus(e) {
    var el = e.target;
    if (!isTel(el)) return;
    if (!digitsOnly(el.value)) {
      setTimeout(function () {
        if (document.activeElement === el && !digitsOnly(el.value)) setVal(el, '+7 ');
      }, 0);
    }
  }
  function onPhoneBlur(e) {
    var el = e.target;
    if (!isTel(el)) return;
    if (!natDigits(digitsOnly(el.value))) {
      el.value = '';
      prevVal.set(el, '');
      try { el.setCustomValidity(''); } catch (_) {}
    }
  }
  document.addEventListener('input', onPhoneInput, true);
  document.addEventListener('focus', onPhoneFocus, true);
  document.addEventListener('blur', onPhoneBlur, true);

  /* ---------- проверка почты ----------
     Три уровня: формат, одноразовые сервисы (блокируем), личная почта
     (не блокируем — только подсказка, лид всё равно нужен). */

  /* Личные почтовые сервисы. Заявку с такой почтой принимаем: у малого бизнеса
     это часто единственный рабочий адрес. Показываем подсказку, потому что в
     самом поле написано «Корпоративная почта» — по домену менеджер сразу видит,
     что компанию по почте не определить. */
  var PERSONAL_MAIL = {
    'gmail.com': 1, 'mail.ru': 1, 'inbox.ru': 1, 'bk.ru': 1, 'list.ru': 1, 'internet.ru': 1,
    'yandex.ru': 1, 'yandex.com': 1, 'ya.ru': 1, 'rambler.ru': 1, 'lenta.ru': 1, 'autorambler.ru': 1,
    'outlook.com': 1, 'hotmail.com': 1, 'live.com': 1, 'msn.com': 1,
    'icloud.com': 1, 'me.com': 1, 'mac.com': 1,
    'yahoo.com': 1, 'proton.me': 1, 'protonmail.com': 1, 'gmx.com': 1, 'qq.com': 1, 'aol.com': 1
  };

  function emailDomain(v) {
    var at = (v || '').lastIndexOf('@');
    return at === -1 ? '' : v.slice(at + 1).trim().toLowerCase().replace(/\.$/, '');
  }

  /* Список одноразовых доменов приходит из disposable-domains.js (npm
     disposable-email-domains). Семантика там wildcard: домен И все его
     поддомены, поэтому проверяем ещё и родительские домены. Если файл не
     загрузился — проверка просто не работает, форма не ломается. */
  function isDisposable(domain) {
    var list = window.ALTER_DISPOSABLE_DOMAINS;
    if (!list || !domain) return false;
    if (!isDisposable._set) {
      isDisposable._set = {};
      for (var i = 0; i < list.length; i++) isDisposable._set[list[i]] = 1;
    }
    var parts = domain.split('.');
    for (var j = 0; j < parts.length - 1; j++) {
      if (isDisposable._set[parts.slice(j).join('.')]) return true;
    }
    return false;
  }

  function emailError(v) {
    v = (v || '').trim();
    if (!v) return '';
    var ok = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(v);
    if (!ok) return 'Введите корректный адрес почты';
    if (isDisposable(emailDomain(v))) return 'На временную почту ответить не сможем — укажите рабочий адрес';
    return '';
  }

  function isGrid(node) {
    try { return getComputedStyle(node).display.indexOf('grid') !== -1; } catch (_) { return false; }
  }

  /* Элемент, ПОСЛЕ которого встаёт подсказка. В одну колонку это само поле почты.
     В сетке — последнее поле его ряда: подсказка растянута на всю ширину, и если
     воткнуть её сразу за почтой, соседнее поле уедет строкой ниже, а рядом с
     почтой останется дыра. Так и проявился баг на калькуляторе ROI 15.08.2026:
     браузер подставлял личную почту, всплывала подсказка, и телефон прыгал под
     неё. Ряд считаем по offsetTop, а не по числу колонок: у форм сайта разметка
     колонок разная (и меняется на узком экране), а вертикальная координата
     одинаковая у всех полей одного ряда при любой сетке. */
  function hintAnchor(el) {
    if (!el.parentNode || !isGrid(el.parentNode)) return el;
    /* Форма в закрытой модалке не отрисована, и offsetTop у всех её полей нулевой —
       ряд по нему не определить, весь список слился бы в один и подсказка уехала
       под кнопку отправки. Для таких форм оставляем прежнее поведение. */
    if (!el.offsetParent) return el;
    var anchor = el, top = el.offsetTop, n = el.nextElementSibling, guard = 8;
    while (n && guard-- > 0) {
      if (n.getAttribute && n.getAttribute('data-role') === 'email-hint') { n = n.nextElementSibling; continue; }
      if (Math.abs(n.offsetTop - top) > 4) break;
      anchor = n;
      n = n.nextElementSibling;
    }
    return anchor;
  }

  /* Подсказка под полем: не блокирует отправку, живёт своей жизнью рядом с
     красной рамкой ошибки. */
  function personalHint(el) {
    var show = !emailError(el.value) && !!PERSONAL_MAIL[emailDomain(el.value)];
    /* Ищем свою подсказку по всему контейнеру, а не в соседях справа: между
       почтой и подсказкой теперь могут стоять остальные поля ряда. */
    var hint = el.parentNode ? el.parentNode.querySelector(':scope > [data-role="email-hint"]') : null;
    if (!show) { if (hint) hint.parentNode.removeChild(hint); return; }
    if (hint) return;
    if (!el.parentNode) return;
    hint = document.createElement('div');
    hint.setAttribute('data-role', 'email-hint');
    /* Янтарный блок, а не серая строчка: подсказку легко проскочить взглядом, а
       она — единственное, что отличает корпоративную почту от личной. Цвет не
       зелёный (в макете это успех) и не красный (это не ошибка, отправить можно). */
    var css = 'margin-top:-2px;padding:10px 14px;border-radius:12px;'
      + 'background:#FFF6E6;border-left:3px solid #E8A33D;'
      + 'font-size:14px;line-height:1.45;color:#7A5A1E;';
    /* Часть форм — двухколоночная сетка (например «Получить расчёт по тарифу»).
       Обычный <div> занял бы там соседнюю ячейку и сдвинул поля вбок, поэтому
       растягиваем подсказку на всю ширину — она встаёт отдельной строкой. */
    if (isGrid(el.parentNode)) css += 'grid-column:1 / -1;';
    hint.setAttribute('style', css);
    hint.textContent = 'Если есть рабочая почта на домене компании, укажите, пожалуйста, её.';
    var anchor = hintAnchor(el);
    el.parentNode.insertBefore(hint, anchor.nextSibling);
  }
  function isEmail(el) {
    return el && el.tagName === 'INPUT' && (el.getAttribute('type') || '').toLowerCase() === 'email';
  }
  function markEmail(el, showError) {
    var err = emailError(el.value);
    try { el.setCustomValidity(err); } catch (_) {}
    if (err && showError) {
      el.style.borderColor = '#E5484D';
      el.style.boxShadow = '0 0 0 4px rgba(229,72,77,0.12)';
    } else {
      el.style.borderColor = '';
      el.style.boxShadow = '';
    }
  }
  document.addEventListener('input', function (e) {
    if (!isEmail(e.target)) return;
    markEmail(e.target, false);
    /* подсказка про личную почту — сразу, не дожидаясь ухода из поля: домен
       распознаётся только целиком, поэтому посреди набора она не мигает */
    personalHint(e.target);
  }, true);
  document.addEventListener('blur', function (e) {
    if (!isEmail(e.target)) return;
    markEmail(e.target, true);
    personalHint(e.target);
  }, true);
  /* browser blocks submit while customValidity is set; paint the field red then */
  document.addEventListener('invalid', function (e) { if (isEmail(e.target)) markEmail(e.target, true); }, true);

  /* ---------- проверка названия компании ----------
     Автоподбор (CompanyAutocomplete) подсказывает компании из ЕГРЮЛ, но выбор из
     списка не обязателен: иностранные компании и свежие юрлица подсказок не имеют
     и вводятся руками. Поэтому здесь отсекается только очевидный мусор — прочерки,
     «тест», одна буква, случайный набор клавиш. Всё остальное пропускаем. */
  var COMPANY_STOP = /^(тест|test|тестовая|проверка|нет|нету|не\s*знаю|физлицо|частное\s*лицо|компания|организация|фирма|ооо|ип|зао|оао|пао|ао|na|n\/a|none|no|asdf|qwerty|фыва|йцукен)$/i;

  function companyError(v) {
    v = (v || '').trim();
    if (!v) return '';
    /* поле называется «Название компании или ИНН» — чистый ИНН это валидный ввод */
    if (/^\d{10}$|^\d{12}$/.test(v)) return '';
    /* срезаем орг-форму и кавычки — «ООО "---"» должно отлетать так же, как «---» */
    var core = v.replace(/^(ооо|зао|оао|пао|нко|тоо|чп|фгуп|муп|ано|гк|нп|ип|ао)\.?\s+/i, '')
      .replace(/^[«"'”“]+|[»"'”“]+$/g, '').trim();
    if (!core) return 'Введите название компании';
    if (COMPANY_STOP.test(core)) return 'Введите название компании';
    var letters = core.replace(/[^A-Za-zА-Яа-яЁё]/g, '');
    if (letters.length < 2) return 'Введите название компании';
    /* «аааа», «ххх», «ыыы» — букв много, но разных мало */
    var uniq = {}, n = 0;
    for (var i = 0; i < letters.length; i++) {
      var ch = letters.charAt(i).toLowerCase();
      if (!uniq[ch]) { uniq[ch] = 1; n++; }
    }
    if (n < 2) return 'Введите название компании';
    return '';
  }

  function isCompany(el) {
    return el && el.tagName === 'INPUT' && el.getAttribute('name') === 'company';
  }
  function markCompany(el, showError) {
    var err = companyError(el.value);
    try { el.setCustomValidity(err); } catch (_) {}
    if (err && showError) {
      el.style.borderColor = '#E5484D';
      el.style.boxShadow = '0 0 0 4px rgba(229,72,77,0.12)';
    } else {
      el.style.borderColor = '';
      el.style.boxShadow = '';
    }
  }
  document.addEventListener('input', function (e) { if (isCompany(e.target)) markCompany(e.target, false); }, true);
  document.addEventListener('blur', function (e) { if (isCompany(e.target)) markCompany(e.target, true); }, true);
  document.addEventListener('invalid', function (e) { if (isCompany(e.target)) markCompany(e.target, true); }, true);
})();
